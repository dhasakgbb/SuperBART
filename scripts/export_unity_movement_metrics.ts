import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PLAYER_CONSTANTS } from '../src/core/constants';
import { createFeelState, stepMovement } from '../src/player/movement';
import {
  measureAirVsGroundAccel,
  measureJumpCutReapplication,
  measureSkidFrameSpan,
  runChargeFramesToRunState,
} from '../tests/helpers/movementAcceptance';

export interface UnityMovementMetricTolerances {
  scalarPct: number;
  frameCount: number;
  booleanExact: boolean;
}

export interface UnityMovementMetrics {
  runTransitionFrames: number;
  runToWalkSpeedRatio: number;
  airGroundAccelRatio: number;
  jumpBufferLandingSuccess: boolean;
  jumpCutOneShotCount: number;
  jumpCutFirstFrame: number | null;
  jumpCutSecondFrame: number | null;
  skidFirstFrame: number | null;
  skidDurationFrames: number;
  skidDurationMs: number;
}

export interface UnityMovementMetricsArtifact {
  version: number;
  generatedAt: string;
  source: {
    model: string;
    helper: string;
    contract: string;
  };
  tolerances: UnityMovementMetricTolerances;
  metrics: UnityMovementMetrics;
}

export interface ExportUnityMovementMetricsOptions {
  outPath?: string;
}

const DEFAULT_OUT_PATH = path.resolve(
  process.cwd(),
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Resources',
  'Fixtures',
  'parity',
  'movement_metrics.json'
);

function readPlayfeelContract(): Record<string, number | boolean> {
  const contractPath = path.resolve(process.cwd(), 'scripts', 'playfeel_contract.json');
  const raw = fs.readFileSync(contractPath, 'utf8');
  return JSON.parse(raw) as Record<string, number | boolean>;
}

function computeJumpBufferLandingSuccess(): boolean {
  let feel = createFeelState();

  const first = stepMovement({
    dtMs: 16,
    vx: 0,
    vy: 50,
    inputX: 0,
    jumpPressed: true,
    jumpHeld: true,
    onGround: false,
    feel,
  });

  feel = first.feel;

  const second = stepMovement({
    dtMs: 50,
    vx: first.vx,
    vy: first.vy,
    inputX: 0,
    jumpPressed: false,
    jumpHeld: true,
    onGround: true,
    feel,
  });

  return second.jumped && second.vy < 0;
}

export function computeUnityMovementMetrics(): UnityMovementMetrics {
  const walk = runChargeFramesToRunState({
    dtMs: 16,
    inputX: 1,
    onGround: true,
    runHeld: false,
    maxFrames: 1,
  });

  const run = runChargeFramesToRunState({
    dtMs: 16,
    inputX: 1,
    onGround: true,
    runHeld: true,
    maxFrames: 20,
  });

  const accel = measureAirVsGroundAccel({
    dtMs: 16,
    inputX: 1,
    onGround: true,
    runHeld: false,
    jumpHeld: true,
  });

  const jumpCut = measureJumpCutReapplication({
    dtMs: 16,
    inputX: 0,
    holdForFrames: 1,
    firstReleaseFrames: 3,
    rePressFrames: 2,
    secondReleaseFrames: 4,
  });

  const skid = measureSkidFrameSpan({
    dtMs: 16,
    inputX: 1,
    runHeld: true,
    onGround: true,
    maxFrames: 12,
    reversalFrames: 16,
    reverseInput: -1,
  });

  return {
    runTransitionFrames: run.framesToRun ?? -1,
    runToWalkSpeedRatio: run.finalOutput.vx / Math.max(Math.abs(walk.finalOutput.vx), Number.EPSILON),
    airGroundAccelRatio: accel.ratio,
    jumpBufferLandingSuccess: computeJumpBufferLandingSuccess(),
    jumpCutOneShotCount: jumpCut.cutCount,
    jumpCutFirstFrame: jumpCut.firstCutFrame,
    jumpCutSecondFrame: jumpCut.secondCutFrame,
    skidFirstFrame: skid.firstSkidFrame,
    skidDurationFrames: skid.skidSpanFrames,
    skidDurationMs: skid.skidSpanFrames * 16,
  };
}

export function buildUnityMovementMetricsArtifact(): UnityMovementMetricsArtifact {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      model: 'src/player/movement.ts',
      helper: 'tests/helpers/movementAcceptance.ts',
      contract: 'scripts/playfeel_contract.json',
    },
    tolerances: {
      scalarPct: 0.03,
      frameCount: 1,
      booleanExact: true,
    },
    metrics: computeUnityMovementMetrics(),
  };
}

function assertContractCompatibility(artifact: UnityMovementMetricsArtifact): void {
  const contract = readPlayfeelContract();
  const metrics = artifact.metrics;

  const runTransitionFramesMax = Number(contract.run_transition_frames_max ?? 8);
  const runToWalkMin = Number(contract.run_to_walk_speed_ratio_min ?? 1.35);
  const airAccelMax = Number(contract.air_accel_ratio_max ?? contract.air_accel_ratio ?? 0.70);
  const jumpCutFrames = Number(contract.jump_cut_frames ?? 1);
  const skidDurationMax = Number(contract.skid_duration_ms_max ?? 96);

  if (metrics.runTransitionFrames > runTransitionFramesMax) {
    throw new Error(`runTransitionFrames ${metrics.runTransitionFrames} exceeds contract ${runTransitionFramesMax}`);
  }
  if (metrics.runToWalkSpeedRatio < runToWalkMin) {
    throw new Error(`runToWalkSpeedRatio ${metrics.runToWalkSpeedRatio} below contract ${runToWalkMin}`);
  }
  if (metrics.airGroundAccelRatio > airAccelMax) {
    throw new Error(`airGroundAccelRatio ${metrics.airGroundAccelRatio} exceeds contract ${airAccelMax}`);
  }
  if (metrics.jumpCutOneShotCount !== jumpCutFrames) {
    throw new Error(`jumpCutOneShotCount ${metrics.jumpCutOneShotCount} must equal ${jumpCutFrames}`);
  }
  if (metrics.skidDurationMs > skidDurationMax) {
    throw new Error(`skidDurationMs ${metrics.skidDurationMs} exceeds contract ${skidDurationMax}`);
  }
  if (!metrics.jumpBufferLandingSuccess) {
    throw new Error('jumpBufferLandingSuccess must be true');
  }
  if (metrics.jumpCutSecondFrame != null) {
    throw new Error(`jumpCutSecondFrame must be null, received ${metrics.jumpCutSecondFrame}`);
  }

  if (PLAYER_CONSTANTS.runTransitionMs !== Number(contract.run_transition_ms ?? 120)) {
    throw new Error('PLAYER_CONSTANTS.runTransitionMs does not match contract run_transition_ms');
  }
}

export function exportUnityMovementMetrics(options: ExportUnityMovementMetricsOptions = {}): string {
  const outPath = path.resolve(options.outPath ?? DEFAULT_OUT_PATH);
  const artifact = buildUnityMovementMetricsArtifact();

  assertContractCompatibility(artifact);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  return outPath;
}

function getArgValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) {
    return undefined;
  }
  return argv[index + 1];
}

function printUsage(): void {
  process.stdout.write(
    [
      'SUPERBART -> Unity movement metrics exporter',
      '',
      'Usage:',
      '  npx tsx scripts/export_unity_movement_metrics.ts --out unity-port-kit/Fixtures/parity/movement_metrics.json',
      '',
      'Options:',
      '  --out <path>  Output JSON path',
      '',
    ].join('\n')
  );
}

function runCli(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const outPath = getArgValue(argv, 'out');
  const filePath = exportUnityMovementMetrics({ outPath });
  process.stdout.write(`Wrote ${path.relative(process.cwd(), filePath)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  runCli(process.argv.slice(2));
}
