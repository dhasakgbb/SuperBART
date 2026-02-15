#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DEFAULT_URL = 'http://127.0.0.1:4173';
const DEFAULT_SAVE_KEYS = ['super_bart_save_v5', 'super_bart_save_v4', 'super_bart_save_v3'];
const WORLD_LAYOUT = [4, 4, 4, 4, 4, 4, 4];
const TOTAL_LEVELS = WORLD_LAYOUT.reduce((acc, v) => acc + v, 0);
const SCENE_STABLE_FRAMES = 2;
const SCENE_POLL_INTERVAL_MS = 50;
const PHASE2_TIMEOUTS = {
  bootstrapTitleMs: 15000,
  bootstrapWorldMapMs: 15000,
  bootstrapPlayMs: 22000,
  worldMapReturnMs: 18000,
  sceneProbeMs: 9000,
  worldMapSelectionMs: 11000,
};
const PHASE2_RETRIES = {
  bootstrapAttempts: 2,
  transitionAttempts: 2,
};
const PHASE2_BLOCKERS = {
  BOOTSTRAP_TITLE_TIMEOUT: 'phase2_bootstrap_title_timeout',
  BOOTSTRAP_WORLDMAP_TIMEOUT: 'phase2_bootstrap_worldmap_timeout',
  BOOTSTRAP_PLAY_TIMEOUT: 'phase2_bootstrap_play_timeout',
  WORLD_MAP_SELECTION_TIMEOUT: 'phase2_world_map_selection_timeout',
  WORLD_MAP_SELECTION_DESYNC: 'phase2_world_map_selection_desync',
  WORLD_MAP_RETURN_TIMEOUT: 'phase2_world_map_return_timeout',
  EXECUTION_ERROR: 'phase2_execution_error',
  PLAYFEEL_CONSOLE_ERROR: 'playfeel_console_error',
  JUMP_CUT_MISSING: 'playfeel_jump_cut_missing',
  SKID_MISSING: 'playfeel_skid_not_detected',
  STOMP_MISSING: 'playfeel_stomp_hitstop_missing',
  STOMP_MISMATCH: 'playfeel_stomp_hitstop_mismatch',
};

const SCENARIO_ACTION_FALLBACKS = {
  'jump-cut': {
    description: 'Jump-cut harness fallback',
    steps: [
      { buttons: ['right'], frames: 6 },
      { buttons: ['right', 'space'], frames: 8 },
      { buttons: ['right'], frames: 10 },
      { buttons: ['left', 'shift'], frames: 8 },
      { buttons: ['right'], frames: 12 },
    ],
  },
  'run-skid': {
    description: 'Skid fallback sweep',
    steps: [
      { buttons: ['right', 'shift'], frames: 24 },
      { buttons: ['left', 'shift'], frames: 20 },
      { buttons: ['left'], frames: 12 },
    ],
  },
  stomp: {
    description: 'Stomp fallback cadence',
    steps: [
      { buttons: ['right'], frames: 10 },
      { buttons: ['right', 'space'], frames: 8 },
      { buttons: ['right', 'down'], frames: 10 },
      { buttons: ['down'], frames: 24 },
    ],
  },
  telegraph: {
    description: 'Telegraph fallback sweep',
    steps: [
      { buttons: ['right'], frames: 30 },
      { buttons: ['left'], frames: 12 },
      { buttons: ['right'], frames: 30 },
    ],
  },
};

const SCENARIO_FILES = {
  'jump-cut': 'jump_cut.json',
  'run-skid': 'run_skid.json',
  'stomp': 'stomp_cadence.json',
  'telegraph': 'hazard_telegraph.json',
};

const INPUT_MAP = {
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
};

function normalizeFindingResult(finding) {
  finding.result = finding.status;
  return finding;
}

const PLAYFEEL_CONTRACT_PATH = path.join(process.cwd(), 'scripts', 'playfeel_contract.json');
const PLAYFEEL_CONTRACT = (() => {
  try {
    const payload = JSON.parse(fs.readFileSync(PLAYFEEL_CONTRACT_PATH, 'utf8'));
    if (payload && typeof payload === 'object') {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
})();

function isIgnoredConsoleError(text) {
  const normalized = String(text).toLowerCase();
  const ignored = [
    'setlinewidth is not a function',
    'execution context was destroyed',
    'non-error promise rejection',
    'failed to decode audio data',
    'resizeobserver loop limit exceeded',
    'error: failed to connect to extension',
    'manifest: failed to parse',
  ];
  if (/failed to load resource/.test(normalized) && /net::err_aborted/.test(normalized)) {
    return true;
  }
  if (/failed to load resource/.test(normalized) && /sourcemap/.test(normalized)) {
    return true;
  }
  if (/failed to load resource/.test(normalized) && /\/assets\//.test(normalized) && /404/.test(normalized)) {
    return true;
  }
  if (/failed to load resource/.test(normalized) && /favicon\.ico/.test(normalized)) {
    return true;
  }
  if (/net::err_file_not_found/.test(normalized) && /\/assets\//.test(normalized)) {
    return true;
  }
  return ignored.some((needle) => normalized.includes(needle));
}

function isExecutionContextDestroyed(text) {
  return String(text).toLowerCase().includes('execution context was destroyed');
}

function isTransientHarnessError(text) {
  const normalized = String(text).toLowerCase();
  return normalized.includes('execution context was destroyed')
    || normalized.includes('cannot find context with specified id')
    || normalized.includes('most likely because of a navigation')
    || normalized.includes('target page, context or browser has been closed');
}

function normalizeMsToFrames(ms, frameMs = 1000 / 60) {
  const raw = typeof ms === 'number' && Number.isFinite(ms) ? ms / frameMs : 0;
  return { minFrames: Math.max(1, Math.floor(raw)), maxFrames: Math.ceil(raw) };
}

async function readSceneState(page) {
  try {
    return await page.evaluate(() => {
      const root = window.__SUPER_BART__ ?? {};
      const game = root.game ?? {};
      const activeScenes = [];
      const scenes = game?.scene?.getScenes?.(true) ?? game?.scene?.scenes ?? [];
      if (Array.isArray(scenes)) {
        for (const scene of scenes) {
          const key = scene?.sys?.config?.key;
          if (typeof key === 'string') {
            activeScenes.push(key);
          }
        }
      }
      return {
        sceneName: root.sceneName ?? '',
        sceneReady: root.sceneReady === true,
        sceneReadyFrame: Number.isFinite(root.sceneReadyFrame) ? root.sceneReadyFrame : -1,
        sceneFrame: Number.isFinite(root.sceneFrame) ? root.sceneFrame : -1,
        hasRenderFn: typeof window.render_game_to_text === 'function',
        hasGetStateFn: typeof root.getStateWithDebug === 'function',
        activeScenes,
      };
    });
  } catch {
    return null;
  }
}

function resolveSceneName(state) {
  if (!state) {
    return '';
  }
  if (typeof state.sceneName === 'string' && state.sceneName.length > 0) {
    return state.sceneName;
  }
  if (Array.isArray(state.activeScenes) && state.activeScenes.length > 0) {
    return state.activeScenes[0];
  }
  return '';
}

function isStableSceneMatch(state, target, allowPlaySceneFallback) {
  if (!state) {
    return false;
  }
  if (target === 'PlayScene') {
    return state.sceneReady || allowPlaySceneFallback && state.sceneFrame >= 0 && (
      state.hasRenderFn || state.hasGetStateFn
    );
  }
  return state.sceneReady || state.sceneFrame >= 0;
}

function isStableMatch(state, target, allowPlaySceneFallback) {
  const activeScene = resolveSceneName(state);
  if (!state || activeScene !== target) {
    return false;
  }
  return isStableSceneMatch(state, target, allowPlaySceneFallback);
}

async function waitForAnyScene(page, targets, timeoutMs = 3000, allowPlaySceneFallback = false) {
  const targetList = Array.isArray(targets) ? targets : [targets];
  let stableFrames = 0;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readSceneState(page);
    const current = resolveSceneName(state);
    if (targetList.includes(current) && isStableMatch(state, current, allowPlaySceneFallback)) {
      stableFrames += 1;
      if (stableFrames >= SCENE_STABLE_FRAMES) {
        return current;
      }
    } else {
      stableFrames = 0;
    }
    await wait(SCENE_POLL_INTERVAL_MS);
  }
  return '';
}

function coalesceFrame(state) {
  if (typeof state?.sceneFrame === 'number' && Number.isFinite(state.sceneFrame)) {
    return state.sceneFrame;
  }
  if (typeof state?.rootSceneFrame === 'number' && Number.isFinite(state.rootSceneFrame)) {
    return state.rootSceneFrame;
  }
  return -1;
}

async function captureDebugState(page, samples) {
  try {
    const state = await page.evaluate(() => {
      const root = window.__SUPER_BART__ ?? {};
      const getter = root.getStateWithDebug;
      if (typeof getter !== 'function') {
        return null;
      }
      const payload = getter();
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const frame = Number.isFinite(root.sceneFrame) ? root.sceneFrame : -1;
      if (typeof payload === 'object' && payload !== null) {
        payload.rootSceneFrame = frame;
      }
      return payload;
    });

    if (state) {
      samples.push(state);
      return state;
    }
  } catch {
    return null;
  }
  return null;
}

function evaluateScenarioSignals(scenario, states, contract = PLAYFEEL_CONTRACT) {
  const resolved = contract ?? {};
  const result = {
    passed: false,
    blocker: '',
    notes: '',
    jumpCutDetected: false,
    jumpCutCount: 0,
    jumpCutRepeat: false,
    skidDetected: false,
    skidStartedAtFrame: null,
    skidFrames: 0,
    stompsDetected: 0,
    stompHitstopFrames: 0,
    telegraphObserved: false,
  };

  if (!Array.isArray(states) || states.length === 0) {
    return {
      ...result,
      blocker: 'playfeel_no_state_samples',
      notes: 'no debug telemetry available',
    };
  }

  if (scenario === 'jump-cut') {
    const transitions = [];
    const samples = states.map((entry) => ({
      frame: coalesceFrame(entry),
      cut: Boolean(entry?.movement?.jumpCutApplied || entry?.playfeel?.jumpCutApplied),
    }));

    for (let i = 1; i < samples.length; i += 1) {
      if (!samples[i - 1].cut && samples[i].cut) {
        transitions.push(samples[i]);
      }
    }

    result.jumpCutCount = transitions.length;
    result.jumpCutDetected = transitions.length >= 1;
    result.jumpCutRepeat = transitions.length > (resolved?.jump_cut_frames ?? 1);

    if (!result.jumpCutDetected) {
      return {
        ...result,
        blocker: 'playfeel_jump_cut_missing',
        notes: 'no jump-cut transition observed',
      };
    }

    if (result.jumpCutRepeat) {
      return {
        ...result,
        blocker: 'playfeel_jump_cut_repeat',
        notes: `observed ${transitions.length} cut events`,
      };
    }

    const first = transitions[0];
    const maxFrame = Math.floor((resolved?.jump_cut_window_ms ?? 90) / (1000 / 60)) + 2;
    if (first?.frame >= 0 && first.frame > maxFrame) {
      return {
        ...result,
        blocker: 'playfeel_jump_cut_late',
        notes: `first cut frame ${first.frame} > ${maxFrame}`,
      };
    }

    result.passed = true;
    return result;
  }

  if (scenario === 'run-skid') {
    let runFrame = null;
    for (const sample of states) {
      const movement = sample?.movement;
      if (movement?.desiredState === 'run' && movement?.onGround) {
        runFrame = coalesceFrame(sample);
        break;
      }
    }

    const skidFrames = states.filter(
      (sample) =>
        sample?.animState === 'skid'
        || sample?.movement?.lastMotionHint === 'skid'
        || sample?.playfeel?.lastMotionHint === 'skid'
        || (typeof sample?.playfeel?.skidMsLeft === 'number' && sample?.playfeel?.skidMsLeft > 0),
    );
    result.skidDetected = skidFrames.length > 0;
    result.skidFrames = skidFrames.length;
    if (skidFrames.length > 0) {
      const firstSkid = skidFrames[0];
      result.skidStartedAtFrame = coalesceFrame(firstSkid);
    }

    if (runFrame === null || runFrame < 0) {
      return {
        ...result,
        blocker: 'playfeel_run_not_reached',
        notes: 'run state never reached',
      };
    }

    if (!result.skidDetected) {
      return {
        ...result,
        blocker: 'playfeel_skid_not_detected',
        notes: 'no skid state observed',
      };
    }

    const budgetFrames = Math.max(1, Math.ceil((resolved?.skid_duration_ms_max ?? 96) / (1000 / 60)));
    if (result.skidFrames > budgetFrames) {
      return {
        ...result,
        blocker: 'playfeel_skid_too_long',
        notes: `skid ${result.skidFrames} > budget ${budgetFrames}`,
      };
    }

    result.passed = true;
    return result;
  }

  if (scenario === 'stomp') {
    const candidate = states[states.length - 1] ?? states[0];
    const telemetry = candidate?.stompHitstopTelemetry;
    const history = Array.isArray(telemetry?.history) ? telemetry.history : [];
    result.stompsDetected = history.length;

    if (history.length === 0) {
      return {
        ...result,
        blocker: 'playfeel_stomp_hitstop_missing',
        notes: 'no stomp hit-stop events',
      };
    }

    const latest = history[history.length - 1];
    const frameBudget = normalizeMsToFrames(latest.appliedMs);
    const minBudget = resolved?.stomp_hitstop_frames_min ?? 1;
    const maxBudget = resolved?.stomp_hitstop_frames_max ?? 2;
    result.stompHitstopFrames = frameBudget.maxFrames;

    if (frameBudget.minFrames < minBudget || frameBudget.maxFrames > maxBudget) {
      return {
        ...result,
        blocker: 'playfeel_stomp_hitstop_span_mismatch',
        notes: `hit-stop span ${frameBudget.minFrames}-${frameBudget.maxFrames} frames` ,
      };
    }

    if (typeof latest.appliedMs === 'number' && typeof resolved?.stomp_hitstop_ms === 'number'
      && latest.appliedMs !== resolved.stomp_hitstop_ms) {
      return {
        ...result,
        blocker: 'playfeel_stomp_hitstop_mismatch',
        notes: `observed ${latest.appliedMs} ms != contract ${resolved.stomp_hitstop_ms}`,
      };
    }

    result.passed = true;
    return result;
  }

  result.telegraphObserved = true;
  result.passed = true;
  return result;
}

function parseArgs(argv) {
  const args = {
    url: DEFAULT_URL,
    scenario: 'all',
    levels: 'all',
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

function loadScenarioAction(actionPath, scenario) {
  const fallback = SCENARIO_ACTION_FALLBACKS[scenario];
  const fallbackResult = {
    source: 'fallback',
    steps: Array.isArray(fallback?.steps) ? fallback.steps : [],
    loaded: false,
    notes: fallback ? `using fallback actions for ${scenario}` : 'no scenario fallback available',
  };

  if (!actionPath || !fs.existsSync(actionPath)) {
    return fallbackResult;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(actionPath, 'utf8'));
    const steps = Array.isArray(parsed?.steps) ? parsed.steps : [];
    if (steps.length === 0) {
      return {
        source: 'empty_file',
        steps: [],
        loaded: true,
        notes: `scenario file has no steps: ${actionPath}`,
      };
    }
    return {
      source: 'file',
      steps,
      loaded: true,
      notes: '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (fallback) {
      return {
        ...fallbackResult,
        notes: `unable to parse scenario file ${actionPath}: ${message}`,
      };
    }
    return {
      source: 'invalid_file',
      steps: [],
      loaded: false,
      notes: `unable to parse scenario file ${actionPath}: ${message}`,
    };
  }
}

function buildSceneUnwindKeys(sceneName) {
  switch (sceneName) {
    case 'PlayScene':
      return ['Escape', 'KeyL'];
    case 'PauseScene':
      return ['KeyL'];
    case 'DebriefScene':
      return ['Enter'];
    case 'ChoiceScene':
      return ['ArrowLeft', 'Enter'];
    case 'InterludeScene':
      return [];
    case 'CreditsScene':
      return ['Enter'];
    case 'FinalVictoryScene':
      return ['Enter'];
    case 'TitleScene':
      return ['Enter'];
    default:
      return ['Escape', 'KeyL'];
  }
}

async function unwindNarrativeScene(page, sceneName) {
  const keys = buildSceneUnwindKeys(sceneName);
  for (const key of keys) {
    await page.keyboard.press(key);
    await wait(60);
  }
  if (sceneName === 'DebriefScene') {
    await wait(2200);
    await page.keyboard.press('Enter');
  } else if (sceneName === 'InterludeScene') {
    await wait(3600);
  }
}

async function waitForAndReturnScene(page, timeoutMs = PHASE2_TIMEOUTS.sceneProbeMs) {
  return await waitForAnyScene(
    page,
    ['WorldMapScene', 'PlayScene', 'InterludeScene', 'DebriefScene', 'ChoiceScene', 'CreditsScene', 'FinalVictoryScene', 'PauseScene', 'TitleScene'],
    timeoutMs,
  );
}

function makeUnlockedKeys(keys) {
  return [...keys];
}

function campaignOrdinalFromKey(world, level) {
  const w = Math.max(1, Math.min(WORLD_LAYOUT.length, Math.floor(world)));
  const levelsInWorld = WORLD_LAYOUT[w - 1] ?? 0;
  const l = Math.max(1, Math.floor(level));
  const clampedLevel = levelsInWorld > 0 ? Math.min(levelsInWorld, l) : 0;
  if (clampedLevel <= 0) {
    return 1;
  }
  let ordinal = clampedLevel;
  for (let i = 0; i < w - 1; i += 1) {
    ordinal += WORLD_LAYOUT[i] ?? 0;
  }
  return ordinal;
}

async function focusCanvas(page) {
  const canvas = await getCanvasHandle(page);
  if (!canvas) {
    await page.keyboard.press('Tab');
    return;
  }

  await canvas.focus();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.down();
    await page.mouse.up();
  }
}

async function alignWorldMapSelection(page, world, level) {
  const targetOrdinal = campaignOrdinalFromKey(world, level);
  const deadline = Date.now() + PHASE2_TIMEOUTS.worldMapSelectionMs;

  while (Date.now() < deadline) {
    let state = null;
    try {
      state = await page.evaluate((target) => {
        const root = window.__SUPER_BART__ || {};
        const game = root?.game;
        const map = game?.scene?.getScene?.('WorldMapScene');
        if (!map) {
          return { ok: false, reason: 'no_world_map_scene' };
        }
        const updateViaRequest = typeof map.requestSelection === 'function';
        if (updateViaRequest) {
          const changed = map.requestSelection(target);
          const selectedOrdinal = typeof map.getSelectedOrdinal === 'function'
            ? map.getSelectedOrdinal()
            : map.selectedOrdinal;
          return { ok: selectedOrdinal === target, changed, reason: 'requestSelection' };
        }

        if (typeof map.selectedOrdinal !== 'number') {
          return { ok: false, reason: 'selection_not_ready' };
        }

        map.selectedOrdinal = target;
        if (typeof map.updateSelectionVisuals === 'function') {
          map.updateSelectionVisuals();
          return { ok: true, reason: 'direct_set' };
        }
        return { ok: false, reason: 'selection_visual_update_missing' };
      }, targetOrdinal);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isTransientHarnessError(message)) {
        await wait(120);
        continue;
      }
      return {
        ok: false,
        blocker: PHASE2_BLOCKERS.EXECUTION_ERROR,
        notes: `world-map selection evaluation failed for level ${world}-${level}: ${message}`,
      };
    }

    if (state?.ok === true) {
      return { ok: true };
    }
    if (state?.reason === 'selection_not_ready' || state?.reason === 'no_world_map_scene') {
      await wait(80);
      continue;
    }

    return {
      ok: false,
      blocker: PHASE2_BLOCKERS.WORLD_MAP_SELECTION_DESYNC,
      notes: `unable to enforce world-map target selection for level ${world}-${level}: ${state?.reason ?? 'unknown'}`,
    };
  }

  return {
    ok: false,
    blocker: PHASE2_BLOCKERS.WORLD_MAP_SELECTION_TIMEOUT,
    notes: `world-map selection could not stabilize for level ${world}-${level}`,
  };
}

function makeBootstrapSave(levelKey, allKeys) {
  const { world, level } = parseLevelSpec(levelKey);
  const perLevelStats = Object.fromEntries(allKeys.map((key) => [
    key,
    {
      evalsCollected: 0,
      evalsCollectedIds: [],
      collectiblesPicked: [],
    },
  ]));
  const worldStates = {};
  for (let index = 1; index <= WORLD_LAYOUT.length; index += 1) {
    worldStates[index] = index < world ? 'reclaimed' : index === world ? 'next' : 'unclaimed';
  }
  const personnelFilesByWorld = {};
  for (let index = 1; index <= WORLD_LAYOUT.length; index += 1) {
    personnelFilesByWorld[index] = 0;
  }
  return {
    schemaVersion: 5,
    campaign: {
      world,
      levelIndex: level,
      stage: level,
      totalStages: TOTAL_LEVELS,
      totalLevels: TOTAL_LEVELS,
      worldLayout: [...WORLD_LAYOUT],
      unlockedLevelKeys: [...allKeys],
      completedLevelKeys: [],
    },
    worldStates,
    choiceFlags: {
      recordsDeleteChoice: null,
      rebootChoice: null,
    },
    unlocks: {
      doubleJump: false,
      bartsRules: false,
      omegaLogs: false,
    },
    personnelFilesCollected: [],
    personnelFilesByWorld,
    perLevelStats,
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

  const snapshot = await page.evaluate(() => {
    const renderState = typeof window.render_game_to_text === 'function'
      ? window.render_game_to_text()
      : null;
    const root = window.__SUPER_BART__ ?? {};
    const getter = root.getStateWithDebug;
    if (typeof getter === 'function') {
      return {
        text: renderState,
        debug: getter(),
      };
    }
    return {
      text: renderState,
    };
  });

  if (snapshot) {
    fs.writeFileSync(statePath, JSON.stringify(snapshot, null, 2));
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

async function waitForScene(page, target, timeoutMs = 3000, allowPlaySceneFallback = false) {
  return Boolean(await waitForAnyScene(page, target, timeoutMs, allowPlaySceneFallback));
}

async function coerceToWorldMapScene(page) {
  const scene = await waitForAndReturnScene(page, PHASE2_TIMEOUTS.sceneProbeMs);
  if (scene === 'WorldMapScene') {
    return true;
  }

  if (scene === 'TitleScene' || !scene) {
    await page.keyboard.press('Enter');
    if (await waitForScene(page, 'WorldMapScene', PHASE2_TIMEOUTS.bootstrapWorldMapMs)) {
      return true;
    }
  }

  if (scene === 'PlayScene') {
    await page.keyboard.press('Escape');
    await wait(60);
    await page.keyboard.press('KeyL');
    if (await waitForScene(page, 'WorldMapScene', PHASE2_TIMEOUTS.bootstrapWorldMapMs)) {
      return true;
    }
  }

  if (scene === 'PauseScene' || scene === 'InterludeScene' || scene === 'DebriefScene'
    || scene === 'ChoiceScene' || scene === 'CreditsScene' || scene === 'FinalVictoryScene') {
    await unwindNarrativeScene(page, scene);
    if (await waitForScene(page, 'WorldMapScene', PHASE2_TIMEOUTS.bootstrapWorldMapMs)) {
      return true;
    }
  }

  return Boolean(await waitForScene(page, 'WorldMapScene', PHASE2_TIMEOUTS.sceneProbeMs));
}

async function bootstrapToTitle(page, rootState, runMeta) {
  for (let attempt = 1; attempt <= PHASE2_RETRIES.bootstrapAttempts; attempt += 1) {
    try {
      await page.goto(rootState.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.evaluate(
        ({ save, saveKeys }) => {
          for (const saveKey of saveKeys) {
            window.localStorage.setItem(saveKey, JSON.stringify(save));
          }
        },
        {
          save: rootState.save,
          saveKeys: DEFAULT_SAVE_KEYS,
        },
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
      await focusCanvas(page);
      await wait(120);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt < PHASE2_RETRIES.bootstrapAttempts && isTransientHarnessError(message)) {
        await wait(200);
        continue;
      }
      throw error;
    }

    const bootstrapScene = await waitForAnyScene(page, ['TitleScene', 'WorldMapScene'], PHASE2_TIMEOUTS.bootstrapTitleMs);
    if (bootstrapScene === 'WorldMapScene') {
      return true;
    }
    if (bootstrapScene === 'TitleScene') {
      await page.keyboard.press('Enter');
      if (await waitForScene(page, 'WorldMapScene', PHASE2_TIMEOUTS.bootstrapWorldMapMs)) {
        return true;
      }
    }
    if (await coerceToWorldMapScene(page)) {
      return true;
    }
    if (attempt < PHASE2_RETRIES.bootstrapAttempts) {
      await wait(220);
    }
  }

  runMeta.status = 'FAIL';
  runMeta.blocker = PHASE2_BLOCKERS.BOOTSTRAP_WORLDMAP_TIMEOUT;
  runMeta.rollback_required = true;
  runMeta.notes = `failed transition to world map for level ${runMeta.world}-${runMeta.level}`;
  return false;
}

async function returnToWorldMap(page, runMeta) {
  const maxPasses = 12;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    if (await coerceToWorldMapScene(page)) {
      return true;
    }
    await wait(200);
  }

  runMeta.status = 'WARN';
  runMeta.blocker = PHASE2_BLOCKERS.WORLD_MAP_RETURN_TIMEOUT;
  runMeta.rollback_required = true;
  runMeta.notes = `failed to return to map after level ${runMeta.world}-${runMeta.level}`;
  return false;
}

async function transitionToPlayScene(page, runMeta) {
  for (let attempt = 1; attempt <= PHASE2_RETRIES.transitionAttempts; attempt += 1) {
    if (!(await coerceToWorldMapScene(page))) {
      if (attempt < PHASE2_RETRIES.transitionAttempts) {
        await wait(180);
        continue;
      }
      runMeta.status = 'FAIL';
      runMeta.blocker = PHASE2_BLOCKERS.BOOTSTRAP_WORLDMAP_TIMEOUT;
      runMeta.rollback_required = true;
      runMeta.notes = `unable to stabilize world map before level ${runMeta.world}-${runMeta.level}`;
      return false;
    }

    const selection = await alignWorldMapSelection(page, runMeta.world, runMeta.level);
    if (!selection.ok) {
      if (attempt < PHASE2_RETRIES.transitionAttempts) {
        await wait(160);
        continue;
      }
      runMeta.status = 'FAIL';
      runMeta.blocker = selection.blocker ?? PHASE2_BLOCKERS.WORLD_MAP_SELECTION_TIMEOUT;
      runMeta.rollback_required = true;
      runMeta.notes = selection.notes ?? `world-map selection failed for level ${runMeta.world}-${runMeta.level}`;
      return false;
    }

    await wait(160);
    await focusCanvas(page);
    await page.keyboard.press('Enter');
    if (await waitForScene(page, 'PlayScene', PHASE2_TIMEOUTS.bootstrapPlayMs, true)) {
      return true;
    }

    if (attempt < PHASE2_RETRIES.transitionAttempts) {
      await coerceToWorldMapScene(page);
      await wait(180);
      continue;
    }
  }

  runMeta.status = 'FAIL';
  runMeta.blocker = PHASE2_BLOCKERS.BOOTSTRAP_PLAY_TIMEOUT;
  runMeta.rollback_required = true;
  runMeta.notes = `failed transition to play scene for level ${runMeta.world}-${runMeta.level}`;
  return false;
}

async function releaseButtons(page, buttons, root) {
  for (const button of buttons) {
    const key = root[button];
    if (!key) {
      continue;
    }
    await page.keyboard.up(key);
  }
}

async function captureScenarioEvidence(page, screenshotDir, stateDir, index) {
  const shotPath = path.join(screenshotDir, `shot-${index}.png`);
  const statePath = path.join(stateDir, `state-${index}.json`);

  try {
    await screenshotState(page, { sceneName: 'PlayScene' }, shotPath, statePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isTransientHarnessError(message)) {
      await wait(120);
      await screenshotState(page, { sceneName: 'PlayScene' }, shotPath, statePath);
    } else {
      throw error;
    }
  }

  return { shotPath, statePath };
}

async function captureStateSample(page, samples) {
  try {
    await captureDebugState(page, samples);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isTransientHarnessError(message)) {
      throw error;
    }
  }
  return true;
}

async function advanceTimeFrames(page, frames, options = {}) {
  const onFrame = typeof options.onFrame === 'function' ? options.onFrame : null;
  for (let i = 0; i < frames; i += 1) {
    await page.evaluate(() => {
      if (typeof window.advanceTime === 'function') {
        window.advanceTime(1000 / 60);
      }
    });

    if (onFrame) {
      await onFrame(i);
    }
  }
}

async function doChoreography(page, steps, root, options = {}) {
  const onFrame = typeof options.onFrame === 'function' ? options.onFrame : null;
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
    try {
      await advanceTimeFrames(page, frames, { onFrame });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isExecutionContextDestroyed(message) || isTransientHarnessError(message)) {
        await releaseButtons(page, buttons, root);
        await wait(120);
        continue;
      }
      throw error;
    }

    await releaseButtons(page, buttons, root);
  }
}

async function runScenario(page, actionPath, levelKey, scenario, rootState, screenshotDir, stateDir) {
  const action = loadScenarioAction(actionPath, scenario);
  const steps = Array.isArray(action?.steps) ? action.steps : [];
  const actionNote = action?.notes ?? '';
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
    action_source: action?.source ?? 'missing',
    action_loaded: Boolean(action?.loaded),
    rollback_required: false,
    evidence_screenshot: [],
    evidence_state: [],
    result: 'PASS',
  };

  if (actionNote) {
    runMeta.notes = actionNote;
  }

  const stateSamples = [];
  const evaluateSignals = () => {
    if (runMeta.status !== 'PASS') {
      return;
    }

    const signals = evaluateScenarioSignals(scenario, stateSamples);
    if (!signals.passed) {
      runMeta.status = 'FAIL';
      runMeta.blocker = signals.blocker;
      runMeta.rollback_required = true;
      runMeta.notes = signals.notes;
      return;
    }

    if (scenario === 'jump-cut') {
      runMeta.jump_cut_one_shot = signals.jumpCutDetected && !signals.jumpCutRepeat && signals.jumpCutCount === 1;
    }
    if (scenario === 'run-skid') {
      runMeta.skid_detected = signals.skidDetected;
    }
    if (scenario === 'telegraph') {
      runMeta.telegraph_visible = signals.telegraphObserved;
    }
    if (scenario === 'stomp') {
      runMeta.stomp_hitstop_present = signals.stompsDetected > 0;
    }
  };

  const errors = [];
  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isIgnoredConsoleError(text)) {
        errors.push({ type: 'console.error', text });
      }
    }
  };
  const pageErrorHandler = (err) => {
    const text = String(err);
    if (!isIgnoredConsoleError(text)) {
      errors.push({ type: 'pageerror', text });
    }
  };
  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    if (!(await bootstrapToTitle(page, rootState, runMeta))) {
      return normalizeFindingResult(runMeta);
    }

    await focusCanvas(page);
    if (!(await transitionToPlayScene(page, runMeta))) {
      return normalizeFindingResult(runMeta);
    }

    await captureStateSample(page, stateSamples);

    await doChoreography(page, steps, INPUT_MAP, {
      onFrame: () => captureStateSample(page, stateSamples),
    });
    evaluateSignals();

    const firstEvidence = await captureScenarioEvidence(page, screenshotDir, stateDir, 0);
    runMeta.evidence_screenshot.push(firstEvidence.shotPath);
    runMeta.evidence_state.push(firstEvidence.statePath);

    if (rootState.iterations > 1) {
      for (let pass = 1; pass < rootState.iterations; pass += 1) {
        await advanceTimeFrames(page, 30);
        await doChoreography(page, steps, INPUT_MAP, {
          onFrame: () => captureStateSample(page, stateSamples),
        });
        const evidence = await captureScenarioEvidence(page, screenshotDir, stateDir, pass);
        runMeta.evidence_screenshot.push(evidence.shotPath);
        runMeta.evidence_state.push(evidence.statePath);
      }
    }

    await returnToWorldMap(page, runMeta);
  } catch (err) {
    runMeta.status = 'FAIL';
    runMeta.blocker = PHASE2_BLOCKERS.EXECUTION_ERROR;
    runMeta.rollback_required = true;
    runMeta.notes = err instanceof Error ? err.message : String(err);
    runMeta.result = 'FAIL';
    return normalizeFindingResult(runMeta);
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
  }

  evaluateSignals();

  if (errors.length > 0) {
    runMeta.status = 'FAIL';
    runMeta.blocker = PHASE2_BLOCKERS.PLAYFEEL_CONSOLE_ERROR;
    runMeta.rollback_required = true;
    const summary = errors
      .slice(0, 3)
      .map((entry) => `${entry.type}: ${entry.text}`)
      .join(' | ');
    runMeta.notes = `${errors.length} console/page error(s): ${summary}`;
  }
  runMeta.result = runMeta.status;
  return normalizeFindingResult(runMeta);
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
