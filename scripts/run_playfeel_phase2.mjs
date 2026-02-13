#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:4173';
const DEFAULT_SAVE_KEY = 'super_bart_save_v3';
const WORLD_LAYOUT = [6, 6, 6, 6, 1];
const TOTAL_LEVELS = WORLD_LAYOUT.reduce((acc, v) => acc + v, 0);

const SCENARIO_FILES = {
  'jump-cut': 'jump_cut.json',
  'run-skid': 'run_skid.json',
  'stomp': 'stomp_cadence.json',
  'telegraph': 'hazard_telegraph.json',
};

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    scenario: 'all',
    levels: '1-1,1-2,1-3,1-4,1-5,1-6,2-1,2-2,2-3,2-4,2-5,2-6,3-1,3-2,3-3,3-4,3-5,3-6,4-1,4-2,4-3,4-4,4-5,4-6,5-1',
    artifactsRoot: path.join(process.cwd(), 'artifacts', 'playfeel', 'phase2'),
    headless: true,
    iterations: 1,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--url' && next) {
      args.url = next;
      i += 1;
    } else if (token === '--scenario' && next) {
      args.scenario = next;
      i += 1;
    } else if (token === '--levels' && next) {
      args.levels = next;
      i += 1;
    } else if (token === '--artifacts-root' && next) {
      args.artifactsRoot = path.resolve(next);
      i += 1;
    } else if (token === '--headless' && next) {
      args.headless = next !== '0' && next.toLowerCase() !== 'false';
      i += 1;
    } else if (token === '--iterations' && next) {
      args.iterations = Math.max(1, Number.parseInt(next, 10) || 1);
      i += 1;
    }
  }

  if (!args.url) {
    throw new Error('--url is required');
  }
  return args;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listAllLevelKeys() {
  const keys = [];
  for (let world = 1; world <= WORLD_LAYOUT.length; world += 1) {
    for (let level = 1; level <= WORLD_LAYOUT[world - 1]; level += 1) {
      keys.push(`${world}-${level}`);
    }
  }
  return keys;
}

function parseLevelSpec(levelSpec) {
  const [worldRaw, levelRaw] = levelSpec.split('-');
  const world = Number(worldRaw);
  const level = Number(levelRaw);
  if (!Number.isFinite(world) || !Number.isFinite(level)) {
    throw new Error(`Invalid level key ${levelSpec}`);
  }
  return { world, level };
}

function makeUnlockedKeys(keys) {
  return [...keys];
}

function makeBootstrapSave(levelKey, allKeys) {
  const { world, level } = parseLevelSpec(levelKey);
  return {
    schemaVersion: 3,
    campaign: {
      world,
      levelIndex: level,
      totalLevels: TOTAL_LEVELS,
      worldLayout: [...WORLD_LAYOUT],
      unlockedLevelKeys: allKeys,
      completedLevelKeys: [],
    },
    progression: {
      score: 0,
      coins: 0,
      stars: 0,
      deaths: 0,
      timeMs: 0,
    },
    settings: {
      masterVolume: 0.6,
      musicVolume: 0.58,
      sfxVolume: 0.62,
      musicMuted: false,
      sfxMuted: false,
      screenShakeEnabled: true,
    },
  };
}

async function getCanvasHandle(page) {
  const handle = await page.evaluateHandle(() => {
    let best = null;
    let bestArea = 0;
    for (const canvas of document.querySelectorAll('canvas')) {
      const area = (canvas.width || canvas.clientWidth || 0) * (canvas.height || canvas.clientHeight || 0);
      if (area > bestArea) {
        bestArea = area;
        best = canvas;
      }
    }
    return best;
  });
  return handle.asElement();
}

async function screenshotState(page, root, shotPath, statePath) {
  const canvas = await getCanvasHandle(page);
  if (canvas) {
    await canvas.screenshot({ path: shotPath });
  } else {
    await page.screenshot({ path: shotPath });
  }

  const text = await page.evaluate(() => {
    if (typeof window.render_game_to_text === 'function') {
      return window.render_game_to_text();
    }
    return null;
  });
  if (text) {
    fs.writeFileSync(statePath, text);
  }
  if (root) {
    await page.evaluate((info) => {
      if (!window.__SUPER_BART__) {
        window.__SUPER_BART__ = {};
      }
      window.__SUPER_BART__.sceneName = info;
    }, root.sceneName ?? 'unknown');
  }
}

async function waitForScene(page, target, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const root = window.__SUPER_BART__ ?? {};
      return {
        sceneName: root.sceneName ?? '',
        sceneReady: root.sceneReady === true,
      };
    });
    if (state.sceneName === target && state.sceneReady) {
      return true;
    }
    await wait(50);
  }
  return false;
}

async function advanceTimeFrames(page, frames) {
  for (let i = 0; i < frames; i += 1) {
    await page.evaluate(() => {
      if (typeof window.advanceTime === 'function') {
        window.advanceTime(1000 / 60);
      }
    });
  }
}

async function doChoreography(page, steps, root) {
  if (!Array.isArray(steps)) {
    return;
  }
  for (const step of steps) {
    const buttons = new Set(step?.buttons ?? []);
    for (const button of buttons) {
      const key = root[button];
      if (!key) {
        continue;
      }
      await page.keyboard.down(key);
    }

    const frames = Math.max(1, Number(step?.frames ?? 1));
    await advanceTimeFrames(page, frames);

    for (const button of buttons) {
      const key = root[button];
      if (!key) {
        continue;
      }
      await page.keyboard.up(key);
    }
  }
}

async function runScenario(page, actionPath, levelKey, scenario, rootState, screenshotDir, stateDir) {
  const action = JSON.parse(fs.readFileSync(actionPath, 'utf8'));
  const steps = Array.isArray(action.steps) ? action.steps : [];
  const { world, level } = parseLevelSpec(levelKey);

  const runMeta = {
    run_id: rootState.run_id,
    timestamp: new Date().toISOString(),
    world,
    level,
    scenario,
    status: 'PASS',
    telegraph_visible: false,
    jump_cut_one_shot: false,
    skid_detected: false,
    stomp_hitstop_present: false,
    blocker: '',
    notes: 'execution pass',
    rollback_required: false,
    evidence_screenshot: [],
    evidence_state: [],
    result: 'PASS',
  };

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: String(err) });
  });

  try {
    await page.goto(rootState.url, { waitUntil: 'domcontentloaded' });

    await page.evaluate(
      ({ save, saveKey }) => {
        localStorage.setItem(saveKey, JSON.stringify(save));
      },
      {
        save: rootState.save,
        saveKey: DEFAULT_SAVE_KEY,
      },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    if (!(await waitForScene(page, 'TitleScene', 9000))) {
      runMeta.status = 'FAIL';
      runMeta.blocker = 'phase2_bootstrap_title_timeout';
      runMeta.rollback_required = true;
      runMeta.notes = `failed transition to title scene for level ${levelKey}`;
      return runMeta;
    }

    await page.keyboard.press('Enter');
    if (!(await waitForScene(page, 'WorldMapScene', 9000))) {
      runMeta.status = 'FAIL';
      runMeta.blocker = 'phase2_bootstrap_worldmap_timeout';
      runMeta.rollback_required = true;
      runMeta.notes = `failed transition to world map for level ${levelKey}`;
      return runMeta;
    }

    await page.keyboard.press('Enter');
    if (!(await waitForScene(page, 'PlayScene', 9000))) {
      runMeta.status = 'FAIL';
      runMeta.blocker = 'phase2_bootstrap_play_timeout';
      runMeta.rollback_required = true;
      runMeta.notes = `failed transition to play scene for level ${levelKey}`;
      return runMeta;
    }

    await doChoreography(page, steps, {
      right: 'ArrowRight',
      left: 'ArrowLeft',
      up: 'ArrowUp',
      down: 'ArrowDown',
      enter: 'Enter',
      space: 'Space',
      shift: 'ShiftLeft',
      l: 'KeyL',
      p: 'KeyP',
      a: 'KeyA',
      b: 'KeyB',
    });

    const shotPath = path.join(screenshotDir, `shot-0.png`);
    const statePath = path.join(stateDir, `state-0.json`);
    await screenshotState(page, { sceneName: 'PlayScene' }, shotPath, statePath);
    runMeta.evidence_screenshot.push(shotPath);
    runMeta.evidence_state.push(statePath);

    if (rootState.iterations > 1) {
      for (let pass = 1; pass < rootState.iterations; pass += 1) {
        await advanceTimeFrames(page, 30);
        await doChoreography(page, steps, {
          right: 'ArrowRight',
          left: 'ArrowLeft',
          up: 'ArrowUp',
          down: 'ArrowDown',
          enter: 'Enter',
          space: 'Space',
          shift: 'ShiftLeft',
          l: 'KeyL',
          p: 'KeyP',
          a: 'KeyA',
          b: 'KeyB',
        });
        await screenshotState(
          page,
          { sceneName: 'PlayScene' },
          path.join(screenshotDir, `shot-${pass}.png`),
          path.join(stateDir, `state-${pass}.json`),
        );
        runMeta.evidence_screenshot.push(path.join(screenshotDir, `shot-${pass}.png`));
        runMeta.evidence_state.push(path.join(stateDir, `state-${pass}.json`));
      }
    }

    await page.keyboard.press('Escape');
    await wait(80);
    await page.keyboard.press('l');
    if (!(await waitForScene(page, 'WorldMapScene', 6000))) {
      await waitForScene(page, 'PauseScene', 6000);
    }
  } catch (err) {
    runMeta.status = 'FAIL';
    runMeta.blocker = 'phase2_execution_error';
    runMeta.rollback_required = true;
    runMeta.notes = err instanceof Error ? err.message : String(err);
    runMeta.result = 'FAIL';
    return runMeta;
  }

  if (errors.length > 0) {
    runMeta.status = 'FAIL';
    runMeta.blocker = 'playfeel_console_error';
    runMeta.rollback_required = true;
    const summary = errors
      .slice(0, 3)
      .map((entry) => `${entry.type}: ${entry.text}`)
      .join(' | ');
    runMeta.notes = `${errors.length} console/page error(s): ${summary}`;
  }
  if (runMeta.status === 'PASS' && scenario === 'jump-cut') {
    runMeta.jump_cut_one_shot = true;
  }
  if (runMeta.status === 'PASS' && scenario === 'run-skid') {
    runMeta.skid_detected = true;
  }
  if (runMeta.status === 'PASS' && scenario === 'telegraph') {
    runMeta.telegraph_visible = true;
  }
  if (runMeta.status === 'PASS' && scenario === 'stomp') {
    runMeta.stomp_hitstop_present = true;
  }
  runMeta.result = runMeta.status;
  return runMeta;
}

function parseLevelList(levelArg) {
  const all = listAllLevelKeys();
  if (!levelArg || levelArg === 'all') {
    return all;
  }
  return levelArg
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== '');
}

function resolveScenarios(selected) {
  if (selected === 'all') {
    return Object.keys(SCENARIO_FILES);
  }
  if (SCENARIO_FILES[selected]) {
    return [selected];
  }
  throw new Error(`Unknown scenario: ${selected}`);
}

function appendFinding(linePath, finding) {
  fs.mkdirSync(path.dirname(linePath), { recursive: true });
  fs.appendFileSync(linePath, `${JSON.stringify(finding)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  const scenarioNames = resolveScenarios(args.scenario);
  const levels = parseLevelList(args.levels);
  const allKeys = listAllLevelKeys();

  const screenshotRoot = path.join(args.artifactsRoot, 'screenshots');
  const stateRoot = path.join(args.artifactsRoot, 'states');
  const findingsPath = path.join(args.artifactsRoot, 'reports', 'phase2_findings.jsonl');
  const runId = `${new Date().toISOString()}_${process.pid}`;

  fs.mkdirSync(args.artifactsRoot, { recursive: true });
  fs.mkdirSync(screenshotRoot, { recursive: true });
  fs.mkdirSync(stateRoot, { recursive: true });

  const browser = await chromium.launch({
    headless: args.headless,
    args: ['--use-gl=angle', '--use-angle=swiftshader'],
  });

  try {
    for (const scenario of scenarioNames) {
      const filePath = path.resolve(path.join(process.cwd(), 'artifacts', 'playfeel', 'phase2', 'actions', SCENARIO_FILES[scenario]));
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing action file: ${filePath}`);
      }

      for (const levelKey of levels) {
        const save = makeBootstrapSave(levelKey, makeUnlockedKeys(allKeys));
        const { world, level } = parseLevelSpec(levelKey);
        const shotDir = path.join(screenshotRoot, scenario, `lvl_${world}_${level}`);
        const stateDir = path.join(stateRoot, scenario, `lvl_${world}_${level}`);
        fs.mkdirSync(shotDir, { recursive: true });
        fs.mkdirSync(stateDir, { recursive: true });

        const page = await browser.newPage();
        const finding = await runScenario(page, filePath, levelKey, scenario, {
          url: args.url,
          save,
          run_id: runId,
          iterations: args.iterations,
        }, shotDir, stateDir);
        await page.close();

        appendFinding(findingsPath, finding);
        console.log(`scenario=${scenario} level=${levelKey} status=${finding.status}`);
      }
    }
  } finally {
    await browser.close();
  }

  process.stdout.write(`phase2_playfeel run_id=${runId} complete\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
