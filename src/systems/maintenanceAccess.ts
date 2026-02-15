// Maintenance Access System
// After clearing a world's boss, the player can return to any cleared stage with:
// - 50% enemy density
// - File counter showing which stages have uncollected files
// - Omega Logs on monitors (if unlocked)

import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';
import { runtimeStore } from '../core/runtime';
import { levelKey } from './progression';
import { PERSONNEL_FILES } from '../content/personnelFiles';

/** Enemy density multiplier for maintenance mode */
export const MAINTENANCE_ENEMY_DENSITY = 0.5;

/** Check if maintenance access is available (any world reclaimed) */
export function isMaintenanceAvailable(): boolean {
  return Object.values(runtimeStore.save.worldStates).some((state) => state === 'reclaimed');
}

/** Check if a specific level is available for maintenance replay */
export function isMaintenanceLevel(world: number, stage: number): boolean {
  if (runtimeStore.save.worldStates[world] !== 'reclaimed') {
    return false;
  }
  return runtimeStore.save.campaign.completedLevelKeys.includes(levelKey(world, stage));
}

/** Get all maintenance-accessible levels */
export function getMaintenanceLevels(): Array<{ world: number; stage: number; key: string }> {
  const levels: Array<{ world: number; stage: number; key: string }> = [];
  for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
    if (runtimeStore.save.worldStates[world] !== 'reclaimed') continue;
    const stageCount = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
    for (let stage = 1; stage <= stageCount; stage += 1) {
      const key = levelKey(world, stage);
      if (runtimeStore.save.campaign.completedLevelKeys.includes(key)) {
        levels.push({ world, stage, key });
      }
    }
  }
  return levels;
}

/** File collection status for a given world */
export interface WorldFileStatus {
  world: number;
  totalFiles: number;
  collectedFiles: number;
  stageDetails: Array<{
    stage: number;
    hasFile: boolean;
    collected: boolean;
    fileId: string | null;
  }>;
}

/** Get file collection status for a specific world */
export function getWorldFileStatus(world: number): WorldFileStatus {
  const stageCount = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
  const collected = new Set(runtimeStore.save.personnelFilesCollected);
  const worldFiles = PERSONNEL_FILES.filter((f) => f.world === world);

  const stageDetails: WorldFileStatus['stageDetails'] = [];
  for (let stage = 1; stage <= stageCount; stage += 1) {
    const file = worldFiles.find((f) => f.stage === stage);
    stageDetails.push({
      stage,
      hasFile: !!file,
      collected: file ? collected.has(file.id) : false,
      fileId: file?.id ?? null,
    });
  }

  return {
    world,
    totalFiles: worldFiles.length,
    collectedFiles: worldFiles.filter((f) => collected.has(f.id)).length,
    stageDetails,
  };
}

/** Get file counter text for HUD display during maintenance mode */
export function getMaintenanceFileCounterText(world: number): string {
  const status = getWorldFileStatus(world);
  return `FILES: ${status.collectedFiles}/${status.totalFiles}`;
}

/** Check if a specific stage has an uncollected file */
export function stageHasUncollectedFile(world: number, stage: number): boolean {
  const collected = new Set(runtimeStore.save.personnelFilesCollected);
  const file = PERSONNEL_FILES.find((f) => f.world === world && f.stage === stage);
  return file ? !collected.has(file.id) : false;
}

/** Apply enemy density reduction for maintenance mode */
export function applyMaintenanceDensity(enemyCount: number): number {
  return Math.max(1, Math.round(enemyCount * MAINTENANCE_ENEMY_DENSITY));
}
