export type PlayerForm = 'small' | 'big' | 'gpu' | 'companion';

export type BonusRouteId = 'micro-level-1' | 'micro-level-2' | 'micro-level-3';

export interface PlayerCombatState {
  form: PlayerForm;
  copilotActiveUntilMs?: number;
  hasCompanionUntilMs?: number;
}

export type GameMode =
  | 'title'
  | 'level_select'
  | 'world_map'
  | 'playing'
  | 'paused'
  | 'level_complete'
  | 'game_over'
  | 'victory'
  | 'settings';

export type ScriptWorldState = 'unclaimed' | 'reclaimed' | 'next';
export type RecordsDeleteChoice = 'delete' | 'preserve' | null;
export type RebootChoice = 'reboot' | 'refuse' | null;

export interface CampaignState {
  world: number;
  stage: number;
  // Legacy compatibility alias. Always mirrors stage.
  levelIndex: number;
  activeBonusRouteId: BonusRouteId | null;
  totalStages: number;
  // Legacy compatibility alias. Always mirrors totalStages.
  totalLevels: number;
  worldLayout: number[];
  unlockedLevelKeys: string[];
  completedLevelKeys: string[];
}

export interface ProgressionState {
  score: number;
  coins: number;
  stars: number;
  deaths: number;
  timeMs: number;
}

export interface PlayerRuntimeState {
  form: PlayerForm;
  combatState: PlayerCombatState;
  lives: number;
  hpTier: 1 | 2;
  invulnMsRemaining: number;
  checkpointId: string;
}

export interface PerLevelStats {
  evalsCollected: number;
  evalsCollectedIds: string[];
  collectiblesPicked: string[];
}

export interface RuntimeEntityCounts {
  walkers: number;
  shells: number;
  fliers: number;
  spitters: number;
  projectiles: number;
  spikes: number;
  thwomps: number;
  movingPlatforms: number;
}

export interface ScriptRuntimeState {
  worldStates: Record<number, ScriptWorldState>;
  choiceFlags: {
    recordsDeleteChoice: RecordsDeleteChoice;
    rebootChoice: RebootChoice;
  };
  unlocks: {
    doubleJump: boolean;
    bartsRules: boolean;
    omegaLogs: boolean;
  };
  personnelFilesCollected: number;
}

export interface SuperBartRuntimeState {
  mode: GameMode;
  campaign: CampaignState;
  player: PlayerRuntimeState;
  progression: ProgressionState;
  level: {
    seed: number;
    theme: string;
    difficultyTier: number;
    chunksUsed: string[];
  };
  entities: RuntimeEntityCounts;
  script: ScriptRuntimeState;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  screenShakeEnabled: boolean;
}

export interface LegacyCampaignSnapshot {
  world?: number;
  levelIndex?: number;
  worldLayout?: number[];
  unlockedLevelKeys?: string[];
  completedLevelKeys?: string[];
}

export interface SaveGameV5 {
  schemaVersion: 5;
  campaign: CampaignState;
  worldStates: Record<number, ScriptWorldState>;
  choiceFlags: {
    recordsDeleteChoice: RecordsDeleteChoice;
    rebootChoice: RebootChoice;
  };
  unlocks: {
    doubleJump: boolean;
    bartsRules: boolean;
    omegaLogs: boolean;
  };
  personnelFilesCollected: string[];
  personnelFilesByWorld: Record<number, number>;
  progression: ProgressionState;
  settings: GameSettings;
  perLevelStats: Record<string, PerLevelStats>;
  legacySnapshot?: {
    schemaVersion: number;
    campaign?: LegacyCampaignSnapshot;
  };
}

export type SaveGame = SaveGameV5;
