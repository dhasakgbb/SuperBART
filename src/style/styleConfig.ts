import { HUD_CONTRACT, SCENE_TEXT } from '../content/contentManifest';

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
          yOffset: 340,
          spacingPx: 320,
          scale: 3.2,
          alpha: 1,
          parallaxFactor: 0.1,
          depth: -1376,
        },
        {
          name: 'hills-near',
          key: 'hill_near',
          xOffset: 10,
          yOffset: 355,
          spacingPx: 280,
          scale: 3.6,
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
        y: 340,
        spacingPx: 320,
        scale: 3.2,
        alpha: 1.0,
        scrollFactor: 0.10,
      },
      near: {
        key: 'hill_near',
        startX: 10,
        y: 355,
        spacingPx: 280,
        scale: 3.6,
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
    worldLabels: [
      { world: 1, x: 72, y: 108 },
      { world: 2, x: 72, y: 184 },
      { world: 3, x: 72, y: 260 },
      { world: 4, x: 72, y: 336 },
      { world: 5, x: 72, y: 412 },
    ],
    mapPath: {
      textureKey: 'map_path_dot',
      scale: 1.3,
      spacingPx: 18,
      alpha: 0.88,
    },
    nodeSpriteKeys: {
      open: 'map_node_open',
      done: 'map_node_done',
      locked: 'map_node_locked',
      selected: 'map_node_selected',
    },
    nodeScale: {
      base: 1.9,
      selected: 2.2,
    },
    selectionBob: {
      distancePx: 6,
      durationMs: 420,
    },
    nodes: [
      { key: '1-1', x: 156, y: 140 }, { key: '1-2', x: 268, y: 140 }, { key: '1-3', x: 380, y: 140 },
      { key: '1-4', x: 492, y: 140 }, { key: '1-5', x: 604, y: 140 }, { key: '1-6', x: 716, y: 140 },
      { key: '2-1', x: 716, y: 216 }, { key: '2-2', x: 604, y: 216 }, { key: '2-3', x: 492, y: 216 },
      { key: '2-4', x: 380, y: 216 }, { key: '2-5', x: 268, y: 216 }, { key: '2-6', x: 156, y: 216 },
      { key: '3-1', x: 156, y: 292 }, { key: '3-2', x: 268, y: 292 }, { key: '3-3', x: 380, y: 292 },
      { key: '3-4', x: 492, y: 292 }, { key: '3-5', x: 604, y: 292 }, { key: '3-6', x: 716, y: 292 },
      { key: '4-1', x: 716, y: 368 }, { key: '4-2', x: 604, y: 368 }, { key: '4-3', x: 492, y: 368 },
      { key: '4-4', x: 380, y: 368 }, { key: '4-5', x: 268, y: 368 }, { key: '4-6', x: 156, y: 368 },
      { key: '5-1', x: 436, y: 444 },
    ],
  },
  titleLayout: {
    viewport: { width: 960, height: 540 },
    wordmark: {
      x: 480,
      y: 28,
      anchor: 'top-center',
      textureKey: 'title_logo',
      scale: 1,
      copy: 'SUPER BART',
    },
    portrait: {
      x: 744,
      y: 78,
      anchor: 'top-left',
      textureKey: 'bart_portrait_96',
      scale: 0.62,
    },
    subtitle: {
      x: 480,
      y: 230,
      anchor: 'top-center',
      fontSizePx: 20,
      letterSpacingPx: 2,
      text: SCENE_TEXT.title.subtitle,
    },
    prompt: {
      x: 480,
      y: 386,
      anchor: 'top-center',
      fontSizePx: 28,
      letterSpacingPx: 2,
      text: SCENE_TEXT.title.prompt,
      blinkMs: 420,
    },
    hints: {
      x: 480,
      y: 432,
      anchor: 'top-center',
      fontSizePx: 14,
      letterSpacingPx: 1,
      text: SCENE_TEXT.title.hints,
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
