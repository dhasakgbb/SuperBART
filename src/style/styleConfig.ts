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
      x: 12,
      y: 10,
      anchor: 'top-left',
      fontSizePx: 16,
    },
    rightText: {
      x: 786,
      y: 10,
      anchor: 'top-left',
      fontSizePx: 14,
    },
    portrait: {
      x: 910,
      y: 74,
      anchor: 'top-left',
      textureSizePx: 96,
      scale: 0.62,
    },
  },
  typography: {
    style: 'bitmap',
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
