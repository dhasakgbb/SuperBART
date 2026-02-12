export type PlayerForm = 'small' | 'big';

export type GameMode =
  | 'title'
  | 'world_map'
  | 'playing'
  | 'level_complete'
  | 'game_over'
  | 'settings';

export interface CampaignState {
  world: number;
  levelIndex: number;
  totalLevels: number;
  bonusUnlocked: boolean[];
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
  lives: number;
  hpTier: 1 | 2;
  invulnMsRemaining: number;
  checkpointId: string;
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
  musicEnabled: boolean;
  sfxEnabled: boolean;
  screenShakeEnabled: boolean;
}

export interface SaveGameV2 {
  schemaVersion: 2;
  campaign: CampaignState;
  progression: ProgressionState;
  settings: GameSettings;
  unlockedBonusLevels: number[];
}
