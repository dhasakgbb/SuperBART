import type { ChunkFamily as CanonicalChunkFamily, WorldPhysicsMultipliers, WorldTheme } from '../content/contentManifest';

export type ThemeName = 'azure' | 'pipeline' | 'enterprise' | 'gpu' | 'benchmark' | 'bonus';

export type ChunkFamily = CanonicalChunkFamily;

export type StructuralChunkType = 'start' | 'checkpoint' | 'end';

export type ChunkTemplateType = 'mid_flat' | 'vertical_climb' | 'coin_arc' | 'enemy_gauntlet' | 'moving_platform';

export type ChunkType = StructuralChunkType | ChunkFamily;

export type LegacyCollectibleAlias = 'coin' | 'star';
export type CanonicalCollectibleId = 'token' | 'eval' | 'gpu_allocation' | 'copilot_mode' | 'semantic_kernel' | 'deploy_to_prod' | 'works_on_my_machine';
export type LegacyCollectibleAliasExtended =
  | 'fire_flower'
  | 'power_up'
  | 'assist_bot'
  | 'green_button'
  | 'woom';
export type CollectibleType = CanonicalCollectibleId | LegacyCollectibleAlias | LegacyCollectibleAliasExtended;

export type EnemyType =
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'technical_debt'
  | 'tethered_debt';

export type EntityType =
  | 'spawn'
  | 'goal'
  | LegacyCollectibleAlias
  | CanonicalCollectibleId
  | LegacyCollectibleAliasExtended
  | 'question_block'
  | 'checkpoint'
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'technical_debt'
  | 'tethered_debt'
  | 'spike'
  | 'thwomp'
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
  theme: WorldTheme;
  multipliers: WorldPhysicsMultipliers;
  groundVariance: number;
  gapFrequency: number;
  enemyDensity: number;
  projectileCadenceMs: number;
  movingPlatformFrequency: number;
  checkpointSpacingChunks: number;
  coinDensity: number;
  starTarget: number;
  allowedChunkFamilies: ChunkFamily[];
  palette: {
    skyTop: number;
    skyBottom: number;
    accent: number;
  };
  audio: {
    tempo: number;
    scale: number[];
  };
  modifiers?: Partial<import('../player/movement').WorldModifiers>;
}
