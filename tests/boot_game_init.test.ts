import { describe, expect, test } from 'vitest';
import { ASSET_MANIFEST } from '../src/core/assetManifest';
import { createGameConfig } from '../src/core/gameConfig';

describe('boot and config sanity', () => {
  test('asset manifest has required keys', () => {
    expect(ASSET_MANIFEST.images.player_small).toContain('player_small.svg');
    expect(ASSET_MANIFEST.images.enemy_walker).toContain('enemy_walker.svg');
    expect(Object.keys(ASSET_MANIFEST.images).length).toBeGreaterThan(10);
  });

  test('game config includes scenes and physics', () => {
    class DummyScene {}
    const config = createGameConfig([DummyScene as never]);
    expect(config.width).toBe(960);
    expect(config.physics).toBeTruthy();
    expect(Array.isArray(config.scene)).toBe(true);
  });
});
