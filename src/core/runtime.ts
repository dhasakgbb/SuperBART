import type { GameMode, PlayerForm, PlayerRuntimeState, SaveGameV3, SuperBartRuntimeState } from '../types/game';
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
  levelTheme: 'azure',
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
  playerForm: PlayerForm;
  combatState?: Partial<PlayerRuntimeState> & { form?: PlayerForm };
  lives: number;
  invulnMsRemaining: number;
  checkpointId: string;
}): SuperBartRuntimeState {
  const hpTier: 1 | 2 = extra.playerForm === 'small' ? 1 : 2;
  return {
    mode: runtimeStore.mode,
    campaign: runtimeStore.save.campaign,
    player: {
      form: extra.playerForm,
      combatState: {
        form: extra.combatState?.form ?? extra.playerForm,
        copilotActiveUntilMs: extra.combatState?.copilotActiveUntilMs,
        hasCompanionUntilMs: extra.combatState?.hasCompanionUntilMs
      },
      lives: extra.lives,
      hpTier,
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
