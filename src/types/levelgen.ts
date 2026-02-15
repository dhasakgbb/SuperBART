import type { ChunkFamily as CanonicalChunkFamily, WorldPhysicsMultipliers, WorldTheme } from '../content/contentManifest';

export type ThemeName =
  | 'city'
  | 'cryo_tundra'
  | 'quantum_void'
  | 'deep_web_catacombs'
  | 'digital_graveyard'
  | 'singularity_core'
  | 'bonus';

export type SetPieceMode = 'avalanche-alley' | 'collapse' | 'approach';

export interface SetPieceSpec {
  mode: SetPieceMode;
  description: string;
}
export type PacingPhase = 'INTRO' | 'PRACTICE' | 'VARIATION' | 'CHALLENGE' | 'COOLDOWN' | 'FINALE';
export type ChunkTag =
  | 'FLAT'
  | 'RISE_STEP'
  | 'DROP_STEP'
  | 'GAP_SHORT'
  | 'GAP_LONG'
  | 'PLATFORM_BUBBLE'
  | 'PLATFORM_STACK'
  | 'CLIFF_EDGE'
  | 'SLOPE_DOWN'
  | 'SLOPE_UP'
  | 'MOVE_PLATFORM'
  | 'VERTICAL_LIFT'
  | 'PASSAGE_TUNNEL'
  | 'SPIKE_LOW'
  | 'SPIKE_SWEEP'
  | 'THWOMP_DROP'
  | 'ELECTRO'
  | 'CRUSH_ZONE'
  | 'BOUNCE_ZONE'
  | 'GOOMBA_SPAWN'
  | 'FLYER_DRIFT'
  | 'WALKER_PATROL'
  | 'TURNAROUND_ENEMY'
  | 'BLOCKER'
  | 'COIN_STAIR'
  | 'COIN_ARCH'
  | 'COIN_RAIL'
  | 'COIN_REWARD'
  | 'MYSTERY_POD'
  | 'POWERUP_HINT'
  | 'COOLDOWN_LANE'
  | 'PRACTICE_PAD'
  | 'COMEDY_VENT'
  | 'VARIATION_PAD'
  | 'VANISH_PLATFORM'
  | 'BENCHMARK_AUTO_SCROLL';

export interface ChunkTemplate {
  id: string;
  tags: ChunkTag[];
  weight: number;
  lengthPx: number;
  recoveryAfter: boolean;
  mechanicsIntroduced: string[];
  vanish_platform?: {
    visibleMs: number;
    hiddenMs: number;
  };
  benchmark_auto_scroll?: {
    speedPxPerSec: number;
    durationMs: number;
  };
  boss_arena_anchor?: { x: number; y: number; width: number };
  enemyCap?: number;
}

export interface PacingSegment {
  phase: PacingPhase;
  chunks: string[];
}

export interface LevelHardRules {
  maxNewMechanicsPerChunk: number;
  minRecoveryGap: number;
  maxHazardClusters: number;
}

export type ChunkFamily = CanonicalChunkFamily | 'azure_walkway' | 'benchmark_sprint' | 'technical_debt_sprint';

export type StructuralChunkType = 'start' | 'checkpoint' | 'end';

export type ChunkTemplateType =
  | 'mid_flat'
  | 'vertical_climb'
  | 'coin_arc'
  | 'enemy_gauntlet'
  | 'moving_platform'
  | 'benchmark_sprint'
  | 'technical_debt_sprint'
  | 'analyst_tower'
  | 'hot_take_gauntlet'
  | 'legacy_slide_01';

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
  | 'boss'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'compliance_officer'
  | 'compliance'
  | 'technical_debt'
  | 'tethered_debt'
  | 'snowman_sentry'
  | 'cryo_drone'
  | 'qubit_swarm'
  | 'crawler'
  | 'glitch_phantom'
  | 'fungal_node'
  | 'ghost_process'
  | 'tape_wraith'
  | 'resume_bot';

export type EntityType =
  | 'spawn'
  | 'goal'
  | LegacyCollectibleAlias
  | CanonicalCollectibleId
  | LegacyCollectibleAliasExtended
  | 'question_block'
  | 'diagnostic_node'
  | 'monitor'
  | 'poster'
  | 'personal_effect'
  | 'personnel_file'
  | 'checkpoint'
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'boss'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'compliance_officer'
  | 'technical_debt'
  | 'tethered_debt'
  | 'snowman_sentry'
  | 'cryo_drone'
  | 'qubit_swarm'
  | 'crawler'
  | 'glitch_phantom'
  | 'fungal_node'
  | 'ghost_process'
  | 'tape_wraith'
  | 'resume_bot'
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

export interface LevelSpec {
  world: number;
  level: number;
  title: string;
  sequence: PacingSegment[];
  hardRules: LevelHardRules;
  notes?: string;
  setPiece?: SetPieceSpec;
}

export interface CampaignArtifact {
  version: string;
  generatedAt: string;
  worldCount: number;
  levels: LevelSpec[];
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
  oneWayPlatforms: Array<{
    x: number;
    y: number;
    w: number;
    vanish?: {
      visibleMs: number;
      hiddenMs: number;
      phaseOffsetMs?: number;
    };
  }>;
  movingPlatforms: Array<{ id: string; x: number; y: number; minX: number; maxX: number; speed: number }>;
  entities: LevelEntity[];
  checkpoints: Array<{ id: string; x: number; y: number }>;
  goal: { x: number; y: number };
  metadata: {
    world: number;
    levelIndex: number;
    theme: ThemeName;
    difficultyTier: number;
    chunksUsed: string[];
    pacing: PacingPhase[];
    seed: number;
    setPiece?: SetPieceSpec;
    benchmarkAutoScroll?: Array<{
      speedPxPerSec: number;
      durationMs: number;
      startX: number;
    }>;
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
  campaign?: WorldLevelConstraint;
  modifiers?: Partial<import('../player/movement').WorldModifiers>;
}

export interface WorldLevelConstraint {
  allowedChunkTags: ChunkTag[];
  allowedHazardTags: ChunkTag[];
  allowedEnemyTags: string[];
  maxNewMechanicsPerChunk: number;
  minRecoveryGap: number;
  maxHazardClusters: number;
  guidanceWindow: number;
  hazardWeights: Record<string, number>;
  enemyWeights: Record<string, number>;
  speedMultiplier: number;
  gravityMultiplier: number;
  tokenBurnRate: number;
  tokenSpawnMultiplier?: number;
  hazardDensityMultiplier?: number;
}
