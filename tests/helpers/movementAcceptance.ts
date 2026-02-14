import {
  createFeelState,
  stepMovement,
  type MovementStepInput,
  type MovementStepOutput,
  type FeelState,
  type WorldModifiers,
} from '../../src/player/movement';

export interface MovementFrame {
  frame: number;
  input: MovementStepInput;
  output: MovementStepOutput;
}

export interface RunTransitionResult {
  reachedRun: boolean;
  framesToRun: number | null;
  walkLikeFrames: MovementFrame[];
  finalOutput: MovementStepOutput;
}

export interface AccelCompareResult {
  dtMs: number;
  groundAccel: number;
  airAccel: number;
  ratio: number;
}

export interface JumpCutPulseResult {
  cutFrame: number | null;
  cutCount: number;
  firstPostReleaseVy: number;
  secondPostReleaseVy: number;
  frames: MovementFrame[];
  finalOutput: MovementStepOutput;
}

export interface SkidSpanResult {
  firstSkidFrame: number | null;
  skidSpanFrames: number;
  frames: MovementFrame[];
}

export interface VelocityFramesResult {
  reached: boolean;
  framesToTarget: number | null;
  frames: MovementFrame[];
  finalOutput: MovementStepOutput;
}

export interface JumpCutReapplyResult {
  firstCutFrame: number | null;
  secondCutFrame: number | null;
  cutCount: number;
  frames: MovementFrame[];
  finalOutput: MovementStepOutput;
}

interface BaseMoveParams {
  dtMs?: number;
  inputX?: -1 | 0 | 1;
  runHeld?: boolean;
  onGround?: boolean;
  jumpHeld?: boolean;
  jumpPressed?: boolean;
  initialVx?: number;
  initialVy?: number;
  maxFrames?: number;
  modifiers?: WorldModifiers;
  initialFeel?: FeelState;
}

const DEFAULT_DT_MS = 16;
const DEFAULT_MAX_FRAMES = 60;

type MovementFramePatch = Partial<
  Omit<MovementStepInput, 'vx' | 'vy' | 'feel'>
>;

type NormalizedMoveParams = Required<
  Pick<
    BaseMoveParams,
    | 'dtMs'
    | 'inputX'
    | 'runHeld'
    | 'onGround'
    | 'jumpHeld'
    | 'jumpPressed'
    | 'initialVx'
    | 'initialVy'
    | 'maxFrames'
  > & Pick<BaseMoveParams, 'modifiers' | 'initialFeel'>
>;

function normalizeParams(
  params: BaseMoveParams,
): NormalizedMoveParams {
  return {
    dtMs: params.dtMs ?? DEFAULT_DT_MS,
    inputX: params.inputX ?? 1,
    runHeld: params.runHeld ?? false,
    onGround: params.onGround ?? true,
    jumpHeld: params.jumpHeld ?? false,
    jumpPressed: params.jumpPressed ?? false,
    initialVx: params.initialVx ?? 0,
    initialVy: params.initialVy ?? 0,
    maxFrames: params.maxFrames ?? DEFAULT_MAX_FRAMES,
    modifiers: params.modifiers ?? { frictionMultiplier: 1, gravityMultiplier: 1, speedMultiplier: 1, tokenBurnRate: 1 },
    initialFeel: params.initialFeel ?? createFeelState(),
  };
}

function cloneFeelState() {
  return createFeelState();
}

export function simulateMovementFrames(params: BaseMoveParams, inputStream: MovementFramePatch[] = []): MovementFrame[] {
  const normalized = normalizeParams(params);
  let feel = normalized.initialFeel ? { ...normalized.initialFeel } : cloneFeelState();
  let vx = normalized.initialVx;
  let vy = normalized.initialVy;
  const totalFrames = inputStream.length > 0 ? inputStream.length : normalized.maxFrames;
  const frames: MovementFrame[] = [];

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const patch = inputStream[frame] ?? {};
    const input: MovementStepInput = {
      dtMs: patch.dtMs ?? normalized.dtMs,
      vx,
      vy,
      inputX: patch.inputX ?? normalized.inputX,
      jumpPressed: patch.jumpPressed ?? normalized.jumpPressed,
      jumpHeld: patch.jumpHeld ?? normalized.jumpHeld,
      runHeld: patch.runHeld ?? normalized.runHeld,
      onGround: patch.onGround ?? normalized.onGround,
      feel,
    };

    const output = stepMovement(input, normalized.modifiers);
    frames.push({
      frame,
      input,
      output,
    });
    feel = output.feel;
    vx = output.vx;
    vy = output.vy;
  }

  return frames;
}

export function runChargeFramesToRunState(params: BaseMoveParams = {}): RunTransitionResult {
  const normalized = normalizeParams(params);
  let feel = normalized.initialFeel ? { ...normalized.initialFeel } : cloneFeelState();
  let vx = normalized.initialVx;
  let vy = normalized.initialVy;
  const frames: MovementFrame[] = [];

  for (let frame = 0; frame < normalized.maxFrames; frame += 1) {
    const input: MovementStepInput = {
      dtMs: normalized.dtMs,
      vx,
      vy,
      inputX: normalized.inputX,
      jumpPressed: normalized.jumpPressed,
      jumpHeld: normalized.jumpHeld,
      runHeld: normalized.runHeld,
      onGround: normalized.onGround,
      feel,
    };
    const output = stepMovement(input, normalized.modifiers);
    frames.push({
      frame,
      input,
      output,
    });

    feel = output.feel;
    vx = output.vx;
    vy = output.vy;
    if (output.motionHint === 'run') {
      return {
        reachedRun: true,
        framesToRun: frame + 1,
        walkLikeFrames: frames,
        finalOutput: output,
      };
    }
  }

  return {
    reachedRun: false,
    framesToRun: null,
    walkLikeFrames: frames,
    finalOutput: frames[frames.length - 1]!.output,
  };
}

export function measureAirVsGroundAccel(params: BaseMoveParams): AccelCompareResult {
  const normalized = normalizeParams({ ...params, onGround: true });
  const dtSeconds = normalized.dtMs / 1000;

  const ground = stepMovement({
    dtMs: normalized.dtMs,
    vx: normalized.initialVx,
    vy: normalized.initialVy,
    inputX: normalized.inputX,
    jumpPressed: normalized.jumpPressed,
    jumpHeld: normalized.jumpHeld,
    runHeld: normalized.runHeld,
    onGround: true,
    feel: cloneFeelState(),
  }, normalized.modifiers);

  const air = stepMovement({
    dtMs: normalized.dtMs,
    vx: normalized.initialVx,
    vy: normalized.initialVy,
    inputX: normalized.inputX,
    jumpPressed: normalized.jumpPressed,
    jumpHeld: normalized.jumpHeld,
    runHeld: normalized.runHeld,
    onGround: false,
    feel: cloneFeelState(),
  }, normalized.modifiers);

  const groundAccel = ground.vx / dtSeconds;
  const airAccel = air.vx / dtSeconds;
  return {
    dtMs: normalized.dtMs,
    groundAccel,
    airAccel,
    ratio: airAccel / Math.max(groundAccel, Number.EPSILON),
  };
}

export function measureJumpCutReapplication(
  params: Omit<BaseMoveParams, 'runHeld'> & {
    holdForFrames?: number;
    firstReleaseFrames?: number;
    rePressFrames?: number;
    secondReleaseFrames?: number;
  } = {},
): JumpCutReapplyResult {
  const {
    holdForFrames = 1,
    firstReleaseFrames = 4,
    rePressFrames = 3,
    secondReleaseFrames = 4,
    dtMs = DEFAULT_DT_MS,
    inputX = 0,
    initialVx = 0,
    initialVy = 120,
    onGround = false,
    modifiers,
  } = params;

  const base = normalizeParams({
    dtMs,
    initialVx,
    initialVy,
    inputX,
    onGround,
    jumpPressed: true,
    jumpHeld: true,
    maxFrames: 1,
    modifiers,
  });
  const launch = stepMovement({
    dtMs: base.dtMs,
    vx: base.initialVx,
    vy: base.initialVy,
    inputX: base.inputX,
    jumpPressed: true,
    jumpHeld: true,
    onGround: true,
    feel: base.initialFeel,
  }, base.modifiers);

  const stream: MovementFramePatch[] = [];
  const safeHoldFrames = Math.max(1, holdForFrames);
  const safeFirstRelease = Math.max(2, firstReleaseFrames);
  const safeRePress = Math.max(1, rePressFrames);
  const safeSecondRelease = Math.max(2, secondReleaseFrames);

  for (let i = 1; i < safeHoldFrames; i += 1) {
    stream.push({ jumpPressed: false, jumpHeld: true });
  }
  for (let i = 0; i < safeFirstRelease; i += 1) {
    stream.push({ jumpPressed: false, jumpHeld: false });
  }
  for (let i = 0; i < safeRePress; i += 1) {
    stream.push({ jumpPressed: false, jumpHeld: true });
  }
  for (let i = 0; i < safeSecondRelease; i += 1) {
    stream.push({ jumpPressed: false, jumpHeld: false });
  }

  const feel = launch.feel;
  const vx = launch.vx;
  const vy = launch.vy;
  let firstCutFrame: number | null = null;
  let secondCutFrame: number | null = null;
  let cutCount = 0;

  const replay = simulateMovementFrames(
    {
      dtMs: base.dtMs,
      inputX: base.inputX,
      jumpPressed: false,
      jumpHeld: false,
      runHeld: false,
      onGround: false,
      initialVx: vx,
      initialVy: vy,
      initialFeel: feel,
      maxFrames: stream.length,
      modifiers: base.modifiers,
    },
    stream,
  );

  const frames = replay;
  let previousCutApplied = false;
  replay.forEach((entry) => {
    const cutApplied = entry.output.feel.jumpCutApplied;
    if (!cutApplied || previousCutApplied) {
      previousCutApplied = cutApplied;
      return;
    }

    if (firstCutFrame == null) {
      firstCutFrame = entry.frame;
      cutCount += 1;
    } else if (secondCutFrame == null) {
      secondCutFrame = entry.frame;
      cutCount += 1;
    }
    previousCutApplied = cutApplied;
  });

  const finalOutput = frames[frames.length - 1]?.output;
  return {
    firstCutFrame,
    secondCutFrame,
    cutCount,
    frames,
    finalOutput: finalOutput ?? launch,
  };
}

export function measureJumpCutPulseFrames(
  params: Omit<BaseMoveParams, 'runHeld'> & {
    holdForFrames?: number;
    cutWindowFrames?: number;
  } = {},
): JumpCutPulseResult {
  const {
    holdForFrames = 1,
    cutWindowFrames = 3,
    dtMs = DEFAULT_DT_MS,
    inputX = 0,
    initialVx = 0,
    initialVy = 120,
    onGround = false,
    modifiers,
  } = params;

  let feel = cloneFeelState();
  let launch = stepMovement({
    dtMs,
    vx: initialVx,
    vy: initialVy,
    inputX,
    jumpPressed: true,
    jumpHeld: true,
    onGround: true,
    feel,
  }, modifiers);
  let vx = launch.vx;
  let vy = launch.vy;
  feel = launch.feel;

  // Optional additional pre-release hold (tap vs. full hold shaping).
  const holdFrames = Math.max(1, holdForFrames);
  for (let holdFrame = 1; holdFrame < holdFrames; holdFrame += 1) {
    launch = stepMovement({
      dtMs,
      vx,
      vy,
      inputX,
      jumpPressed: false,
      jumpHeld: true,
      onGround,
      feel,
    }, modifiers);
    feel = launch.feel;
    vx = launch.vx;
    vy = launch.vy;
  }

  const releaseFrames = Math.max(2, cutWindowFrames);
  const frames: MovementFrame[] = [];
  let cutFrame: number | null = null;
  let cutCount = 0;
  let alreadyCountedCut = false;
  let firstPostReleaseVy = vy;
  let secondPostReleaseVy = vy;
  let current: MovementStepOutput = launch;

  for (let frame = 0; frame < releaseFrames; frame += 1) {
    const input: MovementStepInput = {
      dtMs,
      vx,
      vy,
      inputX,
      jumpPressed: false,
      jumpHeld: false,
      runHeld: false,
      onGround: false,
      feel,
    };
    current = stepMovement(input, modifiers);

    if (frame === 0) {
      firstPostReleaseVy = current.vy;
    }
    if (frame === 1) {
      secondPostReleaseVy = current.vy;
    }
    if (current.feel.jumpCutApplied && !alreadyCountedCut) {
      cutFrame = frame;
      cutCount = 1;
      alreadyCountedCut = true;
    }

    feel = current.feel;
    vx = current.vx;
    vy = current.vy;
    frames.push({ frame, input, output: current });
  }

  return {
    cutFrame,
    cutCount,
    firstPostReleaseVy,
    secondPostReleaseVy,
    frames,
    finalOutput: current,
  };
}

export function measureSkidFrameSpan(
  params: BaseMoveParams & {
    reversalFrames?: number;
    reverseInput?: -1 | 0 | 1;
  } = {},
): SkidSpanResult {
  const normalized = normalizeParams(params);
  const reversalFrames = params.reversalFrames ?? 20;
  const reverseInput = params.reverseInput ?? (normalized.inputX === 1 ? -1 : 1);

  const runUp = runChargeFramesToRunState({
    dtMs: normalized.dtMs,
    inputX: normalized.inputX,
    runHeld: true,
    onGround: true,
    jumpHeld: normalized.jumpHeld,
    maxFrames: Math.max(1, normalized.maxFrames),
    initialVx: normalized.initialVx,
    initialVy: normalized.initialVy,
    modifiers: normalized.modifiers,
  });

  let vx = runUp.finalOutput.vx;
  let vy = runUp.finalOutput.vy;
  let feel = runUp.finalOutput.feel;
  const frames: MovementFrame[] = [];
  let firstSkidFrame: number | null = null;
  let skidSpanFrames = 0;
  let hasSkid = false;

  for (let frame = 0; frame < reversalFrames; frame += 1) {
    const input: MovementStepInput = {
      dtMs: normalized.dtMs,
      vx,
      vy,
      inputX: reverseInput,
      jumpPressed: false,
      jumpHeld: false,
      runHeld: false,
      onGround: true,
      feel,
    };
    const output = stepMovement(input, normalized.modifiers);
    frames.push({ frame, input, output });

    if (output.motionHint === 'skid') {
      if (!hasSkid) {
        firstSkidFrame = frame;
        hasSkid = true;
      }
      skidSpanFrames += 1;
    } else if (hasSkid) {
      break;
    }

    feel = output.feel;
    vx = output.vx;
    vy = output.vy;
  }

  return {
    firstSkidFrame,
    skidSpanFrames,
    frames,
  };
}

export function framesToTargetVelocity(
  params: BaseMoveParams & {
    targetSpeed: number;
  },
): VelocityFramesResult {
  const normalized = normalizeParams(params);
  const threshold = Math.max(0.01, Math.abs(params.targetSpeed));
  let feel = cloneFeelState();
  let vx = normalized.initialVx;
  let vy = normalized.initialVy;
  const frames: MovementFrame[] = [];

  for (let frame = 0; frame < normalized.maxFrames; frame += 1) {
    const input: MovementStepInput = {
      dtMs: normalized.dtMs,
      vx,
      vy,
      inputX: normalized.inputX,
      jumpPressed: normalized.jumpPressed,
      jumpHeld: normalized.jumpHeld,
      runHeld: normalized.runHeld,
      onGround: normalized.onGround,
      feel,
    };
    const output = stepMovement(input, normalized.modifiers);
    frames.push({ frame, input, output });

    if (Math.abs(output.vx) >= threshold) {
      return {
        reached: true,
        framesToTarget: frame + 1,
        frames,
        finalOutput: output,
      };
    }

    feel = output.feel;
    vx = output.vx;
    vy = output.vy;
  }

  return {
    reached: false,
    framesToTarget: null,
    frames,
    finalOutput: frames[frames.length - 1]!.output,
  };
}
