import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import type { BonusRouteId } from '../types/game';
import type { SaveGame } from '../types/game';

export interface CampaignLevelRef {
  world: number;
  stage: number;
  // Legacy compatibility alias.
  levelIndex: number;
}

function asStage(levelIndex: number): number {
  return Math.max(1, Math.floor(levelIndex));
}

export interface BonusRouteTarget {
  world: number;
  levelIndex: number;
  seedOffset: number;
}

const BONUS_ROUTE_TARGETS: Record<BonusRouteId, BonusRouteTarget> = {
  'micro-level-1': {
    world: 7,
    levelIndex: 1,
    seedOffset: 131,
  },
  'micro-level-2': {
    world: 7,
    levelIndex: 2,
    seedOffset: 197,
  },
  'micro-level-3': {
    world: 7,
    levelIndex: 3,
    seedOffset: 223,
  },
};

export function isBonusRouteId(value: unknown): value is BonusRouteId {
  return value === 'micro-level-1' || value === 'micro-level-2' || value === 'micro-level-3';
}

export function resolveBonusRouteTarget(routeId: BonusRouteId): BonusRouteTarget | null {
  return BONUS_ROUTE_TARGETS[routeId] ?? null;
}

export function resolveBonusRouteByLevel(world: number, levelIndex: number): BonusRouteId | null {
  for (const [routeId, target] of Object.entries(BONUS_ROUTE_TARGETS) as Array<[BonusRouteId, BonusRouteTarget]>) {
    if (target.world === world && target.levelIndex === asStage(levelIndex)) {
      return routeId;
    }
  }
  return null;
}

export function levelKey(world: number, levelIndex: number): string {
  return `${world}-${asStage(levelIndex)}`;
}

export function levelsInWorld(world: number): number {
  return CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
}

export function isValidCampaignLevel(world: number, levelIndex: number): boolean {
  const levels = levelsInWorld(world);
  const stage = asStage(levelIndex);
  return levels > 0 && stage >= 1 && stage <= levels;
}

export function nextLevel(world: number, levelIndex: number): CampaignLevelRef | null {
  const stage = asStage(levelIndex);
  if (!isValidCampaignLevel(world, stage)) {
    return { world: 1, stage: 1, levelIndex: 1 };
  }

  const inWorld = levelsInWorld(world);
  if (stage < inWorld) {
    const nextStage = stage + 1;
    return { world, stage: nextStage, levelIndex: nextStage };
  }

  for (let nextWorld = world + 1; nextWorld <= CAMPAIGN_WORLD_LAYOUT.length; nextWorld += 1) {
    const worldStages = levelsInWorld(nextWorld);
    if (worldStages > 0) {
      return { world: nextWorld, stage: 1, levelIndex: 1 };
    }
  }

  return null;
}

export function campaignOrdinal(world: number, levelIndex: number): number {
  const stage = asStage(levelIndex);
  if (!isValidCampaignLevel(world, stage)) {
    return 1;
  }
  let ordinal = stage;
  for (let w = 1; w < world; w += 1) {
    ordinal += levelsInWorld(w);
  }
  return ordinal;
}

export function campaignRefFromOrdinal(ordinal: number): CampaignLevelRef {
  const clamped = Math.min(TOTAL_CAMPAIGN_LEVELS, Math.max(1, Math.floor(ordinal)));
  let offset = clamped;
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    const inWorld = levelsInWorld(world);
    if (offset <= inWorld) {
      return { world, stage: offset, levelIndex: offset };
    }
    offset -= inWorld;
  }
  return { world: 1, stage: 1, levelIndex: 1 };
}

export function computeSeed(world: number, levelIndex: number, bonusRouteId?: BonusRouteId | null): number {
  const stage = asStage(levelIndex);
  const ordinal = campaignOrdinal(world, stage);
  const routeOffset = bonusRouteId ? (BONUS_ROUTE_TARGETS[bonusRouteId]?.seedOffset ?? 0) : 0;
  return world * 100_003 + stage * 9_973 + ordinal * 379 + routeOffset;
}

const MAX_EVALS_PER_LEVEL = 3;

function normalizeEvalList(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).filter((value) => typeof value === 'string')).values()).slice(0, MAX_EVALS_PER_LEVEL);
}

export function getPerLevelStats(
  save: SaveGame,
  world: number,
  levelIndex: number,
): { evalsCollected: number; evalsCollectedIds: string[]; collectiblesPicked: string[] } {
  const key = levelKey(world, levelIndex);
  const raw = save.perLevelStats[key] ?? {
    evalsCollected: 0,
    evalsCollectedIds: [],
    collectiblesPicked: [],
  };
  const evalsCollectedIds = normalizeEvalList(Array.isArray(raw.evalsCollectedIds) ? raw.evalsCollectedIds : []);
  return {
    evalsCollected: Math.min(MAX_EVALS_PER_LEVEL, Math.max(0, Number(raw.evalsCollected) || 0)),
    evalsCollectedIds,
    collectiblesPicked: Array.isArray(raw.collectiblesPicked) ? raw.collectiblesPicked.filter((v) => typeof v === 'string') : [],
  };
}

export function isLevelEvalComplete(save: SaveGame, world: number, levelIndex: number): boolean {
  return getPerLevelStats(save, world, levelIndex).evalsCollected >= MAX_EVALS_PER_LEVEL;
}

export function setLevelEvalStatus(
  save: SaveGame,
  world: number,
  levelIndex: number,
  evalId: string,
): SaveGame {
  const key = levelKey(world, levelIndex);
  if (!isValidCampaignLevel(world, levelIndex)) {
    return save;
  }
  const existing = getPerLevelStats(save, world, levelIndex);
  const nextEvalIds = normalizeEvalList([...[...existing.evalsCollectedIds, evalId]]);
  return {
    ...save,
    perLevelStats: {
      ...save.perLevelStats,
      [key]: {
        ...existing,
        evalsCollectedIds: nextEvalIds,
        evalsCollected: Math.min(MAX_EVALS_PER_LEVEL, nextEvalIds.length),
      },
    },
  };
}

export function setLevelCollectibleStatus(
  save: SaveGame,
  world: number,
  levelIndex: number,
  collectibleId: string,
): SaveGame {
  const key = levelKey(world, levelIndex);
  if (!isValidCampaignLevel(world, levelIndex)) {
    return save;
  }
  const existing = getPerLevelStats(save, world, levelIndex);
  const collectiblesPicked = Array.from(new Set([...existing.collectiblesPicked, collectibleId])).filter(
    (value) => typeof value === 'string',
  );
  return {
    ...save,
    perLevelStats: {
      ...save.perLevelStats,
      [key]: {
        ...existing,
        collectiblesPicked,
      },
    },
  };
}
