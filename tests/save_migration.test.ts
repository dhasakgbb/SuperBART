import { describe, expect, test } from 'vitest';
import { advanceCampaign, defaultSave, migrateSave } from '../src/systems/save';

describe('save progression and migration', () => {
  test('legacy migration yields schema v2', () => {
    const migrated = migrateSave({ schemaVersion: 1 } as never);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.campaign.world).toBe(1);
  });

  test('campaign advances through levels', () => {
    const s = defaultSave();
    const next = advanceCampaign(s);
    expect(next.campaign.world).toBe(1);
    expect(next.campaign.levelIndex).toBe(2);
  });
});
