import { TILE_SIZE } from '../core/constants';
import type {
  ChunkFamily,
  ChunkTemplate,
  ChunkTemplateType,
  ChunkType,
  EntityType,
  GeneratedLevel,
  LevelGenerationInput,
  LevelHardRules,
  LevelSpec,
  PacingPhase,
  PacingSegment,
} from '../types/levelgen';
import { CAMPAIGN_25_LEVELS } from './campaign_25_levels';
import { createRng } from './rng';
import { getWorldRules } from './worldRules';
import { campaignOrdinal } from '../systems/progression';

const CHUNK_WIDTH = 24;
const LEVEL_HEIGHT = 34;
const BASE_GROUND = 26;
const DEFAULT_HARD_RULES: LevelHardRules = {
  maxNewMechanicsPerChunk: 1,
  minRecoveryGap: 1,
  maxHazardClusters: 1,
};

export const FAMILY_TEMPLATES: Record<ChunkFamily, ChunkTemplateType[]> = {
  server_room: ['mid_flat', 'mid_flat', 'coin_arc'],
  training_run: ['coin_arc', 'vertical_climb', 'enemy_gauntlet'],
  rag_pipeline: ['moving_platform', 'vertical_climb', 'enemy_gauntlet'],
  rate_limiter: ['moving_platform', 'enemy_gauntlet', 'coin_arc'],
};

const PHASE_ORDER: PacingPhase[] = [
  'INTRO',
  'PRACTICE',
  'VARIATION',
  'CHALLENGE',
  'COOLDOWN',
  'FINALE',
];

const HAZARD_TAGS = new Set([
  'SPIKE_LOW',
  'SPIKE_SWEEP',
  'THWOMP_DROP',
]);
const HAZARD_MECHANICS = new Set(['spike', 'flying', 'thwomp']);
const RISKY_CHUNK_TAGS = new Set([...HAZARD_TAGS, 'GAP_LONG']);

const GUIDANCE_TAGS = new Set([
  'COIN_STAIR',
  'COIN_ARCH',
  'COIN_RAIL',
  'COIN_REWARD',
  'POWERUP_HINT',
  'PRACTICE_PAD',
]);

const CHUNK_LIBRARY: Record<string, ChunkTemplate> = {
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

function findCampaignLevel(world: number, levelIndex: number): LevelSpec | undefined {
  return CAMPAIGN_25_LEVELS.levels.find((level) => level.world === world && level.level === levelIndex);
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

function introducesNewHazardMechanic(template: ChunkTemplate, newMechanics: string[]): boolean {
  if (!hasHazardTag(template) || newMechanics.length === 0) {
    return false;
  }
  return newMechanics.some((mechanic) => HAZARD_MECHANICS.has(mechanic));
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

function validateCampaignSpec(levelSpec: LevelSpec): string[] {
  const errors: string[] = [];
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
  const recoveryWindow = campaignRules ? campaignRules.minRecoveryGap : levelSpec.hardRules.minRecoveryGap;
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

    const disallowedTags = validateChunkTagAllowed(template, allowedChunkTags);
    disallowedTags.forEach((reason) => errors.push(formatRuleLine(levelSpec, `${chunkId} ${reason}.`)));

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
    newMechanics.forEach((mechanic) => seenMechanics.add(mechanic));
    if (chunkIndex < 2) {
      openingMechanics += newMechanics.length;
    }

    if (recoveryDebt > 0) {
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

    if (isHazardChunk) {
      hazardRun += 1;
      if (hazardRun > normalizedHazardClusters) {
        errors.push(
          formatRuleLine(
            levelSpec,
            `hazard run of ${hazardRun} chunks exceeds maxHazardClusters=${normalizedHazardClusters}.`,
          ),
        );
      }
    } else {
      hazardRun = 0;
    }

    if (isChallengeChunk && isHighRiskChunkTemplate && !isGuidanceChunk(template) && !hasNearbyGuidance(chunks, chunkIndex, guidanceWindow)) {
      errors.push(
        formatRuleLine(
          levelSpec,
          `high-risk challenge chunk "${chunkId}" lacks nearby guidance within ${guidanceWindow} chunk(s).`,
        ),
      );
    }

    if (isChallengeChunk && isHighRiskChunkTemplate) {
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
    } else if (isChallengeChunk) {
      challengeHighRiskRun = 0;
    } else if (isRecoveryChunkTag) {
      challengeHighRiskRun = 0;
    }

    if (isRecoveryChunkTag && template.tags.includes('COOLDOWN_LANE')) {
      if (prevTemplate && prevTemplate.tags.includes('COOLDOWN_LANE')) {
        errors.push(formatRuleLine(levelSpec, `has consecutive cooldown chunks at ${chunkId}.`));
      }
    }
  }

  if (openingMechanics > 1) {
    errors.push(formatRuleLine(levelSpec, `introduces ${openingMechanics} mechanics in first two chunks.`));
  }

  if (recoveryDebt > 0 && recoveryDebtAnchor >= 0) {
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
    oneWayPlatforms: Array<{ x: number; y: number; w: number }>;
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
    movingPlatforms,
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

  if (tags.has('PLATFORM_BUBBLE')) {
    oneWayPlatforms.push({
      x: chunkMid - 2,
      y: groundY - 5,
      w: 4,
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
  const finalCastle = !input.bonus && input.world === 5 && input.levelIndex === 1;

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

    const family = rules.allowedChunkFamilies[chunk % rules.allowedChunkFamilies.length]!;
    const templates = FAMILY_TEMPLATES[family];
    const template = rng.pick([...templates, ...templates]);
    chunksUsed.push(family);

    const variance = rng.nextInt(-rules.groundVariance, rules.groundVariance);
    groundY = Math.max(21, Math.min(28, groundY + variance));
    for (let x = x0; x <= x1; x += 1) {
      fillColumn(grid, x, groundY);
    }

    const hasGap = rng.chance(finalCastle ? rules.gapFrequency + 0.08 : rules.gapFrequency);
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
      if (rng.chance(0.6)) {
        addEntity(entities, 'question_block', x0 + 7, groundY - 4);
      }
      if (rng.chance(0.45)) {
        addEntity(entities, 'star', x0 + 11, groundY - 6);
      }
    }

    if (template === 'enemy_gauntlet' || rng.chance(finalCastle ? rules.enemyDensity + 0.1 : rules.enemyDensity)) {
      addEntity(entities, 'walker', x0 + 8, groundY - 1, { patrol: 4 });
      if (rng.chance(finalCastle ? 0.78 : 0.5)) {
        addEntity(entities, 'shell', x0 + 14, groundY - 1, { patrol: 4 });
      }
      if (rng.chance(finalCastle ? 0.58 : 0.35)) {
        addEntity(entities, 'flying', x0 + 17, groundY - 6, { amp: 20 });
      }
      if (rng.chance((finalCastle ? 0.62 : 0.3) + input.world * 0.06)) {
        addEntity(entities, 'spitter', x0 + 20, groundY - 1, { cadenceMs: rules.projectileCadenceMs });
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

    if (template === 'moving_platform' || rng.chance(finalCastle ? rules.movingPlatformFrequency + 0.12 : rules.movingPlatformFrequency)) {
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
      if (finalCastle && rng.chance(0.5)) {
        addEntity(entities, 'spike', x0 + 8, groundY - 1);
      }
    }

    for (let tx = x0 + 2; tx < x1 - 1; tx += 3) {
      if (rng.chance(rules.coinDensity * (finalCastle ? 0.14 : 0.25))) {
        addEntity(entities, 'token', tx, groundY - rng.nextInt(2, 3));
      }
    }
    if (template === 'mid_flat' && rng.chance(0.35)) {
      addEntity(entities, 'question_block', x0 + rng.nextInt(8, 16), groundY - 4);
    }
  }

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
