export type WorldIndex = 1 | 2 | 3 | 4 | 5;

export type WorldTheme = 'azure' | 'pipeline' | 'enterprise' | 'gpu' | 'benchmark';

export type ChunkFamily = 'server_room' | 'training_run' | 'rag_pipeline' | 'rate_limiter';

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
  1: ['server_room'],
  2: ['server_room', 'training_run'],
  3: ['training_run', 'rag_pipeline'],
  4: ['rag_pipeline', 'rate_limiter'],
  5: ['rate_limiter', 'training_run'],
};

export const CONTENT_WORLD_THEME_NAMES: Record<WorldIndex, string> = {
  1: 'AZURE BASICS',
  2: 'DATA PIPELINE',
  3: 'ENTERPRISE POC',
  4: 'GPU SHORTAGE',
  5: 'THE BENCHMARK',
};

export const WORLD_NAMES: Record<WorldIndex, string> = CONTENT_WORLD_THEME_NAMES;

export const WORLD_BANNERS: Record<WorldIndex, string> = {
  1: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
  2: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
  3: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
  4: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
  5: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
};

export const CONTENT_WORLD_MAP: Array<WorldContract> = [
  {
    index: 1,
    displayName: 'AZURE BASICS',
    worldBanner: WORLD_BANNERS[1],
    theme: 'azure',
    physicsMultipliers: {
      frictionMultiplier: 1,
      gravityMultiplier: 1,
      speedMultiplier: 1,
      tokenBurnRate: 1,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[1],
    generation: {
      groundVariance: 1,
      gapFrequency: 0.09,
      enemyDensity: 0.35,
      projectileCadenceMs: 2300,
      movingPlatformFrequency: 0.08,
      checkpointSpacingChunks: 3,
      coinDensity: 0.55,
      starTarget: 3,
      palette: { skyTop: 0x6ec6ff, skyBottom: 0xb3ecff, accent: 0x5cb85c },
      audio: { tempo: 120, scale: [0, 2, 4, 7, 9] },
    },
  },
  {
    index: 2,
    displayName: 'DATA PIPELINE',
    worldBanner: WORLD_BANNERS[2],
    theme: 'pipeline',
    physicsMultipliers: {
      frictionMultiplier: 1,
      gravityMultiplier: 1,
      speedMultiplier: 1.08,
      tokenBurnRate: 1,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[2],
    generation: {
      groundVariance: 2,
      gapFrequency: 0.14,
      enemyDensity: 0.45,
      projectileCadenceMs: 1900,
      movingPlatformFrequency: 0.13,
      checkpointSpacingChunks: 3,
      coinDensity: 0.5,
      starTarget: 3,
      palette: { skyTop: 0xf9d976, skyBottom: 0xf39f86, accent: 0xc97d10 },
      audio: { tempo: 126, scale: [0, 2, 3, 7, 10] },
    },
  },
  {
    index: 3,
    displayName: 'ENTERPRISE POC',
    worldBanner: WORLD_BANNERS[3],
    theme: 'enterprise',
    physicsMultipliers: {
      frictionMultiplier: 0.6,
      gravityMultiplier: 1,
      speedMultiplier: 1,
      tokenBurnRate: 1,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[3],
    generation: {
      groundVariance: 2,
      gapFrequency: 0.17,
      enemyDensity: 0.52,
      projectileCadenceMs: 1750,
      movingPlatformFrequency: 0.17,
      checkpointSpacingChunks: 2,
      coinDensity: 0.56,
      starTarget: 3,
      palette: { skyTop: 0x89cff0, skyBottom: 0xe0f7ff, accent: 0x55c0f9 },
      audio: { tempo: 132, scale: [0, 2, 5, 7, 9] },
    },
  },
  {
    index: 4,
    displayName: 'GPU SHORTAGE',
    worldBanner: WORLD_BANNERS[4],
    theme: 'gpu',
    physicsMultipliers: {
      frictionMultiplier: 1,
      gravityMultiplier: 1.15,
      speedMultiplier: 1.03,
      tokenBurnRate: 1.2,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[4],
    generation: {
      groundVariance: 2,
      gapFrequency: 0.2,
      enemyDensity: 0.6,
      projectileCadenceMs: 1600,
      movingPlatformFrequency: 0.23,
      checkpointSpacingChunks: 2,
      coinDensity: 0.48,
      starTarget: 3,
      palette: { skyTop: 0x101423, skyBottom: 0x2b2d42, accent: 0xff8c42 },
      audio: { tempo: 138, scale: [0, 1, 5, 7, 8] },
    },
  },
  {
    index: 5,
    displayName: 'THE BENCHMARK',
    worldBanner: WORLD_BANNERS[5],
    theme: 'benchmark',
    physicsMultipliers: {
      frictionMultiplier: 1,
      gravityMultiplier: 1.25,
      speedMultiplier: 1.08,
      tokenBurnRate: 1.3,
    },
    allowedChunkFamilies: WORLD_CHUNK_FAMILIES[5],
    generation: {
      groundVariance: 3,
      gapFrequency: 0.3,
      enemyDensity: 0.76,
      projectileCadenceMs: 1325,
      movingPlatformFrequency: 0.33,
      checkpointSpacingChunks: 2,
      coinDensity: 0.36,
      starTarget: 3,
      palette: { skyTop: 0x221122, skyBottom: 0x3b1f2b, accent: 0xd7263d },
      audio: { tempo: 152, scale: [0, 1, 4, 6, 10] },
    },
  },
];

export const CONTENT_WORLD_CHUNK_FAMILIES = Object.entries(WORLD_CHUNK_FAMILIES).map(
  ([world, families]) => ({
    world: Number(world) as WorldIndex,
    families,
  }),
);

export const COLLECTIBLES: CollectibleContract[] = [
  { id: 'token', aliases: ['coin'], displayName: 'TOKEN', implemented: true },
  { id: 'eval', aliases: ['star'], displayName: 'EVAL', implemented: true },
  { id: 'gpu_allocation', aliases: ['fire_flower'], displayName: 'GPU ALLOCATION', implemented: true },
  { id: 'copilot_mode', aliases: ['power_up'], displayName: 'COPILOT MODE', implemented: true },
  { id: 'semantic_kernel', aliases: ['assist_bot'], displayName: 'SEMANTIC KERNEL', implemented: true },
  { id: 'deploy_to_prod', aliases: ['green_button'], displayName: 'DEPLOY TO PROD', implemented: true },
  { id: 'works_on_my_machine', aliases: ['woom'], displayName: 'WORKS ON MY MACHINE', implemented: true },
];

export const ENEMIES: EnemyContract[] = [
  {
    id: 'hallucination',
    aliases: ['walker'],
    displayName: 'HALLUCINATION',
    implemented: true,
    behaviorNotes: 'Walker with short bursts of confident wrongness and occasional direction changes.',
  },
  {
    id: 'legacy_system',
    aliases: ['shell'],
    displayName: 'LEGACY SYSTEM',
    implemented: true,
    behaviorNotes: 'Shell enemy. Kickable. Splits once into two services and then pauses.',
  },
  {
    id: 'hot_take',
    aliases: ['flying'],
    displayName: 'HOT TAKE',
    implemented: true,
    behaviorNotes: 'Lunge flyer with burst telegraph and predictable cadence.',
  },
  {
    id: 'analyst',
    aliases: ['spitter'],
    displayName: 'ANALYST',
    implemented: true,
    behaviorNotes: 'Ranged spitter with 3-shot burst pattern.',
  },
  {
    id: 'technical_debt',
    aliases: ['tethered_debt'],
    displayName: 'TECHNICAL DEBT',
    implemented: false,
    behaviorNotes: 'Chain-chomp style anchor-and-lunge with late-stage pursuit.',
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
      'FINE-TUNING...',
      'REDUCING HALLUCINATIONS...',
      'PROVISIONING...',
      'WARMING CACHE...',
    ],
  },
  title: {
    subtitle: '4 WORLDS X 6 LEVELS + FINAL BENCHMARK',
    prompt: 'PRESS ENTER',
    hints: 'N: NEW DEPLOYMENT   L: SERVICE MAP   S: SETTINGS',
  },
  levelComplete: {
    heading: 'DEPLOYED TO PROD',
    hint: 'ENTER: NEXT DEPLOY   ESC: SERVICE MAP',
    statsTemplate: 'Latency: {time}s\nTokens: {coins}\nEvals: {evals}\nRollbacks: {deaths}',
  },
  gameOver: {
    heading: '429: TOO MANY REQUESTS',
    hint: 'R: RESTART   ESC: TITLE',
  },
  finalVictory: {
    heading: 'BENCHMARKS IMPROVED',
    subheading: 'shipping still pending',
    hint: 'ENTER: SERVICE MAP   R: RESET DEPLOYMENT   ESC: TITLE',
    statsTemplate: 'Tokens: {coins}\nEvals: {evals}\nRollbacks: {deaths}\nLatency: {time}s',
  },
  pause: {
    heading: 'PAUSED',
    hint: 'ESC / P: RESUME   L: SERVICE MAP   T: LOGIN SCREEN',
  },
  worldMap: {
    title: 'SERVICE MAP',
    subtitle: 'SELECT A DEPLOYMENT',
    hints: 'ARROWS: SELECT   ENTER: PLAY   ESC: TITLE   S: SETTINGS',
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
    checkpointSaved: 'SAVED TO BLOB STORAGE',
    contextWindowExceeded: 'CONTEXT WINDOW EXCEEDED',
    correctedSuffix: 'CORRECTED',
  },
};

export const APPROVED_UI_TEXT: ApprovedUiTextRule = {
  exact: [
    SCENE_TEXT.gameOver.heading,
    SCENE_TEXT.levelComplete.heading,
    SCENE_TEXT.finalVictory.heading,
    SCENE_TEXT.finalVictory.subheading,
    SCENE_TEXT.pause.heading,
    SCENE_TEXT.worldMap.title,
    SCENE_TEXT.worldMap.subtitle,
    SCENE_TEXT.worldMap.hints,
    SCENE_TEXT.title.subtitle,
    SCENE_TEXT.title.prompt,
    SCENE_TEXT.title.hints,
    ...SCENE_TEXT.boot.loadingHints,
    'SUPER BART',
    SCENE_TEXT.gameplay.checkpointSaved,
    SCENE_TEXT.gameplay.contextWindowExceeded,
    SCENE_TEXT.settings.heading,
    SCENE_TEXT.settings.backHintTemplate,
    SCENE_TEXT.levelComplete.hint,
    SCENE_TEXT.gameOver.hint,
    SCENE_TEXT.finalVictory.hint,
    SCENE_TEXT.pause.hint,
    SCENE_TEXT.gameplay.correctedSuffix,
    'WORLD 1',
    'WORLD 2',
    'WORLD 3',
    'WORLD 4',
    'WORLD 5',
    'WORLD MAP',
    'ARROWS: SELECT',
    'DEPLOYED TO PROD',
    '429: TOO MANY REQUESTS',
    'BENCHMARKS IMPROVED',
    'PAUSED',
    'SETTINGS',
  ],
  patterns: [
    { id: 'HUD_WORLD', regex: '^WORLD [1-5]-[1-9]$' },
    { id: 'HUD_WORLD_LABEL', regex: '^WORLD [1-5]$' },
    { id: 'HUD_TIME', regex: '^TIME \\d{3}$' },
    { id: 'HUD_BART', regex: '^BART x\\d{1,3}$' },
    { id: 'HUD_COUNTER_EVAL', regex: '^✦\\d{3,}$' },
    { id: 'HUD_COUNTER_TOKEN', regex: '^◎\\d{3,}$' },
    { id: 'LEVEL_COMPLETE_STATS', regex: '^Latency: \\d+s\\nTokens: \\d+\\nEvals: \\d+\\nRollbacks: \\d+$' },
    { id: 'FINAL_VICTORY_STATS', regex: '^Tokens: \\d+\\nEvals: \\d+\\nRollbacks: \\d+\\nLatency: \\d+s$' },
    { id: 'STATS_LABEL', regex: '^(Latency|Tokens|Evals|Rollbacks): \\d+(?:s)?$' },
    { id: 'PAUSE_HINT', regex: '^ESC \\/ P: RESUME\\s+L: SERVICE MAP\\s+T: LOGIN SCREEN$' },
    { id: 'TITLE_HINT', regex: '^N: NEW DEPLOYMENT\\s+L: SERVICE MAP\\s+S: SETTINGS$' },
    { id: 'LEVEL_COMPLETE_HINT', regex: '^ENTER: NEXT DEPLOY\\s+ESC: SERVICE MAP$' },
    { id: 'GAME_OVER_HINT', regex: '^R: RESTART\\s+ESC: TITLE$' },
    { id: 'VICTORY_HINT', regex: '^ENTER: SERVICE MAP\\s+R: RESET DEPLOYMENT\\s+ESC: TITLE$' },
    { id: 'SETTINGS_HINT', regex: '^ARROWS: SELECT\\s+ENTER: PLAY\\s+ESC: TITLE\\s+S: SETTINGS$' },
    { id: 'SETTINGS_VALUE', regex: '^(MASTER|MUSIC VOL|SFX VOL) \\[[A-Z/]+\\]: [0-9]{1,3}%$' },
    { id: 'TOGGLE_VALUE', regex: '^(MUSIC MUTE \\[M\\]|SFX MUTE \\[X\\]|SCREEN SHAKE \\[H\\]): (ON|OFF)$' },
    { id: 'BACK_HINT', regex: '^Esc: Back \\(.+\\)$' },
    { id: 'WORLD_MAP_HINT', regex: '^ARROWS: SELECT\\s+ENTER: PLAY\\s+ESC: TITLE\\s+S: SETTINGS$' },
    { id: 'PROGRESSIVE_POPUP', regex: '^[A-Z ]+ CORRECTED$' },
  ],
};

export const ASSET_POLICY: AssetPolicy = {
  disallowSvgInProduction: true,
  allowedSvgAssetKeysInProduction: [],
};

export const WORLD_CHUNK_FAMILY_NAMES: ChunkFamily[] = Object.values(WORLD_CHUNK_FAMILIES).flat();

export const COLLECTIBLE_IDENTIFIER_SET = new Set(
  COLLECTIBLES.flatMap((entry) => [entry.id, ...entry.aliases]),
);

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
