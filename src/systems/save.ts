import { CAMPAIGN_WORLD_LAYOUT, DEFAULT_SETTINGS, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import type { SaveGameV3 } from '../types/game';
import { isValidCampaignLevel, levelKey, nextLevel } from './progression';

const SAVE_KEY_V4 = 'super_bart_save_v4';
const SAVE_KEY_V2 = 'super_bart_save_v2';
const SAVE_KEY_V3 = 'super_bart_save_v3';

function normalizeLevelKeys(levelKeys: string[] | undefined): string[] {
  const unique = new Set<string>();
  for (const key of levelKeys ?? []) {
    const parts = key.split('-');
    if (parts.length !== 2) {
      continue;
    }
    const world = Number(parts[0]);
    const levelIndex = Number(parts[1]);
    if (isValidCampaignLevel(world, levelIndex)) {
      unique.add(levelKey(world, levelIndex));
    }
  }
  return [...unique].sort((a, b) => {
    const [wa, la] = a.split('-').map(Number);
    const [wb, lb] = b.split('-').map(Number);
    if (wa !== wb) return wa - wb;
    return la - lb;
  });
}

function normalizeCurrentLevel(save: SaveGameV3): SaveGameV3 {
  if (isValidCampaignLevel(save.campaign.world, save.campaign.levelIndex)) {
    return save;
  }
  return {
    ...save,
    campaign: {
      ...save.campaign,
      world: 1,
      levelIndex: 1
    }
  };
}

function normalizePerLevelStats(levelKeys: string[]): SaveGameV3['perLevelStats'] {
  const stats = Object.create(null) as Record<string, SaveGameV3['perLevelStats'][string]>;
  for (const key of levelKeys) {
    if (!stats[key]) {
      stats[key] = { evalsCollected: 0, evalsCollectedIds: [], collectiblesPicked: [] };
    }
  }
  return stats;
}

function normalizeSave(saveLike: Partial<SaveGameV3>): SaveGameV3 {
  const defaults = defaultSave();
  const rawSettings = (saveLike.settings ?? {}) as Partial<SaveGameV3['settings']> & {
    musicEnabled?: boolean;
    sfxEnabled?: boolean;
  };
  const mappedSettings: Partial<SaveGameV3['settings']> = {
    ...rawSettings,
    musicMuted: rawSettings.musicMuted ?? (rawSettings.musicEnabled === false),
    sfxMuted: rawSettings.sfxMuted ?? (rawSettings.sfxEnabled === false)
  };

  const merged: SaveGameV3 = {
    ...defaults,
    ...saveLike,
    schemaVersion: 4,
    campaign: {
      ...defaults.campaign,
      ...(saveLike.campaign ?? {}),
      worldLayout: [...CAMPAIGN_WORLD_LAYOUT],
      totalLevels: TOTAL_CAMPAIGN_LEVELS
    },
    progression: {
      ...defaults.progression,
      ...(saveLike.progression ?? {})
    },
    settings: {
      ...defaults.settings,
      ...mappedSettings
    }
  };

  merged.campaign.unlockedLevelKeys = normalizeLevelKeys(merged.campaign.unlockedLevelKeys);
  merged.campaign.completedLevelKeys = normalizeLevelKeys(merged.campaign.completedLevelKeys);
  const perLevelStatsFromSave = (saveLike.perLevelStats ?? defaults.perLevelStats) as SaveGameV3['perLevelStats'];
  const keysToHydrate = new Set<string>([...merged.campaign.unlockedLevelKeys, ...merged.campaign.completedLevelKeys]);
  merged.perLevelStats = normalizePerLevelStats([...keysToHydrate]);
  for (const [key, value] of Object.entries(perLevelStatsFromSave)) {
    const safeValue = value ?? {};
    if (!CAMPAIGN_WORLD_LAYOUT[Number(key.split('-')[0]) - 1]) {
      continue;
    }
    merged.perLevelStats[key] = {
      evalsCollected: Number.isFinite(safeValue.evalsCollected) ? Number(safeValue.evalsCollected) : 0,
      evalsCollectedIds: Array.isArray(safeValue.evalsCollectedIds) ? safeValue.evalsCollectedIds.filter((item) => typeof item === 'string') : [],
      collectiblesPicked: Array.isArray(safeValue.collectiblesPicked) ? safeValue.collectiblesPicked.filter((item) => typeof item === 'string') : [],
    };
  }

  const firstLevel = levelKey(1, 1);
  if (!merged.campaign.unlockedLevelKeys.includes(firstLevel)) {
    merged.campaign.unlockedLevelKeys.unshift(firstLevel);
  }

  return normalizeCurrentLevel(merged);
}

export function defaultSave(): SaveGameV3 {
  return {
    schemaVersion: 4,
    campaign: {
      world: 1,
      levelIndex: 1,
      totalLevels: TOTAL_CAMPAIGN_LEVELS,
      worldLayout: [...CAMPAIGN_WORLD_LAYOUT],
      unlockedLevelKeys: [levelKey(1, 1)],
      completedLevelKeys: []
    },
    perLevelStats: {
      '1-1': { evalsCollected: 0, evalsCollectedIds: [], collectiblesPicked: [] },
    },
    progression: {
      score: 0,
      coins: 0,
      stars: 0,
      deaths: 0,
      timeMs: 0
    },
    settings: { ...DEFAULT_SETTINGS }
  };
}

export function loadSave(): SaveGameV3 {
  try {
    const rawV4 = localStorage.getItem(SAVE_KEY_V4);
    if (rawV4) {
      return normalizeSave(JSON.parse(rawV4) as Partial<SaveGameV3>);
    }

    const rawV3 = localStorage.getItem(SAVE_KEY_V3);
    if (rawV3) {
      return normalizeSave(JSON.parse(rawV3) as Partial<SaveGameV3>);
    }

    const rawV2 = localStorage.getItem(SAVE_KEY_V2);
    if (rawV2) {
      const migrated = migrateSave(JSON.parse(rawV2) as Record<string, unknown>);
      persistSave(migrated);
      return migrated;
    }

    return defaultSave();
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveGameV3): void {
  localStorage.setItem(SAVE_KEY_V4, JSON.stringify(normalizeSave(save)));
}

export function migrateSave(legacy: Record<string, unknown>): SaveGameV3 {
  if (legacy && typeof legacy === 'object' && (legacy as { schemaVersion?: number }).schemaVersion === 4) {
    return normalizeSave(legacy as Partial<SaveGameV3>);
  }
  if (legacy && typeof legacy === 'object' && (legacy as { schemaVersion?: number }).schemaVersion === 3) {
    return normalizeSave(legacy as Partial<SaveGameV3>);
  }

  const defaults = defaultSave();
  const maybeCampaign = (legacy?.campaign ?? {}) as {
    world?: number;
    levelIndex?: number;
  };

  const world = Number.isFinite(maybeCampaign.world) ? Number(maybeCampaign.world) : 1;
  const levelIndex = Number.isFinite(maybeCampaign.levelIndex) ? Number(maybeCampaign.levelIndex) : 1;
  const clampedWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, world));
  const clampedLevel = Math.min(CAMPAIGN_WORLD_LAYOUT[clampedWorld - 1] ?? 1, Math.max(1, levelIndex));

  const migrated = normalizeSave({
    ...defaults,
    campaign: {
      ...defaults.campaign,
      world: clampedWorld,
      levelIndex: clampedLevel
    },
    progression: {
      ...defaults.progression,
      ...((legacy?.progression ?? {}) as Partial<SaveGameV3['progression']>)
    },
    settings: {
      ...defaults.settings,
      ...((legacy?.settings ?? {}) as Partial<SaveGameV3['settings']>)
    }
  });

  // Preserve practical progression for v2 saves by unlocking all levels up to the current one.
  const unlocked: string[] = [];
  let pointer = { world: 1, levelIndex: 1 };
  while (true) {
    unlocked.push(levelKey(pointer.world, pointer.levelIndex));
    if (pointer.world === clampedWorld && pointer.levelIndex === clampedLevel) {
      break;
    }
    const next = nextLevel(pointer.world, pointer.levelIndex);
    if (!next) {
      break;
    }
    pointer = next;
  }

  migrated.campaign.unlockedLevelKeys = normalizeLevelKeys(unlocked);
  return migrated;
}

export function ensureSaveDefaults(): void {
  const loaded = loadSave();
  persistSave(loaded);
}

export function isLevelUnlocked(save: SaveGameV3, world: number, levelIndex: number): boolean {
  return save.campaign.unlockedLevelKeys.includes(levelKey(world, levelIndex));
}

export function setCurrentLevel(save: SaveGameV3, world: number, levelIndex: number): SaveGameV3 {
  if (!isValidCampaignLevel(world, levelIndex) || !isLevelUnlocked(save, world, levelIndex)) {
    return save;
  }
  return {
    ...save,
    campaign: {
      ...save.campaign,
      world,
      levelIndex
    }
  };
}

export function completeCurrentLevel(save: SaveGameV3): { save: SaveGameV3; finishedCampaign: boolean } {
  const current = levelKey(save.campaign.world, save.campaign.levelIndex);
  const completed = new Set(save.campaign.completedLevelKeys);
  completed.add(current);

  const next = nextLevel(save.campaign.world, save.campaign.levelIndex);
  if (!next) {
    return {
      save: normalizeSave({
        ...save,
        campaign: {
          ...save.campaign,
          completedLevelKeys: [...completed]
        }
      }),
      finishedCampaign: true
    };
  }

  const unlocked = new Set(save.campaign.unlockedLevelKeys);
  unlocked.add(levelKey(next.world, next.levelIndex));

  return {
    save: normalizeSave({
      ...save,
      campaign: {
        ...save.campaign,
        world: next.world,
        levelIndex: next.levelIndex,
        unlockedLevelKeys: [...unlocked],
        completedLevelKeys: [...completed]
      }
    }),
    finishedCampaign: false
  };
}

export function advanceCampaign(save: SaveGameV3): SaveGameV3 {
  return completeCurrentLevel(save).save;
}
