import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { validateGeneratedLevel } from '../src/levelgen/generator';
import type { GeneratedLevel } from '../src/types/levelgen';

const fixturePath = path.resolve(
  process.cwd(),
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Resources',
  'Fixtures',
  'levels',
  'synthetic_moving_platform.json'
);

describe('unity synthetic fixture', () => {
  test('matches GeneratedLevel shape and invariants', () => {
    expect(fs.existsSync(fixturePath)).toBe(true);

    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as GeneratedLevel;

    expect(fixture.tileGrid).toHaveLength(fixture.height);
    expect(fixture.tileGrid[0]).toHaveLength(fixture.width);
    expect(fixture.entities.some((entity) => entity.type === 'spawn')).toBe(true);
    expect(fixture.entities.some((entity) => entity.type === 'goal')).toBe(true);
    expect(fixture.oneWayPlatforms.length).toBeGreaterThanOrEqual(1);
    expect(fixture.movingPlatforms.length).toBeGreaterThanOrEqual(1);

    const validation = validateGeneratedLevel(fixture);
    expect(validation.ok).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});
