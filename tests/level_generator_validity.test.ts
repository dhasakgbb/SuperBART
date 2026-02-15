import { describe, expect, test } from 'vitest';
import { CAMPAIGN_WORLD_LAYOUT } from '../src/core/constants';
import { SCRIPT_CAMPAIGN_LEVELS } from '../src/levelgen/scriptCampaignLevels';
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

  test('final-world boss includes benchmark auto-scroll metadata', () => {
    for (let seed = 1000; seed < 1010; seed += 1) {
      const level = generateLevel({ world: 7, levelIndex: 4, seed });
      expect(level.metadata.benchmarkAutoScroll).toBeDefined();
      expect(level.metadata.benchmarkAutoScroll?.length ?? 0).toBeGreaterThan(0);
      expect(level.metadata.chunksUsed).toContain('benchmark_sprint_01');
    }

    for (let world = 1; world <= 5; world += 1) {
      for (let i = 1; i <= (CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0); i += 1) {
        for (let seed = 1000; seed < 1002; seed += 1) {
          const level = generateLevel({ world, levelIndex: i, seed });
          if (level.metadata.chunksUsed.includes('benchmark_sprint_01')) {
            expect(level.metadata.benchmarkAutoScroll).toBeDefined();
          } else {
            expect(level.metadata.benchmarkAutoScroll).toBeUndefined();
          }
        }
      }
    }
  });

  test('campaign spec artifacts pass generator campaign validator', () => {
    for (const levelSpec of SCRIPT_CAMPAIGN_LEVELS.levels) {
      const errors = validateCampaignSpec(levelSpec);
      expect(errors, `Campaign level ${levelSpec.world}-${levelSpec.level} failed contract`).toEqual([]);
      const generated = generateLevel({ world: levelSpec.world, levelIndex: levelSpec.level, seed: 1000 });
      const valid = validateGeneratedLevel(generated);
      expect(valid.ok, `Generated level ${levelSpec.world}-${levelSpec.level} invalid`).toBe(true);
      expect(valid.errors).toEqual([]);
    }
  });
});
