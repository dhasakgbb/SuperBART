import Phaser from 'phaser';
import { PLAYER_CONSTANTS, VIEW_HEIGHT, VIEW_WIDTH } from './constants';

export function createGameConfig(scenes: Array<typeof Phaser.Scene>): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'app',
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#1c2434',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: PLAYER_CONSTANTS.gravityY },
        debug: false
      }
    },
    render: {
      pixelArt: true,
      antialias: false
    },
    scene: scenes
  };
}
