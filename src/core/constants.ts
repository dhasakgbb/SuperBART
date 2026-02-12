import type { GameSettings } from '../types/game';

export const TILE_SIZE = 16;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;

export const PLAYER_CONSTANTS = {
  runAcceleration: 1900,
  runDrag: 1600,
  maxSpeed: 210,
  jumpVelocity: -360,
  jumpCutMultiplier: 0.52,
  gravityY: 980,
  coyoteMs: 100,
  jumpBufferMs: 100,
  invulnMs: 1200,
  knockbackX: 180,
  knockbackY: -220,
  hitstopMs: 50,
  maxFallSpeed: 650
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.6,
  musicEnabled: true,
  sfxEnabled: true,
  screenShakeEnabled: true
};

export const CAMPAIGN_LEVELS_PER_WORLD = 5;
export const CAMPAIGN_WORLD_COUNT = 5;
export const TOTAL_CAMPAIGN_LEVELS = CAMPAIGN_LEVELS_PER_WORLD * CAMPAIGN_WORLD_COUNT;

export const SCORE_VALUES = {
  coin: 10,
  stomp: 100,
  star: 250,
  completeBonus: 500
} as const;
