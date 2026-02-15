import Phaser from "phaser";
import { PLAYER_CONSTANTS, VIEW_HEIGHT, VIEW_WIDTH } from "./constants";

export function resolveRendererType(): number {
  if (typeof window === 'undefined') {
    return Phaser.WEBGL;
  }

  const forcedCanvas = (window as Window & { __SUPER_BART__?: { forceCanvas?: boolean } }).__SUPER_BART__?.forceCanvas;
  if (forcedCanvas) {
    return Phaser.CANVAS;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    return gl ? Phaser.WEBGL : Phaser.CANVAS;
  } catch {
    return Phaser.CANVAS;
  }
}

export function createGameConfig(
  scenes: Array<typeof Phaser.Scene>,
): Phaser.Types.Core.GameConfig {
  return {
    type: resolveRendererType(),
    parent: "app",
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: "#1c2434",
    transparent: false,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: PLAYER_CONSTANTS.gravityY },
        debug: false,
      },
    },
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      batchSize: 8192,
      maxLights: 10,
    },
    scene: scenes,
  };
}
