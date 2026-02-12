import { describe, expect, test } from 'vitest';
import { completeCurrentLevel, defaultSave, migrateSave, setCurrentLevel } from '../src/systems/save';
import { TOTAL_CAMPAIGN_LEVELS } from '../src/core/constants';

describe('save progression and migration', () => {
  test('legacy migration yields schema v3', () => {
    const migrated = migrateSave({ schemaVersion: 2, campaign: { world: 2, levelIndex: 3 } });
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.campaign.worldLayout).toEqual([6, 6, 6, 6, 1]);
    expect(migrated.campaign.totalLevels).toBe(TOTAL_CAMPAIGN_LEVELS);
    expect(migrated.campaign.unlockedLevelKeys).toContain('1-1');
  });

  test('completing a level unlocks the next level', () => {
    const save = defaultSave();
    const result = completeCurrentLevel(save);
    expect(result.finishedCampaign).toBe(false);
    expect(result.save.campaign.world).toBe(1);
    expect(result.save.campaign.levelIndex).toBe(2);
    expect(result.save.campaign.unlockedLevelKeys).toContain('1-2');
    expect(result.save.campaign.completedLevelKeys).toContain('1-1');
  });

  test('final castle completion flags campaign completion', () => {
    let save = defaultSave();
    // Simulate a fully unlocked run and jump to final castle.
    for (let world = 1; world <= 4; world += 1) {
      for (let level = 1; level <= 6; level += 1) {
        save.campaign.unlockedLevelKeys.push(`${world}-${level}`);
      }
    }
    save.campaign.unlockedLevelKeys.push('5-1');
    save = setCurrentLevel(save, 5, 1);
    const result = completeCurrentLevel(save);
    expect(result.finishedCampaign).toBe(true);
    expect(result.save.campaign.completedLevelKeys).toContain('5-1');
  });
});
