import { describe, expect, test } from 'vitest';
import { generateLevel, validateGeneratedLevel } from '../src/levelgen/generator';

describe('level generator validity', () => {
  test('generates valid levels across worlds and seeds', () => {
    for (let world = 1; world <= 5; world += 1) {
      for (let i = 1; i <= 5; i += 1) {
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
