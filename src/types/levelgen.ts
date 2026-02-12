export type ThemeName = 'grass' | 'desert' | 'ice' | 'factory' | 'castle' | 'bonus';

export type ChunkType =
  | 'start'
  | 'mid_flat'
  | 'vertical_climb'
  | 'coin_arc'
  | 'enemy_gauntlet'
  | 'moving_platform'
  | 'checkpoint'
  | 'end';

export type EntityType =
  | 'spawn'
  | 'goal'
  | 'coin'
  | 'star'
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'spike'
  | 'thwomp'
  | 'checkpoint'
  | 'spring'
  | 'moving_platform';

export interface LevelGenerationInput {
  world: number;
  levelIndex: number;
  seed: number;
  bonus?: boolean;
}

export interface LevelEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  data?: Record<string, number | string | boolean>;
}

export interface GeneratedLevel {
  tileSize: number;
  width: number;
  height: number;
  tileGrid: number[][];
  oneWayPlatforms: Array<{ x: number; y: number; w: number }>;
  movingPlatforms: Array<{ id: string; x: number; y: number; minX: number; maxX: number; speed: number }>;
  entities: LevelEntity[];
  checkpoints: Array<{ id: string; x: number; y: number }>;
  goal: { x: number; y: number };
  metadata: {
    world: number;
    levelIndex: number;
    theme: ThemeName;
    difficultyTier: number;
    chunksUsed: ChunkType[];
    seed: number;
  };
}

export interface WorldRuleset {
  theme: ThemeName;
  groundVariance: number;
  gapFrequency: number;
  enemyDensity: number;
  projectileCadenceMs: number;
  movingPlatformFrequency: number;
  checkpointSpacingChunks: number;
  coinDensity: number;
  starTarget: number;
  palette: {
    skyTop: number;
    skyBottom: number;
    accent: number;
  };
  audio: {
    tempo: number;
    scale: number[];
  };
}
