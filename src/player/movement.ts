import { PLAYER_CONSTANTS } from '../core/constants';

export interface WorldModifiers {
  frictionMultiplier: number;   // 1.0 = normal, 0.6 = slippery
  gravityMultiplier: number;    // 1.0 = normal, 1.15 = heavy
  speedMultiplier: number;      // 1.0 = normal
  tokenBurnRate: number;        // 1.0 = normal, 1.2 = fast timer
}

export const DEFAULT_WORLD_MODIFIERS: WorldModifiers = {
  frictionMultiplier: 1.0,
  gravityMultiplier: 1.0,
  speedMultiplier: 1.0,
  tokenBurnRate: 1.0,
};

export interface FeelState {
  coyoteMsLeft: number;
  jumpBufferMsLeft: number;
  jumpCutApplied: boolean;
  jumpCutWindowMsLeft: number;
  prevJumpHeld: boolean;
  runChargeMs: number;
  desiredState: 'walk' | 'run';
  skidMsLeft: number;
}

export type MotionHint = 'air' | 'walk' | 'run' | 'skid';

export interface MovementStepInput {
  dtMs: number;
  vx: number;
  vy: number;
  inputX: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
  runHeld?: boolean;
  onGround: boolean;
  feel: FeelState;
}

export interface MovementStepOutput {
  vx: number;
  vy: number;
  jumped: boolean;
  motionHint: MotionHint;
  feel: FeelState;
}

export function createFeelState(): FeelState {
  return {
    coyoteMsLeft: 0,
    jumpBufferMsLeft: 0,
    jumpCutApplied: false,
    jumpCutWindowMsLeft: 0,
    prevJumpHeld: false,
    runChargeMs: 0,
    desiredState: 'walk',
    skidMsLeft: 0,
  };
}

export function stepMovement(input: MovementStepInput, modifiers?: WorldModifiers): MovementStepOutput {
  const dt = input.dtMs / 1000;
  const m = modifiers ?? DEFAULT_WORLD_MODIFIERS;
  const next = { ...input.feel };
  const jumpReleased = !input.jumpHeld && next.prevJumpHeld;

  if (input.onGround) {
    next.coyoteMsLeft = PLAYER_CONSTANTS.coyoteMs;
  } else {
    next.coyoteMsLeft = Math.max(0, next.coyoteMsLeft - input.dtMs);
  }

  if (input.jumpPressed) {
    next.jumpBufferMsLeft = PLAYER_CONSTANTS.jumpBufferMs;
  } else {
    next.jumpBufferMsLeft = Math.max(0, next.jumpBufferMsLeft - input.dtMs);
  }

  const runHeld = input.runHeld ?? false;
  const hasGroundMoveInput = input.inputX !== 0;
  if (input.onGround) {
    // Charge only while grounded and moving; decay on-ground without input.
    const runChargeDelta = runHeld && hasGroundMoveInput ? input.dtMs : -input.dtMs;
    next.runChargeMs = Math.max(0, Math.min(PLAYER_CONSTANTS.runTransitionMs, next.runChargeMs + runChargeDelta));
  } else {
    next.runChargeMs = Math.max(0, next.runChargeMs - input.dtMs);
  }
  const runChargeProgress = Math.min(1, next.runChargeMs / PLAYER_CONSTANTS.runTransitionMs);
  // Contract says run is intent-qualified and requires sustained grounded input to arm.
  const runReady = input.onGround && runHeld && hasGroundMoveInput && runChargeProgress >= 1;
  next.desiredState = input.onGround && runReady ? 'run' : 'walk';

  const runProgress = runHeld ? runChargeProgress : 0;
  const runMultiplier = 1 + (PLAYER_CONSTANTS.runSpeedMultiplier - 1) * runProgress;
  const target = input.inputX * PLAYER_CONSTANTS.maxSpeed * m.speedMultiplier * (runHeld ? runMultiplier : 1);
  const walkBaseAcceleration = PLAYER_CONSTANTS.runAcceleration * 0.72;
  const dragBase = input.onGround ? PLAYER_CONSTANTS.runDrag : PLAYER_CONSTANTS.runDrag * 0.92;
  const drag = dragBase * m.frictionMultiplier;
  const runAccelBlend = PLAYER_CONSTANTS.runAcceleration * (0.72 + 0.28 * runProgress);
  const groundAcceleration = runHeld ? runAccelBlend : walkBaseAcceleration;
  const baseAcceleration = input.inputX === 0 ? drag : groundAcceleration;
  const controlMultiplier = input.onGround
    ? 1
    : input.inputX === 0
      ? PLAYER_CONSTANTS.airDragMultiplier
      : PLAYER_CONSTANTS.airControlMultiplier;
  const accel = baseAcceleration * controlMultiplier;
  let vx = input.vx;

  const reversing = input.onGround && input.inputX !== 0 && vx !== 0 && Math.sign(input.inputX) !== Math.sign(vx);
  const hasSkidMomentum = Math.abs(vx) >= PLAYER_CONSTANTS.skidThresholdPxPerSec;
  const newSkid = reversing && hasSkidMomentum && next.skidMsLeft <= 0;
  if (newSkid) {
    next.skidMsLeft = Math.max(next.skidMsLeft, PLAYER_CONSTANTS.skidDurationMs);
  } else if (next.skidMsLeft > 0) {
    next.skidMsLeft = Math.max(0, next.skidMsLeft - input.dtMs);
  }

  if (vx < target) {
    vx = Math.min(target, vx + accel * dt);
  } else if (vx > target) {
    const skidBrake = next.skidMsLeft > 0 ? 1.45 : 1;
    // Skid brake keeps the transition readable while remaining recoverable after a few frames.
    const stopRate = accel * dt * skidBrake;
    vx = Math.max(target, vx - stopRate);
  }

  let vy = Math.min(PLAYER_CONSTANTS.maxFallSpeed, input.vy + PLAYER_CONSTANTS.gravityY * m.gravityMultiplier * dt);
  let jumped = false;

  if (input.onGround) {
    next.jumpCutApplied = false;
    next.jumpCutWindowMsLeft = 0;
  } else if (next.jumpCutWindowMsLeft > 0) {
    next.jumpCutWindowMsLeft = Math.max(0, next.jumpCutWindowMsLeft - input.dtMs);
  }

  if (next.jumpBufferMsLeft > 0 && next.coyoteMsLeft > 0) {
    vy = PLAYER_CONSTANTS.jumpVelocity;
    next.jumpBufferMsLeft = 0;
    next.coyoteMsLeft = 0;
    next.jumpCutApplied = false;
    next.jumpCutWindowMsLeft = PLAYER_CONSTANTS.jumpCutWindowMs;
    jumped = true;
  }

  next.prevJumpHeld = input.jumpHeld;

  // Jump-cut must be a one-shot pulse per jump arc; re-arm only when grounded.
  if (jumpReleased && !next.jumpCutApplied && next.jumpCutWindowMsLeft > 0 && vy < 0) {
    vy *= PLAYER_CONSTANTS.jumpCutMultiplier;
    next.jumpCutApplied = true;
  }

  const absVx = Math.abs(vx);
  const runHintVelocityThreshold = PLAYER_CONSTANTS.maxSpeed * 0.65 * m.speedMultiplier;
  let motionHint: MotionHint = 'air';
  if (input.onGround) {
    if (next.skidMsLeft > 0) {
      motionHint = 'skid';
    } else if (runReady && absVx >= runHintVelocityThreshold) {
      motionHint = 'run';
    } else if (absVx > 0) {
      motionHint = 'walk';
    } else {
      motionHint = 'walk';
    }
  }

  return { vx, vy, jumped, motionHint, feel: next };
}
