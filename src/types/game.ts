export type PlayerForm = 'small' | 'big' | 'gpu' | 'companion';

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

export interface CampaignState {
  world: number;
  levelIndex: number;
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
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  screenShakeEnabled: boolean;
}

export interface SaveGameV3 {
  schemaVersion: 4;
  campaign: CampaignState;
  progression: ProgressionState;
  settings: GameSettings;
  perLevelStats: Record<string, PerLevelStats>;
}
