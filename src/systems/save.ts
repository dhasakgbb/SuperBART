import { CAMPAIGN_LEVELS_PER_WORLD, CAMPAIGN_WORLD_COUNT, DEFAULT_SETTINGS, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import type { SaveGameV2 } from '../types/game';

const SAVE_KEY = 'super_bart_save_v2';

export function defaultSave(): SaveGameV2 {
  return {
    schemaVersion: 2,
    campaign: {
      world: 1,
      levelIndex: 1,
      totalLevels: TOTAL_CAMPAIGN_LEVELS,
      bonusUnlocked: [false, false, false]
    },
    progression: {
      score: 0,
      coins: 0,
      stars: 0,
      deaths: 0,
      timeMs: 0
    },
    settings: { ...DEFAULT_SETTINGS },
    unlockedBonusLevels: []
  };
}

export function loadSave(): SaveGameV2 {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveGameV2>;
    if (parsed.schemaVersion !== 2) return migrateSave(parsed);
    return {
      ...defaultSave(),
      ...parsed,
      campaign: { ...defaultSave().campaign, ...(parsed.campaign ?? {}) },
      progression: { ...defaultSave().progression, ...(parsed.progression ?? {}) },
      settings: { ...defaultSave().settings, ...(parsed.settings ?? {}) }
    };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveGameV2): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function migrateSave(_legacy: Partial<SaveGameV2>): SaveGameV2 {
  return defaultSave();
}

export function advanceCampaign(save: SaveGameV2): SaveGameV2 {
  const next = structuredClone(save);
  if (next.campaign.levelIndex < CAMPAIGN_LEVELS_PER_WORLD) {
    next.campaign.levelIndex += 1;
  } else if (next.campaign.world < CAMPAIGN_WORLD_COUNT) {
    next.campaign.world += 1;
    next.campaign.levelIndex = 1;
  }
  return next;
}
