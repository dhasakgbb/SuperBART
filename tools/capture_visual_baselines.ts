#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { imageDimensions, readPng } from './lib/pixel';
import styleConfig from '../src/style/styleConfig';

const DEV_PORT = 4179;
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;
const SETTLE_FRAMES_AFTER_READY = 3;

export interface CapturedScenes {
  title: string;
  map: string;
  play: string;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

interface SceneReadyState {
  sceneName: string;
  sceneReady: boolean;
  sceneFrame: number;
  sceneReadyFrame: number;
  sceneReadyVersion?: string | number;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function evaluateReadyState(page: Page): Promise<SceneReadyState | null> {
  return page.evaluate(() => {
    const marker = (window as typeof window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__;
    if (!marker || typeof marker !== 'object' || marker === null) {
      return null;
    }
    return {
      sceneName: typeof marker.sceneName === 'string' ? marker.sceneName : '',
      sceneReady: marker.sceneReady === true,
      sceneFrame: typeof marker.sceneFrame === 'number' && Number.isFinite(marker.sceneFrame) ? marker.sceneFrame : -1,
      sceneReadyFrame:
        typeof marker.sceneReadyFrame === 'number' && Number.isFinite(marker.sceneReadyFrame)
          ? marker.sceneReadyFrame
          : -1,
      sceneReadyVersion:
        typeof marker.sceneReadyVersion === 'number' || typeof marker.sceneReadyVersion === 'string'
          ? marker.sceneReadyVersion
          : undefined,
    };
  });
}

async function waitForSceneReadyMarker(
  page: Page,
  targetScene: string,
  requiredVersion?: string | number,
): Promise<SceneReadyState> {
  const timeoutMs = 15000;
  const start = Date.now();
  let stableCount = 0;
  let lastReadyFrame = -1;
  let markerSeen = false;
  const stableTarget = 3;

  while (Date.now() - start < timeoutMs) {
    const state = await evaluateReadyState(page);
    if (!state) {
      await wait(16);
      continue;
    }

    markerSeen = true;
    if (state.sceneName !== targetScene || !state.sceneReady) {
      stableCount = 0;
      lastReadyFrame = -1;
      await wait(16);
      continue;
    }
    if (requiredVersion != null) {
      if (state.sceneReadyVersion == null) {
        throw new Error(`Scene ready version missing for ${targetScene}. Expected ${requiredVersion}.`);
      }
      if (state.sceneReadyVersion !== requiredVersion) {
        throw new Error(`Scene ready version mismatch for ${targetScene}: expected ${requiredVersion}, received ${state.sceneReadyVersion}`);
      }
    }

    if (state.sceneFrame < 0 || state.sceneReadyFrame < 0) {
      await wait(16);
      continue;
    }

    if (state.sceneFrame - state.sceneReadyFrame < 2) {
      await wait(16);
      continue;
    }

    if (state.sceneReadyFrame === lastReadyFrame) {
      stableCount += 1;
    } else {
      lastReadyFrame = state.sceneReadyFrame;
      stableCount = 1;
    }

    if (stableCount >= stableTarget) {
      return state;
    }

    await wait(16);
  }

  if (!markerSeen) {
    throw new Error(
      `Missing deterministic scene marker: window.__SUPER_BART__ for ${targetScene}. Ensure setSceneReadyMarker() is called in each scene.`,
    );
  }

  throw new Error(`Timed out waiting for deterministic scene readiness marker: ${targetScene}`);
}

async function waitForSceneFrameSettle(page: Page): Promise<void> {
  for (let i = 0; i < SETTLE_FRAMES_AFTER_READY; i += 1) {
    await page.waitForTimeout(16);
  }
}

function assertCapturedFrameLooksRendered(imagePath: string, scene: string): void {
  const image = readPng(imagePath);
  const totalPixels = image.width * image.height;
  if (totalPixels === 0) {
    throw new Error(`Captured frame for ${scene} is empty.`);
  }

  let nonTransparent = 0;
  let sumLuma = 0;
  let sumLumaSq = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i]!;
    const g = image.data[i + 1]!;
    const b = image.data[i + 2]!;
    const a = image.data[i + 3]!;
    if (a > 8) {
      nonTransparent += 1;
      const luma = (r + g + b) / 3;
      sumLuma += luma;
      sumLumaSq += luma * luma;
    }
  }

  if (nonTransparent < totalPixels * 0.02) {
    throw new Error(`Captured ${scene} frame has too much transparency; looks empty.`);
  }
  const meanLuma = sumLuma / Math.max(1, nonTransparent);
  const lumaVariance = sumLumaSq / Math.max(1, nonTransparent) - meanLuma * meanLuma;
  const lumaSpread = lumaVariance > 0 ? Math.sqrt(lumaVariance) : 0;
  const minLumaSpread = scene === 'play' ? 3.0 : 2.6;
  if (lumaSpread < minLumaSpread || (meanLuma < 2 && scene !== 'title')) {
    throw new Error(`Captured ${scene} frame has near-uniform dark/blank output.`);
  }
}

function writeGoldenMetadata(outputDir: string, title: string, map: string, play: string): void {
  const now = new Date().toISOString();
  const layoutVersion = styleConfig.contractVersion;
  const meta = {
    schema: 'visual-regression-v1',
    generatedAt: now,
    layoutVersion,
    scenes: [
      {
        scene: 'title',
        sourceScene: 'TitleScene',
        targetFile: path.resolve(title),
        captureHash: hashFile(title),
        width: imageDimensions(title).width,
        height: imageDimensions(title).height,
        createdAt: now,
        layoutVersion,
      },
      {
        scene: 'map',
        sourceScene: 'WorldMapScene',
        targetFile: path.resolve(map),
        captureHash: hashFile(map),
        width: imageDimensions(map).width,
        height: imageDimensions(map).height,
        createdAt: now,
        layoutVersion,
      },
      {
        scene: 'play',
        sourceScene: 'PlayScene',
        targetFile: path.resolve(play),
        captureHash: hashFile(play),
        width: imageDimensions(play).width,
        height: imageDimensions(play).height,
        createdAt: now,
        layoutVersion,
      },
    ],
  };
  fs.writeFileSync(path.join(outputDir, 'golden_meta.json'), JSON.stringify(meta, null, 2));
}

function hashFile(filePath: string): string {
  const raw = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const probe = (): void => {
      const req = http.get(url, (res) => {
        res.resume();
        if ((res.statusCode ?? 500) < 500) {
          resolve();
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(probe, 250);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(probe, 250);
      });
    };
    probe();
  });
}

function startDevServer(): ChildProcessWithoutNullStreams {
  const proc = spawn(
    'npm',
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(DEV_PORT), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  proc.stdout.on('data', () => {
    // keep pipe drained to avoid deadlock in long runs
  });
  proc.stderr.on('data', () => {
    // keep pipe drained to avoid deadlock in long runs
  });
  return proc as unknown as ChildProcessWithoutNullStreams;
}

function stopDevServer(proc: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    proc.once('exit', () => resolve());
    proc.kill('SIGTERM');
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
    }, 1500);
  });
}

export async function captureVisualBaselines(outputDir: string): Promise<CapturedScenes> {
  ensureDir(outputDir);
  const dev = startDevServer();

  try {
    await waitForServer(DEV_URL, 25000);
    const browser = await chromium.launch({
      headless: true,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
    });
    const expectedVersion = styleConfig.contractVersion;
    try {
      const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
      await page.addInitScript(() => {
        try {
          localStorage.removeItem('super_bart_save_v5');
          localStorage.removeItem('super_bart_save_v4');
          localStorage.removeItem('super_bart_save_v3');
          localStorage.removeItem('super_bart_save_v2');
        } catch {
          // keep capture pipeline resilient in restricted environments
        }
        const seed = 1337;
        let s = seed >>> 0;
        const next = (): number => {
          s ^= s << 13;
          s ^= s >>> 17;
          s ^= s << 5;
          return (s >>> 0) / 0xffffffff;
        };
        Math.random = () => next();
        (window as any).__SUPER_BART__ = { forceSeed: 1337 };
      });
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      page.on('pageerror', err => console.log('PAGE ERROR:', err));
      await page.goto(DEV_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('canvas');
      await waitForSceneReadyMarker(page, 'TitleScene', expectedVersion);
      await waitForSceneFrameSettle(page);

      const canvas = page.locator('canvas');
      const titlePath = path.resolve(outputDir, 'title_scene_current.png');
      await canvas.screenshot({ path: titlePath });
      assertCapturedFrameLooksRendered(titlePath, 'title');

      await page.keyboard.press('L');
      await waitForSceneReadyMarker(page, 'WorldMapScene', expectedVersion);
      await waitForSceneFrameSettle(page);
      const mapPath = path.resolve(outputDir, 'map_scene_current.png');
      await canvas.screenshot({ path: mapPath });
      assertCapturedFrameLooksRendered(mapPath, 'map');

      await page.keyboard.press('Enter');
      await waitForSceneReadyMarker(page, 'PlayScene', expectedVersion);
      await waitForSceneFrameSettle(page);
      const playPath = path.resolve(outputDir, 'play_scene_current.png');
      await canvas.screenshot({ path: playPath });
      assertCapturedFrameLooksRendered(playPath, 'play');

      return { title: titlePath, map: mapPath, play: playPath };
    } finally {
      await browser.close();
    }
  } finally {
    await stopDevServer(dev);
  }
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const outputDir = path.resolve('docs/screenshots/current');
  const scenes = await captureVisualBaselines(outputDir);

  if (args.has('--update-golden')) {
    const goldenDir = path.resolve('docs/screenshots/golden');
    ensureDir(goldenDir);
    fs.copyFileSync(scenes.title, path.join(goldenDir, 'title_scene_golden.png'));
    fs.copyFileSync(scenes.map, path.join(goldenDir, 'map_scene_golden.png'));
    fs.copyFileSync(scenes.play, path.join(goldenDir, 'play_scene_golden.png'));
    writeGoldenMetadata(
      path.resolve('docs/screenshots/golden'),
      path.join(goldenDir, 'title_scene_golden.png'),
      path.join(goldenDir, 'map_scene_golden.png'),
      path.join(goldenDir, 'play_scene_golden.png'),
    );
    console.log(`Updated golden screenshots in ${path.relative(process.cwd(), goldenDir)}`);
    return;
  }

  console.log(`Captured screenshots in ${path.relative(process.cwd(), outputDir)}`);
  console.log(`- title: ${path.relative(process.cwd(), scenes.title)}`);
  console.log(`- map: ${path.relative(process.cwd(), scenes.map)}`);
  console.log(`- play: ${path.relative(process.cwd(), scenes.play)}`);
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
