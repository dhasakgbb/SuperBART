import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CAMPAIGN_25_LEVELS } from '../src/levelgen/campaign_25_levels';
import { validateCampaignSpec } from '../src/levelgen/generator';

type CampaignFixture = {
  levels: Array<{
    world: number;
    level: number;
    title: string;
    sequence: Array<{ phase: string; chunks: string[] }>;
    hardRules: {
      maxNewMechanicsPerChunk: number;
      minRecoveryGap: number;
      maxHazardClusters: number;
    };
  }>;
};

function levelKey(world: number, level: number): string {
  return `${world}-${level}`;
}

describe('campaign specs', () => {
  test('docs and runtime 25-level spec stay synchronized', () => {
    const fixturePath = path.resolve(
      fileURLToPath(new URL('../docs/level_specs/campaign_25_levels.json', import.meta.url)),
    );
    const fixtureRaw = readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(fixtureRaw) as CampaignFixture;

    expect(fixture.levels.length).toBe(CAMPAIGN_25_LEVELS.levels.length);

    const fixtureByKey = new Map(fixture.levels.map((level) => [levelKey(level.world, level.level), level]));
    const runtimeByKey = new Map(
      CAMPAIGN_25_LEVELS.levels.map((level) => [levelKey(level.world, level.level), level]),
    );

    expect([...fixtureByKey.keys()].sort()).toEqual([...runtimeByKey.keys()].sort());

    for (const [key, runtimeLevel] of runtimeByKey.entries()) {
      const fixtureLevel = fixtureByKey.get(key);
      expect(fixtureLevel, `Missing fixture level ${key}`).toBeDefined();
      expect(fixtureLevel!.title).toBe(runtimeLevel.title);
      expect(fixtureLevel!.hardRules).toEqual(runtimeLevel.hardRules);
      expect(fixtureLevel!.sequence).toEqual(runtimeLevel.sequence);
    }
  });

  test('runtime campaign level specs satisfy campaign validator', () => {
    for (const level of CAMPAIGN_25_LEVELS.levels) {
      const errors = validateCampaignSpec(level);
      expect(errors).toEqual([]);
    }
  });
});
