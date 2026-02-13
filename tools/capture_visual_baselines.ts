#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';

const DEV_PORT = 4179;
const DEV_URL = `http://127.0.0.1:${DEV_PORT}`;

export interface CapturedScenes {
  title: string;
  map: string;
  play: string;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSceneReadyMarker(page: Page, targetScene: string): Promise<void> {
  const timeoutMs = 15000;
  const start = Date.now();
  let stableCount = 0;
  let lastReadyFrame = -1;
  let markerSeen = false;
  const stableTarget = 3;

  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(() => {
      const marker = (window as typeof window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__;
      if (!marker || typeof marker !== 'object' || marker === null) {
        return null;
      }
      const sceneName = typeof marker.sceneName === 'string' ? marker.sceneName : '';
      const sceneReady = marker.sceneReady === true;
      const sceneFrame = typeof marker.sceneFrame === 'number' && Number.isFinite(marker.sceneFrame) ? marker.sceneFrame : null;
      const sceneReadyFrame =
        typeof marker.sceneReadyFrame === 'number' && Number.isFinite(marker.sceneReadyFrame)
          ? marker.sceneReadyFrame
          : null;
      return {
        sceneName,
        sceneReady,
        sceneFrame,
        sceneReadyFrame,
      };
    });

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

    if (typeof state.sceneFrame !== 'number' || typeof state.sceneReadyFrame !== 'number') {
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
      return;
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
  return proc;
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
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
      await page.goto(DEV_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('canvas');
      await waitForSceneReadyMarker(page, 'TitleScene');

      const canvas = page.locator('canvas');
      const titlePath = path.resolve(outputDir, 'title_scene_current.png');
      await canvas.screenshot({ path: titlePath });

      await page.keyboard.press('Enter');
      await waitForSceneReadyMarker(page, 'WorldMapScene');
      const mapPath = path.resolve(outputDir, 'map_scene_current.png');
      await canvas.screenshot({ path: mapPath });

      await page.keyboard.press('Enter');
      await waitForSceneReadyMarker(page, 'PlayScene');
      const playPath = path.resolve(outputDir, 'play_scene_current.png');
      await canvas.screenshot({ path: playPath });

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
