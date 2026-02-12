import Phaser from 'phaser';

export const GAME_MODES = Object.freeze({
  RUNNING: 'RUNNING',
  WIN: 'WIN',
  LOSE: 'LOSE'
});

export const INPUT_KEYS = Object.freeze({
  LEFT: ['LEFT', 'A'],
  RIGHT: ['RIGHT', 'D'],
  JUMP: ['SPACE', 'UP', 'W'],
  RESTART: 'R'
});

export const GAME_CONSTANTS = Object.freeze({
  width: 960,
  height: 540,
  fixedStepMs: 1000 / 60,
  score: {
    coin: 10,
    stomp: 100
  },
  livesStart: 3,
  player: {
    acceleration: 1800,
    drag: 2200,
    maxSpeed: 220,
    maxFallSpeed: 760,
    jumpVelocity: -430,
    jumpCutMultiplier: 0.45,
    stompBounceVelocity: -280,
    respawnDelayMs: 700,
    invulnerableMs: 800,
    fallThreshold: 160
  },
  enemy: {
    speed: 55
  }
});

export function createGameConfig(scenes) {
  return {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: GAME_CONSTANTS.width,
    height: GAME_CONSTANTS.height,
    pixelArt: true,
    backgroundColor: '#79b4ff',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1200 },
        debug: false
      }
    },
    scene: scenes,
    render: {
      antialias: false,
      roundPixels: true
    }
  };
}
