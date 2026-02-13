import { describe, expect, test } from 'vitest';
import { measureJumpCutReapplication } from './helpers/movementAcceptance';
import {
  stepMovement,
  createFeelState,
} from '../src/player/movement';

describe('player feel timing', () => {
  test('jump buffer triggers shortly after landing', () => {
    let feel = createFeelState();
    const first = stepMovement({
      dtMs: 16,
      vx: 0,
      vy: 50,
      inputX: 0,
      jumpPressed: true,
      jumpHeld: true,
      onGround: false,
      feel
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
      feel
    });

    expect(second.jumped).toBe(true);
    expect(second.vy).toBeLessThan(0);
  });

  test('released jump cuts upward velocity', () => {
    const out = stepMovement({
      dtMs: 16,
      vx: 0,
      vy: -280,
      inputX: 0,
      jumpPressed: false,
      jumpHeld: false,
      onGround: false,
      feel: createFeelState()
    });

    expect(out.vy).toBeGreaterThan(-280);
  });

  test('jump-cut remains one-shot in a single air arc', () => {
    const result = measureJumpCutReapplication({
      dtMs: 16,
      inputX: 0,
      holdForFrames: 1,
      firstReleaseFrames: 3,
      rePressFrames: 2,
      secondReleaseFrames: 4,
    });

    expect(result.cutCount).toBe(1);
    expect(result.firstCutFrame).toBe(0);
    expect(result.secondCutFrame).toBeNull();
  });
});
