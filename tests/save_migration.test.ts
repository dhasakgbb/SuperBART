import { describe, expect, test } from 'vitest';
import { completeCurrentLevel, defaultSave, migrateSave, setCurrentLevel } from '../src/systems/save';
import { TOTAL_CAMPAIGN_LEVELS } from '../src/core/constants';
import { resolveBonusRouteByLevel } from '../src/systems/progression';

describe('save progression and migration', () => {
  test('legacy migration yields schema v5 reset policy', () => {
    const migrated = migrateSave({ schemaVersion: 2, campaign: { world: 2, levelIndex: 3 } });
    expect(migrated.schemaVersion).toBe(5);
    expect(migrated.campaign.worldLayout).toEqual([4, 4, 4, 4, 4, 4, 4]);
    expect(migrated.campaign.totalStages).toBe(TOTAL_CAMPAIGN_LEVELS);
    expect(migrated.campaign.unlockedLevelKeys).toContain('1-1');
    expect(migrated.campaign.world).toBe(1);
    expect(migrated.campaign.stage).toBe(1);
    expect(migrated.legacySnapshot?.schemaVersion).toBe(2);
  });

  test('completing a level unlocks the next level', () => {
    const save = defaultSave();
    const result = completeCurrentLevel(save);
    expect(result.finishedCampaign).toBe(false);
    expect(result.save.campaign.world).toBe(1);
    expect(result.save.campaign.stage).toBe(2);
    expect(result.save.campaign.levelIndex).toBe(2);
    expect(result.save.campaign.unlockedLevelKeys).toContain('1-2');
    expect(result.save.campaign.completedLevelKeys).toContain('1-1');
  });

  test('final world boss completion flags campaign completion', () => {
    let save = defaultSave();
    // Simulate a fully unlocked run and jump to final boss.
    for (let world = 1; world <= 7; world += 1) {
      for (let level = 1; level <= 4; level += 1) {
        save.campaign.unlockedLevelKeys.push(`${world}-${level}`);
      }
    }
    save = setCurrentLevel(save, 7, 4);
    const result = completeCurrentLevel(save);
    expect(result.finishedCampaign).toBe(true);
    expect(result.save.campaign.completedLevelKeys).toContain('7-4');
  });

  test('micro-level bonus-route id persists through save current-level updates', () => {
    const save = defaultSave();
    expect(resolveBonusRouteByLevel(7, 1), 'micro-route precondition').toBe('micro-level-1');

    const routed = setCurrentLevel(save, 7, 1, true, 'micro-level-1');
    expect(routed.campaign.activeBonusRouteId).toBe('micro-level-1');
    expect(routed.campaign.stage).toBe(1);
    expect(routed.campaign.levelIndex).toBe(1);
  });
});
