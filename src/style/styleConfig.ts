import { GAME_TITLE, HUD_CONTRACT, SCENE_TEXT } from '../content/contentManifest';

export type StyleReferenceTargetRole = 'primary' | 'secondary' | 'supplemental';
export type StyleReferenceTarget = {
  name: string;
  path: string;
  scenes: string[];
  required: boolean;
  role: StyleReferenceTargetRole;
  reason?: string;
  notes?: string;
};

export type SceneStyleExceptionRationale = 'system-only' | 'transient-ui' | 'non-blocking transition' | 'legacy';
export type SceneStyleException = {
  scene: string;
  rationale: SceneStyleExceptionRationale;
  approvedBy: string;
  since: string;
  notes?: string;
};
export type PlayerAnimationContract = {
  states: readonly string[];
  source: 'src/player/PlayerAnimator.ts';
  requireExactStates: boolean;
};

export const contractVersion = '1.0.0';
export const sceneLockScope = 'all-user-facing' as const;
const STYLE_REFERENCE_TARGETS: StyleReferenceTarget[] = [
  {
    name: 'primary_reference',
    path: 'public/assets/target_look.png',
    scenes: [
      'BootScene',
      'TitleScene',
      'WorldMapScene',
      'PlayScene',
      'GameOverScene',
      'LevelCompleteScene',
      'FinalVictoryScene',
      'SettingsScene',
    ],
    required: true,
    role: 'primary',
    reason: 'Primary NES baseline for all user-facing lock scenes.',
    notes: 'Used as canonical lock coverage source.',
  },
  {
    name: 'secondary_reference',
    path: 'public/assets/target_look_2.jpeg',
    scenes: ['PlayScene', 'WorldMapScene'],
    required: false,
    role: 'secondary',
    reason: 'Supplemental visual parity reference for play/map campaign review.',
    notes: 'Do not treat as source-of-truth for lock decisions.',
  },
];

export const canonicalReferenceTargets: StyleReferenceTarget[] = STYLE_REFERENCE_TARGETS;
export const sceneStyleExceptions: SceneStyleException[] = [];
export const playerAnimationContract: PlayerAnimationContract = {
  states: ['idle', 'walk', 'run', 'skid', 'jump', 'fall', 'land', 'hurt', 'win', 'dead'],
  source: 'src/player/PlayerAnimator.ts',
  requireExactStates: true,
};

export const styleConfig = {
  contractVersion,
  // Canonical reference mapping used by style validation and asset/style gates.
  // Keep this as the source-of-truth list for acceptance references.
  referenceTargets: canonicalReferenceTargets,
  // System font fallback scenes should be empty for NES lock.
  // Keep this field explicit for future scene exception handling.
  sceneStyleExceptions,
  palette: {
    swatches: [
      { name: 'inkDark', hex: '#1D1D1D' },
      { name: 'inkSoft', hex: '#2B2824' },
      { name: 'skyDeep', hex: '#000000' },
      { name: 'skyMid', hex: '#060808' },
      { name: 'skyBlue', hex: '#6b8cff' },
      { name: 'skyLight', hex: '#9CBDFF' }, // Added skyLight
      { name: 'grassTop', hex: '#46BA4C' },
      { name: 'grassMid', hex: '#20A36D' },
      { name: 'groundShadow', hex: '#742B01' },
      { name: 'groundMid', hex: '#B6560E' },
      { name: 'groundWarm', hex: '#DC7C1D' },
      { name: 'coinCore', hex: '#DED256' },
      { name: 'coinEdge', hex: '#DC7C1D' },
      { name: 'hudText', hex: '#FFFFFF' },
      { name: 'hudAccent', hex: '#FFD700' }, // Gold accent
      { name: 'hudPanel', hex: '#1A1A1D' }, // Deep dark grey
      { name: 'bloomWarm', hex: '#FFEB9C' },
    ],
    ramps: {
      terrain: ['groundShadow', 'groundMid', 'groundWarm', 'grassMid', 'grassTop'],
      ui: ['hudPanel', 'hudText', 'hudAccent'],
      fx: ['bloomWarm', 'coinCore', 'coinEdge'],
    },
  },
  outline: {
    worldPx: 2,
    uiPx: 2,
    maxPx: 3,
    worldColor: 'inkDark',
    uiColor: 'inkDark',
    color: 'inkDark',
    sourceColor: 'inkDark',
    sourceAlpha: 220,
  },
  spriteScale: {
    tilePx: 16,
    worldBaseScale: 1,
    hudPortraitScale: 0.62,
  },
  hudLayout: {
    viewport: { width: 960, height: 540 },
    portrait: {
      texture: 'bart_portrait_96',
      x: 14,
      y: 8,
      anchor: 'top-left',
      textureSizePx: 96,
      scale: 0.66,
    },
    leftGroup: {
      x: 84,
      y: 11,
      anchor: 'top-left',
      fontSizePx: 14,
      letterSpacingPx: 2,
      textFormat: HUD_CONTRACT.leftBlock.line1TextFormat,
    },
    rightGroup: {
      x: 948,
      y: 11,
      anchor: 'top-right',
      fontSizePx: 14,
      letterSpacingPx: 2,
      textFormat: HUD_CONTRACT.rightBlock.line1TextFormat,
    },
    leftGroupIcons: {
      star: { texture: 'pickup_eval', x: 210, y: 11, scale: 1.1 }, // Increased scale
      coin: { texture: 'pickup_token', x: 266, y: 11, scale: 1.1 },
    },
    hudMode: 'icon-driven',
    timeDigits: 3,
  },
  gameplayLayout: {
    viewport: { width: 960, height: 540 },
    cameraZoom: 1.2,
    actorScale: {
      player: 1.9,
      enemy: 1.9,
      coin: 1.8,
      star: 1.8,
      questionBlock: 2.6,
    },
    showcase: {
      world: 1,
      level: 1,
      questionBlockOffset: { x: 184, y: -56 },
      coinLine: { startX: 84, yOffset: -72, spacingPx: 34, count: 3 },
      extraWalkerOffsetX: 250,
    },
    sky: {
      topSwatch: 'skyBlue',
      bottomSwatch: 'skyLight',
    },
    haze: {
      y: 240,
      widthFactor: 0.48,
      heightPx: 96,
      alpha: 0.08,
    },
    parallaxProfile: {
      enabled: true,
      layers: [
        {
          name: 'clouds-far',
          key: 'cloud_2',
          xOffset: 80,
          yOffset: 160,
          spacingPx: 480,
          scale: 2.2,
          alpha: 0.95,
          parallaxFactor: 0.1,
          driftPx: 30,
          driftSpeedMs: 20000,
          depth: -1388,
          glow: {
            offsetX: 4,
            offsetY: 4,
            scale: 0.12,
            alpha: 0.22,
            color: 'bloomWarm',
            blendMode: 'ADD',
          },
        },
        {
          name: 'clouds-near',
          key: 'cloud_1',
          xOffset: 300,
          yOffset: 180,
          spacingPx: 440,
          scale: 1.8,
          alpha: 0.9,
          parallaxFactor: 0.14,
          driftPx: 20,
          driftSpeedMs: 16000,
          depth: -1384,
          glow: {
            offsetX: 3,
            offsetY: 3,
            scale: 0.12,
            alpha: 0.18,
            color: 'bloomWarm',
            blendMode: 'ADD',
          },
        },
        {
          name: 'hills-far',
          key: 'hill_far',
          xOffset: 40,
          yOffset: 270,
          spacingPx: 320,
          scale: 3,
          alpha: 1,
          parallaxFactor: 0.1,
          depth: -1376,
        },
        {
          name: 'hills-near',
          key: 'hill_near',
          xOffset: 10,
          yOffset: 270,
          spacingPx: 320,
          scale: 3,
          alpha: 1,
          parallaxFactor: 0.22,
          depth: -1372,
        },
      ],
      depthCue: {
        enabled: true,
        topSwatch: 'skyDeep',
        midSwatch: 'skyMid',
        startY: 216,
        bandHeightPx: 118,
        maxAlpha: 0.16,
        bands: 12,
      },
      fallback: {
        toClouds: true,
      },
    },
    clouds: [
      {
        key: 'cloud_2',
        x: 80,
        y: 160,
        spacingPx: 480,
        scale: 2.2,
        alpha: 0.95,
        scrollFactor: 0.10,
        driftPx: 30,
        driftMs: 20000,
      },
      {
        key: 'cloud_1',
        x: 300,
        y: 180,
        spacingPx: 440,
        scale: 1.8,
        alpha: 0.90,
        scrollFactor: 0.1,
        driftPx: 20,
        driftMs: 16000,
      },
    ],
    hills: {
      far: {
        key: 'hill_far',
        startX: 40,
        y: 270, // Centered vertically for 540h
        spacingPx: 320,
        scale: 3, // 320 * 3 = 960 (Native Integer Scale)
        alpha: 1.0,
        scrollFactor: 0.10,
      },
      near: {
        key: 'hill_near',
        startX: 10,
        y: 270,
        spacingPx: 320,
        scale: 3,
        alpha: 1.0,
        scrollFactor: 0.22,
      },
    },
    worldSpaceLabelPolicy: {
      disallowGameplayEntityLabels: true,
      disallowLabelDebugGlyphs: true,
      allowedPopupModes: ['hud-counter', 'headless-toast'],
    },
  },
    worldMapLayout: {
      viewport: { width: 960, height: 540 },
      title: {
        x: 480,
        y: 22,
        fontSizePx: 30,
        letterSpacingPx: 2,
        text: SCENE_TEXT.worldMap.title,
      },
      subtitle: {
        x: 480,
        y: 58,
        fontSizePx: 14,
        letterSpacingPx: 1,
        text: SCENE_TEXT.worldMap.subtitle,
      },
      hints: {
        x: 480,
        y: 508,
        fontSizePx: 14,
        letterSpacingPx: 1,
        text: SCENE_TEXT.worldMap.hints,
      },
    // World labels for 7-world campaign [4,4,4,4,4,4,4]
    worldLabels: [
      { world: 1, x: 120, y: 380 },
      { world: 2, x: 100, y: 180 },
      { world: 3, x: 260, y: 60 },
      { world: 4, x: 480, y: 350 },
      { world: 5, x: 740, y: 280 },
      { world: 6, x: 780, y: 100 },
      { world: 7, x: 900, y: 60 },
    ],
    mapPath: {
      textureKey: 'map_path_dot',
      scale: 1.0,
      spacingPx: 12, // Tighter spacing for paths
      alpha: 0.6,
    },
    nodeSpriteKeys: {
      open: 'map_node_open',
      done: 'map_node_done',
      locked: 'map_node_locked',
      selected: 'map_node_selected',
    },
    nodeScale: {
      base: 1.6,
      selected: 2.0,
    },
    selectionBob: {
      distancePx: 6,
      durationMs: 420,
    },
    nodes: [
      // W1: The City (Prologue) - Bottom Left [4 stages]
      { key: '1-1', x: 140, y: 460 },
      { key: '1-2', x: 180, y: 440 },
      { key: '1-3', x: 220, y: 420 },
      { key: '1-4', x: 260, y: 400 },

      // W2: Cryo-Server Tundra - Mid Left [4 stages]
      { key: '2-1', x: 140, y: 280 }, { key: '2-2', x: 180, y: 260 }, { key: '2-3', x: 140, y: 220 }, { key: '2-4', x: 180, y: 200 },

      // W3: Quantum Void - Top Left [4 stages]
      { key: '3-1', x: 280, y: 160 }, { key: '3-2', x: 320, y: 140 }, { key: '3-3', x: 360, y: 120 }, { key: '3-4', x: 400, y: 100 },

      // W4: Deep Web Catacombs - Center Bottom [4 stages]
      { key: '4-1', x: 440, y: 460 }, { key: '4-2', x: 480, y: 440 }, { key: '4-3', x: 520, y: 460 }, { key: '4-4', x: 560, y: 440 },

      // W5: Digital Graveyard - Mid Right [4 stages]
      { key: '5-1', x: 680, y: 340 }, { key: '5-2', x: 720, y: 320 }, { key: '5-3', x: 760, y: 340 }, { key: '5-4', x: 800, y: 320 },

      // W6: Singularity Core - Top Right [4 stages]
      { key: '6-1', x: 760, y: 160 }, { key: '6-2', x: 800, y: 130 }, { key: '6-3', x: 840, y: 100 }, { key: '6-4', x: 880, y: 70 },

      // W7: Singularity Apex - Top Right Edge [4 stages]
      { key: '7-1', x: 800, y: 200 }, { key: '7-2', x: 840, y: 170 }, { key: '7-3', x: 880, y: 140 }, { key: '7-4', x: 920, y: 110 },
    ],
  },
  titleLayout: {
    viewport: { width: 960, height: 540 },
    titleMode: 'full',
    wordmark: {
      x: 480,
      y: 40,
      anchor: 'top-center',
      textureKey: 'title_logo',
      scale: 1.15,
      copy: GAME_TITLE,
    },
    portrait: {
      x: 780,
      y: 260,
      anchor: 'top-left',
      textureKey: 'bart_portrait_96',
      scale: 0.82,
    },
    subtitle: {
      x: 480,
      y: 170,
      anchor: 'top-center',
      fontSizePx: 16,
      letterSpacingPx: 3,
      text: SCENE_TEXT.title.subtitle,
    },
    prompt: {
      x: 480,
      y: 470,
      anchor: 'top-center',
      fontSizePx: 14,
      letterSpacingPx: 2,
      text: SCENE_TEXT.title.prompt,
      blinkMs: 520,
    },
    hints: {
      x: 480,
      y: 500,
      anchor: 'top-center',
      fontSizePx: 14,
      letterSpacingPx: 1,
      text: SCENE_TEXT.title.hints,
    },
    menu: {
      x: 480,
      startY: 290,
      spacingPx: 36,
      fontSizePx: 20,
      letterSpacingPx: 3,
      cursorGlyph: '> ',
      items: ['CONTINUE', 'NEW RUN', 'SETTINGS', 'BARTS RULES'],
    },
    attract: {
      worldWidthPx: 1440,
      cameraPanPx: 192,
      cameraPanMs: 9800,
      groundY: 474,
      groundRows: 4,
      groundTileCrop: { x: 0, y: 0, w: 16, h: 16 },
      cloudDriftPx: 124,
      cloudDriftMs: 22000,
      clouds: [
        { key: 'cloud_2', x: 324, y: 98, scale: 2.5, alpha: 0.58 },
        { key: 'cloud_1', x: 868, y: 154, scale: 2.3, alpha: 0.53 },
      ],
      questionBlock: {
        x: 628,
        y: 324,
        bobPx: 6,
        bobMs: 1280,
        scale: 2.8,
      },
      coinLine: {
        startX: 548,
        y: 286,
        spacingPx: 36,
        count: 4,
        scale: 2.2,
        shimmerMs: 760,
      },
    },
  },
  typography: {
    style: 'bitmap',
    fontKey: 'hud',
    fallbackFamily: 'monospace',
    letterSpacingPx: 1,
    lineHeightPx: 16,
    casing: 'uppercase',
  },
  bloom: {
    enabled: true,
    threshold: 0.73,
    strength: 0.46,
    radius: 3,
    downsample: 2,
    tint: '#F6D58B',
  },
  playerAnimation: {
    idleThreshold: 10,
    runThreshold: 160,
    skidThreshold: 120,
    walkFps: 8,
    runFps: 12,
    landDurationMs: 80,
    hurtDurationMs: 400,
    headScaleSmall: 0.33,
    headScaleBig: 0.25,
    dustPuffAlpha: 0.6,
    dustPuffScale: 1.5,
    dustPuffLifeMs: 220,
    dustPuffCount: 3,
  },
  playerAnimationContract,
} as const;

export type StyleConfig = typeof styleConfig;

export const stylePalette = Object.fromEntries(
  styleConfig.palette.swatches.map((swatch) => [swatch.name, swatch.hex]),
) as Record<string, string>;

export default styleConfig;
