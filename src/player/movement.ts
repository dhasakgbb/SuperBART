import { PLAYER_CONSTANTS } from '../core/constants';

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

export function stepMovement(input: MovementStepInput): MovementStepOutput {
  const dt = input.dtMs / 1000;
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

  const target = input.inputX * PLAYER_CONSTANTS.maxSpeed;
  const accel = input.inputX === 0 ? PLAYER_CONSTANTS.runDrag : PLAYER_CONSTANTS.runAcceleration;
  let vx = input.vx;
  if (vx < target) {
    vx = Math.min(target, vx + accel * dt);
  } else if (vx > target) {
    vx = Math.max(target, vx - accel * dt);
  }

  let vy = Math.min(PLAYER_CONSTANTS.maxFallSpeed, input.vy + PLAYER_CONSTANTS.gravityY * dt);
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
