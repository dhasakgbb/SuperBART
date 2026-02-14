import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import type { SaveGameV3 } from '../types/game';

export interface CampaignLevelRef {
  world: number;
  levelIndex: number;
}

export function levelKey(world: number, levelIndex: number): string {
  return `${world}-${levelIndex}`;
}

export function levelsInWorld(world: number): number {
  return CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
}

export function isValidCampaignLevel(world: number, levelIndex: number): boolean {
  const levels = levelsInWorld(world);
  return levels > 0 && levelIndex >= 1 && levelIndex <= levels;
}

export function nextLevel(world: number, levelIndex: number): CampaignLevelRef | null {
  if (!isValidCampaignLevel(world, levelIndex)) {
    return { world: 1, levelIndex: 1 };
  }

  const inWorld = levelsInWorld(world);
  if (levelIndex < inWorld) {
    return { world, levelIndex: levelIndex + 1 };
  }

  for (let nextWorld = world + 1; nextWorld <= CAMPAIGN_WORLD_LAYOUT.length; nextWorld += 1) {
    const worldLevels = levelsInWorld(nextWorld);
    if (worldLevels > 0) {
      return { world: nextWorld, levelIndex: 1 };
    }
  }

  return null;
}

export function campaignOrdinal(world: number, levelIndex: number): number {
  if (!isValidCampaignLevel(world, levelIndex)) {
    return 1;
  }
  let ordinal = levelIndex;
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
      return { world, levelIndex: offset };
    }
    offset -= inWorld;
  }
  return { world: 1, levelIndex: 1 };
}

export function computeSeed(world: number, levelIndex: number): number {
  const ordinal = campaignOrdinal(world, levelIndex);
  return world * 100_003 + levelIndex * 9_973 + ordinal * 379;
}

const MAX_EVALS_PER_LEVEL = 3;

function normalizeEvalList(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).filter((value) => typeof value === 'string')).values()).slice(0, MAX_EVALS_PER_LEVEL);
}

export function getPerLevelStats(
  save: SaveGameV3,
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

export function isLevelEvalComplete(save: SaveGameV3, world: number, levelIndex: number): boolean {
  return getPerLevelStats(save, world, levelIndex).evalsCollected >= MAX_EVALS_PER_LEVEL;
}

export function setLevelEvalStatus(
  save: SaveGameV3,
  world: number,
  levelIndex: number,
  evalId: string,
): SaveGameV3 {
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
  save: SaveGameV3,
  world: number,
  levelIndex: number,
  collectibleId: string,
): SaveGameV3 {
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
