vi.mock('phaser', () => {
  class MockScene {}
  class MockTween {}
  return {
    default: {
      AUTO: 0,
      CANVAS: 1,
      WEBGL: 2,
      Scene: MockScene,
      Display: {
        Color: {
          HexStringToColor: (hex: string) => ({ color: parseInt(hex.replace('#', ''), 16) }),
        },
      },
      Math: {
        Clamp: (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value)),
      },
      Tweens: {
        Tween: MockTween,
      },
      Scenes: {
        Events: {
          SHUTDOWN: 'shutdown',
          POST_UPDATE: 'postupdate',
        },
      },
      BlendModes: {
        ADD: 0,
      },
    },
  };
});

import { describe, expect, test, vi } from 'vitest';
import { PlayScene } from '../src/scenes/PlayScene';

type CollectibleGlowHandle =
  | { kind: 'postfx'; fx: { destroy: () => void } }
  | { kind: 'fallback'; image: { destroy: () => void } };

type PlaySceneGlowHarness = {
  canUsePostFx: boolean;
  collectibleGlows: Map<number, CollectibleGlowHandle>;
  glowIdCounter: number;
  canUsePostFxRender: () => boolean;
  attachCollectibleGlow: (sprite: MockGlowSprite, textureKey: string) => void;
  detachCollectibleGlow: (sprite: MockGlowSprite) => void;
  game: {
    renderer: {
      type: number;
    };
  };
  tweens: {
    add: ReturnType<typeof vi.fn>;
  };
  add: {
    image: ReturnType<typeof vi.fn>;
  };
};

type MockGlowSprite = {
  x: number;
  postFX: {
    addGlow: ReturnType<typeof vi.fn>;
  };
  depth: number;
  setY: (value: number) => MockGlowSprite;
  setData: (key: string, value: unknown) => MockGlowSprite;
  getData: (key: string) => unknown;
  setBlendMode?: () => MockGlowSprite;
  setDepth?: () => MockGlowSprite;
  setAlpha?: () => MockGlowSprite;
  setTint?: () => MockGlowSprite;
  setScale?: () => MockGlowSprite;
  destroy?: () => void;
};

function createSceneHarness(): PlaySceneGlowHarness {
  const tween = {
    stop: vi.fn(),
    remove: vi.fn(),
  };
  const fallbackImage = {
    destroy: vi.fn(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    setBlendMode: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
  };
  const fallbackImageFactory = vi.fn().mockReturnValue(fallbackImage);

  return {
    canUsePostFx: false,
    collectibleGlows: new Map(),
    glowIdCounter: 1,
    canUsePostFxRender: () => false,
    attachCollectibleGlow: () => undefined,
    detachCollectibleGlow: () => undefined,
    game: { renderer: { type: 2 } },
    tweens: {
      add: vi.fn(() => tween),
    },
    add: {
      image: fallbackImageFactory,
    },
  } as unknown as PlaySceneGlowHarness & PlayScene;
}

function bindHarness(): PlaySceneGlowHarness {
  const scene = Object.create(PlayScene.prototype) as PlaySceneGlowHarness & PlayScene;
  const harness = createSceneHarness();
  scene.collectibleGlows = harness.collectibleGlows;
  scene.glowIdCounter = harness.glowIdCounter;
  scene.tweens = harness.tweens;
  scene.add = harness.add;
  scene.canUsePostFx = harness.canUsePostFx;
  scene.game = harness.game;
  return scene as unknown as PlaySceneGlowHarness;
}

function createCollectibleSprite(): { sprite: MockGlowSprite; postFxSpy: ReturnType<typeof vi.fn> } {
  const data = new Map<string, unknown>();
  let y = 44;
  const postFxSpy = vi.fn();
  const sprite = {
    x: 120,
    get y() {
      return y;
    },
    set y(value: number) {
      y = value;
    },
    depth: 28,
    postFX: {
      addGlow: postFxSpy,
    },
    setY(value: number): MockGlowSprite {
      y = value;
      return sprite as unknown as MockGlowSprite;
    },
    setData(key: string, value: unknown): MockGlowSprite {
      data.set(key, value);
      return sprite as unknown as MockGlowSprite;
    },
    getData(key: string): unknown {
      return data.get(key);
    },
  } as MockGlowSprite;
  return {
    sprite,
    postFxSpy,
  };
}

describe('PlayScene collectible FX selection', () => {
  test('uses post-FX glow when renderer supports it', () => {
    const scene = bindHarness() as unknown as PlaySceneGlowHarness;
    scene.canUsePostFx = true;
    scene.canUsePostFxRender = () => true;
    const { sprite, postFxSpy } = createCollectibleSprite();
    const glowController = { destroy: vi.fn() };
    postFxSpy.mockReturnValue(glowController);

    scene.attachCollectibleGlow(sprite, 'pickup_token');

    const glow = scene.collectibleGlows.get(1);
    expect(postFxSpy).toHaveBeenCalledTimes(1);
    expect(glow).toBeDefined();
    expect(glow?.kind).toBe('postfx');
    expect(glow && glow.kind === 'postfx' ? glow.fx : undefined).toBe(glowController);

    scene.detachCollectibleGlow(sprite);
    expect(glowController.destroy).toHaveBeenCalledTimes(1);
    expect(scene.collectibleGlows.size).toBe(0);
  });

  test('falls back to additive sprite glow without post-FX', () => {
    const scene = bindHarness() as unknown as PlaySceneGlowHarness;
    scene.canUsePostFx = false;
    scene.canUsePostFxRender = () => false;
    const { sprite } = createCollectibleSprite();
    const imageFactory = scene.add.image as ReturnType<typeof vi.fn>;

    scene.attachCollectibleGlow(sprite, 'pickup_eval');
    const image = imageFactory.mock.results[0]?.value as { destroy: ReturnType<typeof vi.fn> } | undefined;
    expect(image).toBeDefined();

    expect(scene.add.image).toHaveBeenCalledTimes(1);
    expect(image!.destroy).toHaveBeenCalledTimes(0);
    expect(scene.collectibleGlows.get(1)?.kind).toBe('fallback');

    scene.detachCollectibleGlow(sprite);
    expect(image!.destroy).toHaveBeenCalledTimes(1);
    expect(scene.collectibleGlows.size).toBe(0);
  });

  test('falls back and disables post-FX when addGlow throws', () => {
    const scene = bindHarness() as unknown as PlaySceneGlowHarness;
    scene.canUsePostFx = true;
    scene.canUsePostFxRender = () => true;
    const { sprite, postFxSpy } = createCollectibleSprite();
    postFxSpy.mockImplementation(() => {
      throw new Error('post-fx unavailable');
    });

    scene.attachCollectibleGlow(sprite, 'pickup_token');

    const handle = scene.collectibleGlows.get(1);
    expect(handle?.kind).toBe('fallback');
    expect(scene.canUsePostFx).toBe(false);
  });
});

describe('PlayScene renderer support helper', () => {
  test('guards post-FX with renderer type', () => {
    const scene = bindHarness() as unknown as PlaySceneGlowHarness;
    scene.canUsePostFx = true;
    scene.game = { renderer: { type: 2 } };
    expect(scene.canUsePostFxRender()).toBe(true);

    scene.game = { renderer: { type: 1 } };
    expect(scene.canUsePostFxRender()).toBe(false);
  });
});
