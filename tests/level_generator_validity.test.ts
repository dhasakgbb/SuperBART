import { describe, expect, test } from 'vitest';
import { CAMPAIGN_WORLD_LAYOUT } from '../src/core/constants';
import { CAMPAIGN_25_LEVELS } from '../src/levelgen/campaign_25_levels';
import { generateLevel, validateCampaignSpec, validateGeneratedLevel } from '../src/levelgen/generator';

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

  test('level5 includes benchmark auto-scroll and only world5 owns it', () => {
    for (let seed = 1000; seed < 1010; seed += 1) {
      const level = generateLevel({ world: 5, levelIndex: 1, seed });
      expect(level.metadata.benchmarkAutoScroll).toBeDefined();
      expect(level.metadata.benchmarkAutoScroll?.length ?? 0).toBeGreaterThan(0);
      expect(level.metadata.chunksUsed).toContain('benchmark_sprint_01');
    }

    for (let world = 1; world <= 4; world += 1) {
      for (let i = 1; i <= (CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0); i += 1) {
        for (let seed = 1000; seed < 1002; seed += 1) {
          const level = generateLevel({ world, levelIndex: i, seed });
          expect(level.metadata.benchmarkAutoScroll).toBeUndefined();
          expect(level.metadata.chunksUsed.includes('benchmark_sprint_01')).toBe(false);
        }
      }
    }
  });

  test('campaign spec artifacts pass generator campaign validator', () => {
    for (const levelSpec of CAMPAIGN_25_LEVELS.levels) {
      const errors = validateCampaignSpec(levelSpec);
      expect(errors, `Campaign level ${levelSpec.world}-${levelSpec.level} failed contract`).toEqual([]);
      const generated = generateLevel({ world: levelSpec.world, levelIndex: levelSpec.level, seed: 1000 });
      const valid = validateGeneratedLevel(generated);
      expect(valid.ok, `Generated level ${levelSpec.world}-${levelSpec.level} invalid`).toBe(true);
      expect(valid.errors).toEqual([]);
    }
  });
});
