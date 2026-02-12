import { describe, expect, it } from 'vitest';
import {
  capHorizontalSpeed,
  simulateHorizontalRun,
  simulateJumpApex
} from '../src/logic/playerPhysics.js';

describe('player physics sanity', () => {
  it('caps horizontal speed at configured maximum', () => {
    expect(capHorizontalSpeed(999, 220)).toBe(220);
    expect(capHorizontalSpeed(-999, 220)).toBe(-220);
    expect(capHorizontalSpeed(120, 220)).toBe(120);
  });

  it('run simulation converges to max speed but does not exceed it', () => {
    const velocity = simulateHorizontalRun({
      durationMs: 2000,
      acceleration: 1800,
      maxSpeed: 220
    });
    expect(velocity).toBeLessThanOrEqual(220);
    expect(velocity).toBeGreaterThan(190);
  });

  it('held jump reaches higher apex than tap jump', () => {
    const tapApex = simulateJumpApex({ holdDurationMs: 24 });
    const holdApex = simulateJumpApex({ holdDurationMs: 220 });

    expect(holdApex).toBeGreaterThan(tapApex * 1.2);
  });
});
