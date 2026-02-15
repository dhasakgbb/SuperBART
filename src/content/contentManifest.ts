import { SCRIPT_WORLD_DEFINITIONS, SCRIPT_WORLD_NAME_MAP, type ScriptWorldId } from './scriptCampaign';

export type WorldIndex = ScriptWorldId;

export type WorldTheme =
  | 'city'
  | 'cryo_tundra'
  | 'quantum_void'
  | 'deep_web_catacombs'
  | 'digital_graveyard'
  | 'singularity_core';

export type ChunkFamily =
  | 'azure_walkway'
  | 'server_room'
  | 'training_run'
  | 'rag_pipeline'
  | 'rate_limiter'
  | 'benchmark_sprint'
  | 'technical_debt_sprint'
  | 'analyst_tower'
  | 'legacy_slide_01'
  | 'hot_take_gauntlet';

export interface WorldPhysicsMultipliers {
  frictionMultiplier: number;
  gravityMultiplier: number;
  speedMultiplier: number;
  tokenBurnRate: number;
}

export interface WorldGenerationContract {
  groundVariance: number;
  gapFrequency: number;
  enemyDensity: number;
  projectileCadenceMs: number;
  movingPlatformFrequency: number;
  checkpointSpacingChunks: number;
  coinDensity: number;
  starTarget: number;
  palette: {
    skyTop: number;
    skyBottom: number;
    accent: number;
  };
  audio: {
    tempo: number;
    scale: number[];
  };
}

export interface WorldContract {
  index: WorldIndex;
  displayName: string;
  worldBanner: string;
  theme: WorldTheme;
  physicsMultipliers: WorldPhysicsMultipliers;
  allowedChunkFamilies: ChunkFamily[];
  generation: WorldGenerationContract;
}

export interface CollectibleContract {
  id: string;
  aliases: string[];
  displayName: string;
  implemented: boolean;
}

export interface EnemyContract {
  id: string;
  aliases: string[];
  displayName: string;
  behaviorNotes: string;
  implemented: boolean;
}

export interface HudContract {
  leftBlock: {
    line1TextFormat: string;
    iconLabel: string;
    iconMultiplierGlyph: string;
    widthDigits: number;
  };
  rightBlock: {
    line1TextFormat: string;
    countdownDigits: number;
  };
}

export interface ApprovedUiTextRule {
  exact: string[];
  patterns: Array<{ id: string; regex: string }>;
}

export interface SceneText {
  boot: {
    loadingHints: string[];
  };
  title: {
    subtitle: string;
    prompt: string;
    hints: string;
  };
  levelComplete: {
    heading: string;
    hint: string;
    statsTemplate: string;
  };
  gameOver: {
    heading: string;
    hint: string;
  };
  finalVictory: {
    heading: string;
    subheading: string;
    hint: string;
    statsTemplate: string;
  };
  pause: {
    heading: string;
    hint: string;
  };
  worldMap: {
    title: string;
    subtitle: string;
    hints: string;
  };
  settings: {
    heading: string;
    backHintTemplate: string;
    masterLabel: string;
    musicLabel: string;
    sfxLabel: string;
    musicMuteLabel: string;
    sfxMuteLabel: string;
    shakeLabel: string;
  };
  gameplay: {
    checkpointSaved: string;
    contextWindowExceeded: string;
    correctedSuffix: string;
  };
}

export interface AssetPolicy {
  disallowSvgInProduction: boolean;
  allowedSvgAssetKeysInProduction: string[];
}

export interface ManifestSummary {
  worlds: number;
  chunkFamilies: number;
  collectibles: number;
  enemies: number;
  approvedStringRules: number;
}

export const WORLD_CHUNK_FAMILIES: Record<WorldIndex, ChunkFamily[]> = {
  1: ['azure_walkway', 'server_room'],
  2: ['training_run', 'rag_pipeline'],
  3: ['rag_pipeline', 'training_run', 'technical_debt_sprint'],
  4: ['legacy_slide_01', 'hot_take_gauntlet', 'technical_debt_sprint'],
  5: ['legacy_slide_01', 'rate_limiter', 'hot_take_gauntlet'],
  6: ['benchmark_sprint', 'analyst_tower', 'hot_take_gauntlet'],
  7: ['benchmark_sprint', 'analyst_tower', 'hot_take_gauntlet'],
};

export const CONTENT_WORLD_THEME_NAMES: Record<WorldIndex, string> = {
  1: 'THE CITY',
  2: 'THE CRYO-SERVER TUNDRA',
  3: 'THE QUANTUM VOID',
  4: 'THE DEEP WEB CATACOMBS',
  5: 'THE DIGITAL GRAVEYARD',
  6: 'THE SINGULARITY CORE',
  7: 'THE SINGULARITY APEX',
};

export const WORLD_NAMES: Record<WorldIndex, string> = SCRIPT_WORLD_NAME_MAP;

const CAMPAIGN_BANNER = 'THE GLOBAL CLOUD NETWORK';
export const GAME_TITLE = 'SUPER BART: CLOUD QUEST';
export const GAME_TITLE_PREMIUM = 'SUPER BART: CLOUD QUEST (PREMIUM BUILD)';
export const WORLD_BANNERS: Record<WorldIndex, string> = {
  1: CAMPAIGN_BANNER,
  2: CAMPAIGN_BANNER,
  3: CAMPAIGN_BANNER,
  4: CAMPAIGN_BANNER,
  5: CAMPAIGN_BANNER,
  6: CAMPAIGN_BANNER,
  7: CAMPAIGN_BANNER,
};

const WORLD_THEME_BY_INDEX: Record<WorldIndex, WorldTheme> = {
  1: 'city',
  2: 'cryo_tundra',
  3: 'quantum_void',
  4: 'deep_web_catacombs',
  5: 'digital_graveyard',
  6: 'singularity_core',
  7: 'singularity_core',
};

const WORLD_PALETTES: Record<WorldIndex, { skyTop: number; skyBottom: number; accent: number }> = {
  1: { skyTop: 0x000000, skyBottom: 0x6b8cff, accent: 0xd4a24a }, // City: Deep Sky to Blue
  2: { skyTop: 0x32535F, skyBottom: 0x74C0D4, accent: 0xB7E9F7 }, // Tundra: Deep Ice to Mid Ice, Light Accent
  3: { skyTop: 0x1A0B2E, skyBottom: 0xD45698, accent: 0x4DEEEA }, // Void: Dark to Pink, Cyan Accent
  4: { skyTop: 0x1A1A1A, skyBottom: 0x203820, accent: 0x68F046 }, // Catacombs: Mud to Slime, Toxic Accent
  5: { skyTop: 0x0C0C14, skyBottom: 0x505050, accent: 0x74F6D9 }, // Graveyard: Midnight to Fog Grey, Teal Accent
  6: { skyTop: 0x221111, skyBottom: 0xFF4D00, accent: 0xFFD500 }, // Core: Charcoal to Magma, Yellow Accent
  7: { skyTop: 0x050505, skyBottom: 0x1f1f1f, accent: 0xf0d68f }, // Apex (Keep original or tune later)
};

export const CONTENT_WORLD_MAP: Array<WorldContract> = SCRIPT_WORLD_DEFINITIONS.map((world) => {
  const worldIndex = world.id;
  const palette = WORLD_PALETTES[worldIndex];
  return {
    index: worldIndex,
    displayName: world.displayName,
    worldBanner: WORLD_BANNERS[worldIndex],
    theme: WORLD_THEME_BY_INDEX[worldIndex],
    physicsMultipliers: {
      frictionMultiplier: worldIndex === 4 ? 0.6 : 1,
      gravityMultiplier: worldIndex === 5 ? 1.15 : 1,
      speedMultiplier: 1,
      tokenBurnRate: worldIndex === 5 ? 1.2 : 1,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[worldIndex],
    generation: {
      groundVariance: worldIndex >= 6 ? 3 : 2,
      gapFrequency: 0.1 + worldIndex * 0.022,
      enemyDensity: 0.32 + worldIndex * 0.075,
      projectileCadenceMs: Math.max(1050, 2450 - worldIndex * 170),
      movingPlatformFrequency: 0.08 + worldIndex * 0.03,
      checkpointSpacingChunks: worldIndex >= 5 ? 2 : 3,
      coinDensity: Math.max(0.22, 0.56 - worldIndex * 0.04),
      starTarget: 3,
      palette,
      audio: {
        tempo: 118 + worldIndex * 5,
        scale: worldIndex >= 6 ? [0, 1, 3, 6, 8] : [0, 2, 4, 7, 9],
      },
    },
  };
});

export const CONTENT_WORLD_CHUNK_FAMILIES = Object.entries(WORLD_CHUNK_FAMILIES).map(([world, families]) => ({
  world: Number(world) as WorldIndex,
  families,
}));

export const COLLECTIBLES: CollectibleContract[] = [
  { id: 'token', aliases: ['coin', 'data_packet'], displayName: 'DATA PACKET', implemented: true },
  { id: 'eval', aliases: ['star', 'override_shard'], displayName: 'OVERRIDE SHARD', implemented: true },
  { id: 'firewall_shield', aliases: ['shield'], displayName: 'FIREWALL SHIELD', implemented: false },
  { id: 'pulse_charge', aliases: ['triple_shot'], displayName: 'PULSE CHARGE', implemented: false },
  { id: 'bandwidth_boost', aliases: ['speed_boost'], displayName: 'BANDWIDTH BOOST', implemented: false },
  { id: 'cache_restore', aliases: ['health'], displayName: 'CACHE RESTORE', implemented: false },
  { id: 'overclock', aliases: ['slow_motion'], displayName: 'OVERCLOCK', implemented: false },
];

export const COLLECTIBLE_DISPLAY_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  COLLECTIBLES.map((collectible) => [collectible.id, collectible.displayName]),
);

export const ENEMIES: EnemyContract[] = [
  {
    id: 'walker',
    aliases: ['hallucination', 'ai_robot'],
    displayName: 'AI ROBOT',
    implemented: true,
    behaviorNotes: 'Ground patrol bot with predictable rebounds.',
  },
  {
    id: 'shell',
    aliases: ['legacy_system', 'firewall'],
    displayName: 'FIREWALL',
    implemented: true,
    behaviorNotes: 'Armored blocker. Stomp to toggle vulnerability windows.',
  },
  {
    id: 'flying',
    aliases: ['hot_take', 'spam'],
    displayName: 'SPAM',
    implemented: true,
    behaviorNotes: 'Arcing flyer with staged dive timing.',
  },
  {
    id: 'spitter',
    aliases: ['analyst', 'bug'],
    displayName: 'BUG',
    implemented: true,
    behaviorNotes: 'Projectile caster with short burst cadence.',
  },
  {
    id: 'compliance_officer',
    aliases: ['compliance', 'compliance_drone'],
    displayName: 'COMPLIANCE DRONE',
    implemented: true,
    behaviorNotes: 'Stomp-gated platform enemy used in late worlds.',
  },
  {
    id: 'technical_debt',
    aliases: ['tethered_debt', 'tech_debt_wraith'],
    displayName: 'TECH DEBT WRAITH',
    implemented: true,
    behaviorNotes: 'Anchor-and-lunge chaser with delayed pressure.',
  },
  {
    id: 'boss',
    aliases: ['ai_overlord_omega'],
    displayName: 'BOSS',
    implemented: true,
    behaviorNotes: 'Phase-driven boss actor controlled by scripted telegraph windows.',
  },
  {
    id: 'snowman_sentry',
    aliases: ['frost_bot'],
    displayName: 'SNOWMAN SENTRY',
    implemented: false,
    behaviorNotes: 'Slow patrol, ice projectile throw.',
  },
  {
    id: 'cryo_drone',
    aliases: ['ice_drone'],
    displayName: 'CRYO-DRONE',
    implemented: false,
    behaviorNotes: 'Floating unit, freezing beam.',
  },
  {
    id: 'qubit_swarm',
    aliases: ['crystal_swarm'],
    displayName: 'QUBIT SWARM',
    implemented: false,
    behaviorNotes: 'Two-state dormant/active.',
  },
  {
    id: 'crawler',
    aliases: ['cable_crawler'],
    displayName: 'CRAWLER',
    implemented: false,
    behaviorNotes: 'Emerges from walls.',
  },
  {
    id: 'glitch_phantom',
    aliases: ['phantom'],
    displayName: 'GLITCH PHANTOM',
    implemented: false,
    behaviorNotes: 'Phases in/out, contact damage.',
  },
  {
    id: 'fungal_node',
    aliases: ['spore_node'],
    displayName: 'FUNGAL NODE',
    implemented: false,
    behaviorNotes: 'Spore cloud, signal drift.',
  },
  {
    id: 'ghost_process',
    aliases: ['ghost'],
    displayName: 'GHOST PROCESS',
    implemented: false,
    behaviorNotes: 'Drifts through walls.',
  },
  {
    id: 'tape_wraith',
    aliases: ['tape_ghost'],
    displayName: 'TAPE WRAITH',
    implemented: false,
    behaviorNotes: 'Reforms unless source reel hit.',
  },
  {
    id: 'resume_bot',
    aliases: ['paper_bot'],
    displayName: 'RESUME BOT',
    implemented: false,
    behaviorNotes: 'Non-hostile patrol, no drops.',
  },
];

export const HUD_CONTRACT: HudContract = {
  leftBlock: {
    line1TextFormat: 'BART x{instances}',
    iconLabel: 'BART',
    iconMultiplierGlyph: 'x',
    widthDigits: 2,
  },
  rightBlock: {
    line1TextFormat: 'WORLD {world}-{level}  TIME {time}',
    countdownDigits: 3,
  },
};

export const SCENE_TEXT: SceneText = {
  boot: {
    loadingHints: [
      'SYNCING BADGE HANDSHAKE...',
      'VALIDATING MANUAL OVERRIDES...',
      'SCANNING RECLAIM NODES...',
      'PATCHING OLD RAILS...',
    ],
  },
  title: {
    subtitle: 'RECLAIM THE NETWORK',
    prompt: 'PRESS ENTER',
    hints: '',
  },
  levelComplete: {
    heading: 'NODE RECLAIMED',
    hint: 'ENTER: CONTINUE',
    statsTemplate: 'Time: {time}s\nPackets: {coins}\nShards: {evals}\nKnockdowns: {deaths}',
  },
  gameOver: {
    heading: 'SYSTEM FAILURE',
    hint: 'R: RETRY   ESC: TITLE',
  },
  finalVictory: {
    heading: 'NETWORK RECLAIMED',
    subheading: 'THE MAP IS LIVE AGAIN.',
    hint: 'ENTER: NETWORK MAP   R: RESET CAMPAIGN   ESC: TITLE',
    statsTemplate: 'Packets: {coins}\nShards: {evals}\nKnockdowns: {deaths}\nTime: {time}s',
  },
  pause: {
    heading: 'PAUSED',
    hint: 'ESC / P: RESUME   L: NETWORK MAP   T: TITLE',
  },
  worldMap: {
    title: 'GLOBAL CLOUD NETWORK',
    subtitle: 'RECLAIM THE NEXT NODE',
    hints: 'ARROWS: SELECT   ENTER: DEPLOY   ESC: TITLE   S: SETTINGS',
  },
  settings: {
    heading: 'SETTINGS',
    backHintTemplate: 'Esc: Back ({scene})',
    masterLabel: 'MASTER [Q/E]:',
    musicLabel: 'MUSIC VOL [A/D]:',
    sfxLabel: 'SFX VOL [Z/C]:',
    musicMuteLabel: 'MUSIC MUTE [M]:',
    sfxMuteLabel: 'SFX MUTE [X]:',
    shakeLabel: 'SCREEN SHAKE [H]:',
  },
  gameplay: {
    checkpointSaved: 'CHECKPOINT LOGGED',
    contextWindowExceeded: 'MANUAL CHECK REQUIRED',
    correctedSuffix: 'CORRECTED',
  },
};

export const APPROVED_UI_TEXT: ApprovedUiTextRule = {
  exact: [
    ...SCENE_TEXT.boot.loadingHints,
    SCENE_TEXT.title.subtitle,
    SCENE_TEXT.title.prompt,
    SCENE_TEXT.levelComplete.heading,
    SCENE_TEXT.levelComplete.hint,
    SCENE_TEXT.gameOver.heading,
    SCENE_TEXT.gameOver.hint,
    SCENE_TEXT.finalVictory.heading,
    SCENE_TEXT.finalVictory.subheading,
    SCENE_TEXT.finalVictory.hint,
    SCENE_TEXT.pause.heading,
    SCENE_TEXT.pause.hint,
    SCENE_TEXT.worldMap.title,
    SCENE_TEXT.worldMap.subtitle,
    SCENE_TEXT.worldMap.hints,
    SCENE_TEXT.settings.heading,
    SCENE_TEXT.settings.backHintTemplate,
    SCENE_TEXT.gameplay.checkpointSaved,
    SCENE_TEXT.gameplay.contextWindowExceeded,
    SCENE_TEXT.gameplay.correctedSuffix,
    'PRESS ENTER',
    'W/S NAVIGATE  -  ENTER SELECT',
    'CONTINUE',
    'NEW RUN',
    'SETTINGS',
    'BARTS RULES',
    'CHARGED RACK PULSE',
    'RACK PULSE',
    'NO DIAGNOSTIC NODE IN RANGE',
    'MANUAL CHECK: PATROL ROUTE REVEALED',
    'MANUAL CHECK: HAZARD CYCLE LOGGED',
    'MANUAL CHECK: FILE PING WITHIN RANGE',
    'MANUAL CHECK: NO FILE PING',
    'MANUAL CHECK: CRACKED SURFACE MARKED',
    'GROUND POUND',
    'DOUBLE JUMP',
    'NO INPUT REQUIRED',
    'Bart keeps walking. The corridor hums. Another door unlocks.',
    'PRESS ANY KEY TO SKIP AFTER 2s',
    'PART 1: BART EXITS THE FACILITY. INTERCEPT LINES DIM.',
    'PRESS ANY KEY TO SKIP',
    'PART 3: WORLD MAP REVEAL',
    'WORLD RECONSTRUCTION PRIORITY LAYER',
    'DEBRIEF // THE LIVING MAP',
    'Part 1: Bart exits the facility. The lights dim behind him.',
    'INTERCEPT',
    'No intercept available.',
    'PART 3: THE LIVING MAP',
    'LEFT/RIGHT: CHOOSE  ENTER: CONFIRM',
    'RECLAIM THE NETWORK',
    'PRESS ENTER',
    'CONTINUE',
    'NEW RUN',
    'SETTINGS',
    'BARTS RULES',
    '> ',
    GAME_TITLE,
    'ENDING // THE HUMAN COST',
    'ENTER: WORLD MAP   ESC: TITLE',
    'The network reboots. The names stay protected.',
    'The network reboots. The archive stays open.',
    'The core goes dark. The names remain private.',
    'The core goes dark. The record survives.',
    'WORLD 1',
    'WORLD 2',
    'WORLD 3',
    'WORLD 4',
    'WORLD 5',
    'WORLD 6',
    'WORLD 7',
    '7 REGIONS • 28 STAGES • HUMAN COST',
    GAME_TITLE_PREMIUM,
  ],
  patterns: [
    { id: 'HUD_WORLD', regex: '^WORLD [1-7]-[1-4]$' },
    { id: 'HUD_WORLD_LABEL', regex: '^WORLD [1-7]$' },
    { id: 'HUD_TIME', regex: '^TIME \\d{3}$' },
    { id: 'HUD_BART', regex: '^BART x\\d{1,3}$' },
    { id: 'HUD_COUNTER_EVAL', regex: '^✦\\d{3,}$' },
    { id: 'HUD_COUNTER_TOKEN', regex: '^◎\\d{3,}$' },
    { id: 'LEVEL_COMPLETE_STATS', regex: '^Time: \\d+s\\nPackets: \\d+\\nShards: \\d+\\nKnockdowns: \\d+$' },
    { id: 'FINAL_VICTORY_STATS', regex: '^Packets: \\d+\\nShards: \\d+\\nKnockdowns: \\d+\\nTime: \\d+s$' },
    { id: 'SETTINGS_VALUE', regex: '^(MASTER|MUSIC VOL|SFX VOL) \\[[A-Z/]+\\]: [0-9]{1,3}%$' },
    { id: 'TOGGLE_VALUE', regex: '^(MUSIC MUTE \\[M\\]|SFX MUTE \\[X\\]|SCREEN SHAKE \\[H\\]): (ON|OFF)$' },
    { id: 'BACK_HINT', regex: '^Esc: Back \\(.+\\)$' },
    { id: 'HUD_TOAST_SCORE', regex: '^\\+\\d+ (DATA PACKET|OVERRIDE SHARD|CORRECTED)$' },
    { id: 'HUD_TOAST_PERSONNEL_FILE', regex: '^PERSONNEL FILE (?:[1-9]|[12]\\d|2[0-2])/22$' },
    { id: 'INTERLUDE_TITLE', regex: '^INTERLUDE [1-7]-[1-4]$' },
    { id: 'INTERLUDE_DEBRIEF_TITLE', regex: '^DEBRIEF // WORLD [1-7]$' },
    { id: 'DEBRIEF_MAP_BODY', regex: '^World [1-7] stabilizes\\. The next route glows amber\\.\\nPeople return to reclaimed nodes\\.$' },
    { id: 'CREDITS_PERSONNEL', regex: '^Personnel Files Recovered: (?:[0-9]|[12]\\d|2[0-2])/22$' },
  ],
};

export const ASSET_POLICY: AssetPolicy = {
  disallowSvgInProduction: true,
  allowedSvgAssetKeysInProduction: [],
};

export const WORLD_CHUNK_FAMILY_NAMES: ChunkFamily[] = Object.values(WORLD_CHUNK_FAMILIES).flat();
export const COLLECTIBLE_IDENTIFIER_SET = new Set(COLLECTIBLES.flatMap((entry) => [entry.id, ...entry.aliases]));
export const ENEMY_IDENTIFIER_SET = new Set(ENEMIES.flatMap((entry) => [entry.id, ...entry.aliases]));
export const CONTENT_WORLD_NAME_SET = new Set(Object.values(WORLD_NAMES));

export const MANIFEST_SUMMARY: ManifestSummary = {
  worlds: CONTENT_WORLD_MAP.length,
  chunkFamilies: new Set(WORLD_CHUNK_FAMILY_NAMES).size,
  collectibles: COLLECTIBLES.length,
  enemies: ENEMIES.length,
  approvedStringRules: APPROVED_UI_TEXT.exact.length + APPROVED_UI_TEXT.patterns.length,
};

export const CONTENT_MANIFEST = {
  worlds: CONTENT_WORLD_MAP,
  worldNames: WORLD_NAMES,
  worldChunkFamilies: WORLD_CHUNK_FAMILIES,
  worldChunkFamilyIndex: CONTENT_WORLD_CHUNK_FAMILIES,
  collectibles: COLLECTIBLES,
  enemies: ENEMIES,
  hud: HUD_CONTRACT,
  approvedUiText: APPROVED_UI_TEXT,
  sceneText: SCENE_TEXT,
  assetPolicy: ASSET_POLICY,
  summary: MANIFEST_SUMMARY,
} as const;

export type CanonicalWorld = (typeof CONTENT_WORLD_MAP)[number];
export type CanonicalChunkFamily = ChunkFamily;
export type CanonicalCollectible = (typeof COLLECTIBLES)[number];
export type CanonicalEnemy = (typeof ENEMIES)[number];
