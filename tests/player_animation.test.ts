import { describe, expect, test } from 'vitest';
import { resolveAnimState, type AnimStateInput, type AnimConfig, type PlayerAnimState } from '../src/player/PlayerAnimator';

const CONFIG: AnimConfig = {
  idleThreshold: 10,
  runThreshold: 160,
  skidThreshold: 120,
  landDurationMs: 80,
  hurtDurationMs: 400,
};

function makeInput(overrides: Partial<AnimStateInput> = {}): AnimStateInput {
  return {
    vx: 0,
    vy: 0,
    inputX: 0,
    onGround: true,
    wasOnGround: true,
    jumped: false,
    form: 'small',
    ...overrides,
  };
}

function resolve(
  input: Partial<AnimStateInput>,
  current: PlayerAnimState = 'idle',
  landTimer = 0,
  hurtTimer = 0,
  dtMs = 16,
) {
  return resolveAnimState(makeInput(input), current, landTimer, hurtTimer, CONFIG, dtMs);
}

describe('player animation state machine', () => {
  test('idle when standing still on ground', () => {
    const r = resolve({});
    expect(r.state).toBe('idle');
  });

  test('walk when moving slowly on ground', () => {
    const r = resolve({ vx: 80, inputX: 1 });
    expect(r.state).toBe('walk');
  });

  test('idle when vx is below threshold', () => {
    const r = resolve({ vx: 5 });
    expect(r.state).toBe('idle');
  });

  test('run when moving fast on ground', () => {
    const r = resolve({ vx: 180, inputX: 1, motionState: 'run' });
    expect(r.state).toBe('run');
  });

  test('run state requires run intent alignment with input', () => {
    const r = resolve({ vx: 240, inputX: 0 });
    expect(r.state).toBe('walk');

    const r2 = resolve({ vx: 240, inputX: 1, motionState: 'run' });
    expect(r2.state).toBe('run');
  });

  test('skid when reversing at speed', () => {
    const r = resolve({ vx: 150, inputX: -1 });
    expect(r.state).toBe('skid');
  });

  test('skid requires speed above threshold', () => {
    const r = resolve({ vx: 50, inputX: -1 });
    expect(r.state).not.toBe('skid');
  });

  test('jump when airborne with upward velocity', () => {
    const r = resolve({ onGround: false, vy: -200 });
    expect(r.state).toBe('jump');
  });

  test('fall when airborne with downward velocity', () => {
    const r = resolve({ onGround: false, vy: 100 }, 'jump');
    expect(r.state).toBe('fall');
  });

  test('land briefly when transitioning air to ground', () => {
    const r = resolve({ onGround: true, wasOnGround: false }, 'fall');
    expect(r.state).toBe('land');
    expect(r.landTimer).toBeGreaterThan(0);
  });

  test('land timer decrements and eventually returns to idle', () => {
    // With active land timer
    const r1 = resolve({ onGround: true, wasOnGround: true }, 'land', 60, 0, 16);
    expect(r1.state).toBe('land');
    expect(r1.landTimer).toBeLessThan(60);

    // After timer expires
    const r2 = resolve({ onGround: true, wasOnGround: true }, 'land', 0, 0, 16);
    expect(r2.state).toBe('idle');
  });

  test('dead state is sticky', () => {
    const r = resolve({ vx: 200, onGround: true }, 'dead');
    expect(r.state).toBe('dead');
  });

  test('win state is sticky', () => {
    const r = resolve({ vx: 200, onGround: true }, 'win');
    expect(r.state).toBe('win');
  });

  test('hurt holds while timer active', () => {
    const r = resolve({}, 'hurt', 0, 300, 16);
    expect(r.state).toBe('hurt');
    expect(r.hurtTimer).toBeLessThan(300);
  });

  test('hurt resolves to idle when timer expires', () => {
    const r = resolve({}, 'hurt', 0, 0, 16);
    expect(r.state).toBe('idle');
  });

  test('walk to run transition', () => {
    const r1 = resolve({ vx: 100, inputX: 1 });
    expect(r1.state).toBe('walk');

    const r2 = resolve({ vx: 180, inputX: 1, motionState: 'run' });
    expect(r2.state).toBe('run');
  });

  test('run to skid transition when reversing', () => {
    const r1 = resolve({ vx: 180, inputX: 1, motionState: 'run' });
    expect(r1.state).toBe('run');

    const r2 = resolve({ vx: 180, inputX: -1 });
    expect(r2.state).toBe('skid');
  });

  test('skid is recoverable to walk when motion is realigned', () => {
    const r1 = resolve({ vx: 180, inputX: -1 });
    expect(r1.state).toBe('skid');

    const r2 = resolve({ vx: 100, inputX: -1 });
    expect(r2.state).toBe('walk');
  });

  test('motion hint run maps directly to run state', () => {
    const r = resolve({ vx: 220, inputX: 1, onGround: true, motionState: 'run' });
    expect(r.state).toBe('run');
  });

  test('run motion hint remains speed-qualified (low speed stays walk)', () => {
    const r = resolve({ vx: 110, inputX: 0, onGround: true, motionState: 'run' });
    expect(r.state).toBe('walk');
  });

  test('run motion hint drops when motion intent is absent', () => {
    const r1 = resolve({ vx: 240, inputX: 0, onGround: true, motionState: 'run' });
    expect(r1.state).toBe('walk');
  });

  test('motion hint skid is prioritized before speed thresholds on ground', () => {
    const r = resolve({ vx: 180, inputX: 1, onGround: true, motionState: 'skid' });
    expect(r.state).toBe('skid');
  });

  test('ground to jump to fall sequence', () => {
    const r1 = resolve({ onGround: true, vx: 0 });
    expect(r1.state).toBe('idle');

    const r2 = resolve({ onGround: false, vy: -300 });
    expect(r2.state).toBe('jump');

    const r3 = resolve({ onGround: false, vy: 50 }, 'jump');
    expect(r3.state).toBe('fall');

    const r4 = resolve({ onGround: true, wasOnGround: false }, 'fall');
    expect(r4.state).toBe('land');
  });

  test('negative vx skid works (moving left, pressing right)', () => {
    const r = resolve({ vx: -150, inputX: 1 });
    expect(r.state).toBe('skid');
  });

  test('no skid when input direction matches velocity', () => {
    const r = resolve({ vx: 150, inputX: 1 });
    expect(r.state).not.toBe('skid');
  });
});
