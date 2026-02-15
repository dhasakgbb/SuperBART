// Bart's Rules: New Game+ constraint system
// Unlocked after completing the campaign. Five toggleable rules presented as
// handwritten notes on Bart's workbench.

import { runtimeStore } from '../core/runtime';
import { PLAYER_CONSTANTS } from '../core/constants';

export interface BartsRule {
  id: number;
  name: string;
  effect: string;
  note: string;
  active: boolean;
}

/** Canonical rule definitions from SCRIPT.md */
export const BARTS_RULES: BartsRule[] = [
  {
    id: 1,
    name: 'No Handouts',
    effect: 'All power-ups disabled. Data Packets score only.',
    note: 'If you need a crutch, you didn\'t learn the walk.',
    active: false,
  },
  {
    id: 2,
    name: 'Manual Override',
    effect: 'Checkpoints disabled. Death restarts the stage.',
    note: 'The real world doesn\'t have save points.',
    active: false,
  },
  {
    id: 3,
    name: 'Trust Nothing',
    effect: 'Telegraphs shortened 30%. Boss windows 20% shorter.',
    note: 'Fast is fine. Predictable gets you killed.',
    active: false,
  },
  {
    id: 4,
    name: 'Analog Only',
    effect: 'Rack Pulse half range. Charged Pulse takes 2.5s instead of 1.5.',
    note: 'Tools break. Skills don\'t.',
    active: false,
  },
  {
    id: 5,
    name: 'The Full Bartkowski',
    effect: 'All four active simultaneously.',
    note: 'This is how I actually work.',
    active: false,
  },
];

const STORAGE_KEY = 'super_bart_rules_active';

/** Active rule IDs for the current NG+ session */
let activeRuleIds: Set<number> = new Set();

/** Whether the Full Bartkowski has ever been completed */
let fullBartkowskiCompleted = false;

export function loadBartsRulesState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { active: number[]; fullCompleted?: boolean };
      activeRuleIds = new Set(
        Array.isArray(parsed.active) ? parsed.active.filter((id) => id >= 1 && id <= 5) : [],
      );
      fullBartkowskiCompleted = parsed.fullCompleted === true;
    }
  } catch {
    activeRuleIds = new Set();
  }
}

export function persistBartsRulesState(): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ active: [...activeRuleIds], fullCompleted: fullBartkowskiCompleted }),
  );
}

export function isBartsRulesUnlocked(): boolean {
  return runtimeStore.save.unlocks.bartsRules;
}

export function toggleRule(ruleId: number): void {
  if (ruleId === 5) {
    // The Full Bartkowski: toggles all four on/off together
    if (activeRuleIds.has(5)) {
      activeRuleIds.clear();
    } else {
      activeRuleIds = new Set([1, 2, 3, 4, 5]);
    }
  } else {
    if (activeRuleIds.has(ruleId)) {
      activeRuleIds.delete(ruleId);
      activeRuleIds.delete(5); // Can't have Full Bartkowski without all
    } else {
      activeRuleIds.add(ruleId);
      // Auto-activate Full Bartkowski if all 4 are on
      if (activeRuleIds.has(1) && activeRuleIds.has(2) && activeRuleIds.has(3) && activeRuleIds.has(4)) {
        activeRuleIds.add(5);
      }
    }
  }
  persistBartsRulesState();
}

export function isRuleActive(ruleId: number): boolean {
  return activeRuleIds.has(ruleId);
}

export function getActiveRuleIds(): number[] {
  return [...activeRuleIds].sort();
}

export function getActiveRuleCount(): number {
  return activeRuleIds.size;
}

export function clearAllRules(): void {
  activeRuleIds.clear();
  persistBartsRulesState();
}

// ---------- Gameplay modifier queries ----------

/** Rule 1: No Handouts - should power-ups be disabled? */
export function arePowerUpsDisabled(): boolean {
  return activeRuleIds.has(1);
}

/** Rule 2: Manual Override - are checkpoints disabled? */
export function areCheckpointsDisabled(): boolean {
  return activeRuleIds.has(2);
}

/** Rule 3: Trust Nothing - telegraph time multiplier (0.7 = 30% shorter) */
export function getTelegraphMultiplier(): number {
  return activeRuleIds.has(3) ? 0.7 : 1.0;
}

/** Rule 3: Trust Nothing - boss vulnerability window multiplier (0.8 = 20% shorter) */
export function getBossWindowMultiplier(): number {
  return activeRuleIds.has(3) ? 0.8 : 1.0;
}

/** Rule 4: Analog Only - Rack Pulse radius multiplier (0.5 = half range) */
export function getRackPulseRadiusMultiplier(): number {
  return activeRuleIds.has(4) ? 0.5 : 1.0;
}

/** Rule 4: Analog Only - Charged Pulse charge time in ms */
export function getChargedPulseTimeMs(): number {
  return activeRuleIds.has(4) ? 2500 : 1500;
}

/** Mark Full Bartkowski as completed (for workbench second soldering iron) */
export function markFullBartkowskiCompleted(): void {
  fullBartkowskiCompleted = true;
  persistBartsRulesState();
}

export function isFullBartkowskiCompleted(): boolean {
  return fullBartkowskiCompleted;
}

/** Get display state for each rule (for the workbench UI) */
export function getRulesDisplayState(): Array<BartsRule & { active: boolean }> {
  return BARTS_RULES.map((rule) => ({
    ...rule,
    active: activeRuleIds.has(rule.id),
  }));
}
