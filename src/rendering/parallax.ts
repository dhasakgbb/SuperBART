import Phaser from 'phaser';
import { stylePalette, type StyleConfig } from '../style/styleConfig';

type ParallaxLayerInput = {
  name: string;
  key: string;
  x?: number;
  y?: number;
  xOffset?: number;
  yOffset?: number;
  spacingPx: number;
  scale: number;
  alpha: number;
  parallaxFactor?: number;
  scrollFactor?: number;
  driftPx?: number;
  driftMs?: number;
  driftSpeedMs?: number;
  depth: number;
  glow?: {
    offsetX: number;
    offsetY: number;
    scale: number;
    alpha: number;
    color: string;
    blendMode?: string | number;
  };
};

type ParallaxLayer = {
  name: string;
  key: string;
  x: number;
  y: number;
  spacingPx: number;
  scale: number;
  alpha: number;
  scrollFactor: number;
  driftPx?: number;
  driftMs: number;
  depth: number;
  glow?: {
    offsetX: number;
    offsetY: number;
    scale: number;
    alpha: number;
    color: string;
    blendMode?: string | number;
  };
};

type ParallaxProfile = {
  enabled: boolean;
  layers: ParallaxLayerInput[];
  depthCue?: {
    enabled: boolean;
    topSwatch: string;
    midSwatch: string;
    startY: number;
    bandHeightPx: number;
    maxAlpha: number;
    bands: number;
  };
  fallback?: {
    toClouds: boolean;
  };
};

type RenderInstance = {
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  baseX: number;
  baseGlowX: number;
};

type GameplayLayout = StyleConfig['gameplayLayout'] & { parallaxProfile?: ParallaxProfile };

const SKY_DEPTH = -1400;
const HORIZON_DEPTH = -1394;
const HAZE_DEPTH = -1389;

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function toColor(swatch: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[swatch] ?? '#ffffff').color;
}

function colorObject(swatch: string): Phaser.Display.Color {
  return Phaser.Display.Color.ValueToColor(toColor(swatch));
}

function parseBlendMode(raw?: string | number): Phaser.BlendModes | number {
  if (raw == null) {
    return Phaser.BlendModes.NORMAL;
  }
  if (typeof raw === 'number') {
    return raw;
  }
  const keys = Phaser.BlendModes as unknown as Record<string, number>;
  return keys[raw] ?? Phaser.BlendModes.NORMAL;
}

function wrap(value: number, modulo: number): number {
  const rem = value % modulo;
  return rem < 0 ? rem + modulo : rem;
}

function pickScrollFactor(layer: ParallaxLayerInput): number {
  return layer.scrollFactor ?? layer.parallaxFactor ?? 0;
}

function pickDriftMs(layer: ParallaxLayerInput): number {
  return layer.driftSpeedMs ?? layer.driftMs ?? 0;
}

function normalizeLayer(layer: ParallaxLayerInput): ParallaxLayer {
  return {
    name: layer.name,
    key: layer.key,
    x: layer.x ?? layer.xOffset ?? 0,
    y: layer.y ?? layer.yOffset ?? 0,
    spacingPx: layer.spacingPx,
    scale: layer.scale,
    alpha: layer.alpha,
    scrollFactor: pickScrollFactor(layer),
    driftPx: layer.driftPx,
    driftMs: pickDriftMs(layer),
    depth: layer.depth,
    glow: layer.glow,
  };
}

function resolveProfile(layout: GameplayLayout): ParallaxProfile | undefined {
  return layout.parallaxProfile;
}

function resolveLayers(layout: GameplayLayout): ParallaxLayer[] {
  const profile = resolveProfile(layout);
  if (profile?.enabled === true && profile.layers.length > 0) {
    return [...profile.layers.map(normalizeLayer)].sort((a, b) => a.depth - b.depth);
  }

  const fallbackLayers: ParallaxLayerInput[] = [];
  const includeClouds = profile?.fallback?.toClouds ?? true;

  if (includeClouds) {
    fallbackLayers.push(
      ...layout.clouds.map((cloud) => ({
        name: `cloud-${cloud.key}`,
        key: cloud.key,
        x: cloud.x,
        y: cloud.y,
        spacingPx: cloud.spacingPx,
        scale: cloud.scale,
        alpha: cloud.alpha,
        scrollFactor: cloud.scrollFactor,
        driftPx: cloud.driftPx,
        driftMs: cloud.driftMs,
        depth: -1388,
      })),
    );
  }

  fallbackLayers.push(
    {
      name: 'hills-far',
      key: layout.hills.far.key,
      x: layout.hills.far.startX,
      y: layout.hills.far.y,
      spacingPx: layout.hills.far.spacingPx,
      scale: layout.hills.far.scale,
      alpha: layout.hills.far.alpha,
      scrollFactor: layout.hills.far.scrollFactor,
      depth: -1376,
    },
    {
      name: 'hills-near',
      key: layout.hills.near.key,
      x: layout.hills.near.startX,
      y: layout.hills.near.y,
      spacingPx: layout.hills.near.spacingPx,
      scale: layout.hills.near.scale,
      alpha: layout.hills.near.alpha,
      scrollFactor: layout.hills.near.scrollFactor,
      depth: -1372,
    },
  );

  return fallbackLayers.map(normalizeLayer).sort((a, b) => a.depth - b.depth);
}

function renderSky(scene: Phaser.Scene, width: number, height: number, layout: GameplayLayout): void {
  const top = colorObject(layout.sky.topSwatch);
  const bottom = colorObject(layout.sky.bottomSwatch);
  const graphics = scene.add.graphics();

  const skyBands = 20;
  const bandHeight = Math.max(1, Math.ceil(height / skyBands));
  for (let i = 0; i < skyBands; i += 1) {
    const step = i / (skyBands - 1 || 1);
    const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, skyBands - 1 || 1, step * (skyBands - 1 || 1));
    graphics
      .fillStyle(Phaser.Display.Color.GetColor(mixed.r, mixed.g, mixed.b), 1)
      .fillRect(0, i * bandHeight, width, bandHeight);
  }
  graphics.setScrollFactor(0).setDepth(SKY_DEPTH);

  const profile = resolveProfile(layout);
  const cue = profile?.depthCue;
  if (!cue?.enabled) {
    return;
  }

  const cueTop = colorObject(cue.topSwatch);
  const cueMid = colorObject(cue.midSwatch);
  const bandRows = Math.max(1, cue.bands);
  const cueHeight = Math.max(1, cue.bandHeightPx);
  const cueStart = Math.max(0, cue.startY);
  for (let i = 0; i < bandRows; i += 1) {
    const blended = Phaser.Display.Color.Interpolate.ColorWithColor(cueTop, cueMid, bandRows - 1 || 1, i);
    const t = bandRows > 1 ? i / (bandRows - 1) : 0;
    const stripHeight = Math.max(1, Math.floor(cueHeight / bandRows));
    graphics
      .fillStyle(Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b), cue.maxAlpha * (1 - t))
      .fillRect(0, cueStart + i * stripHeight, width, stripHeight);
  }
  graphics.setDepth(HORIZON_DEPTH);
}

function renderHaze(scene: Phaser.Scene, width: number, height: number, layout: GameplayLayout): void {
  const haze = layout.haze;
  if (!haze) {
    return;
  }

  const y = Math.round(clamp(haze.y, 0, height - 1));
  const bandHeight = Math.max(1, Math.round(clamp(haze.heightPx, 1, Math.max(1, height - y))));
  const widthFactor = clamp01(haze.widthFactor);
  const bandWidth = Math.max(1, Math.min(width, Math.round(width * widthFactor)));
  const left = Math.max(0, Math.floor((width - bandWidth) / 2));
  const edgeFadeWidth = Math.max(1, Math.round(bandWidth * 0.08));
  const alpha = clamp01(haze.alpha);
  if (alpha <= 0) {
    return;
  }

  const color = Phaser.Display.Color.ValueToColor(toColor('bloomWarm'));
  const graphics = scene.add.graphics();
  graphics.setScrollFactor(0).setDepth(HAZE_DEPTH).setBlendMode(Phaser.BlendModes.ADD);

  for (let row = 0; row < bandHeight; row += 1) {
    const yPos = y + row;
    if (yPos >= height) {
      break;
    }

    const tRow = bandHeight > 1 ? row / (bandHeight - 1) : 0;
    const rowFade = 1 - Math.abs(tRow - 0.5) * 2;
    const localAlpha = alpha * clamp01(rowFade);
    if (localAlpha <= 0) {
      continue;
    }

    for (let col = 0; col < bandWidth; col += 1) {
      const xPos = left + col;
      if (xPos >= width) {
        break;
      }
      const distToEdge = Math.min(col, bandWidth - col - 1);
      const edgeFade = Math.min(1, distToEdge / edgeFadeWidth);
      const pixelAlpha = localAlpha * edgeFade;
      if (pixelAlpha <= 0) {
        continue;
      }
      graphics.fillStyle(color.color, pixelAlpha * 0.85);
      graphics.fillRect(xPos, yPos, 1, 1);
    }
  }
}

function renderLayer(scene: Phaser.Scene, width: number, layer: ParallaxLayer): RenderInstance[] {
  const texture = scene.textures.get(layer.key);
  const source = texture.getSourceImage();
  const textureWidth = (source?.width ?? 0) * layer.scale;
  const step = Math.max(layer.spacingPx, textureWidth);
  if (textureWidth <= 0 || step <= 0) {
    return [];
  }

  const result: RenderInstance[] = [];
  for (let x = -step; x <= width + step; x += step) {
    const baseX = x + layer.x;
    const sprite = scene.add
      .image(baseX, layer.y, layer.key)
      .setScale(layer.scale)
      .setAlpha(layer.alpha)
      .setDepth(layer.depth)
      .setScrollFactor(0)
      .setOrigin(0.5, 0.5);

    const entry: RenderInstance = {
      sprite,
      baseX,
      baseGlowX: baseX,
    };

    if (layer.glow) {
      const glow = scene.add
        .image(baseX + layer.glow.offsetX, layer.y + layer.glow.offsetY, layer.key)
        .setScale(layer.scale + layer.glow.scale)
        .setAlpha(layer.glow.alpha)
        .setTint(toColor(layer.glow.color))
        .setDepth(layer.depth - 1)
        .setScrollFactor(0)
        .setOrigin(0.5, 0.5)
        .setBlendMode(parseBlendMode(layer.glow.blendMode));
      entry.glow = glow;
      entry.baseGlowX = baseX + layer.glow.offsetX;
    }

    result.push(entry);
  }

  return result;
}

function renderParallaxLayers(scene: Phaser.Scene, width: number, layers: ParallaxLayer[]): void {
  const camera = scene.cameras.main;
  const layerState: Array<{ layer: ParallaxLayer; instances: RenderInstance[] }> = layers.map((layer) => ({
    layer,
    instances: renderLayer(scene, width, layer),
  }));

  const onPostUpdate = (): void => {
    for (const bucket of layerState) {
      const { layer, instances } = bucket;
      if (instances.length === 0) {
        continue;
      }

      const texture = scene.textures.get(layer.key);
      const source = texture.getSourceImage();
      const textureWidth = Math.max(1, (source?.width ?? 1) * layer.scale);
      const rawOffsetX = camera.scrollX * (1 - layer.scrollFactor);
      const renderOffsetX = wrap(rawOffsetX, textureWidth);
      const drift = (layer.driftPx && layer.driftMs > 0)
        ? Math.sin((scene.time.now / layer.driftMs) * Math.PI * 2) * layer.driftPx
        : 0;

      for (const item of instances) {
        item.sprite.x = item.baseX - renderOffsetX + drift;
        if (item.glow) {
          item.glow.x = item.baseGlowX - renderOffsetX + drift;
        }
      }
    }
  };

  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

  onPostUpdate();
}

export interface WorldPaletteOverride {
  skyTop: number;
  skyBottom: number;
  accent: number;
}

export function renderGameplayBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  layout: StyleConfig['gameplayLayout'],
  worldPalette?: WorldPaletteOverride,
): void {
  if (worldPalette) {
    renderSkyDirect(scene, width, height, worldPalette.skyTop, worldPalette.skyBottom, layout as GameplayLayout);
  } else {
    renderSky(scene, width, height, layout as GameplayLayout);
  }
  const layers = resolveLayers(layout as GameplayLayout);
  renderParallaxLayers(scene, width, layers);
  renderHaze(scene, width, height, layout as GameplayLayout);
}

/** Render sky gradient using direct color values (no swatch lookup). */
function renderSkyDirect(
  scene: Phaser.Scene,
  width: number,
  height: number,
  topColor: number,
  bottomColor: number,
  layout: GameplayLayout,
): void {
  const top = Phaser.Display.Color.IntegerToColor(topColor);
  const bottom = Phaser.Display.Color.IntegerToColor(bottomColor);
  const graphics = scene.add.graphics();

  const skyBands = 20;
  const bandHeight = Math.max(1, Math.ceil(height / skyBands));
  for (let i = 0; i < skyBands; i += 1) {
    const step = i / (skyBands - 1 || 1);
    const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, skyBands - 1 || 1, step * (skyBands - 1 || 1));
    graphics
      .fillStyle(Phaser.Display.Color.GetColor(mixed.r, mixed.g, mixed.b), 1)
      .fillRect(0, i * bandHeight, width, bandHeight);
  }
  graphics.setScrollFactor(0).setDepth(SKY_DEPTH);

  // Still render depth cue if present
  const profile = resolveProfile(layout);
  const cue = profile?.depthCue;
  if (!cue?.enabled) {
    return;
  }

  const cueTop = colorObject(cue.topSwatch);
  const cueMid = colorObject(cue.midSwatch);
  const bandRows = Math.max(1, cue.bands);
  const cueHeight = Math.max(1, cue.bandHeightPx);
  const cueStart = Math.max(0, cue.startY);
  for (let i = 0; i < bandRows; i += 1) {
    const blended = Phaser.Display.Color.Interpolate.ColorWithColor(cueTop, cueMid, bandRows - 1 || 1, i);
    const t = bandRows > 1 ? i / (bandRows - 1) : 0;
    const stripHeight = Math.max(1, Math.floor(cueHeight / bandRows));
    graphics
      .fillStyle(Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b), cue.maxAlpha * (1 - t))
      .fillRect(0, cueStart + i * stripHeight, width, stripHeight);
  }
  graphics.setDepth(HORIZON_DEPTH);
}
