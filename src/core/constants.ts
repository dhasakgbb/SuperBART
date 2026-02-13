import type { GameSettings } from '../types/game';

export const TILE_SIZE = 16;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

export const PLAYER_CONSTANTS = {
  runAcceleration: 1900,
  runDrag: 1600,
  maxSpeed: 210,
  runSpeedMultiplier: 1.38,
  jumpCutWindowMs: 90,
  runTransitionMs: 120,
  skidThresholdPxPerSec: 120,
  skidDurationMs: 96,
  // 1-2 frames at 60Hz for a tight stomp impact beat.
  stompHitstopMs: 32,
  jumpVelocity: -420,
  jumpCutMultiplier: 0.52,
  airControlMultiplier: 0.62,
  airDragMultiplier: 0.45,
  gravityY: 980,
  coyoteMs: 100,
  jumpBufferMs: 100,
  invulnMs: 1200,
  knockbackX: 180,
  knockbackY: -220,
  hitstopMs: 24,
  stompCooldownMs: 120,
  maxFallSpeed: 650
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.6,
  musicVolume: 0.58,
  sfxVolume: 0.62,
  musicMuted: false,
  sfxMuted: false,
  screenShakeEnabled: true
};

export const CAMPAIGN_WORLD_LAYOUT = [6, 6, 6, 6, 1] as const;
export const CAMPAIGN_WORLD_COUNT = CAMPAIGN_WORLD_LAYOUT.length;
// Kept for compatibility with legacy callers that still expect a flat per-world level count.
export const CAMPAIGN_LEVELS_PER_WORLD = Math.max(...CAMPAIGN_WORLD_LAYOUT);
export const TOTAL_CAMPAIGN_LEVELS = CAMPAIGN_WORLD_LAYOUT.reduce((acc, levels) => acc + levels, 0);

export const SCORE_VALUES = {
  coin: 10,       // credit
  questionBlock: 50,
  stomp: 100,     // correction
  star: 250,      // eval
  completeBonus: 500  // deploy bonus
} as const;

export const DISPLAY_NAMES = {
  coin: 'API CREDIT',
  star: 'EVAL',
  stomp: 'CORRECTED',
  lives: 'INSTANCES',
  gameOver: '429 TOO MANY REQUESTS',
  levelClear: 'DEPLOYED TO PROD',
  finalVictory: 'AGI ACHIEVED!',
} as const;
