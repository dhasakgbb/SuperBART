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
}

export interface MovementStepInput {
  dtMs: number;
  vx: number;
  vy: number;
  inputX: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
  onGround: boolean;
  feel: FeelState;
}

export interface MovementStepOutput {
  vx: number;
  vy: number;
  jumped: boolean;
  feel: FeelState;
}

export function createFeelState(): FeelState {
  return { coyoteMsLeft: 0, jumpBufferMsLeft: 0 };
}

export function stepMovement(input: MovementStepInput, modifiers?: WorldModifiers): MovementStepOutput {
  const dt = input.dtMs / 1000;
  const m = modifiers ?? DEFAULT_WORLD_MODIFIERS;
  const next = { ...input.feel };

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

  const target = input.inputX * PLAYER_CONSTANTS.maxSpeed * m.speedMultiplier;
  const drag = PLAYER_CONSTANTS.runDrag * m.frictionMultiplier;
  const accel = input.inputX === 0 ? drag : PLAYER_CONSTANTS.runAcceleration;
  let vx = input.vx;
  if (vx < target) {
    vx = Math.min(target, vx + accel * dt);
  } else if (vx > target) {
    vx = Math.max(target, vx - accel * dt);
  }

  let vy = Math.min(PLAYER_CONSTANTS.maxFallSpeed, input.vy + PLAYER_CONSTANTS.gravityY * m.gravityMultiplier * dt);
  let jumped = false;

  if (next.jumpBufferMsLeft > 0 && next.coyoteMsLeft > 0) {
    vy = PLAYER_CONSTANTS.jumpVelocity;
    next.jumpBufferMsLeft = 0;
    next.coyoteMsLeft = 0;
    jumped = true;
  }

  if (!input.jumpHeld && vy < 0) {
    vy *= PLAYER_CONSTANTS.jumpCutMultiplier;
  }

  return { vx, vy, jumped, feel: next };
}
