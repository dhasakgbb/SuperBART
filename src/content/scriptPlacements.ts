import type { ScriptWorldId } from './scriptCampaign';

export interface PlacementBudget {
  world: ScriptWorldId;
  diagnosticNodesPerStage: number;
  personnelFilesPerWorld: number;
  monitorsPerStage: number;
  postersPerStage: number;
  personalEffectsPerStage: number;
}

// Per SCRIPT.md V4 Production Spec:
// Prologue: 3 diagnostic nodes, 3 personnel files, 1 monitor, 2 posters, 2 personal effects
// W1-W2: 2-3 nodes, 5 files, 1 monitor, 1-2 posters, 1 effect
// W3-W4: 2 nodes, 5 files, 1 monitor, 0-1 posters (decayed), 1-2 effects
// W5: 1 node, 2 files, 1 monitor, 0 posters, 0 effects
export const SCRIPT_PLACEMENT_BUDGETS: PlacementBudget[] = [
  { world: 1, diagnosticNodesPerStage: 3, personnelFilesPerWorld: 3, monitorsPerStage: 1, postersPerStage: 2, personalEffectsPerStage: 2 },
  { world: 2, diagnosticNodesPerStage: 3, personnelFilesPerWorld: 5, monitorsPerStage: 1, postersPerStage: 2, personalEffectsPerStage: 1 },
  { world: 3, diagnosticNodesPerStage: 2, personnelFilesPerWorld: 5, monitorsPerStage: 1, postersPerStage: 1, personalEffectsPerStage: 0 },
  { world: 4, diagnosticNodesPerStage: 2, personnelFilesPerWorld: 5, monitorsPerStage: 1, postersPerStage: 1, personalEffectsPerStage: 2 },
  { world: 5, diagnosticNodesPerStage: 2, personnelFilesPerWorld: 5, monitorsPerStage: 1, postersPerStage: 0, personalEffectsPerStage: 2 },
  { world: 6, diagnosticNodesPerStage: 1, personnelFilesPerWorld: 2, monitorsPerStage: 1, postersPerStage: 0, personalEffectsPerStage: 0 },
  { world: 7, diagnosticNodesPerStage: 1, personnelFilesPerWorld: 0, monitorsPerStage: 1, postersPerStage: 0, personalEffectsPerStage: 0 },
];

export function getPlacementBudget(world: number): PlacementBudget {
  const safeWorld = Math.max(1, Math.min(7, Math.floor(world))) as ScriptWorldId;
  return SCRIPT_PLACEMENT_BUDGETS.find((budget) => budget.world === safeWorld) ?? SCRIPT_PLACEMENT_BUDGETS[0]!;
}
