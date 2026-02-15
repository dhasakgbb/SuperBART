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

  test('blocks bonus export in M1 with explicit error', () => {
    expect(() =>
      exportLevelsForUnity({
        outDir: path.resolve(process.cwd(), 'artifacts', 'unity', 'levels'),
        world: 1,
        levels: [2],
        bonus: true,
      })
    ).toThrow(/temporarily unsupported/i);
  });
});
