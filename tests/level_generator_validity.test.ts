import { describe, expect, test } from 'vitest';
import { CAMPAIGN_WORLD_LAYOUT } from '../src/core/constants';
import { generateLevel, validateGeneratedLevel } from '../src/levelgen/generator';

describe('level generator validity', () => {
  test('generates valid levels across worlds and seeds', () => {
    for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
      const levelsInWorld = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
      for (let i = 1; i <= levelsInWorld; i += 1) {
        for (let seed = 1000; seed < 1010; seed += 1) {
          const level = generateLevel({ world, levelIndex: i, seed });
          const valid = validateGeneratedLevel(level);
          expect(valid.ok).toBe(true);
          expect(level.entities.some((e) => e.type === 'spawn')).toBe(true);
          expect(level.entities.some((e) => e.type === 'goal')).toBe(true);
        }
      }
    }
  });
});
