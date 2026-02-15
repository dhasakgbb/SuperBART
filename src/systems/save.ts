import { CAMPAIGN_WORLD_LAYOUT, DEFAULT_SETTINGS, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import type { SaveGame, ScriptWorldState } from '../types/game';
import { isBonusRouteId, isValidCampaignLevel, levelKey, nextLevel } from './progression';

const SAVE_KEY_V5 = 'super_bart_save_v5';
const SAVE_KEY_V4 = 'super_bart_save_v4';
const SAVE_KEY_V3 = 'super_bart_save_v3';
const SAVE_KEY_V2 = 'super_bart_save_v2';

function createDefaultWorldStates(): Record<number, ScriptWorldState> {
  const worldStates: Record<number, ScriptWorldState> = {};
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    worldStates[world] = world === 1 ? 'next' : 'unclaimed';
  }
  return worldStates;
}

function normalizeWorldState(value: unknown): ScriptWorldState {
  if (value === 'reclaimed' || value === 'next' || value === 'unclaimed') {
    return value;
  }
  return 'unclaimed';
}

function normalizeWorldStates(states: unknown): Record<number, ScriptWorldState> {
  const defaults = createDefaultWorldStates();
  if (!states || typeof states !== 'object') {
    return defaults;
  }
  const result: Record<number, ScriptWorldState> = { ...defaults };
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    const key = String(world);
    const raw = (states as Record<string, unknown>)[key] ?? (states as Record<number, unknown>)[world];
    result[world] = normalizeWorldState(raw);
  }
  return result;
}

function normalizeLevelKeys(levelKeys: string[] | undefined): string[] {
  const unique = new Set<string>();
  for (const key of levelKeys ?? []) {
    const parts = key.split('-');
    if (parts.length !== 2) {
      continue;
    }
    const world = Number(parts[0]);
    const stage = Number(parts[1]);
    if (isValidCampaignLevel(world, stage)) {
      unique.add(levelKey(world, stage));
    }
  }
  return [...unique].sort((a, b) => {
    const [wa, la] = a.split('-').map(Number);
    const [wb, lb] = b.split('-').map(Number);
    if (wa !== wb) return wa - wb;
    return la - lb;
  });
}

function normalizeCampaign(rawCampaign: Partial<SaveGame['campaign']> | undefined): SaveGame['campaign'] {
  const rawWorld = Number(rawCampaign?.world ?? 1);
  const world = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Number.isFinite(rawWorld) ? rawWorld : 1));

  const rawStage = Number(rawCampaign?.stage ?? rawCampaign?.levelIndex ?? 1);
  const maxStage = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 1;
  const stage = Math.min(maxStage, Math.max(1, Number.isFinite(rawStage) ? rawStage : 1));

  const totalStages =
    Number.isFinite(rawCampaign?.totalStages) && Number(rawCampaign?.totalStages) > 0
      ? Number(rawCampaign?.totalStages)
      : TOTAL_CAMPAIGN_LEVELS;
  const totalLevels =
    Number.isFinite(rawCampaign?.totalLevels) && Number(rawCampaign?.totalLevels) > 0
      ? Number(rawCampaign?.totalLevels)
      : totalStages;

  const unlockedLevelKeys = normalizeLevelKeys(rawCampaign?.unlockedLevelKeys);
  const completedLevelKeys = normalizeLevelKeys(rawCampaign?.completedLevelKeys);

  const firstLevel = levelKey(1, 1);
  if (!unlockedLevelKeys.includes(firstLevel)) {
    unlockedLevelKeys.unshift(firstLevel);
  }

  return {
    world,
    stage,
    levelIndex: stage,
    activeBonusRouteId: isBonusRouteId(rawCampaign?.activeBonusRouteId) ? rawCampaign.activeBonusRouteId : null,
    totalStages,
    totalLevels,
    worldLayout: [...CAMPAIGN_WORLD_LAYOUT],
    unlockedLevelKeys,
    completedLevelKeys,
  };
}

function normalizePerLevelStats(levelKeys: string[], value: unknown): SaveGame['perLevelStats'] {
  const stats = Object.create(null) as Record<string, SaveGame['perLevelStats'][string]>;
  for (const key of levelKeys) {
    stats[key] = { evalsCollected: 0, evalsCollectedIds: [], collectiblesPicked: [] };
  }
  if (!value || typeof value !== 'object') {
    return stats;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!isValidCampaignLevel(Number(key.split('-')[0]), Number(key.split('-')[1]))) {
      continue;
    }
    const safe = (entry ?? {}) as Record<string, unknown>;
    stats[key] = {
      evalsCollected: Number.isFinite(safe.evalsCollected) ? Number(safe.evalsCollected) : 0,
      evalsCollectedIds: Array.isArray(safe.evalsCollectedIds)
        ? safe.evalsCollectedIds.filter((item): item is string => typeof item === 'string')
        : [],
      collectiblesPicked: Array.isArray(safe.collectiblesPicked)
        ? safe.collectiblesPicked.filter((item): item is string => typeof item === 'string')
        : [],
    };
  }
  return stats;
}

function normalizeChoiceFlags(value: unknown): SaveGame['choiceFlags'] {
  const raw = value as Partial<SaveGame['choiceFlags']> | undefined;
  const recordsDeleteChoice = raw?.recordsDeleteChoice === 'delete' || raw?.recordsDeleteChoice === 'preserve'
    ? raw.recordsDeleteChoice
    : null;
  const rebootChoice = raw?.rebootChoice === 'reboot' || raw?.rebootChoice === 'refuse'
    ? raw.rebootChoice
    : null;
  return { recordsDeleteChoice, rebootChoice };
}

function normalizeUnlocks(value: unknown): SaveGame['unlocks'] {
  const raw = value as Partial<SaveGame['unlocks']> | undefined;
  return {
    doubleJump: raw?.doubleJump === true,
    bartsRules: raw?.bartsRules === true,
    omegaLogs: raw?.omegaLogs === true,
  };
}

function normalizePersonnelFilesByWorld(value: unknown): Record<number, number> {
  const byWorld: Record<number, number> = {};
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    byWorld[world] = 0;
  }
  if (!value || typeof value !== 'object') {
    return byWorld;
  }
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    const key = String(world);
    const raw = (value as Record<string, unknown>)[key] ?? (value as Record<number, unknown>)[world];
    const safe = Number(raw);
    byWorld[world] = Number.isFinite(safe) ? Math.max(0, Math.floor(safe)) : 0;
  }
  return byWorld;
}

function deriveWorldStates(
  campaign: SaveGame['campaign'],
  existing: Record<number, ScriptWorldState>,
): Record<number, ScriptWorldState> {
  const nextStates: Record<number, ScriptWorldState> = { ...existing };
  const completed = new Set(campaign.completedLevelKeys);
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    const bossKey = levelKey(world, CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 4);
    if (completed.has(bossKey)) {
      nextStates[world] = 'reclaimed';
    } else if (world === campaign.world) {
      nextStates[world] = 'next';
    } else if (world < campaign.world) {
      nextStates[world] = 'reclaimed';
    } else {
      nextStates[world] = 'unclaimed';
    }
  }
  return nextStates;
}

function normalizeSave(raw: Partial<SaveGame>): SaveGame {
  const defaults = defaultSave();
  const campaign = normalizeCampaign(raw.campaign);

  const progression = {
    ...defaults.progression,
    ...(raw.progression ?? {}),
  };
  const rawSettings = (raw.settings ?? {}) as Partial<SaveGame['settings']> & {
    musicEnabled?: boolean;
    sfxEnabled?: boolean;
  };
  const settings = {
    ...defaults.settings,
    ...rawSettings,
    musicMuted: rawSettings.musicMuted ?? (rawSettings.musicEnabled === false ? true : defaults.settings.musicMuted),
    sfxMuted: rawSettings.sfxMuted ?? (rawSettings.sfxEnabled === false ? true : defaults.settings.sfxMuted),
  };
  const unlockedAndCompleted = new Set<string>([...campaign.unlockedLevelKeys, ...campaign.completedLevelKeys]);

  const personnelFilesCollected = Array.isArray(raw.personnelFilesCollected)
    ? raw.personnelFilesCollected.filter((item): item is string => typeof item === 'string')
    : [];
  const personnelFilesByWorld = normalizePersonnelFilesByWorld(raw.personnelFilesByWorld);
  const worldStates = deriveWorldStates(campaign, normalizeWorldStates(raw.worldStates));
  const unlocks = normalizeUnlocks(raw.unlocks);
  const choiceFlags = normalizeChoiceFlags(raw.choiceFlags);

  if (personnelFilesCollected.length >= 25) {
    unlocks.omegaLogs = true;
  }

  return {
    schemaVersion: 5,
    campaign: {
      ...campaign,
      totalStages: TOTAL_CAMPAIGN_LEVELS,
      totalLevels: TOTAL_CAMPAIGN_LEVELS,
      worldLayout: [...CAMPAIGN_WORLD_LAYOUT],
    },
    worldStates,
    choiceFlags,
    unlocks,
    personnelFilesCollected: Array.from(new Set(personnelFilesCollected)),
    personnelFilesByWorld,
    progression,
    settings,
    perLevelStats: normalizePerLevelStats([...unlockedAndCompleted], raw.perLevelStats),
    legacySnapshot: raw.legacySnapshot,
  };
}

export function defaultSave(): SaveGame {
  return {
    schemaVersion: 5,
    campaign: {
      world: 1,
      stage: 1,
      levelIndex: 1,
      activeBonusRouteId: null,
      totalStages: TOTAL_CAMPAIGN_LEVELS,
      totalLevels: TOTAL_CAMPAIGN_LEVELS,
      worldLayout: [...CAMPAIGN_WORLD_LAYOUT],
      unlockedLevelKeys: [levelKey(1, 1)],
      completedLevelKeys: [],
    },
    worldStates: createDefaultWorldStates(),
    choiceFlags: {
      recordsDeleteChoice: null,
      rebootChoice: null,
    },
    unlocks: {
      doubleJump: false,
      bartsRules: false,
      omegaLogs: false,
    },
    personnelFilesCollected: [],
    personnelFilesByWorld: normalizePersonnelFilesByWorld(undefined),
    perLevelStats: {
      '1-1': { evalsCollected: 0, evalsCollectedIds: [], collectiblesPicked: [] },
    },
    progression: {
      score: 0,
      coins: 0,
      stars: 0,
      deaths: 0,
      timeMs: 0,
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function migrateFromLegacySchema(legacy: Record<string, unknown>): SaveGame {
  const defaults = defaultSave();
  const maybeCampaign = (legacy.campaign ?? {}) as Record<string, unknown>;
  const legacyWorld = Number(maybeCampaign.world);
  const legacyStage = Number(maybeCampaign.levelIndex ?? maybeCampaign.stage);

  const clampedWorld = Number.isFinite(legacyWorld)
    ? Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, legacyWorld))
    : 1;
  const clampedStage = Number.isFinite(legacyStage)
    ? Math.min(CAMPAIGN_WORLD_LAYOUT[clampedWorld - 1] ?? 1, Math.max(1, legacyStage))
    : 1;

  const migrated = normalizeSave({
    ...defaults,
    progression: {
      ...defaults.progression,
      ...((legacy.progression ?? {}) as Partial<SaveGame['progression']>),
    },
    settings: {
      ...defaults.settings,
      ...((legacy.settings ?? {}) as Partial<SaveGame['settings']>),
    },
    perLevelStats: (legacy.perLevelStats ?? defaults.perLevelStats) as SaveGame['perLevelStats'],
    legacySnapshot: {
      schemaVersion: Number(legacy.schemaVersion ?? 0) || 0,
      campaign: {
        world: clampedWorld,
        levelIndex: clampedStage,
        worldLayout: Array.isArray(maybeCampaign.worldLayout) ? maybeCampaign.worldLayout as number[] : undefined,
        unlockedLevelKeys: Array.isArray(maybeCampaign.unlockedLevelKeys) ? maybeCampaign.unlockedLevelKeys as string[] : undefined,
        completedLevelKeys: Array.isArray(maybeCampaign.completedLevelKeys) ? maybeCampaign.completedLevelKeys as string[] : undefined,
      },
    },
  });

  // SCRIPT V3 reset policy: preserve global totals/settings, reset campaign path to 1-1.
  migrated.campaign.world = 1;
  migrated.campaign.stage = 1;
  migrated.campaign.levelIndex = 1;
  migrated.campaign.unlockedLevelKeys = [levelKey(1, 1)];
  migrated.campaign.completedLevelKeys = [];
  migrated.worldStates = createDefaultWorldStates();
  migrated.unlocks.doubleJump = false;
  migrated.choiceFlags.recordsDeleteChoice = null;
  migrated.choiceFlags.rebootChoice = null;

  return normalizeSave(migrated);
}

export function migrateSave(legacy: Record<string, unknown>): SaveGame {
  if (legacy && typeof legacy === 'object' && (legacy as { schemaVersion?: number }).schemaVersion === 5) {
    return normalizeSave(legacy as Partial<SaveGame>);
  }
  return migrateFromLegacySchema(legacy);
}

export function loadSave(): SaveGame {
  try {
    const rawV5 = localStorage.getItem(SAVE_KEY_V5);
    if (rawV5) {
      return normalizeSave(JSON.parse(rawV5) as Partial<SaveGame>);
    }

    const rawV4 = localStorage.getItem(SAVE_KEY_V4);
    if (rawV4) {
      const migrated = migrateSave(JSON.parse(rawV4) as Record<string, unknown>);
      persistSave(migrated);
      return migrated;
    }

    const rawV3 = localStorage.getItem(SAVE_KEY_V3);
    if (rawV3) {
      const migrated = migrateSave(JSON.parse(rawV3) as Record<string, unknown>);
      persistSave(migrated);
      return migrated;
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

export function persistSave(save: SaveGame): void {
  localStorage.setItem(SAVE_KEY_V5, JSON.stringify(normalizeSave(save)));
}

export function ensureSaveDefaults(): void {
  const loaded = loadSave();
  persistSave(loaded);
}

export function isLevelUnlocked(save: SaveGame, world: number, levelIndex: number): boolean {
  return save.campaign.unlockedLevelKeys.includes(levelKey(world, levelIndex));
}

export function isCampaignCompleted(save: SaveGame): boolean {
  const completedCount = new Set(save.campaign.completedLevelKeys).size;
  return completedCount >= TOTAL_CAMPAIGN_LEVELS;
}

export function setCurrentLevel(
  save: SaveGame,
  world: number,
  levelIndex: number,
  allowLocked = false,
  bonusRouteId: SaveGame['campaign']['activeBonusRouteId'] = null,
): SaveGame {
  if (!isValidCampaignLevel(world, levelIndex)) {
    return save;
  }
  if (!allowLocked && !isLevelUnlocked(save, world, levelIndex)) {
    return save;
  }
  const stage = Math.floor(levelIndex);
  const activeBonusRouteId = isBonusRouteId(bonusRouteId) ? bonusRouteId : null;
  return normalizeSave({
    ...save,
    campaign: {
      ...save.campaign,
      world,
      stage,
      levelIndex: stage,
      activeBonusRouteId,
    },
  });
}

export function setActiveBonusRouteId(save: SaveGame, bonusRouteId: SaveGame['campaign']['activeBonusRouteId']): SaveGame {
  return normalizeSave({
    ...save,
    campaign: {
      ...save.campaign,
      activeBonusRouteId: isBonusRouteId(bonusRouteId) ? bonusRouteId : null,
    },
  });
}

export function clearActiveBonusRouteId(save: SaveGame): SaveGame {
  return setActiveBonusRouteId(save, null);
}

export type LevelCompletionResult = {
  save: SaveGame;
  finishedCampaign: boolean;
  completedWorld: number;
  completedStage: number;
  revealWorld?: number;
  revealFromWorld?: number;
};

export function completeCurrentLevel(
  save: SaveGame,
): LevelCompletionResult {
  const completedWorld = save.campaign.world;
  const completedStage = save.campaign.stage;
  if (save.campaign.activeBonusRouteId) {
    return {
      save: clearActiveBonusRouteId(save),
      finishedCampaign: false,
      completedWorld,
      completedStage,
      revealWorld: undefined,
      revealFromWorld: undefined,
    };
  }
  const currentKey = levelKey(completedWorld, completedStage);
  const completed = new Set(save.campaign.completedLevelKeys);
  completed.add(currentKey);

  const next = nextLevel(completedWorld, completedStage);
  const unlocked = new Set(save.campaign.unlockedLevelKeys);
  if (next) {
    unlocked.add(levelKey(next.world, next.stage));
  }

  const nextSave = normalizeSave({
    ...save,
    campaign: {
      ...save.campaign,
      world: next?.world ?? completedWorld,
      stage: next?.stage ?? completedStage,
      levelIndex: next?.stage ?? completedStage,
      unlockedLevelKeys: [...unlocked],
      completedLevelKeys: [...completed],
    },
    unlocks: {
      ...save.unlocks,
      doubleJump: save.unlocks.doubleJump || (completedWorld === 3 && completedStage === 4),
    },
  });
  const revealWorld = next?.world && next.world !== completedWorld ? next.world : undefined;

  return {
    save: nextSave,
    finishedCampaign: !next,
    completedWorld,
    completedStage,
    revealWorld,
    revealFromWorld: revealWorld ? completedWorld : undefined,
  };
}

export function advanceCampaign(save: SaveGame): SaveGame {
  return completeCurrentLevel(save).save;
}

export function setRecordsDeleteChoice(save: SaveGame, choice: 'delete' | 'preserve'): SaveGame {
  return normalizeSave({
    ...save,
    choiceFlags: {
      ...save.choiceFlags,
      recordsDeleteChoice: choice,
    },
  });
}

export function setRebootChoice(save: SaveGame, choice: 'reboot' | 'refuse'): SaveGame {
  return normalizeSave({
    ...save,
    choiceFlags: {
      ...save.choiceFlags,
      rebootChoice: choice,
    },
  });
}

export function setBartsRulesUnlocked(save: SaveGame, unlocked = true): SaveGame {
  return normalizeSave({
    ...save,
    unlocks: {
      ...save.unlocks,
      bartsRules: unlocked,
    },
  });
}

export function collectPersonnelFile(save: SaveGame, world: number, fileId: string): SaveGame {
  const nextFiles = Array.from(new Set([...save.personnelFilesCollected, fileId]));
  const nextByWorld = { ...save.personnelFilesByWorld };
  const cappedWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world)));
  nextByWorld[cappedWorld] = Math.max(0, (nextByWorld[cappedWorld] ?? 0) + (save.personnelFilesCollected.includes(fileId) ? 0 : 1));
  return normalizeSave({
    ...save,
    personnelFilesCollected: nextFiles,
    personnelFilesByWorld: nextByWorld,
    unlocks: {
      ...save.unlocks,
      omegaLogs: save.unlocks.omegaLogs || nextFiles.length >= 25,
    },
  });
}
