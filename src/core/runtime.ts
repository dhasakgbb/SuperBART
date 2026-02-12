import type { GameMode, SaveGameV3, SuperBartRuntimeState } from '../types/game';
import { defaultSave } from '../systems/save';

export interface RuntimeStore {
  mode: GameMode;
  save: SaveGameV3;
  levelSeed: number;
  levelTheme: string;
  difficultyTier: number;
  chunksUsed: string[];
  entityCounts: SuperBartRuntimeState['entities'];
}

export const runtimeStore: RuntimeStore = {
  mode: 'title',
  save: defaultSave(),
  levelSeed: 0,
  levelTheme: 'grass',
  difficultyTier: 1,
  chunksUsed: [],
  entityCounts: {
    walkers: 0,
    shells: 0,
    fliers: 0,
    spitters: 0,
    projectiles: 0,
    spikes: 0,
    thwomps: 0,
    movingPlatforms: 0
  }
};

export function buildRuntimeState(extra: {
  playerForm: 'small' | 'big';
  lives: number;
  invulnMsRemaining: number;
  checkpointId: string;
}): SuperBartRuntimeState {
  return {
    mode: runtimeStore.mode,
    campaign: runtimeStore.save.campaign,
    player: {
      form: extra.playerForm,
      lives: extra.lives,
      hpTier: extra.playerForm === 'big' ? 2 : 1,
      invulnMsRemaining: extra.invulnMsRemaining,
      checkpointId: extra.checkpointId
    },
    progression: runtimeStore.save.progression,
    level: {
      seed: runtimeStore.levelSeed,
      theme: runtimeStore.levelTheme,
      difficultyTier: runtimeStore.difficultyTier,
      chunksUsed: runtimeStore.chunksUsed
    },
    entities: runtimeStore.entityCounts
  };
}
