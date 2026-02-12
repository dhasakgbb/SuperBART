export const styleConfig = {
  referenceImage: 'public/assets/target_look.png',
  palette: {
    swatches: [
      { name: 'inkDark', hex: '#1D1D1D' },
      { name: 'inkSoft', hex: '#2B2824' },
      { name: 'skyDeep', hex: '#0A121C' },
      { name: 'skyMid', hex: '#212826' },
      { name: 'grassTop', hex: '#46BA4C' },
      { name: 'grassMid', hex: '#20A36D' },
      { name: 'groundShadow', hex: '#742B01' },
      { name: 'groundMid', hex: '#B6560E' },
      { name: 'groundWarm', hex: '#DC7C1D' },
      { name: 'coinCore', hex: '#DED256' },
      { name: 'coinEdge', hex: '#DC7C1D' },
      { name: 'hudText', hex: '#F2FDFD' },
      { name: 'hudAccent', hex: '#DED256' },
      { name: 'hudPanel', hex: '#1F1F20' },
      { name: 'bloomWarm', hex: '#F6D58B' },
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
  },
  spriteScale: {
    tilePx: 16,
    worldBaseScale: 1,
    hudPortraitScale: 0.62,
  },
  hudLayout: {
    viewport: { width: 960, height: 540 },
    topText: {
      x: 84,
      y: 11,
      anchor: 'top-left',
      fontSizePx: 14,
    },
    rightText: {
      x: 948,
      y: 11,
      anchor: 'top-right',
      fontSizePx: 14,
    },
    portrait: {
      x: 14,
      y: 8,
      anchor: 'top-left',
      textureSizePx: 96,
      scale: 0.66,
    },
  },
  titleLayout: {
    viewport: { width: 960, height: 540 },
    wordmark: {
      x: 480,
      y: 52,
      anchor: 'top-center',
      textureKey: 'title_logo',
      scale: 1,
    },
    portrait: {
      x: 760,
      y: 98,
      anchor: 'top-left',
      textureKey: 'bart_portrait_96',
      scale: 0.58,
    },
    subtitle: {
      x: 480,
      y: 228,
      anchor: 'top-center',
      fontSizePx: 20,
      letterSpacingPx: 2,
      text: '4 WORLDS X 6 LEVELS + FINAL CASTLE',
    },
    prompt: {
      x: 480,
      y: 398,
      anchor: 'top-center',
      fontSizePx: 28,
      letterSpacingPx: 2,
      text: 'PRESS ENTER',
      blinkMs: 420,
    },
    hints: {
      x: 480,
      y: 446,
      anchor: 'top-center',
      fontSizePx: 14,
      letterSpacingPx: 1,
      text: 'N: NEW GAME   L: LEVEL SELECT   S: SETTINGS',
    },
    attract: {
      worldWidthPx: 1320,
      cameraPanPx: 168,
      cameraPanMs: 9800,
      groundY: 476,
      groundRows: 4,
      groundTileCrop: { x: 0, y: 0, w: 16, h: 16 },
      cloudDriftPx: 120,
      cloudDriftMs: 23000,
      clouds: [
        { key: 'cloud_2', x: 300, y: 104, scale: 2.2, alpha: 0.56 },
        { key: 'cloud_1', x: 790, y: 144, scale: 2, alpha: 0.5 },
      ],
      questionBlock: {
        x: 640,
        y: 340,
        bobPx: 6,
        bobMs: 1280,
        scale: 2.8,
      },
      coinLine: {
        startX: 570,
        y: 300,
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
} as const;

export type StyleConfig = typeof styleConfig;

export const stylePalette = Object.fromEntries(
  styleConfig.palette.swatches.map((swatch) => [swatch.name, swatch.hex]),
) as Record<string, string>;

export default styleConfig;
