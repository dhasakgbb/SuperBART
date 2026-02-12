import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';

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

export function starsNeededForBonus(world: number): number {
  return world * 3;
}

export function isBonusUnlocked(world: number, stars: number): boolean {
  return stars >= starsNeededForBonus(world);
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
