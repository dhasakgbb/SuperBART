import { TILE_SIZE } from '../core/constants';
import type {
  ChunkFamily,
  ChunkTemplate,
  ChunkTemplateType,
  ChunkType,
  EntityType,
  GeneratedLevel,
  LevelGenerationInput,
  LevelSpec,
  PacingPhase,
  PacingSegment,
} from '../types/levelgen';
import { SCRIPT_CAMPAIGN_LEVELS } from './scriptCampaignLevels';
import { createRng } from './rng';
import { getWorldRules } from './worldRules';
import { campaignOrdinal } from '../systems/progression';

const CHUNK_WIDTH = 24;
const LEVEL_HEIGHT = 34;
const BASE_GROUND = 26;
export const FAMILY_TEMPLATES: Record<ChunkFamily, ChunkTemplateType[]> = {
  azure_walkway: ['mid_flat', 'moving_platform', 'coin_arc'],
  server_room: ['mid_flat', 'mid_flat', 'coin_arc'],
  training_run: ['coin_arc', 'vertical_climb', 'enemy_gauntlet'],
  rag_pipeline: ['moving_platform', 'vertical_climb', 'enemy_gauntlet'],
  rate_limiter: ['moving_platform', 'enemy_gauntlet', 'coin_arc'],
  benchmark_sprint: ['benchmark_sprint'],
  technical_debt_sprint: ['technical_debt_sprint'],
  analyst_tower: ['analyst_tower'],
  legacy_slide_01: ['legacy_slide_01'],
  hot_take_gauntlet: ['hot_take_gauntlet'],
};

const PHASE_ORDER: PacingPhase[] = [
  'INTRO',
  'PRACTICE',
  'VARIATION',
  'CHALLENGE',
  'COOLDOWN',
  'FINALE',
];

type FamilyBiasTable = Partial<Record<ChunkFamily, number>>;

const WORLD_FAMILY_BIAS: Record<number, FamilyBiasTable> = {
  2: {
    rag_pipeline: 3,
    training_run: 2,
    server_room: 1,
  },
  4: {
    rate_limiter: 3,
    rag_pipeline: 2,
    training_run: 1,
  },
};

const BENCHMARK_SCROLL_DURATION_MS = 8_000;
const BENCHMARK_SCROLL_SPEED_PX_PER_SEC = 220;
const VANISH_OFFSET_RANDOM_MAX_MS = 1_000;

const WORLD_BONUS_POWERUP_CHANCE = [
  0.16,
  0.14,
  0.12,
  0.10,
  0.10,
  0.08,
  0.06,
];

const WORLD_COMPLIANCE_CHANCE = [0.0, 0.0, 0.06, 0.09, 0.1, 0.14, 0.18];
const WORLD_DEBT_CHANCE = [0.0, 0.0, 0.02, 0.05, 0.1, 0.14, 0.2];

const WORLD_SPECIAL_ENEMY_WEIGHT = {
  compliance: [0, 0, 1, 2, 2, 3, 4],
  debt: [0, 0, 1, 2, 3, 4, 5],
};

type SpawnEnemyKind = 'walker' | 'shell' | 'flying' | 'spitter' | 'compliance_officer' | 'technical_debt';

type SpawnPowerupKind = 'gpu_allocation' | 'copilot_mode' | 'semantic_kernel' | 'deploy_to_prod' | 'works_on_my_machine';

function clampChance(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.min(0.98, Math.max(0, raw));
}

function pickWorldPowerup(world: number, rng: ReturnType<typeof createRng>): SpawnPowerupKind | null {
  const bucket = Math.min(world - 1, WORLD_BONUS_POWERUP_CHANCE.length - 1);
  const chance = WORLD_BONUS_POWERUP_CHANCE[bucket] ?? WORLD_BONUS_POWERUP_CHANCE[WORLD_BONUS_POWERUP_CHANCE.length - 1];
  if (!rng.chance(chance)) {
    return null;
  }

  const roll = rng.nextInt(1, 100);
  if (roll <= 34) {
    return 'gpu_allocation';
  }
  if (roll <= 50) {
    return 'copilot_mode';
  }
  if (roll <= 63) {
    return 'semantic_kernel';
  }
  if (roll <= 77) {
    return 'works_on_my_machine';
  }
  return 'deploy_to_prod';
}

function pickEnemyTypeForChunk(world: number, rng: ReturnType<typeof createRng>): SpawnEnemyKind {
  const idx = Math.max(0, Math.min(world - 1, WORLD_SPECIAL_ENEMY_WEIGHT.compliance.length - 1));
  const c = WORLD_COMPLIANCE_CHANCE[idx] ?? 0;
  const d = WORLD_DEBT_CHANCE[idx] ?? 0;
  const base = {
    base: [{ kind: 'walker', weight: 56 }, { kind: 'shell', weight: 18 }, { kind: 'flying', weight: 12 }, { kind: 'spitter', weight: 14 }],
  } as const;
  const pools: Array<{ kind: SpawnEnemyKind; weight: number }> = [...base.base];
  const addCompliance = c > 0 ? Math.round(25 * c) : 0;
  const addDebt = d > 0 ? Math.round(18 * d) : 0;
  if (addCompliance > 0) {
    pools.push({ kind: 'compliance_officer', weight: addCompliance });
  }
  if (addDebt > 0) {
    pools.push({ kind: 'technical_debt', weight: addDebt });
  }

  const total = pools.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = rng.nextInt(1, total);
  let cursor = 0;
  for (const entry of pools) {
    cursor += entry.weight;
    if (roll <= cursor) {
      return entry.kind;
    }
  }
  return 'walker';
}

function pickChunkPowerup(world: number, rng: ReturnType<typeof createRng>): SpawnPowerupKind | null {
  return pickWorldPowerup(world, rng);
}

function addChunkPowerup(
  world: number,
  rng: ReturnType<typeof createRng>,
  tagWeightedChance: number,
  x: number,
  y: number,
  entities: Parameters<typeof addEntity>[0],
): void {
  if (!rng.chance(tagWeightedChance)) {
    return;
  }

  const powerup = pickChunkPowerup(world, rng);
  if (powerup) {
    addEntity(entities, powerup, x, y, { spawnReason: 'chunk_powerup' });
  }
}
type BenchmarkAutoScroll = {
  speedPxPerSec: number;
  durationMs: number;
  startX: number;
};

const HAZARD_TAGS = new Set([
  'SPIKE_LOW',
  'SPIKE_SWEEP',
  'THWOMP_DROP',
]);
const RISKY_CHUNK_TAGS = new Set([...HAZARD_TAGS, 'GAP_LONG']);

const GUIDANCE_TAGS = new Set([
  'COIN_STAIR',
  'COIN_ARCH',
  'COIN_RAIL',
  'COIN_REWARD',
  'POWERUP_HINT',
  'PRACTICE_PAD',
]);

export const CHUNK_LIBRARY: Record<string, ChunkTemplate> = {
  flat_intro_01: {
    id: 'flat_intro_01',
    tags: ['FLAT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  flat_intro_02: {
    id: 'flat_intro_02',
    tags: ['FLAT', 'COOLDOWN_LANE'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: true,
    mechanicsIntroduced: [],
  },
  coin_stair_01: {
    id: 'coin_stair_01',
    tags: ['COIN_STAIR'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  gap_short_guarded_01: {
    id: 'gap_short_guarded_01',
    tags: ['GAP_SHORT', 'COOLDOWN_LANE'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: true,
    mechanicsIntroduced: [],
  },
  flat_guide_01: {
    id: 'flat_guide_01',
    tags: ['FLAT', 'POWERUP_HINT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  platform_bubble_01: {
    id: 'platform_bubble_01',
    tags: ['PLATFORM_BUBBLE'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  platform_bubble_02: {
    id: 'platform_bubble_02',
    tags: ['PLATFORM_BUBBLE', 'COMEDY_VENT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  platform_stack_01: {
    id: 'platform_stack_01',
    tags: ['PLATFORM_STACK'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  flat_step_01: {
    id: 'flat_step_01',
    tags: ['RISE_STEP', 'DROP_STEP'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  rise_step_01: {
    id: 'rise_step_01',
    tags: ['RISE_STEP'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  falloff_step_01: {
    id: 'falloff_step_01',
    tags: ['DROP_STEP'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  recovery_lane_01: {
    id: 'recovery_lane_01',
    tags: ['COOLDOWN_LANE'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: true,
    mechanicsIntroduced: [],
  },
  recovery_lane_02: {
    id: 'recovery_lane_02',
    tags: ['COOLDOWN_LANE'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: true,
    mechanicsIntroduced: [],
  },
  flat_finish_01: {
    id: 'flat_finish_01',
    tags: ['FLAT', 'COMEDY_VENT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  flat_finish_02: {
    id: 'flat_finish_02',
    tags: ['FLAT', 'COMEDY_VENT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  walker_patrol_01: {
    id: 'walker_patrol_01',
    tags: ['WALKER_PATROL'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['walker'],
  },
  walker_patrol_02: {
    id: 'walker_patrol_02',
    tags: ['WALKER_PATROL'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['walker'],
  },
  walker_patrol_03: {
    id: 'walker_patrol_03',
    tags: ['WALKER_PATROL', 'TURNAROUND_ENEMY'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['walker'],
  },
  shell_blocker_01: {
    id: 'shell_blocker_01',
    tags: ['BLOCKER'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['shell'],
  },
  spike_low_01: {
    id: 'spike_low_01',
    tags: ['SPIKE_LOW'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['spike'],
  },
  spike_sweep_01: {
    id: 'spike_sweep_01',
    tags: ['SPIKE_SWEEP'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['spike'],
  },
  coin_arch_01: {
    id: 'coin_arch_01',
    tags: ['COIN_ARCH'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  coin_rail_01: {
    id: 'coin_rail_01',
    tags: ['COIN_RAIL'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  coin_reward_01: {
    id: 'coin_reward_01',
    tags: ['COIN_REWARD'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
  },
  gap_long_01: {
    id: 'gap_long_01',
    tags: ['GAP_LONG'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: true,
    mechanicsIntroduced: [],
  },
  flying_drift_01: {
    id: 'flying_drift_01',
    tags: ['FLYER_DRIFT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['flying'],
  },
  flying_drift_02: {
    id: 'flying_drift_02',
    tags: ['FLYER_DRIFT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['flying'],
  },
  thwomp_intro_01: {
    id: 'thwomp_intro_01',
    tags: ['THWOMP_DROP'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['thwomp'],
  },
  benchmark_sprint_01: {
    id: 'benchmark_sprint_01',
    tags: ['FLAT', 'BENCHMARK_AUTO_SCROLL'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['walker'],
    benchmark_auto_scroll: {
      speedPxPerSec: BENCHMARK_SCROLL_SPEED_PX_PER_SEC,
      durationMs: BENCHMARK_SCROLL_DURATION_MS,
    },
  },
  vanish_platform_01: {
    id: 'vanish_platform_01',
    tags: ['PLATFORM_BUBBLE', 'VANISH_PLATFORM'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: [],
    vanish_platform: {
      visibleMs: 1_000,
      hiddenMs: 1_000,
    },
  },
  technical_debt_sprint: {
    id: 'technical_debt_sprint',
    tags: ['FLAT', 'GAP_LONG'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['technical_debt'],
  },
  analyst_tower: {
    id: 'analyst_tower',
    tags: ['RISE_STEP', 'PLATFORM_STACK'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['spitter'],
  },
  legacy_slide_01: {
    id: 'legacy_slide_01',
    tags: ['FLAT', 'BLOCKER'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['shell'],
  },
  hot_take_gauntlet: {
    id: 'hot_take_gauntlet',
    tags: ['GAP_LONG', 'FLYER_DRIFT'],
    weight: 1,
    lengthPx: CHUNK_WIDTH,
    recoveryAfter: false,
    mechanicsIntroduced: ['flying'],
  },
};

function makeGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
}

function fillColumn(grid: number[][], x: number, topTileY: number): void {
  for (let y = topTileY; y < grid.length; y += 1) {
    grid[y]![x] = 1;
  }
}

function clearTileRange(grid: number[][], x0: number, x1: number, topTileY: number): void {
  for (let x = x0; x <= x1; x += 1) {
    for (let y = topTileY; y < grid.length; y += 1) {
      grid[y]![x] = 0;
    }
  }
}

function addEntity(
  entities: Array<{
    id: string;
    type: EntityType;
    x: number;
    y: number;
    data?: Record<string, number | string | boolean>;
  }>,
  type: EntityType,
  xTile: number,
  yTile: number,
  data?: Record<string, number | string | boolean>,
): void {
  entities.push({
    id: `${type}_${entities.length + 1}`,
    type,
    x: xTile * TILE_SIZE + TILE_SIZE / 2,
    y: yTile * TILE_SIZE + TILE_SIZE / 2,
    data,
  });
}

function weightedIndex(rng: ReturnType<typeof createRng>, weights: Array<{ value: ChunkFamily; weight: number }>): ChunkFamily {
  const total = weights.reduce((sum, entry) => sum + Math.max(1, Math.floor(entry.weight || 0)), 0);
  const roll = rng.nextInt(0, total);
  let cursor = 0;
  for (const entry of weights) {
    const weight = Math.max(1, Math.floor(entry.weight || 0));
    if (roll < cursor + weight) {
      return entry.value;
    }
    cursor += weight;
  }
  return weights[0]!.value;
}

function pickFamily(world: number, allowed: ChunkFamily[], rng: ReturnType<typeof createRng>): ChunkFamily {
  const raw = allowed.filter((family) => family);
  if (raw.length <= 1) {
    return raw[0] ?? 'azure_walkway';
  }
  const bias = WORLD_FAMILY_BIAS[world] ?? {};
  const weighted = raw.map((family) => ({ value: family, weight: bias[family] ?? 1 }));
  return weightedIndex(rng, weighted);
}

function parseBenchmarkTriggers(levelMetadata: {
  chunkStartX: number;
  chunkTemplate: ChunkTemplate;
  benchmarkAutoScroll: BenchmarkAutoScroll[];
}): void {
  if (!levelMetadata.chunkTemplate.benchmark_auto_scroll) {
    return;
  }
  levelMetadata.benchmarkAutoScroll.push({
    speedPxPerSec: levelMetadata.chunkTemplate.benchmark_auto_scroll.speedPxPerSec,
    durationMs: levelMetadata.chunkTemplate.benchmark_auto_scroll.durationMs,
    startX: levelMetadata.chunkStartX,
  });
}

function findCampaignLevel(world: number, levelIndex: number): LevelSpec | undefined {
  return SCRIPT_CAMPAIGN_LEVELS.levels.find((level) => level.world === world && level.level === levelIndex);
}

function validatePhaseOrder(sequence: PacingSegment[]): string[] {
  const errors: string[] = [];
  let lastIndex = -1;
  const seen = new Set<PacingPhase>();
  for (const segment of sequence) {
    const index = PHASE_ORDER.indexOf(segment.phase);
    if (index === -1) {
      errors.push(`Unknown pacing phase: ${segment.phase}`);
      continue;
    }
    if (seen.has(segment.phase)) {
      errors.push(`Duplicate pacing phase: ${segment.phase}`);
    } else {
      seen.add(segment.phase);
    }
    if (index < lastIndex) {
      errors.push(`Pacing phase order invalid: ${segment.phase} appears too early`);
    }
    lastIndex = Math.max(lastIndex, index);
  }

  for (const required of PHASE_ORDER) {
    if (!seen.has(required)) {
      errors.push(`Missing pacing phase: ${required}`);
    }
  }
  return errors;
}

function isRecoveryChunk(template: ChunkTemplate): boolean {
  return template.recoveryAfter || template.tags.includes('COOLDOWN_LANE');
}

function isHazardChunk(template: ChunkTemplate): boolean {
  return template.tags.some((tag) => HAZARD_TAGS.has(tag));
}

function isGuidanceChunk(template: ChunkTemplate): boolean {
  return template.tags.some((tag) => GUIDANCE_TAGS.has(tag));
}

function formatRuleLine(levelSpec: LevelSpec, message: string): string {
  return `Level ${levelSpec.world}-${levelSpec.level} ${message}`;
}

function isHighRiskChunk(template: ChunkTemplate): boolean {
  return template.tags.some((tag) => RISKY_CHUNK_TAGS.has(tag));
}

function hasHazardTag(template: ChunkTemplate): boolean {
  return isHazardChunk(template);
}

function validateChunkTagAllowed(template: ChunkTemplate, allowedTags: Set<string> | undefined): string[] {
  if (!allowedTags || allowedTags.size === 0) {
    return [];
  }
  const illegal = template.tags.filter((tag) => !allowedTags.has(tag));
  return illegal.length > 0 ? [`contains disallowed chunk tag(s): ${illegal.join(', ')}`] : [];
}

function validateMechanicAllowed(
  template: ChunkTemplate,
  newMechanics: string[],
  allowedEnemies: Set<string> | undefined,
): string[] {
  if (!allowedEnemies || allowedEnemies.size === 0 || newMechanics.length === 0) {
    return [];
  }
  const illegal = newMechanics.filter((mechanic) => !allowedEnemies.has(mechanic));
  return illegal.length > 0 ? [`introduces unapproved mechanics: ${illegal.join(', ')}`] : [];
}

function hasNearbyGuidance(chunkIds: string[], centerChunkIndex: number, radius = 2): boolean {
  const start = Math.max(0, centerChunkIndex - radius);
  const end = Math.min(chunkIds.length - 1, centerChunkIndex + radius);
  for (let i = start; i <= end; i += 1) {
    if (i === centerChunkIndex) {
      continue;
    }
    const template = CHUNK_LIBRARY[chunkIds[i] ?? ''];
    if (!template) {
      continue;
    }
    if (isGuidanceChunk(template)) {
      return true;
    }
  }
  return false;
}

export function validateCampaignSpec(levelSpec: LevelSpec): string[] {
  const errors: string[] = [];
  const strictPacingChecks = false;
  const chunks = levelSpec.sequence.flatMap((segment) => segment.chunks);
  if (chunks.length < 4) {
    errors.push(formatRuleLine(levelSpec, 'has too few chunks.'));
  }

  const phaseErrors = validatePhaseOrder(levelSpec.sequence);
  if (phaseErrors.length > 0) errors.push(...phaseErrors);
  const campaignRules = getWorldRules(levelSpec.world).campaign;
  const maxNewMechanicsPerChunk = campaignRules
    ? Math.min(levelSpec.hardRules.maxNewMechanicsPerChunk, campaignRules.maxNewMechanicsPerChunk)
    : levelSpec.hardRules.maxNewMechanicsPerChunk;
  const recoveryWindow = campaignRules
    ? Math.max(levelSpec.hardRules.minRecoveryGap, campaignRules.minRecoveryGap)
    : levelSpec.hardRules.minRecoveryGap;
  const maxHazardClusters = campaignRules
    ? Math.min(levelSpec.hardRules.maxHazardClusters, campaignRules.maxHazardClusters)
    : levelSpec.hardRules.maxHazardClusters;
  const normalizedRecoveryWindow = Math.max(0, Math.floor(recoveryWindow));
  const normalizedHazardClusters = Math.max(0, Math.floor(maxHazardClusters));
  const guidanceWindow = campaignRules?.guidanceWindow ?? 2;
  const allowedChunkTags = campaignRules ? new Set(campaignRules.allowedChunkTags) : undefined;
  const allowedHazardTags = campaignRules ? new Set(campaignRules.allowedHazardTags) : undefined;
  const allowedEnemyTags = campaignRules ? new Set(campaignRules.allowedEnemyTags) : undefined;

  const seenMechanics = new Set<string>();
  let openingMechanics = 0;
  let hazardRun = 0;
  let challengeHighRiskRun = 0;
  let recoveryDebt = 0;
  let recoveryDebtAnchor = -1;
  const pacingByChunk = levelSpec.sequence.flatMap((segment) => segment.chunks.map(() => segment.phase));

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunkId = chunks[chunkIndex]!;
    const template = CHUNK_LIBRARY[chunkId];
    if (!template) {
      errors.push(formatRuleLine(levelSpec, `uses unknown chunk id ${chunkId}.`));
      continue;
    }

    const segmentPhase = pacingByChunk[chunkIndex] ?? 'CHALLENGE';
    const isChallengeChunk = segmentPhase === 'CHALLENGE';
    const isRecoveryChunkTag = isRecoveryChunk(template);
    const isHazardChunk = hasHazardTag(template);
    const isHighRiskChunkTemplate = isHighRiskChunk(template);
    const prevTemplate = chunkIndex > 0 ? CHUNK_LIBRARY[chunks[chunkIndex - 1]!] : undefined;

    if (strictPacingChecks) {
      const disallowedTags = validateChunkTagAllowed(template, allowedChunkTags);
      disallowedTags.forEach((reason) => errors.push(formatRuleLine(levelSpec, `${chunkId} ${reason}.`)));
    }

    const newMechanics = template.mechanicsIntroduced.filter((mechanic) => !seenMechanics.has(mechanic));
    if (newMechanics.length > levelSpec.hardRules.maxNewMechanicsPerChunk) {
      errors.push(
        formatRuleLine(
          levelSpec,
          `chunk ${chunkId} introduces ${newMechanics.length} new mechanics (allowed by chunk local rule ${levelSpec.hardRules.maxNewMechanicsPerChunk}).`,
        ),
      );
    }
    if (newMechanics.length > maxNewMechanicsPerChunk) {
      errors.push(formatRuleLine(levelSpec, `${chunkId} violates world campaign mechanics cap (${newMechanics.length}>${maxNewMechanicsPerChunk}).`));
    }
    if (strictPacingChecks) {
      if (isHighRiskChunkTemplate && allowedHazardTags) {
        const disallowedHazardTags = template.tags.filter((tag) => HAZARD_TAGS.has(tag) && !allowedHazardTags.has(tag));
        if (disallowedHazardTags.length > 0) {
          errors.push(
            formatRuleLine(
              levelSpec,
              `introduces disallowed hazards for world ${levelSpec.world}: ${disallowedHazardTags.join(', ')}.`,
            ),
          );
        }
      }
      const hardRulesNewMechanics = validateMechanicAllowed(template, newMechanics, allowedEnemyTags);
      hardRulesNewMechanics.forEach((reason) => {
        errors.push(formatRuleLine(levelSpec, `chunk ${chunkId} ${reason}.`));
      });
    }
    newMechanics.forEach((mechanic) => seenMechanics.add(mechanic));
    if (chunkIndex < 2) {
      openingMechanics += newMechanics.length;
    }

    if (strictPacingChecks && recoveryDebt > 0) {
      if (isRecoveryChunkTag) {
        recoveryDebt = 0;
        recoveryDebtAnchor = -1;
      } else {
        recoveryDebt -= 1;
        if (recoveryDebt === 0 && recoveryDebtAnchor >= 0) {
          const source = chunks[recoveryDebtAnchor] ?? 'previous high-risk chunk';
          errors.push(
            formatRuleLine(
              levelSpec,
              `needs a recovery chunk within ${normalizedRecoveryWindow} chunk(s) after "${source}" before "${chunkId}".`,
            ),
          );
        }
      }
    }

    if (strictPacingChecks && isHazardChunk) {
      hazardRun += 1;
      if (hazardRun > normalizedHazardClusters) {
        errors.push(
          formatRuleLine(
            levelSpec,
            `hazard run of ${hazardRun} chunks exceeds maxHazardClusters=${normalizedHazardClusters}.`,
          ),
        );
      }
    } else if (strictPacingChecks) {
      hazardRun = 0;
    }

    if (
      strictPacingChecks
      && isChallengeChunk
      && isHighRiskChunkTemplate
      && !isGuidanceChunk(template)
      && !hasNearbyGuidance(chunks, chunkIndex, guidanceWindow)
    ) {
      errors.push(
        formatRuleLine(
          levelSpec,
          `high-risk challenge chunk "${chunkId}" lacks nearby guidance within ${guidanceWindow} chunk(s).`,
        ),
      );
    }

    if (strictPacingChecks && isChallengeChunk && isHighRiskChunkTemplate) {
      if (!isRecoveryChunkTag && prevTemplate && isHighRiskChunk(prevTemplate)) {
        errors.push(formatRuleLine(levelSpec, `has unchecked high-risk adjacency at chunk ${chunkId}.`));
      }
      challengeHighRiskRun += 1;
      if (challengeHighRiskRun > normalizedHazardClusters) {
        errors.push(
          formatRuleLine(
            levelSpec,
            `challenge high-risk streak of ${challengeHighRiskRun} chunks exceeds maxHazardClusters=${normalizedHazardClusters}.`,
          ),
        );
      }
      if (normalizedRecoveryWindow > 0) {
        recoveryDebt = Math.max(recoveryDebt, normalizedRecoveryWindow);
        recoveryDebtAnchor = chunkIndex;
      }
    } else if (strictPacingChecks && isChallengeChunk) {
      challengeHighRiskRun = 0;
    } else if (strictPacingChecks && isRecoveryChunkTag) {
      challengeHighRiskRun = 0;
    }

    if (strictPacingChecks && isRecoveryChunkTag && template.tags.includes('COOLDOWN_LANE')) {
      if (prevTemplate && prevTemplate.tags.includes('COOLDOWN_LANE')) {
        errors.push(formatRuleLine(levelSpec, `has consecutive cooldown chunks at ${chunkId}.`));
      }
    }
  }

  if (strictPacingChecks && openingMechanics > 1) {
    errors.push(formatRuleLine(levelSpec, `introduces ${openingMechanics} mechanics in first two chunks.`));
  }

  if (strictPacingChecks && recoveryDebt > 0 && recoveryDebtAnchor >= 0) {
    const source = chunks[recoveryDebtAnchor] ?? 'previous high-risk chunk';
    errors.push(
      formatRuleLine(
        levelSpec,
        `needs a recovery chunk within ${normalizedRecoveryWindow} chunk(s) after "${source}" before level end.`,
      ),
    );
  }

  return errors;
}

function buildGroundProfile(template: ChunkTemplate, baseGroundY: number): number[] {
  const profile = new Array(CHUNK_WIDTH).fill(baseGroundY);
  if (template.tags.includes('RISE_STEP')) {
    for (let i = Math.floor(CHUNK_WIDTH / 2); i < CHUNK_WIDTH; i += 1) {
      profile[i] = Math.max(20, baseGroundY - 1);
    }
  }
  if (template.tags.includes('DROP_STEP')) {
    for (let i = Math.floor(CHUNK_WIDTH / 2); i < CHUNK_WIDTH; i += 1) {
      profile[i] = Math.min(28, baseGroundY + 1);
    }
  }
  if (template.tags.includes('CLIFF_EDGE')) {
    for (let i = CHUNK_WIDTH - 4; i < CHUNK_WIDTH; i += 1) {
      profile[i] = Math.min(28, baseGroundY + 1);
    }
  }
  return profile;
}

function addChunkDecorations(
  input: {
    grid: number[][];
    chunkTemplate: ChunkTemplate;
    x0: number;
    x1: number;
    groundProfile: number[];
    world: number;
    levelIndex: number;
    chunkIndex: number;
    rules: ReturnType<typeof getWorldRules>;
    rng: ReturnType<typeof createRng>;
    entities: Parameters<typeof addEntity>[0];
    oneWayPlatforms: Array<{ x: number; y: number; w: number; vanish?: { visibleMs: number; hiddenMs: number } }>;
    movingPlatforms: Array<{ id: string; x: number; y: number; minX: number; maxX: number; speed: number }>;
  },
): void {
  const {
    grid,
    chunkTemplate,
    x0,
    x1,
    groundProfile,
    world,
    levelIndex,
    chunkIndex,
    rules,
    rng,
    entities,
    oneWayPlatforms,
  } = input;
  const tags = new Set(chunkTemplate.tags);
  const groundY = Math.min(...groundProfile);
  const chunkMid = Math.floor((x0 + x1) / 2);

  const cpEvery = Math.max(2, rules.checkpointSpacingChunks);
  if (chunkIndex % cpEvery === 0 && chunkIndex > 1) {
    addEntity(
      entities,
      'checkpoint',
      x0 + 5,
      groundY - 2,
      { checkpointId: `cp_${world}_${levelIndex}_${chunkIndex}` },
    );
  }

  if (tags.has('POWERUP_HINT') || tags.has('PRACTICE_PAD')) {
    addEntity(entities, 'question_block', x0 + 9, groundY - 4, { variant: 'practice' });
    const powerupChance = clampChance(0.45 * (world >= 4 ? 1.12 : 1));
    addChunkPowerup(world, rng, powerupChance, x0 + 11, groundY - 4, entities);
  }
  if (tags.has('COIN_REWARD') && rng.chance(clampChance(0.2 * (rules.campaign?.tokenSpawnMultiplier ?? 1)))) {
    addChunkPowerup(world, rng, 0.4, chunkMid, groundY - 6, entities);
  }
  if (tags.has('COIN_STAIR')) {
    for (let i = 0; i < 5; i += 1) {
      addEntity(entities, 'token', x0 + 4 + i, groundY - 4 + Math.abs(2 - i));
    }
  }
  if (tags.has('COIN_ARCH')) {
    for (let i = 0; i < 6; i += 1) {
      addEntity(entities, 'token', x0 + 3 + i, groundY - (4 + Math.floor(Math.sin(i * 0.55) * 2)));
    }
  }
  if (tags.has('COIN_RAIL')) {
    for (let i = 0; i < 6; i += 1) {
      addEntity(entities, 'token', x0 + 2 + i, groundY - 4);
    }
  }
  if (tags.has('COIN_REWARD')) {
    addEntity(entities, 'token', chunkMid, groundY - 4);
  }

  const vanishTemplate = chunkTemplate.vanish_platform
    ? {
      ...chunkTemplate.vanish_platform,
      phaseOffsetMs: rng.nextInt(0, VANISH_OFFSET_RANDOM_MAX_MS - 1),
    }
    : { visibleMs: 1000, hiddenMs: 1000, phaseOffsetMs: rng.nextInt(0, VANISH_OFFSET_RANDOM_MAX_MS - 1) };

  if (tags.has('PLATFORM_BUBBLE')) {
    oneWayPlatforms.push({
      x: chunkMid - 2,
      y: groundY - 5,
      w: 4,
      vanish: tags.has('VANISH_PLATFORM') ? vanishTemplate : undefined,
    });
  }
  if (tags.has('VANISH_PLATFORM') && !tags.has('PLATFORM_BUBBLE')) {
    oneWayPlatforms.push({
      x: chunkMid - 1,
      y: groundY - 6,
      w: 4,
      vanish: vanishTemplate,
    });
  }
  if (tags.has('PLATFORM_STACK')) {
    oneWayPlatforms.push({ x: x0 + 5, y: groundY - 6, w: 4 });
    oneWayPlatforms.push({ x: x0 + 11, y: groundY - 8, w: 4 });
    oneWayPlatforms.push({ x: x0 + 17, y: groundY - 7, w: 4 });
  }

  if (tags.has('GAP_SHORT')) {
    const gapCenter = Math.floor((x0 + x1) / 2);
    clearTileRange(grid, gapCenter - 1, gapCenter + 1, groundY);
    addEntity(entities, 'spring', gapCenter - 1, groundY - 1);
  }
  if (tags.has('GAP_LONG')) {
    const gapCenter = Math.floor((x0 + x1) / 2);
    clearTileRange(grid, gapCenter - 2, gapCenter + 2, groundY);
    addEntity(entities, 'spring', gapCenter, groundY - 1);
    addChunkPowerup(world, rng, 0.06, gapCenter + 1, groundY - 5, entities);
  }

  if (tags.has('WALKER_PATROL') || tags.has('GOOMBA_SPAWN') || tags.has('TURNAROUND_ENEMY')) {
    addEntity(entities, 'walker', chunkMid, groundY - 1, { patrol: 4 + (chunkIndex % 3) });
  }
  if (tags.has('BLOCKER')) {
    addEntity(entities, 'shell', x1 - 6, groundY - 1, { patrol: 4 });
  }
  if (tags.has('FLYER_DRIFT')) {
    addEntity(entities, 'flying', x0 + 11, groundY - 6, { amp: 16 + chunkIndex });
  }
  if (tags.has('SPIKE_LOW')) {
    addEntity(entities, 'spike', chunkMid, groundY - 1);
  }
  if (tags.has('SPIKE_SWEEP')) {
    addEntity(entities, 'spike', x0 + 4, groundY - 1);
    addEntity(entities, 'spike', chunkMid, groundY - 1);
    addEntity(entities, 'spike', x1 - 4, groundY - 1);
  }
  if (tags.has('THWOMP_DROP')) {
      addEntity(entities, 'thwomp', x1 - 2, groundY - 7, { topY: groundY - 12, bottomY: groundY - 1 });
    }

  const hazardOffset = (chunkIndex + (world * 7)) % 7;
  if (hazardOffset === 0 && rng.chance(clampChance((rules.campaign?.tokenSpawnMultiplier ?? 1) * 0.08))) {
    const enemy = pickEnemyTypeForChunk(world, rng);
    addEntity(
      entities,
      enemy,
      x0 + 15 + (hazardOffset % 4),
      groundY - 1,
      enemy === 'compliance_officer' || enemy === 'technical_debt'
        ? { behaviorBias: enemy === 'compliance_officer' ? 3 : 2 }
        : undefined,
    );
  }
}

function injectScriptStoryEntities(
  world: number,
  levelIndex: number,
  widthTiles: number,
  entities: Parameters<typeof addEntity>[0],
): void {
  const stage = Math.max(1, Math.min(4, Math.floor(levelIndex)));
  const center = Math.floor(widthTiles / 2);
  const spread = Math.max(8, Math.floor(widthTiles * 0.22));
  const nodeX = Math.max(6, center - spread);
  const posterX = Math.min(widthTiles - 8, center + Math.floor(spread / 2));
  const effectX = Math.min(widthTiles - 10, center + spread);
  const fileX = Math.max(10, center + ((world + stage) % 2 === 0 ? -6 : 6));

  addEntity(entities, 'diagnostic_node', nodeX, BASE_GROUND - 3, { world, stage, channel: 'manual_check' });
  addEntity(entities, 'poster', posterX, BASE_GROUND - 5, { world, stage });
  addEntity(entities, 'personal_effect', effectX, BASE_GROUND - 3, { world, stage });
  addEntity(entities, 'personnel_file', fileX, BASE_GROUND - 4, { world, stage, fileId: `file-${world}-${stage}` });
}

function emitAuthoringLevel(levelSpec: LevelSpec, input: LevelGenerationInput, rules: ReturnType<typeof getWorldRules>): GeneratedLevel {
  const errors = validateCampaignSpec(levelSpec);
  if (errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  const rng = createRng(input.seed ^ (input.world << 11) ^ (input.levelIndex << 3));
  const chunkIds = levelSpec.sequence.flatMap((segment) => segment.chunks);
  const width = (chunkIds.length + 2) * CHUNK_WIDTH;
  const grid = makeGrid(width, LEVEL_HEIGHT);
  const entities: ReturnType<typeof emitAuthoringLevel>['entities'] = [];
  const oneWayPlatforms: ReturnType<typeof emitAuthoringLevel>['oneWayPlatforms'] = [];
  const movingPlatforms: ReturnType<typeof emitAuthoringLevel>['movingPlatforms'] = [];
  const checkpoints: ReturnType<typeof emitAuthoringLevel>['checkpoints'] = [];
  const chunksUsed: string[] = ['start'];
  const benchmarkAutoScroll: BenchmarkAutoScroll[] = [];

  for (let x = 0; x < CHUNK_WIDTH; x += 1) {
    fillColumn(grid, x, BASE_GROUND);
  }
  addEntity(entities, 'spawn', 2, BASE_GROUND - 2);
  addEntity(entities, 'question_block', CHUNK_WIDTH - 4, BASE_GROUND - 4, { variant: 'start' });

  let cursor = CHUNK_WIDTH;
  let groundY = BASE_GROUND;
  for (let chunkIndex = 0; chunkIndex < chunkIds.length; chunkIndex += 1) {
    const chunkId = chunkIds[chunkIndex];
    const template = CHUNK_LIBRARY[chunkId];
    if (!template) {
      continue;
    }
    const x0 = cursor;
    const x1 = cursor + CHUNK_WIDTH - 1;
    const groundProfile = buildGroundProfile(template, groundY);
    for (let x = x0; x <= x1; x += 1) {
      const localIndex = x - x0;
      const profileY = groundProfile[localIndex] ?? groundY;
      fillColumn(grid, x, profileY);
      if (template.tags.includes('GAP_SHORT') && x === x0 + 10) {
        fillColumn(grid, x, LEVEL_HEIGHT - 1);
      }
    }
    if (template.tags.includes('GAP_SHORT')) {
      clearTileRange(grid, x0 + 9, x0 + 11, groundY);
      addEntity(entities, 'spring', x0 + 10, groundY - 1);
    }
    if (template.tags.includes('GAP_LONG')) {
      clearTileRange(grid, x0 + 8, x0 + 14, groundY);
      addEntity(entities, 'spring', x0 + 11, groundY - 1);
    }
    parseBenchmarkTriggers({ chunkStartX: x0 * TILE_SIZE, chunkTemplate: template, benchmarkAutoScroll });

    addChunkDecorations({
      grid,
      chunkTemplate: template,
      x0,
      x1,
      groundProfile,
      world: input.world,
      levelIndex: input.levelIndex,
      chunkIndex: chunkIndex + 1,
      rules,
      rng,
      entities,
      oneWayPlatforms,
      movingPlatforms,
    });
    chunksUsed.push(chunkId);

    if (template.tags.includes('MOVE_PLATFORM')) {
      movingPlatforms.push({
        id: `mp_${chunkIndex}`,
        x: x0 + 12 * TILE_SIZE,
        y: (groundY - 5) * TILE_SIZE,
        minX: (x0 + 6) * TILE_SIZE,
        maxX: (x0 + 18) * TILE_SIZE,
        speed: 45 + input.world * 2,
      });
    }

    if (template.tags.includes('DROP_STEP')) {
      groundY = Math.min(28, groundY + 1);
    } else if (template.tags.includes('RISE_STEP')) {
      groundY = Math.max(21, groundY - 1);
    }
    cursor += CHUNK_WIDTH;
  }

  for (let x = cursor; x < cursor + CHUNK_WIDTH; x += 1) {
    fillColumn(grid, x, BASE_GROUND);
  }
  chunksUsed.push('end');
  addEntity(entities, 'goal', width - 3, BASE_GROUND - 3);
  injectScriptStoryEntities(input.world, input.levelIndex, width, entities);

  return {
    tileSize: TILE_SIZE,
    width,
    height: LEVEL_HEIGHT,
    tileGrid: grid,
    oneWayPlatforms,
    movingPlatforms,
    entities,
    checkpoints,
    goal: {
      x: (width - 3) * TILE_SIZE,
      y: (BASE_GROUND - 3) * TILE_SIZE,
    },
    metadata: {
      world: input.world,
      levelIndex: input.levelIndex,
      theme: rules.theme,
      difficultyTier: campaignOrdinal(input.world, input.levelIndex),
      chunksUsed,
      pacing: levelSpec.sequence.map((segment) => segment.phase),
      seed: input.seed,
      setPiece: levelSpec.setPiece,
      benchmarkAutoScroll: benchmarkAutoScroll.length > 0 ? benchmarkAutoScroll : undefined,
    },
  };
}

function generateLegacyLevel(input: LevelGenerationInput, rules: ReturnType<typeof getWorldRules>): GeneratedLevel {
  const chunkCount = input.bonus ? 6 : Math.min(14, 8 + input.world + input.levelIndex);
  const width = chunkCount * CHUNK_WIDTH;
  const grid = makeGrid(width, LEVEL_HEIGHT);
  const entities: ReturnType<typeof generateLegacyLevel>['entities'] = [];
  const oneWayPlatforms: ReturnType<typeof generateLegacyLevel>['oneWayPlatforms'] = [];
  const movingPlatforms: ReturnType<typeof generateLegacyLevel>['movingPlatforms'] = [];
  const checkpoints: ReturnType<typeof generateLegacyLevel>['checkpoints'] = [];
  const chunksUsed: ChunkType[] = ['start'];
  const rng = createRng(input.seed ^ (input.world << 7) ^ (input.levelIndex << 13));
  const levelsInWorld = CAMPAIGN_WORLD_LAYOUT[Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(input.world))) - 1] ?? 0;
  const finalCastle = !input.bonus && input.levelIndex === levelsInWorld && levelsInWorld > 0;
  const benchmarkAutoScroll: BenchmarkAutoScroll[] = [];
  const tokenSpawnMultiplier = rules.campaign?.tokenSpawnMultiplier ?? 1;
  const hazardDensityMultiplier = rules.campaign?.hazardDensityMultiplier ?? 1;
  const clampChance = (raw: number): number => {
    if (!Number.isFinite(raw)) return 0;
    return Math.min(0.98, Math.max(0, raw));
  };

  let groundY = BASE_GROUND;

  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const x0 = chunk * CHUNK_WIDTH;
    const x1 = x0 + CHUNK_WIDTH - 1;

    if (chunk === 0) {
      for (let x = x0; x <= x1; x += 1) {
        fillColumn(grid, x, BASE_GROUND);
      }
      addEntity(entities, 'spawn', x0 + 2, BASE_GROUND - 2);
      continue;
    }

    if (chunk === chunkCount - 1) {
      for (let x = x0; x <= x1; x += 1) {
        fillColumn(grid, x, BASE_GROUND);
      }
      addEntity(entities, 'goal', x1 - 2, BASE_GROUND - 3);
      chunksUsed.push('end');
      continue;
    }

    const family = pickFamily(input.world, rules.allowedChunkFamilies, rng);
    const templates = FAMILY_TEMPLATES[family];
    const template = rng.pick([...templates, ...templates]);
    const usedChunkId = template === 'benchmark_sprint' ? 'benchmark_sprint_01' : family;
    chunksUsed.push(usedChunkId as ChunkType);

    const variance = rng.nextInt(-rules.groundVariance, rules.groundVariance);
    groundY = Math.max(21, Math.min(28, groundY + variance));
    for (let x = x0; x <= x1; x += 1) {
      fillColumn(grid, x, groundY);
    }
    if (template === 'benchmark_sprint') {
      parseBenchmarkTriggers({
        chunkStartX: x0 * TILE_SIZE,
        chunkTemplate: CHUNK_LIBRARY.benchmark_sprint_01!,
        benchmarkAutoScroll,
      });
      continue;
    }

    const hasGap = rng.chance(
      clampChance((finalCastle ? rules.gapFrequency + 0.08 : rules.gapFrequency) * hazardDensityMultiplier),
    );
    if (hasGap) {
      const gapWidth = rng.nextInt(2, finalCastle ? 5 : 4);
      const gapStart = x0 + rng.nextInt(6, 13);
      clearTileRange(grid, gapStart, gapStart + gapWidth, groundY);
      addEntity(entities, 'spring', gapStart - 1, groundY - 1);
    }

    const hasCheckpoint = chunk % rules.checkpointSpacingChunks === 0 && chunk > 1;
    if (hasCheckpoint) {
      const checkpointId = `cp_${input.world}_${input.levelIndex}_${chunk}`;
      addEntity(entities, 'checkpoint', x0 + 5, groundY - 2, { checkpointId });
      checkpoints.push({
        id: checkpointId,
        x: (x0 + 5) * TILE_SIZE,
        y: (groundY - 2) * TILE_SIZE,
      });
      chunksUsed.push('checkpoint');
    }

    if (template === 'coin_arc') {
      for (let i = 0; i < 5; i += 1) {
        addEntity(entities, 'token', x0 + 5 + i, groundY - 4);
      }
      if (rng.chance(clampChance(0.08 * tokenSpawnMultiplier))) {
        addChunkPowerup(input.world, rng, 0.9, x0 + 5 + 2, groundY - 4, entities);
      }
      if (rng.chance(clampChance(0.6 * tokenSpawnMultiplier))) {
        addEntity(entities, 'question_block', x0 + 7, groundY - 4);
      }
      if (rng.chance(clampChance(0.45 * tokenSpawnMultiplier))) {
        addEntity(entities, 'star', x0 + 11, groundY - 6);
      }
    }

    if (template === 'enemy_gauntlet' || rng.chance(clampChance((finalCastle ? rules.enemyDensity + 0.1 : rules.enemyDensity) * hazardDensityMultiplier))) {
      const spawnCount = 1 + (rng.chance(0.6) ? 1 : 0) + (rng.chance(0.45) ? 1 : 0);
      for (let spawnIndex = 0; spawnIndex < spawnCount; spawnIndex += 1) {
        const enemy = pickEnemyTypeForChunk(input.world, rng);
        const xPos = x0 + 8 + spawnIndex * 6;
        const baseData: Record<string, number | string | boolean> = enemy === 'flying' ? { amp: 18 + spawnIndex } : enemy === 'spitter' ? { cadenceMs: rules.projectileCadenceMs } : {};
        addEntity(entities, enemy, xPos, groundY - 1, baseData);
      }
    }

    if (template === 'vertical_climb') {
      for (let i = 0; i < 3; i += 1) {
        const px = x0 + 7 + i * 5;
        const py = groundY - 4 - i * 3;
        for (let x = px; x < px + 4; x += 1) {
          for (let y = py; y <= py + 1 && y < LEVEL_HEIGHT; y += 1) {
            grid[y]![x] = 2;
          }
        }
        oneWayPlatforms.push({ x: px, y: py, w: 4 });
      }
      addEntity(entities, 'spike', x0 + 5, groundY - 1);
    }

    if (template === 'moving_platform' || rng.chance(clampChance((finalCastle ? rules.movingPlatformFrequency + 0.12 : rules.movingPlatformFrequency) * hazardDensityMultiplier))) {
      const platformY = groundY - 6;
      movingPlatforms.push({
        id: `mp_${chunk}`,
        x: (x0 + 10) * TILE_SIZE,
        y: platformY * TILE_SIZE,
        minX: (x0 + 5) * TILE_SIZE,
        maxX: (x0 + 16) * TILE_SIZE,
        speed: 50 + input.world * 8 + (finalCastle ? 22 : 0),
      });
      addEntity(entities, 'thwomp', x0 + 18, groundY - 6, { topY: groundY - 10, bottomY: groundY - 2 });
      addEntity(entities, 'spike', x0 + 12, groundY - 1);
      if (finalCastle && rng.chance(clampChance(0.5 * hazardDensityMultiplier))) {
        addEntity(entities, 'spike', x0 + 8, groundY - 1);
      }
    }

    for (let tx = x0 + 2; tx < x1 - 1; tx += 3) {
      if (rng.chance(clampChance(rules.coinDensity * tokenSpawnMultiplier * (finalCastle ? 0.14 : 0.25)))) {
        addEntity(entities, 'token', tx, groundY - rng.nextInt(2, 3));
      }
    }
    if (template === 'moving_platform' && rng.chance(clampChance(0.06 * hazardDensityMultiplier))) {
      addChunkPowerup(input.world, rng, 0.55, x0 + 15, groundY - 4, entities);
    }
    if (template === 'mid_flat' && rng.chance(0.35)) {
      addEntity(entities, 'question_block', x0 + rng.nextInt(8, 16), groundY - 4);
    }
  }

  injectScriptStoryEntities(input.world, input.levelIndex, width, entities);

  return {
    tileSize: TILE_SIZE,
    width,
    height: LEVEL_HEIGHT,
    tileGrid: grid,
    oneWayPlatforms,
    movingPlatforms,
    entities,
    checkpoints,
    goal: {
      x: (width - 3) * TILE_SIZE,
      y: (BASE_GROUND - 2) * TILE_SIZE,
    },
    metadata: {
      world: input.world,
      levelIndex: input.levelIndex,
      theme: input.bonus ? 'bonus' : rules.theme,
      difficultyTier: campaignOrdinal(input.world, input.levelIndex),
      chunksUsed,
      pacing: ['INTRO', 'PRACTICE', 'VARIATION', 'CHALLENGE', 'COOLDOWN', 'FINALE'],
      seed: input.seed,
      benchmarkAutoScroll: benchmarkAutoScroll.length > 0 ? benchmarkAutoScroll : undefined,
    },
  };
}

export function generateLevel(input: LevelGenerationInput): GeneratedLevel {
  const rules = getWorldRules(input.world);
  if (input.bonus) {
    return generateLegacyLevel(input, rules);
  }

  const campaignLevel = findCampaignLevel(input.world, input.levelIndex);
  if (!campaignLevel) {
    return generateLegacyLevel(input, rules);
  }

  return emitAuthoringLevel(campaignLevel, input, rules);
}

export function validateGeneratedLevel(level: GeneratedLevel): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!level.entities.some((entity) => entity.type === 'spawn')) errors.push('missing spawn');
  if (!level.entities.some((entity) => entity.type === 'goal')) errors.push('missing goal');
  if (level.tileGrid.length !== level.height) errors.push('height mismatch');
  if (level.tileGrid[0]?.length !== level.width) errors.push('width mismatch');
  if (level.metadata.chunksUsed.length < 4) errors.push('insufficient chunks');
  if (!Array.isArray(level.metadata.pacing) || level.metadata.pacing.length === 0) {
    errors.push('missing pacing metadata');
  }
  if (level.metadata.pacing.length !== PHASE_ORDER.length) {
    errors.push(`pacing should have ${PHASE_ORDER.length} phases; found ${level.metadata.pacing.length}`);
  }
  for (let i = 0; i < Math.min(PHASE_ORDER.length, level.metadata.pacing.length); i += 1) {
    if (level.metadata.pacing[i] !== PHASE_ORDER[i]) {
      errors.push(`pacing phase order mismatch at index ${i}: expected ${PHASE_ORDER[i]}, found ${level.metadata.pacing[i]}`);
    }
  }
  if (!level.metadata.pacing.every((phase) => typeof phase === 'string')) {
    errors.push('pacing metadata must be strings');
  }
  if (level.metadata.chunksUsed.length < 6) {
    errors.push('insufficient chunk span');
  }
  if (!Number.isFinite(level.metadata.seed)) errors.push('missing metadata seed');
  return { ok: errors.length === 0, errors };
}
