import { describe, expect, it } from 'vitest';
import { stepMovement, createFeelState, DEFAULT_WORLD_MODIFIERS, type WorldModifiers } from '../src/player/movement';

/**
 * Enemy behavior tests focus on the pure-function parts of the gameplay overhaul.
 * Phaser-dependent enemy update closures are tested via manual play and the
 * existing level-generator validity tests that validate spawn contracts.
 */

describe('WorldModifiers applied to stepMovement', () => {
  const baseInput = () => ({
    dtMs: 16,
    vx: 150,
    vy: 0,
    inputX: 0 as const,
    jumpPressed: false,
    jumpHeld: false,
    onGround: true,
    feel: createFeelState(),
  });

  it('default modifiers produce same result as no modifiers', () => {
    const input = baseInput();
    const a = stepMovement(input);
    const b = stepMovement(input, DEFAULT_WORLD_MODIFIERS);
    expect(a.vx).toBe(b.vx);
    expect(a.vy).toBe(b.vy);
  });

  it('low frictionMultiplier results in slower deceleration (higher vx after same time with no input)', () => {
    const slippery: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS, frictionMultiplier: 0.6 };
    const normal = stepMovement(baseInput());
    const slick = stepMovement(baseInput(), slippery);
    // With lower friction, the player retains more speed when no input is held
    expect(slick.vx).toBeGreaterThan(normal.vx);
  });

  it('high gravityMultiplier results in faster falling', () => {
    const heavy: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS, gravityMultiplier: 1.15 };
    const input = { ...baseInput(), onGround: false, vy: 0 };
    const normalFall = stepMovement(input);
    const heavyFall = stepMovement(input, heavy);
    expect(heavyFall.vy).toBeGreaterThan(normalFall.vy);
  });

  it('speedMultiplier increases max target speed', () => {
    const fast: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS, speedMultiplier: 1.4 };
    const input = { ...baseInput(), vx: 0, inputX: 1 as const };
    // Run for many frames
    let normalVx = 0;
    let fastVx = 0;
    for (let i = 0; i < 200; i++) {
      normalVx = stepMovement({ ...input, vx: normalVx }).vx;
      fastVx = stepMovement({ ...input, vx: fastVx }, fast).vx;
    }
    expect(fastVx).toBeGreaterThan(normalVx);
  });

  it('tokenBurnRate is exposed but does not affect stepMovement output', () => {
    // tokenBurnRate is applied externally in PlayScene.simulateStep, not inside stepMovement
    const burn: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS, tokenBurnRate: 1.5 };
    const a = stepMovement(baseInput());
    const b = stepMovement(baseInput(), burn);
    expect(a.vx).toBe(b.vx);
    expect(a.vy).toBe(b.vy);
  });
});

describe('WorldModifiers interface contracts', () => {
  it('DEFAULT_WORLD_MODIFIERS has all fields set to 1.0', () => {
    expect(DEFAULT_WORLD_MODIFIERS.frictionMultiplier).toBe(1.0);
    expect(DEFAULT_WORLD_MODIFIERS.gravityMultiplier).toBe(1.0);
    expect(DEFAULT_WORLD_MODIFIERS.speedMultiplier).toBe(1.0);
    expect(DEFAULT_WORLD_MODIFIERS.tokenBurnRate).toBe(1.0);
  });
});
