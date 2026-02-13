vi.mock('phaser', () => ({
  default: {
    Cameras: {
      Scene2D: {
        Events: {
          FADE_OUT_COMPLETE: 'camerafadeoutcomplete',
        },
      },
    },
    Scene: class {},
  },
}));

import { describe, expect, test, vi } from 'vitest';
import { transitionToScene } from '../src/scenes/sceneFlow';

describe('scene flow transitions', () => {
  test('supports optional fadeIn when transitioning to a scene', () => {
    const FADE_OUT_COMPLETE = 'camerafadeoutcomplete';

    const targetCamera = {
      fadeIn: vi.fn(),
    };

    const targetScene = {
      cameras: { main: targetCamera },
    } as Record<string, unknown>;

    const getScene = vi.fn(() => targetScene);
    const sourceScene = {
      cameras: {
        main: {
          once: vi.fn(),
          fadeOut: vi.fn(),
        },
      },
      scene: {
        start: vi.fn(),
        manager: {
          getScene,
        },
      },
      time: {
        delayedCall: vi.fn((_: number, callback: () => void) => {
          callback();
        }),
      },
    } as Record<string, unknown>;

    let capturedFadeOutComplete: (() => void) | undefined;
    const sceneMain = sourceScene.cameras.main as unknown as {
      once: (event: string, cb: () => void) => void;
      fadeOut: (...args: unknown[]) => void;
    };
    sceneMain.once.mockImplementation((event: string, cb: () => void) => {
      if (event === FADE_OUT_COMPLETE) {
        capturedFadeOutComplete = cb;
      }
    });

    transitionToScene(sourceScene, 'Target', { value: 4 }, { durationMs: 120, fadeInMs: 80, color: 0x112233 });

    expect(sourceScene.scene.start).toHaveBeenCalledTimes(0);
    expect(sceneMain.fadeOut).toHaveBeenCalledWith(120, 0x11, 0x22, 0x33);
    expect(capturedFadeOutComplete).toBeTypeOf('function');
    capturedFadeOutComplete?.();

    expect(sourceScene.scene.start).toHaveBeenCalledWith('Target', { value: 4 });
    expect(getScene).toHaveBeenCalledWith('Target');
    expect(targetCamera.fadeIn).toHaveBeenCalledWith(80, 0x11, 0x22, 0x33);
  });

  test('supports immediate scene transition with delayed fade-in', () => {
    const targetCamera = {
      fadeIn: vi.fn(),
    };

    const targetScene = {
      cameras: { main: targetCamera },
    } as Record<string, unknown>;

    const getScene = vi.fn(() => targetScene);
    const sourceScene = {
      cameras: {
        main: undefined,
      },
      scene: {
        start: vi.fn(),
        manager: {
          getScene,
        },
      },
      time: {
        delayedCall: vi.fn((_: number, callback: () => void) => {
          callback();
        }),
      },
      } as Record<string, unknown>;

    transitionToScene(sourceScene, 'TargetImmediate', undefined, { durationMs: 0, fadeInMs: 64 });

    expect(sourceScene.scene.start).toHaveBeenCalledWith('TargetImmediate', undefined);
    expect(getScene).toHaveBeenCalledWith('TargetImmediate');
    expect(targetCamera.fadeIn).toHaveBeenCalledWith(64, 0, 0, 0);
  });
});
