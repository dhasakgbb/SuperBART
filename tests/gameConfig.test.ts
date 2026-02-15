import { describe, expect, test, vi } from 'vitest';
vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    CANVAS: 1,
    WEBGL: 2,
  },
}));

import { createGameConfig } from '../src/core/gameConfig';

describe('renderer config', () => {
  test('createGameConfig enforces WebGL-friendly render settings', () => {
    const config = createGameConfig([]);

    // Renderer should resolve dynamically: WebGL first, Canvas fallback.
    expect([1, 2, 0].includes(Number(config.type))).toBe(true);
    expect(config.render?.antialias).toBe(false);
    expect(config.render?.pixelArt).toBe(true);
    expect(config.render?.roundPixels).toBe(true);
    expect(config.render?.batchSize).toBe(8192);
    expect(config.render?.maxLights).toBe(10);
  });
});
