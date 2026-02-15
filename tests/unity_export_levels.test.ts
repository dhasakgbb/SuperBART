import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import type { GeneratedLevel } from '../src/types/levelgen';
import { exportLevelsForUnity } from '../scripts/export_levels_for_unity';

function withTempDir<T>(run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'superbart-unity-export-'));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('unity level exporter', () => {
  test('exports deterministic w1_l2 with valid level structure', () => {
    withTempDir((outDir) => {
      const result = exportLevelsForUnity({
        outDir,
        world: 1,
        levels: [2],
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.seed).toBe(120707);

      const filePath = path.join(outDir, 'w1_l2.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as GeneratedLevel;
      expect(parsed.metadata.seed).toBe(120707);
      expect(parsed.tileGrid).toHaveLength(parsed.height);
      expect(parsed.tileGrid[0]).toHaveLength(parsed.width);
      expect(parsed.entities.some((entity) => entity.type === 'spawn')).toBe(true);
      expect(parsed.entities.some((entity) => entity.type === 'goal')).toBe(true);
      expect(parsed.oneWayPlatforms.length).toBeGreaterThan(0);
    });
  });

  test('exports all campaign levels with --all flag', () => {
    withTempDir((outDir) => {
      const result = exportLevelsForUnity({
        outDir,
        all: true,
      });

      // 7 worlds x 4 levels = 28 total campaign levels
      expect(result).toHaveLength(28);

      // Verify each world has 4 levels
      for (let w = 1; w <= 7; w++) {
        const worldLevels = result.filter((r) => r.world === w);
        expect(worldLevels).toHaveLength(4);
      }

      // Verify all files exist and have valid structure
      for (const item of result) {
        expect(fs.existsSync(item.filePath)).toBe(true);
        const parsed = JSON.parse(fs.readFileSync(item.filePath, 'utf8')) as GeneratedLevel;
        expect(parsed.tileGrid).toBeDefined();
        expect(parsed.entities.some((e) => e.type === 'spawn')).toBe(true);
      }

      // Verify all seeds are unique
      const seeds = result.map((r) => r.seed);
      expect(new Set(seeds).size).toBe(28);
    });
  });
});
