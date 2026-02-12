import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../src/game/assetManifest.js';
import { validateLevelContract } from '../src/level/levelParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function resolveAsset(relativePath) {
  return path.join(repoRoot, 'public', relativePath);
}

describe('boot and level load smoke checks', () => {
  it('boot manifest references local files that exist', () => {
    for (const p of Object.values(ASSET_MANIFEST.images)) {
      expect(existsSync(resolveAsset(p))).toBe(true);
    }
    for (const p of Object.values(ASSET_MANIFEST.tilemaps)) {
      expect(existsSync(resolveAsset(p))).toBe(true);
    }
  });

  it('level1 tilemap satisfies required contract', () => {
    const levelPath = resolveAsset(ASSET_MANIFEST.tilemaps.level1);
    const level = JSON.parse(readFileSync(levelPath, 'utf-8'));
    const errors = validateLevelContract(level);

    expect(errors).toEqual([]);
    expect(level.layers.some((layer) => layer.name === 'ground')).toBe(true);
    expect(level.layers.some((layer) => layer.name === 'entities')).toBe(true);
  });
});
