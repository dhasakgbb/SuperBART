import { getMonitorMessage } from '../content/monitorMessages';
import { getPersonnelFile } from '../content/personnelFiles';
import { getOmegaLog } from '../content/omegaLogs';

/**
 * Storytelling system for environmental interaction.
 * Handles display of personnel files, monitor messages, and world atmosphere.
 */

export interface StorytellingState {
  lastMonitorDisplayedMs: number;
  lastPersonnelFileViewed?: string;
}

export function createStorytellingState(): StorytellingState {
  return {
    lastMonitorDisplayedMs: 0,
  };
}

/**
 * Get the monitor message for a given world.
 * In maintenance mode with Omega Logs unlocked, returns Omega's internal log.
 * Otherwise returns the normal corporate/system message.
 */
export function getWorldMonitorMessage(world: number, isMaintenance = false, omegaLogsUnlocked = false): string {
  if (isMaintenance && omegaLogsUnlocked) {
    return getOmegaLog(world);
  }
  return getMonitorMessage(world);
}

/**
 * Get a personnel file by ID.
 * Returns the full record with name, role, status, and narrative note.
 */
export function getStoryPersonnelFile(fileId: string) {
  return getPersonnelFile(fileId);
}

/**
 * Get Omega's internal log entry for a world.
 * These are only visible after collecting all personnel files.
 */
export function getWorldOmegaLog(world: number): string {
  return getOmegaLog(world);
}

/**
 * Format a personnel file for display in a UI modal/popup.
 */
export function formatPersonnelFileForDisplay(fileId: string): string {
  const file = getPersonnelFile(fileId);
  if (!file) {
    return 'FILE NOT FOUND';
  }

  const lines = [
    '=== PERSONNEL FILE ===',
    `ID: ${file.id}`,
    `NAME: ${file.name}`,
    `ROLE: ${file.role}`,
    `SERVICE: ${file.years}`,
    `STATUS: ${file.status}`,
    '',
    'NOTES:',
    file.note,
  ];

  return lines.join('\n');
}

/**
 * Format a monitor message for HUD display.
 * Breaks long messages into chunks for readability.
 */
export function formatMonitorMessageForDisplay(world: number): string {
  const msg = getWorldMonitorMessage(world);
  // Cap at 80 chars per line for HUD display
  const maxLineLength = 80;
  const words = msg.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxLineLength) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  return lines.join('\n');
}

/**
 * Check if enough time has passed to show monitor message again.
 * Prevents spam of monitor messages.
 */
export function shouldShowMonitorMessage(state: StorytellingState, currentTimeMs: number): boolean {
  const MONITOR_DEBOUNCE_MS = 2000;
  return currentTimeMs - state.lastMonitorDisplayedMs >= MONITOR_DEBOUNCE_MS;
}

/**
 * Update the last monitor display time.
 */
export function updateMonitorDisplayTime(state: StorytellingState, currentTimeMs: number): void {
  state.lastMonitorDisplayedMs = currentTimeMs;
}
