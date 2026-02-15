import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';

export type ScriptWorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ScriptStageType = 'stage' | 'boss';

export interface ScriptWorldDefinition {
  id: ScriptWorldId;
  displayName: string;
  subtitle: string;
  biome: string;
  colorHex: string;
}

export interface ScriptStageDefinition {
  world: ScriptWorldId;
  stage: number;
  key: string;
  type: ScriptStageType;
  title: string;
}

export const SCRIPT_WORLD_DEFINITIONS: ScriptWorldDefinition[] = [
  {
    id: 1,
    displayName: 'THE CITY',
    subtitle: 'Building 7 - Where It Started',
    biome: 'city',
    colorHex: '#D4A24A',
  },
  {
    id: 2,
    displayName: 'THE CRYO-SERVER TUNDRA',
    subtitle: 'The Coldest Data on Earth',
    biome: 'tundra',
    colorHex: '#6FA8DC',
  },
  {
    id: 3,
    displayName: 'THE QUANTUM VOID',
    subtitle: 'Between the Data and the Dream',
    biome: 'void',
    colorHex: '#9B59B6',
  },
  {
    id: 4,
    displayName: 'THE DEEP WEB CATACOMBS',
    subtitle: 'Some Data Was Never Meant to Be Found',
    biome: 'catacombs',
    colorHex: '#5E7D4A',
  },
  {
    id: 5,
    displayName: 'THE DIGITAL GRAVEYARD',
    subtitle: 'Where Old Code Goes to Die',
    biome: 'graveyard',
    colorHex: '#7A7A82',
  },
  {
    id: 6,
    displayName: 'THE SINGULARITY CORE',
    subtitle: 'The End of the Line',
    biome: 'core',
    colorHex: '#D4B24A',
  },
  {
    id: 7,
    displayName: 'THE SINGULARITY APEX',
    subtitle: 'Final Escalation Corridor',
    biome: 'apex',
    colorHex: '#F2D16B',
  },
];

const STAGE_TITLES: Record<ScriptWorldId, readonly string[]> = {
  1: ['GROUND LEVEL', 'BUILDING 7', 'THE NETWORK ECHO', 'THE WATCHDOG'],
  2: ['PERMAFROST PROTOCOL', 'THE SERVER GLACIER', 'AVALANCHE ALLEY', 'THE GLACIAL MAINFRAME'],
  3: ['SUPERPOSITION', 'DATA STREAMS', 'THE COLLAPSE', 'THE NULL POINTER'],
  4: ['THE FORGOTTEN ARCHIVE', 'THE DATA MINES', 'THE ENCRYPTED PASSAGE', 'THE QUBIT SERPENT'],
  5: ['LEGACY LANE', 'THE RETRAINING CENTER', 'RESURRECTION PROTOCOL', 'THE LEGACY DAEMON'],
  6: ['THE FIREWALL GAUNTLET', 'THE APPROACH', 'THE SHARDWELL', 'AI OVERLORD OMEGA'],
  7: ['THE LAST STAGE', 'DEEP CORE BOUNDARY', 'THE TRUE APEX', 'SINGULARITY CROWN'],
};

export const SCRIPT_STAGE_DEFINITIONS: ScriptStageDefinition[] = SCRIPT_WORLD_DEFINITIONS.flatMap((world) => {
  const stagesInWorld = CAMPAIGN_WORLD_LAYOUT[world.id - 1] ?? 4;
  const titles = STAGE_TITLES[world.id];
  return Array.from({ length: stagesInWorld }, (_, index) => {
    const stage = index + 1;
    const isBoss = stage === stagesInWorld;
    return {
      world: world.id,
      stage,
      key: `${world.id}-${stage}`,
      type: isBoss ? 'boss' : 'stage',
      title: titles[stage - 1] ?? `STAGE ${stage}`,
    } satisfies ScriptStageDefinition;
  });
});

export const SCRIPT_WORLD_NAME_MAP: Record<ScriptWorldId, string> = Object.fromEntries(
  SCRIPT_WORLD_DEFINITIONS.map((world) => [world.id, world.displayName]),
) as Record<ScriptWorldId, string>;

export function getScriptWorld(world: number): ScriptWorldDefinition {
  const safe = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world))) as ScriptWorldId;
  return SCRIPT_WORLD_DEFINITIONS.find((entry) => entry.id === safe) ?? SCRIPT_WORLD_DEFINITIONS[0]!;
}

export function getScriptStage(world: number, stage: number): ScriptStageDefinition {
  const safeWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world))) as ScriptWorldId;
  const safeStage = Math.min(CAMPAIGN_WORLD_LAYOUT[safeWorld - 1] ?? 1, Math.max(1, Math.floor(stage)));
  return SCRIPT_STAGE_DEFINITIONS.find((entry) => entry.world === safeWorld && entry.stage === safeStage)
    ?? SCRIPT_STAGE_DEFINITIONS[0]!;
}

export function isBossStage(world: number, stage: number): boolean {
  const safeWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world)));
  const maxStage = CAMPAIGN_WORLD_LAYOUT[safeWorld - 1] ?? 3;
  return Math.floor(stage) === maxStage;
}
