import Phaser from 'phaser';
import { PLAYER_CONSTANTS, VIEW_HEIGHT, VIEW_WIDTH } from './constants';

function hasBrowserWebGLContext(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas');
  const context = (
    canvas.getContext('webgl2')
    || canvas.getContext('webgl')
    || canvas.getContext('experimental-webgl')
  );
  return Boolean(context);
}

function resolveRendererType(): Phaser.Types.Core.GameConfig['type'] {
  return hasBrowserWebGLContext() ? Phaser.WEBGL : Phaser.AUTO;
}

export function createGameConfig(scenes: Array<typeof Phaser.Scene>): Phaser.Types.Core.GameConfig {
  return {
    type: resolveRendererType(),
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
      antialias: false,
      roundPixels: true,
      batchSize: 8192,
      maxLights: 1,
    },
    scene: scenes
  };
}
