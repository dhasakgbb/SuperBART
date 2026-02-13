import Phaser from 'phaser';
import { SMALL_HEAD_OFFSETS, BIG_HEAD_OFFSETS, type HeadOffset } from '../anim/headOffsets';
import styleConfig from '../style/styleConfig';
import type { PlayerForm } from '../types/game';

// ── Types ──────────────────────────────────────────────────────

export type PlayerAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'skid'
  | 'jump'
  | 'fall'
  | 'land'
  | 'hurt'
  | 'win'
  | 'dead';

export interface AnimStateInput {
  vx: number;
  vy: number;
  inputX: -1 | 0 | 1;
  motionState?: 'air' | 'walk' | 'run' | 'skid';
  onGround: boolean;
  wasOnGround: boolean;
  jumped: boolean;
  form: PlayerForm;
}

export interface AnimConfig {
  idleThreshold: number;
  runThreshold: number;
  skidThreshold: number;
  landDurationMs: number;
  hurtDurationMs: number;
}

export interface AnimResolveResult {
  state: PlayerAnimState;
  landTimer: number;
  hurtTimer: number;
}

// ── Pure state resolution (testable without Phaser) ────────────

export function resolveAnimState(
  input: AnimStateInput,
  current: PlayerAnimState,
  landTimer: number,
  hurtTimer: number,
  config: AnimConfig,
  dtMs: number,
): AnimResolveResult {
  // Sticky states
  if (current === 'dead') return { state: 'dead', landTimer: 0, hurtTimer: 0 };
  if (current === 'win') return { state: 'win', landTimer: 0, hurtTimer: 0 };

  // Hurt holds for duration
  if (current === 'hurt' && hurtTimer > 0) {
    return { state: 'hurt', landTimer: 0, hurtTimer: Math.max(0, hurtTimer - dtMs) };
  }

  // Land timer
  let lt = landTimer;
  if (lt > 0) {
    lt = Math.max(0, lt - dtMs);
    if (lt > 0) return { state: 'land', landTimer: lt, hurtTimer: 0 };
  }

  // Just landed trigger
  if (input.onGround && !input.wasOnGround) {
    return { state: 'land', landTimer: config.landDurationMs, hurtTimer: 0 };
  }

  // Airborne
  if (!input.onGround) {
    const airState: PlayerAnimState = input.vy < 0 ? 'jump' : 'fall';
    return { state: airState, landTimer: 0, hurtTimer: 0 };
  }

  // Ground states
  const absVx = Math.abs(input.vx);
  if (input.motionState === 'skid' && absVx > 0) {
    return { state: 'skid', landTimer: 0, hurtTimer: 0 };
  }
  // Run is strictly intent-driven; raw speed alone is never enough without run motion hint.
  if (input.motionState === 'run' && absVx >= config.runThreshold && input.inputX !== 0) {
    return { state: 'run', landTimer: 0, hurtTimer: 0 };
  }
  if (input.motionState === 'walk' && absVx > config.idleThreshold) {
    return { state: 'walk', landTimer: 0, hurtTimer: 0 };
  }

  // Skid: reversing direction at speed
  if (input.motionState === undefined && input.inputX !== 0 && Math.sign(input.inputX) !== Math.sign(input.vx) && absVx > config.skidThreshold) {
    return { state: 'skid', landTimer: 0, hurtTimer: 0 };
  }

  // Walk
  if (absVx > config.idleThreshold) {
    return { state: 'walk', landTimer: 0, hurtTimer: 0 };
  }

  // Idle
  return { state: 'idle', landTimer: 0, hurtTimer: 0 };
}

// ── Frame index mapping ────────────────────────────────────────

const STATE_TO_FRAME: Record<PlayerAnimState, number> = {
  idle: 0,
  walk: 1,
  run: 4,
  skid: 7,
  jump: 8,
  fall: 9,
  land: 10,
  hurt: 11,
  win: 12,
  dead: 13,
};

// ── Phaser integration class ───────────────────────────────────

export class PlayerAnimator {
  private state: PlayerAnimState = 'idle';
  private prevState: PlayerAnimState = 'idle';
  private landTimer = 0;
  private hurtTimer = 0;
  private form: PlayerForm;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private config: AnimConfig;

  constructor(
    _scene: Phaser.Scene,
    sprite: Phaser.Physics.Arcade.Sprite,
    form: PlayerForm,
  ) {
    this.sprite = sprite;
    this.form = form;
    this.config = {
      idleThreshold: styleConfig.playerAnimation.idleThreshold,
      runThreshold: styleConfig.playerAnimation.runThreshold,
      skidThreshold: styleConfig.playerAnimation.skidThreshold,
      landDurationMs: styleConfig.playerAnimation.landDurationMs,
      hurtDurationMs: styleConfig.playerAnimation.hurtDurationMs,
    };
  }

  update(input: AnimStateInput, dtMs: number): void {
    this.prevState = this.state;
    const result = resolveAnimState(
      input,
      this.state,
      this.landTimer,
      this.hurtTimer,
      this.config,
      dtMs,
    );
    this.state = result.state;
    this.landTimer = result.landTimer;
    this.hurtTimer = result.hurtTimer;

    const prefix = this.form === 'small' ? 'bart_s_' : 'bart_b_';
    const animKey = `${prefix}${this.state}`;
    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.anims.play(animKey, true);
    }
  }

  getCurrentHeadOffset(): HeadOffset {
    const offsets = this.form === 'small' ? SMALL_HEAD_OFFSETS : BIG_HEAD_OFFSETS;
    const frameIdx = STATE_TO_FRAME[this.state] ?? 0;
    return offsets[frameIdx] ?? { dx: 0, dy: -12 };
  }

  justEntered(state: PlayerAnimState): boolean {
    return this.state === state && this.prevState !== state;
  }

  getState(): PlayerAnimState {
    return this.state;
  }

  setForm(form: PlayerForm): void {
    this.form = form;
  }

  triggerHurt(): void {
    this.state = 'hurt';
    this.hurtTimer = this.config.hurtDurationMs;
    this.landTimer = 0;
  }

  triggerWin(): void {
    this.state = 'win';
    this.landTimer = 0;
    this.hurtTimer = 0;
  }

  triggerDead(): void {
    this.state = 'dead';
    this.landTimer = 0;
    this.hurtTimer = 0;
  }
}
