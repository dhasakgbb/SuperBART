import { GAME_CONSTANTS, GAME_MODES } from './config.js';

export function createInitialState(totalCoins = 0) {
  return {
    mode: GAME_MODES.RUNNING,
    score: 0,
    lives: GAME_CONSTANTS.livesStart,
    totalCoins,
    collectedCoins: 0,
    enemiesDefeated: 0,
    respawnCount: 0,
    lastEvent: 'spawn'
  };
}

export function registerCoinCollect(state) {
  if (state.mode !== GAME_MODES.RUNNING) {
    return state;
  }
  return {
    ...state,
    score: state.score + GAME_CONSTANTS.score.coin,
    collectedCoins: state.collectedCoins + 1,
    lastEvent: 'coin_collect'
  };
}

export function registerEnemyStomp(state) {
  if (state.mode !== GAME_MODES.RUNNING) {
    return state;
  }
  return {
    ...state,
    score: state.score + GAME_CONSTANTS.score.stomp,
    enemiesDefeated: state.enemiesDefeated + 1,
    lastEvent: 'enemy_stomp'
  };
}

export function registerPlayerDeath(state, reason) {
  if (state.mode !== GAME_MODES.RUNNING) {
    return state;
  }

  const remainingLives = state.lives - 1;
  if (remainingLives <= 0) {
    return {
      ...state,
      lives: 0,
      mode: GAME_MODES.LOSE,
      lastEvent: `death_${reason}_game_over`
    };
  }

  return {
    ...state,
    lives: remainingLives,
    respawnCount: state.respawnCount + 1,
    lastEvent: `death_${reason}`
  };
}

export function registerGoalReach(state) {
  if (state.mode !== GAME_MODES.RUNNING) {
    return state;
  }

  return {
    ...state,
    mode: GAME_MODES.WIN,
    lastEvent: 'goal_reached'
  };
}
