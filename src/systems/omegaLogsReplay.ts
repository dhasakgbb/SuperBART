// Omega Logs Replay System
// When omegaLogs is unlocked (all 25 Personnel Files collected) and the player
// replays a level via Maintenance Access, monitors display Omega's internal logs
// instead of normal world messages. Monitors glow red instead of green.

import { runtimeStore } from '../core/runtime';
import { getOmegaLog } from '../content/omegaLogs';

/** Whether Omega Logs mode is active for the current level */
export function isOmegaLogsActive(): boolean {
  return runtimeStore.save.unlocks.omegaLogs;
}

/**
 * Returns the monitor text for the given world.
 * If Omega Logs are unlocked and the level is being replayed (maintenance mode),
 * returns Omega's perspective. Otherwise returns null (caller uses normal messages).
 */
export function getMonitorTextForReplay(world: number, isMaintenance: boolean): string | null {
  if (!isMaintenance || !isOmegaLogsActive()) {
    return null;
  }
  return getOmegaLog(world);
}

/**
 * Monitor tint color for Omega Logs mode.
 * Normal monitors: green (0x44FF44). Omega monitors: red (0xFF4444).
 */
export function getMonitorTint(isMaintenance: boolean): number {
  if (isMaintenance && isOmegaLogsActive()) {
    return 0xFF4444; // Red glow for Omega's perspective
  }
  return 0x44FF44; // Green for normal
}

/**
 * Monitor text color for Omega Logs mode.
 * Normal: green (#44FF44). Omega: red (#FF4444) with machine-readable feel.
 */
export function getMonitorTextColor(isMaintenance: boolean): string {
  if (isMaintenance && isOmegaLogsActive()) {
    return '#FF4444';
  }
  return '#44FF44';
}
