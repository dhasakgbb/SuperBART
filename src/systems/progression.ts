import { CAMPAIGN_LEVELS_PER_WORLD } from '../core/constants';

export function starsNeededForBonus(world: number): number {
  return world * 3;
}

export function isBonusUnlocked(world: number, stars: number): boolean {
  return stars >= starsNeededForBonus(world);
}

export function computeSeed(world: number, levelIndex: number): number {
  return world * 100_003 + levelIndex * 9973;
}

export function nextLevel(world: number, levelIndex: number): { world: number; levelIndex: number } {
  if (levelIndex < CAMPAIGN_LEVELS_PER_WORLD) {
    return { world, levelIndex: levelIndex + 1 };
  }
  return { world: Math.min(5, world + 1), levelIndex: 1 };
}
