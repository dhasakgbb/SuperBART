import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { generateLevel } from '../src/levelgen/generator';

function levelHash(world: number, levelIndex: number, seed: number): string {
  const level = generateLevel({ world, levelIndex, seed });
  const digest = createHash('sha256');
  digest.update(JSON.stringify(level.tileGrid));
  digest.update(JSON.stringify(level.entities));
  digest.update(JSON.stringify(level.movingPlatforms));
  digest.update(JSON.stringify(level.metadata));
  return digest.digest('hex');
}

describe('generator determinism hash', () => {
  test('same world/level/seed produces identical layout hash', () => {
    const a = levelHash(3, 4, 70331);
    const b = levelHash(3, 4, 70331);
    expect(a).toBe(b);
  });

  test('different seed changes generated hash', () => {
    const a = levelHash(2, 6, 1001);
    const b = levelHash(2, 6, 1002);
    expect(a).not.toBe(b);
  });
});
