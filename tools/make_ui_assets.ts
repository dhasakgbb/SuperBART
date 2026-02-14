#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import styleConfig, { contractVersion } from '../src/style/styleConfig';
import {
  blit,
  createImage,
  drawDisk,
  drawLine,
  ensureDir,
  fillRect,
  getPixel,
  parseHex,
  setPixel,
  strokeRect,
  readPng,
  type PixelImage,
  type Rgba,
  writePng,
} from './lib/pixel';

type GeneratorPass = 'all' | 'objects' | 'hud';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SWATCH_BY_NAME = new Map(styleConfig.palette.swatches.map((entry) => [entry.name, entry.hex]));
const STYLE_OUTLINE_ALPHA = Number.isFinite(styleConfig.outline.sourceAlpha) ? styleConfig.outline.sourceAlpha : 220;
const STYLE_OUTLINE_SWATCH = styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark';
const STYLE_OUTLINE_WORLD_SWATCH =
  styleConfig.outline.worldColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark';
const STYLE_OUTLINE_UI_SWATCH = styleConfig.outline.uiColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark';
const STYLE_OUTLINE_MAX_PX = Number.isFinite(styleConfig.outline.maxPx) ? Math.max(1, Math.floor(styleConfig.outline.maxPx)) : 3;
const STYLE_OUTLINE_WORLD_PX = Number.isFinite(styleConfig.outline.worldPx)
  ? Math.max(1, Math.min(Math.floor(styleConfig.outline.worldPx), STYLE_OUTLINE_MAX_PX))
  : 1;
const STYLE_OUTLINE_UI_PX = Number.isFinite(styleConfig.outline.uiPx)
  ? Math.max(1, Math.min(Math.floor(styleConfig.outline.uiPx), STYLE_OUTLINE_MAX_PX))
  : 1;
const STYLE_OUTLINE_SCHEMA_VERSION = '1.1.0';
const STYLE_OUTLINE_GENERATED_BY = 'make_ui_assets.ts';
const STYLE_OUTLINE_SOURCE = 'src/style/styleConfig.ts';
const STYLE_OUTLINE_CONTRACT_PATH = path.join(repoRoot, 'public/assets/style_outline_contract.json');

function swatchColor(swatch: string): Rgba {
  const hex = SWATCH_BY_NAME.get(swatch as any);
  if (hex == null) {
    throw new Error(`Style contract requires swatch "${swatch}" in styleConfig.palette.swatches.`);
  }
  const [r, g, b] = parseHex(hex);
  return [r, g, b, 255] as Rgba;
}

const STYLE_OUTLINE_WORLD: Rgba = [...swatchColor(STYLE_OUTLINE_WORLD_SWATCH).slice(0, 3), STYLE_OUTLINE_ALPHA] as unknown as Rgba;
const STYLE_OUTLINE_UI: Rgba = [...swatchColor(STYLE_OUTLINE_UI_SWATCH).slice(0, 3), STYLE_OUTLINE_ALPHA] as unknown as Rgba;
const STYLE_OUTLINE: Rgba = STYLE_OUTLINE_WORLD;

const COLORS = {
  inkDark: parseHex('#1D1D1D', 220),
  inkSoft: swatchColor('inkSoft'),
  inkDeep: parseHex('#0e0f12'),
  grassTop: swatchColor('grassTop'),
  grassMid: swatchColor('grassMid'),
  coinCore: swatchColor('coinCore'),
  coinEdge: swatchColor('coinEdge'),
  skyMid: swatchColor('skyMid'),
  mossDark: parseHex('#1d5e36'),
  hillFarDark: parseHex('#196228'),
  hillFarLight: parseHex('#3ea84f'),
  hillNearDark: parseHex('#2b974a'),
  hillNearLight: parseHex('#67e06f'),
  groundShadow: swatchColor('groundShadow'),
  groundMid: swatchColor('groundMid'),
  groundWarm: swatchColor('groundWarm'),
  sand: parseHex('#e2bd50'),
  hudBlue: parseHex('#245bb1'),
  hudBlueLight: parseHex('#6bb0ff'),
  hudAccent: parseHex('#ded256'),
  cloudLight: parseHex('#f6fcff'),
  cloudShade: parseHex('#dce9f4'),
  steel: parseHex('#8f98a3'),
  steelDark: parseHex('#5d6774'),
  checkpointBlue: parseHex('#37a9ef'),
  checkpointGold: parseHex('#f2cb60'),
  checkpointRed: parseHex('#cf6a50'),
  shellRust: parseHex('#8d3b2a'),
  shellShell: parseHex('#f5d7ad'),
  shellGlow: parseHex('#f79d58'),
  ghostTeal: parseHex('#38b9c8'),
  glitch: parseHex('#ff6e7a'),
  chipBlue: parseHex('#2cb6ff'),
  chipGrid: parseHex('#2b8cd6'),
  mushroomRed: parseHex('#de5b3f'),
  mushroomStem: parseHex('#f4f4f0'),
  mushroomCap: parseHex('#5ec96f'),
  mushroomOff: parseHex('#8da58d'),
  mapLockedDark: parseHex('#4a5058'),
  mapLockedLight: parseHex('#7a8491'),
  mapDoneDark: parseHex('#1d7e44'),
  mapDoneLight: parseHex('#68d17c'),
  mapOpenDark: parseHex('#215eab'),
  mapOpenLight: parseHex('#86c5ff'),
  outline: STYLE_OUTLINE_WORLD,
  outlineUi: STYLE_OUTLINE_UI,
};

const TILE_SIZE = 16;

function isTransparent(pixel: Rgba): boolean {
  return pixel[3] === 0;
}

function writeSprite(file: string, image: PixelImage): void {
  writePng(file, image);
  console.log(`Wrote ${path.relative(repoRoot, file)}`);
}

function writeOutlineContractMetadata(): void {
  const payload = {
    schemaVersion: STYLE_OUTLINE_SCHEMA_VERSION,
    generatedBy: STYLE_OUTLINE_GENERATED_BY,
    generatedAt: new Date().toISOString(),
    source: STYLE_OUTLINE_SOURCE,
    outline: {
      worldPx: STYLE_OUTLINE_WORLD_PX,
      uiPx: STYLE_OUTLINE_UI_PX,
      maxPx: STYLE_OUTLINE_MAX_PX,
      worldColor: styleConfig.outline.worldColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark',
      uiColor: styleConfig.outline.uiColor ?? styleConfig.outline.sourceColor ?? styleConfig.outline.color ?? 'inkDark',
      sourceColor: STYLE_OUTLINE_SWATCH,
      sourceAlpha: STYLE_OUTLINE_ALPHA,
      configVersion: contractVersion,
    },
  };

  fs.writeFileSync(STYLE_OUTLINE_CONTRACT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function outlinePx(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 1;
  }
  return Math.max(1, Math.min(Math.floor(raw), STYLE_OUTLINE_MAX_PX));
}

function outlineOpaquePixels(image: PixelImage, outline: Rgba, width = STYLE_OUTLINE_WORLD_PX): void {
  const safeWidth = outlinePx(width);
  const snapshot = createImage(image.width, image.height, [0, 0, 0, 0]);
  blit(snapshot, image, 0, 0);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const px = getPixel(snapshot, x, y);
      if (px[3] !== 0) {
        continue;
      }
      let hasOpaqueNeighbor = false;
      for (let yOffset = -safeWidth; yOffset <= safeWidth && !hasOpaqueNeighbor; yOffset += 1) {
        for (let xOffset = -safeWidth; xOffset <= safeWidth && !hasOpaqueNeighbor; xOffset += 1) {
          if (Math.abs(xOffset) + Math.abs(yOffset) > safeWidth || (xOffset === 0 && yOffset === 0)) {
            continue;
          }
          if (getPixel(snapshot, x + xOffset, y + yOffset)[3] > 0) {
            hasOpaqueNeighbor = true;
          }
        }
      }
      if (hasOpaqueNeighbor) {
        setPixel(image, x, y, outline);
      }
    }
  }
}

// --- Task 1: Ground Tiles Variants ---

function drawGroundTileW1(tile: PixelImage): void {
  // W1 Azure: Lush green grass top over organic brown earth
  const grass1 = [70, 186, 76, 255] as const;
  const grass2 = [32, 163, 109, 255] as const;
  const grass3 = [10, 88, 44, 255] as const;
  const dirt1 = [220, 124, 29, 255] as const;
  const dirt2 = [182, 86, 14, 255] as const;
  const dirt3 = [116, 43, 1, 255] as const;
  const ink = COLORS.inkDark;

  // Fill earth
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, dirt3);
  fillRect(tile, 0, 4, TILE_SIZE, TILE_SIZE - 4, dirt2);

  // Dirt Clusters (Organic clusters instead of math patterns)
  const clusters = [
    [2, 6], [3, 6], [2, 7], 
    [8, 10], [9, 10], [9, 11],
    [12, 5], [13, 5], [13, 6],
    [4, 12], [5, 12], [4, 13]
  ];
  clusters.forEach(([cx, cy]) => setPixel(tile, cx, cy, dirt1));

  // Multi-layered Grass
  // Top edge highlight
  fillRect(tile, 0, 0, TILE_SIZE, 1, [140, 240, 140, 255]);
  
  // Layer 1: Bright Green
  for (let x = 0; x < TILE_SIZE; x++) {
    const h = (x % 3 === 0) ? 3 : 2;
    fillRect(tile, x, 1, 1, h, grass1);
  }
  
  // Layer 2: Mid Green Clusters
  for (let x = 0; x < TILE_SIZE; x++) {
    if ((x + 1) % 4 === 0) fillRect(tile, x, 2, 1, 3, grass2);
    if ((x + 2) % 5 === 0) fillRect(tile, x, 3, 1, 2, grass2);
  }

  // Layer 3: Deep Green
  for (let x = 0; x < TILE_SIZE; x++) {
    if (getPixel(tile, x, 4)[0] === dirt2[0]) {
       if ((x * 7) % 3 === 0) setPixel(tile, x, 4, grass3);
       if ((x * 13) % 4 === 0) setPixel(tile, x, 5, grass3);
    }
  }

  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawGroundTileW2(tile: PixelImage): void {
  // W2 Pipeline: Volumetric copper/bronze industrial plating
  const copper1 = [255, 160, 60, 255] as const;
  const copper2 = [182, 86, 14, 255] as const;
  const copper3 = [90, 40, 0, 255] as const;
  const highlight = [255, 220, 160, 255] as const;
  const ink = COLORS.inkDark;

  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, copper2);
  
  // Plating Bevel
  fillRect(tile, 0, 0, TILE_SIZE, 1, highlight);
  fillRect(tile, 0, 0, 1, TILE_SIZE, highlight);
  fillRect(tile, 0, TILE_SIZE - 1, TILE_SIZE, 1, copper3);
  fillRect(tile, TILE_SIZE - 1, 0, 1, TILE_SIZE, copper3);

  // Oxidized Texture
  for (let y = 1; y < TILE_SIZE - 1; y++) {
    for (let x = 1; x < TILE_SIZE - 1; x++) {
      if ((x ^ y) % 3 === 0) setPixel(tile, x, y, copper1);
      if ((x * y) % 7 === 0) setPixel(tile, x, y, copper3);
    }
  }

  // Rivets with luster
  const rivets = [[3, 3], [12, 3], [3, 12], [12, 12]];
  rivets.forEach(([rx, ry]) => {
    setPixel(tile, rx, ry, ink);
    setPixel(tile, rx - 1, ry - 1, highlight);
  });

  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawGroundTileW3(tile: PixelImage): void {
  // W3 Enterprise: Premium corporate concrete/glass
  const gray1 = [160, 168, 179, 255] as const;
  const gray2 = [100, 110, 124, 255] as const;
  const blue = [30, 78, 163, 255] as const;
  const blueLight = [120, 180, 255, 255] as const;
  const ink = COLORS.inkDark;

  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, gray1);
  
  // Texture shading
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      if ((x + y * 11) % 5 === 0) setPixel(tile, x, y, gray2);
    }
  }

  // Modern Grid
  for (let i = 0; i < TILE_SIZE; i += 8) {
    drawLine(tile, i, 0, i, TILE_SIZE, [80, 90, 100, 255]);
    drawLine(tile, 0, i, TILE_SIZE, i, [80, 90, 100, 255]);
  }

  // Corporate Glass Trim
  fillRect(tile, 1, 1, TILE_SIZE - 2, 3, blue);
  fillRect(tile, 1, 1, TILE_SIZE - 2, 1, blueLight);
  
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawGroundTileW4(tile: PixelImage): void {
  // W4 GPU: Volcanic basalt + glowing energy veins
  const basalt1 = [43, 40, 36, 255] as const;
  const basalt2 = [20, 18, 16, 255] as const;
  const energy = [118, 185, 0, 255] as const; // NVIDIA Green
  const energyGlow = [180, 255, 60, 255] as const;
  const lava = [207, 81, 81, 255] as const;
  const ink = COLORS.inkDark;

  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, basalt2);
  
  // Basalt texture
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      if ((x ^ y) % 4 === 0) setPixel(tile, x, y, basalt1);
    }
  }

  // Energy Veins
  drawLine(tile, 3, 3, 12, 12, energy);
  drawLine(tile, 12, 3, 3, 12, energy);
  setPixel(tile, 8, 8, energyGlow);

  // Lava base heat
  fillRect(tile, 0, TILE_SIZE - 2, TILE_SIZE, 1, lava);
  for (let x = 0; x < TILE_SIZE; x += 2) setPixel(tile, x, TILE_SIZE - 3, lava);
  
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawGroundTileW5(tile: PixelImage): void {
  // W5 Benchmark: Deep red digital circuit board
  const core = [29, 29, 29, 255] as const;
  const trace = [255, 82, 82, 255] as const;
  const traceDim = [120, 40, 40, 255] as const;
  const node = [242, 253, 253, 255] as const;
  const ink = COLORS.inkDark;

  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, core);
  
  // Logic Grids
  for (let i = 0; i < TILE_SIZE; i += 4) {
    drawLine(tile, i, 0, i, TILE_SIZE, [43, 43, 48, 255]);
    drawLine(tile, 0, i, TILE_SIZE, i, [43, 43, 48, 255]);
  }

  // Circuit Traces
  drawLine(tile, 8, 2, 8, 14, traceDim);
  drawLine(tile, 2, 8, 14, 8, traceDim);
  drawLine(tile, 8, 4, 8, 12, trace);
  drawLine(tile, 4, 8, 12, 8, trace);
  
  // Digital Node
  fillRect(tile, 7, 7, 3, 3, trace);
  setPixel(tile, 8, 8, node);

  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawGroundTile(tile: PixelImage): void {
  drawGroundTileW1(tile);
}

function drawBrickTile(tile: PixelImage): void {
  // Premium Brick: Warm clay with deep shadow mortar
  const brickMid = COLORS.groundWarm;
  const brickDark = COLORS.groundShadow;
  const brickLight = [255, 180, 80, 255] as const;
  const ink = COLORS.inkDark;

  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, brickMid);
  
  // Mortar lines
  for (let y = 0; y < TILE_SIZE; y += 4) {
    fillRect(tile, 0, y, TILE_SIZE, 1, brickDark);
  }
  for (let x = 0; x < TILE_SIZE; x += 8) {
    fillRect(tile, x, 1, 1, 3, brickDark);
    fillRect(tile, (x + 4) % TILE_SIZE, 5, 1, 3, brickDark);
  }

  // Highlights
  for (let x = 0; x < TILE_SIZE; x++) {
    if ((x % 8) !== 0) {
      setPixel(tile, x, 1, brickLight);
      setPixel(tile, x, 5, brickLight);
    }
  }

  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, ink);
}

function drawPlatformTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.steelDark);
  fillRect(tile, 0, 0, TILE_SIZE, 3, COLORS.steel);
  for (let y = 3; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 2) {
      setPixel(tile, x, y, COLORS.steel);
    }
  }
  fillRect(tile, 3, 6, 10, 2, COLORS.inkSoft);
  fillRect(tile, 4, 7, 8, 1, COLORS.sand);
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
}

function drawOneWayTile(tile: PixelImage): void {
  // Premium One-Way: Sleek hover-beam platform
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  const beam = [255, 230, 0, 180] as const;
  const base = [40, 40, 60, 255] as const;
  const ink = COLORS.inkDark;

  // Metal Base
  fillRect(tile, 1, 6, 14, 4, base);
  fillRect(tile, 1, 6, 14, 1, COLORS.steel);
  
  // Glowing Hover Beam
  for (let x = 2; x < 14; x += 2) {
    setPixel(tile, x, 7, beam);
    setPixel(tile, x + 1, 8, [beam[0], beam[1], beam[2], 100]);
  }

  strokeRect(tile, 1, 6, 14, 4, ink);
}

function drawSpikeTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 0, 13, TILE_SIZE, 3, COLORS.groundShadow);
  for (let peak = 0; peak < 4; peak += 1) {
    const baseX = peak * 4;
    drawLine(tile, baseX, 13, baseX + 2, 6, COLORS.sand);
    drawLine(tile, baseX + 4, 13, baseX + 2, 6, COLORS.sand);
    fillRect(tile, baseX + 1, 10, 3, 3, [217, 230, 240, 255]);
    setPixel(tile, baseX + 2, 6, COLORS.checkpointRed);
    setPixel(tile, baseX + 2, 7, COLORS.inkDeep);
  }
  for (let x = 0; x < TILE_SIZE; x += 1) {
    setPixel(tile, x, 13, COLORS.inkDark);
  }
  strokeRect(tile, 0, 13, TILE_SIZE, 3, COLORS.inkDark);
}

function drawCheckpointTile(tile: PixelImage): void {
  // Premium Checkpoint: High-fidelity mechanical scanner
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  const base = COLORS.steelDark;
  const bar = COLORS.steel;
  const energy = COLORS.checkpointGold;
  const scanned = COLORS.checkpointBlue;
  const ink = COLORS.inkDark;

  // Base
  fillRect(tile, 3, 13, 10, 3, base);
  fillRect(tile, 4, 12, 8, 1, bar);
  
  // Vertical Pole
  fillRect(tile, 7, 2, 2, 10, bar);
  for (let y = 2; y < 12; y += 2) setPixel(tile, 7, y, ink);

  // Scanner Head
  fillRect(tile, 9, 4, 5, 6, base);
  fillRect(tile, 10, 5, 3, 2, scanned);
  fillRect(tile, 10, 7, 3, 2, energy);
  
  outlineOpaquePixels(tile, ink, 1);
}

function drawGoalTile(tile: PixelImage): void {
  // Premium Goal: AI Edition Flagpiece
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  const gold = COLORS.checkpointGold;
  const shadow = COLORS.groundShadow;
  const ink = COLORS.inkDark;

  // Heavy Base
  fillRect(tile, 2, 12, 12, 4, shadow);
  fillRect(tile, 2, 12, 12, 1, COLORS.steel);
  
  // Flagpole
  fillRect(tile, 7, 2, 2, 10, COLORS.steel);
  
  // Premium Banner
  fillRect(tile, 2, 3, 6, 7, [200, 40, 40, 255]);
  fillRect(tile, 3, 4, 4, 5, gold);
  // Banner trim
  fillRect(tile, 2, 3, 6, 1, [150, 30, 30, 255]);
  
  outlineOpaquePixels(tile, ink, 1);
}

function makeTileGround(): void {
  const tile = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  drawGroundTileW1(tile);
  writeSprite(path.join(repoRoot, 'public/assets/tiles/tile_ground.png'), tile);

  const variants = [
    { fn: drawGroundTileW1, file: 'tileset_w1.png' },
    { fn: drawGroundTileW2, file: 'tileset_w2.png' },
    { fn: drawGroundTileW3, file: 'tileset_w3.png' },
    { fn: drawGroundTileW4, file: 'tileset_w4.png' },
    { fn: drawGroundTileW5, file: 'tileset_w5.png' },
  ];

  variants.forEach((v) => {
    const tileBuilders = [
      v.fn,
      drawBrickTile,
      drawPlatformTile,
      drawOneWayTile,
      drawSpikeTile,
      drawCheckpointTile,
      drawGoalTile,
    ];
    
    const tileset = createImage(TILE_SIZE, TILE_SIZE * tileBuilders.length, [0, 0, 0, 0]);
    tileBuilders.forEach((builder, index) => {
      const t = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
      builder(t);
      blit(tileset, t, 0, index * TILE_SIZE);
    });
    
    writePng(path.join(repoRoot, `public/assets/tiles/${v.file}`), tileset);
    console.log(`Wrote public/assets/tiles/${v.file}`);
  });
}

function makeTileOneWay(): void {
  const tile = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  drawOneWayTile(tile);
  const output = path.join(repoRoot, 'public/assets/tiles/tile_oneway.png');
  writeSprite(output, tile);
}

function makeEnemyWalker(): void {
  const enemy = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(enemy, 2, 3, 11, 2, COLORS.inkDark);
  fillRect(enemy, 1, 4, 13, 7, COLORS.ghostTeal);
  fillRect(enemy, 2, 8, 2, 6, COLORS.inkDark);
  fillRect(enemy, 11, 8, 2, 6, COLORS.inkDark);
  fillRect(enemy, 3, 11, 10, 3, COLORS.inkDark);
  drawDisk(enemy, 5, 9, 2, COLORS.ghostTeal);
  drawDisk(enemy, 10, 9, 2, COLORS.ghostTeal);
  drawLine(enemy, 4, 4, 11, 4, COLORS.inkDeep);
  outlineOpaquePixels(enemy, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/enemy_walker.png');
  writeSprite(output, enemy);
}

function makeEnemyShell(): void {
  const enemy = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(enemy, 2, 4, 12, 8, COLORS.shellRust);
  fillRect(enemy, 2, 11, 12, 2, COLORS.shellShell);
  fillRect(enemy, 3, 3, 10, 2, COLORS.shellGlow);
  fillRect(enemy, 4, 5, 8, 4, COLORS.shellShell);
  drawDisk(enemy, 8, 9, 2, COLORS.shellShell);
  outlineOpaquePixels(enemy, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/enemy_shell.png');
  writeSprite(output, enemy);
}

function makeProjectile(): void {
  const proj = createImage(16, 16, [0, 0, 0, 0]);
  const core = parseHex('#D0644A');
  const light = parseHex('#F1C55F');
  
  drawDisk(proj, 8, 8, 4, core);
  drawDisk(proj, 7, 7, 2, light);
  
  outlineOpaquePixels(proj, COLORS.inkDark);
  const output = path.join(repoRoot, 'public/assets/sprites/projectile.png');
  writePng(output, proj);
}

function makeFlag(): void {
  const greenLight = parseHex('#46BA4C');
  const greenDark = parseHex('#5CB85C');
  const poleColor = parseHex('#9FA8B3');
  
  const flag = createImage(16, 16, [0, 0, 0, 0]);
  
  // Pole
  fillRect(flag, 1, 0, 1, 16, poleColor);
  fillRect(flag, 2, 0, 1, 16, parseHex('#66707C')); // Pole shadow
  
  // Pennant
  for(let y=0; y<8; y++) {
    const w = 10 - y;
    if (w > 0) {
      fillRect(flag, 3, 1+y, w, 1, greenDark);
      setPixel(flag, 3, 1+y, greenLight); // Highlight at pole attachment
    }
  }
  
  // Checkmark symbol
  const ink = COLORS.inkDark;
  setPixel(flag, 5, 4, ink);
  setPixel(flag, 6, 5, ink);
  setPixel(flag, 7, 4, ink);
  setPixel(flag, 8, 3, ink);
  
  outlineOpaquePixels(flag, ink);
  writePng(path.join(repoRoot, 'public/assets/sprites/flag.png'), flag);
}

function makeCheckpointSprite(): void {
  const tile = createImage(16, 16, [0, 0, 0, 0]);
  drawCheckpointTile(tile);
  const output = path.join(repoRoot, 'public/assets/sprites/checkpoint.png');
  writeSprite(output, tile);
}

function makeSpring(): void {
  const spring = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(spring, 4, 2, 8, 2, COLORS.inkDark);
  fillRect(spring, 5, 4, 6, 1, COLORS.inkSoft);
  fillRect(spring, 4, 6, 8, 2, COLORS.steel);
  fillRect(spring, 5, 8, 6, 1, COLORS.steelDark);
  fillRect(spring, 6, 10, 4, 2, COLORS.sand);
  for (let y = 10; y < 16; y += 1) {
    setPixel(spring, 7, y, COLORS.inkDark);
    setPixel(spring, 8, y, COLORS.inkDark);
  }
  outlineOpaquePixels(spring, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/spring.png');
  writeSprite(output, spring);
}

function makeSpike(): void {
  const spike = createImage(16, 16, [0, 0, 0, 0]);
  drawSpikeTile(spike);
  const output = path.join(repoRoot, 'public/assets/sprites/spike.png');
  writeSprite(output, spike);
}

function makeThwomp(): void {
  const t = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(t, 0, 5, 16, 8, COLORS.inkDark);
  fillRect(t, 1, 3, 14, 2, COLORS.groundShadow);
  fillRect(t, 2, 2, 12, 3, COLORS.groundMid);
  fillRect(t, 3, 1, 10, 2, COLORS.groundWarm);
  fillRect(t, 4, 4, 8, 1, COLORS.sand);
  fillRect(t, 2, 12, 12, 2, COLORS.inkDark);
  outlineOpaquePixels(t, COLORS.cloudLight);
  const output = path.join(repoRoot, 'public/assets/sprites/thwomp.png');
  writeSprite(output, t);
}

function makeMovingPlatform(): void {
  const platform = createImage(32, 8, [0, 0, 0, 0]);
  fillRect(platform, 0, 1, 32, 2, COLORS.inkDark);
  fillRect(platform, 1, 3, 30, 3, COLORS.steelDark);
  fillRect(platform, 2, 2, 28, 1, COLORS.steel);
  fillRect(platform, 2, 4, 28, 3, COLORS.inkSoft);
  for (let i = 2; i < 30; i += 4) {
    fillRect(platform, i, 4, 2, 2, COLORS.inkDark);
  }
  const output = path.join(repoRoot, 'public/assets/sprites/moving_platform.png');
  writeSprite(output, platform);
}

function makePickupEval(): void {
  // Task 1: Eval Replacement (16x16)
  const evalIcon = createImage(16, 16, [0, 0, 0, 0]);
  const white = parseHex('#F2FDFD');
  const cyan = parseHex('#50E6FF');
  const ink = COLORS.inkDark;

  // Star badge shape (5-point-ish)
  // Center
  fillRect(evalIcon, 6, 6, 4, 4, white);
  // Points
  fillRect(evalIcon, 7, 2, 2, 4, white); // Top
  fillRect(evalIcon, 3, 10, 3, 3, white); // Bottom Left
  fillRect(evalIcon, 10, 10, 3, 3, white); // Bottom Right
  fillRect(evalIcon, 2, 5, 4, 3, white); // Mid Left
  fillRect(evalIcon, 10, 5, 4, 3, white); // Mid Right

  // Cyan accents (shading)
  setPixel(evalIcon, 7, 3, cyan);
  setPixel(evalIcon, 4, 11, cyan);
  setPixel(evalIcon, 11, 11, cyan);
  setPixel(evalIcon, 3, 6, cyan);
  setPixel(evalIcon, 12, 6, cyan);

  // Checkmark in center (2x2)
  setPixel(evalIcon, 7, 8, cyan);
  setPixel(evalIcon, 8, 9, cyan);
  setPixel(evalIcon, 9, 8, cyan);
  setPixel(evalIcon, 10, 7, cyan);

  outlineOpaquePixels(evalIcon, ink);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_eval.png'), evalIcon);
}

function makePickupGPUAllocation(): void {
  // GPU Allocation Pickup (16x16 Chip)
  const chip = createImage(16, 16, [0, 0, 0, 0]);
  const blue = parseHex('#1B4D95');
  const green = parseHex('#76B900');
  const gold = parseHex('#DED256');
  
  fillRect(chip, 2, 2, 12, 12, blue);
  strokeRect(chip, 2, 2, 12, 12, parseHex('#5FA2F2'));
  // Gold processing center
  fillRect(chip, 6, 6, 4, 4, gold);
  // Pins
  for(let x=3; x<13; x+=2) {
    setPixel(chip, x, 1, green);
    setPixel(chip, x, 14, green);
    setPixel(chip, 1, x, green);
    setPixel(chip, 14, x, green);
  }
  
  outlineOpaquePixels(chip, COLORS.inkDark);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_gpu_allocation.png'), chip);
}

function makePickupCopilot(): void {
  // Copilot assistant icon (16x16 Bot)
  const bot = createImage(16, 16, [0, 0, 0, 0]);
  const gray = parseHex('#9FA8B3');
  const cyan = parseHex('#50E6FF');
  
  fillRect(bot, 4, 3, 8, 7, gray); // Head
  fillRect(bot, 5, 10, 6, 4, parseHex('#66707C')); // Neck/Body
  // Eyes
  setPixel(bot, 6, 5, cyan);
  setPixel(bot, 9, 5, cyan);
  // Antenna
  drawLine(bot, 8, 0, 8, 2, parseHex('#DC7C1D'));
  
  outlineOpaquePixels(bot, COLORS.inkDark);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_copilot_mode.png'), bot);
}

function makePickupSemanticKernel(): void {
  const icon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(icon, 2, 2, 12, 12, parseHex('#1E4EA3'));
  drawDisk(icon, 8, 8, 4, parseHex('#50E6FF'));
  outlineOpaquePixels(icon, COLORS.outline);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_semantic_kernel.png'), icon);
}


function makePickupDeployToProd(): void {
  // Deploy Flag / Box (Green package)
  const pkg = createImage(16, 16, [0, 0, 0, 0]);
  const green = parseHex('#46BA4C');
  fillRect(pkg, 2, 4, 12, 10, green);
  strokeRect(pkg, 2, 4, 12, 10, parseHex('#0A582C'));
  fillRect(pkg, 6, 2, 4, 4, parseHex('#9FA8B3')); // Shipping label
  outlineOpaquePixels(pkg, COLORS.inkDark);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_deploy_to_prod.png'), pkg);
}

function makePickupWorksOnMyMachine(): void {
  // Poison Mushroom variant (Red/Purple glitchy orb)
  const orb = createImage(16, 16, [0, 0, 0, 0]);
  drawDisk(orb, 8, 8, 6, parseHex('#9D2C2C'));
  // Glitch stripes
  setPixel(orb, 4, 6, parseHex('#FF5252'));
  setPixel(orb, 11, 10, parseHex('#FF5252'));
  outlineOpaquePixels(orb, COLORS.inkDark);
  writePng(path.join(repoRoot, 'public/assets/sprites/pickup_works_on_my_machine.png'), orb);
}

function makePickupToken(): void {
  const token = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(token, 4, 1, 8, 14, COLORS.coinCore);
  fillRect(token, 5, 2, 2, 11, COLORS.coinEdge);
  fillRect(token, 9, 2, 2, 11, COLORS.coinEdge);
  fillRect(token, 2, 3, 12, 7, COLORS.groundMid);
  fillRect(token, 3, 4, 1, 3, COLORS.inkDark);
  fillRect(token, 12, 4, 1, 3, COLORS.inkDark);
  fillRect(token, 4, 10, 8, 1, COLORS.inkDark);
  fillRect(token, 4, 12, 8, 1, COLORS.inkDark);
  fillRect(token, 2, 2, 1, 2, COLORS.inkSoft);
  fillRect(token, 13, 2, 1, 2, COLORS.inkSoft);
  outlineOpaquePixels(token, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_token.png');
  writeSprite(output, token);
}

function makeTileset(): void {
  const tileBuilders = [
    drawGroundTile,
    drawBrickTile,
    drawPlatformTile,
    drawOneWayTile,
    drawSpikeTile,
    drawCheckpointTile,
    drawGoalTile,
  ];

  const tileset = createImage(TILE_SIZE, TILE_SIZE * tileBuilders.length, [0, 0, 0, 0]);
  tileBuilders.forEach((builder, index) => {
    const tile = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
    builder(tile);
    blit(tileset, tile, 0, index * TILE_SIZE);
  });

  const output = path.join(repoRoot, 'public/assets/tiles/tileset.png');
  writePng(output, tileset);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeCoin(): void {
  // Task 1: Token (was "coin") - Vertical oval 10x8
  const token = createImage(16, 16, [0, 0, 0, 0]);
  const gold = parseHex('#DED256');
  const shadow = parseHex('#DC7C1D');
  const highlight = parseHex('#F1DD77');
  const tokenInk = COLORS.inkDark;

  // Main oval shape (8x10)
  fillRect(token, 4, 3, 8, 10, gold);
  // Corners rounding for oval
  setPixel(token, 4, 3, [0,0,0,0]);
  setPixel(token, 11, 3, [0,0,0,0]);
  setPixel(token, 4, 12, [0,0,0,0]);
  setPixel(token, 11, 12, [0,0,0,0]);

  // Shading (shadow on right and bottom)
  drawLine(token, 11, 4, 11, 11, shadow);
  drawLine(token, 5, 12, 10, 12, shadow);
  
  // Central slot line (2px wide)
  fillRect(token, 7, 5, 2, 6, shadow);
  
  // Highlight (upper-left)
  setPixel(token, 5, 4, highlight);
  setPixel(token, 6, 4, highlight);
  setPixel(token, 5, 5, highlight);

  outlineOpaquePixels(token, tokenInk);
  writePng(path.join(repoRoot, 'public/assets/sprites/coin.png'), token);
}

function makeQuestionBlock(): void {
  // Task 1: Question Block - Chunky outline, bold white "?"
  const block = createImage(16, 16, [0, 0, 0, 0]);
  const qInk = COLORS.inkDark;
  const goldFill = parseHex('#DED256');
  const innerBorder = parseHex('#F1DD77');
  const darkGold = parseHex('#DC7C1D');
  const white = parseHex('#F2FDFD');

  // 2px thick dark outline (manual stroke for control)
  fillRect(block, 0, 0, 16, 16, qInk);
  fillRect(block, 2, 2, 12, 12, goldFill);

  // Inner highlight border (1px)
  strokeRect(block, 2, 2, 12, 12, innerBorder);

  // Darker gold on bottom half for depth
  fillRect(block, 3, 8, 10, 5, darkGold);

  // Bold white "?" centered
  // Shadow for "?"
  const qShadow = qInk;
  const ox = 5, oy = 4;
  // Shadow pixels
  setPixel(block, ox+2, oy+1, qShadow);
  setPixel(block, ox+4, oy+2, qShadow);
  setPixel(block, ox+4, oy+3, qShadow);
  setPixel(block, ox+3, oy+4, qShadow);
  setPixel(block, ox+2, oy+5, qShadow);
  setPixel(block, ox+2, oy+7, qShadow);

  // White "?" pixels
  fillRect(block, ox+1, oy, 3, 1, white); // top
  setPixel(block, ox, oy+1, white);
  setPixel(block, ox+3, oy+1, white);
  setPixel(block, ox+3, oy+2, white);
  setPixel(block, ox+2, oy+3, white);
  setPixel(block, ox+1, oy+4, white);
  setPixel(block, ox+1, oy+6, white); // dot

  writePng(path.join(repoRoot, 'public/assets/sprites/question_block.png'), block);
}


function makeQuestionBlockUsed(): void {
  const block = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(block, 0, 0, 16, 16, COLORS.inkDark);
  fillRect(block, 1, 1, 14, 14, COLORS.groundMid);
  fillRect(block, 2, 2, 12, 2, COLORS.groundShadow);
  fillRect(block, 2, 13, 12, 1, COLORS.inkDark);
  for (let y = 3; y < 13; y += 1) {
    setPixel(block, 2, y, COLORS.inkDeep);
    setPixel(block, 13, y, COLORS.inkDeep);
  }
  fillRect(block, 6, 12, 4, 2, COLORS.inkDeep);
  strokeRect(block, 0, 0, 16, 16, COLORS.inkDark);

  const output = path.join(repoRoot, 'public/assets/sprites/question_block_used.png');
  writePng(output, block);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}



function drawCloud(baseWidth: number, baseHeight: number, variant: 1 | 2): PixelImage {
  const cloud = createImage(baseWidth, baseHeight, [0, 0, 0, 0]);
  const cx = baseWidth / 2;
  const cy = baseHeight / 2;
  const baseColor = COLORS.cloudLight;
  const shadeColor = COLORS.cloudShade;

  if (variant === 1) {
    drawDisk(cloud, cx, cy, baseHeight * 0.4, baseColor);
    drawDisk(cloud, cx - baseWidth * 0.2, cy + baseHeight * 0.1, baseHeight * 0.3, baseColor);
    drawDisk(cloud, cx + baseWidth * 0.2, cy + baseHeight * 0.05, baseHeight * 0.25, baseColor);
  } else {
    drawDisk(cloud, cx, cy, baseHeight * 0.4, baseColor);
    drawDisk(cloud, cx + baseWidth * 0.25, cy, baseHeight * 0.3, baseColor);
    drawDisk(cloud, cx - baseWidth * 0.2, cy + baseHeight * 0.05, baseHeight * 0.35, baseColor);
    drawDisk(cloud, cx + baseWidth * 0.1, cy - baseHeight * 0.15, baseHeight * 0.25, baseColor);
  }

  // Voluminous Shading (Dithering)
  for (let y = 0; y < cloud.height; y++) {
    for (let x = 0; x < cloud.width; x++) {
      const px = getPixel(cloud, x, y);
      if (px[3] === 0) continue;
      
      // Shade bottom-right edges
      const isBottom = y > cy + baseHeight * 0.1;
      const isRight = x > cx + baseWidth * 0.1;
      if ((isBottom || isRight) && (x + y) % 2 === 0) {
        setPixel(cloud, x, y, shadeColor);
      }
    }
  }

  outlineOpaquePixels(cloud, COLORS.outline, STYLE_OUTLINE_WORLD_PX);
  return cloud;
}

function makeClouds(): void {
  const cloud1 = drawCloud(24, 16, 1);
  const cloud2 = drawCloud(32, 18, 2);

  outlineOpaquePixels(cloud1, COLORS.outline, STYLE_OUTLINE_WORLD_PX);
  outlineOpaquePixels(cloud2, COLORS.outline, STYLE_OUTLINE_WORLD_PX);

  const out1 = path.join(repoRoot, 'public/assets/sprites/cloud_1.png');
  const out2 = path.join(repoRoot, 'public/assets/sprites/cloud_2.png');
  writePng(out1, cloud1);
  writePng(out2, cloud2);
  console.log(`Wrote ${path.relative(repoRoot, out1)}`);
  console.log(`Wrote ${path.relative(repoRoot, out2)}`);
}

type Glyph = string[];

const GLYPHS: Record<string, Glyph> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10001', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00010', '00100', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function measureWordWidth(text: string, scale: number): number {
  const step = 5 * scale + scale;
  return Math.max(0, text.length * step - scale);
}

function drawWordLayer(image: PixelImage, text: string, x: number, y: number, scale: number, color: Rgba): void {
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') {
          continue;
        }
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, scale, color);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function drawWordBevel(image: PixelImage, text: string, x: number, y: number, scale: number): void {
  // Bevel adds a light edge on top-left and dark on bottom-right inside the font
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') continue;
        const screenX = cursorX + gx * scale;
        const screenY = y + gy * scale;
        // Top-left light
        if (gx === 0 || gy === 0 || (glyph[gy-1] && glyph[gy-1][gx] !== '1') || (row[gx-1] !== '1')) {
           fillRect(image, screenX, screenY, scale, scale, [255, 255, 255, 80]);
        }
        // Bottom-right dark
        if (gx === row.length - 1 || gy === glyph.length - 1 || (glyph[gy+1] && glyph[gy+1][gx] !== '1') || (row[gx+1] !== '1')) {
           fillRect(image, screenX, screenY, scale, scale, [0, 0, 0, 60]);
        }
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function drawWordHighlights(image: PixelImage, text: string, x: number, y: number, scale: number, highlightColor: Rgba = COLORS.sand): void {
  const highlight = highlightColor;
  const highlightHeight = Math.max(1, Math.floor(scale * 0.4));
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      if (gy > 1) continue;
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') continue;
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, highlightHeight, highlight);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function drawWordGradient(image: PixelImage, text: string, x: number, y: number, scale: number, colorTop: Rgba, colorBot: Rgba): void {
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      const row = glyph[gy] ?? '';
      const color = gy < 3 ? colorTop : colorBot; // Split at row 3 (of 7)
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') {
          continue;
        }
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, scale, color);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function makeTitleLogo(): void {
  const logo = createImage(512, 160, [0, 0, 0, 0]);

  drawDisk(logo, 256, 36, 100, [246, 213, 139, 40]); // Larger glow
  drawDisk(logo, 256, 40, 140, [246, 213, 139, 24]);
  fillRect(logo, 0, 9, 512, 4, [16, 17, 22, 220]); // Thicker bars
  fillRect(logo, 0, 147, 512, 4, [16, 17, 22, 220]);

  const line1 = { text: 'SUPER', y: 12, scale: 6, colorTop: [255, 230, 150, 255] as const, colorBot: [200, 140, 40, 255] as const };
  const line2 = { text: 'BART', y: 62, scale: 9, colorTop: [255, 230, 150, 255] as const, colorBot: [200, 140, 40, 255] as const };
  const line3 = { text: 'AI EDITION', y: 132, scale: 2, colorTop: [120, 220, 255, 255] as const, colorBot: [40, 100, 220, 255] as const };

  const drawLine = (line: { text: string; y: number; scale: number; colorTop: Rgba; colorBot: Rgba }): void => {
    const width = measureWordWidth(line.text, line.scale);
    const x = Math.floor((logo.width - width) / 2);
    const dropOffsets = [
      [0, 3],
      [1, 3],
      [2, 4],
      [3, 4],
      [2, 2],
    ];
    for (const [dx, dy] of dropOffsets) {
      drawWordLayer(logo, line.text, x + dx, line.y + dy, line.scale, COLORS.inkDeep);
    }

    const outlineOffsets = [
      [-2, 0], [2, 0], [0, -2], [0, 2],
      [-2, -2], [2, -2], [-2, 2], [2, 2],
      [-3, 0], [3, 0], [0, -3], [0, 3],
    ];
    for (const [dx, dy] of outlineOffsets) {
      drawWordLayer(logo, line.text, x + dx, line.y + dy, line.scale, COLORS.inkDeep);
    }

    // Bevel for 3D depth
    drawWordBevel(logo, line.text, x, line.y, line.scale);

    // Gradient Text
    drawWordGradient(logo, line.text, x, line.y, line.scale, line.colorTop, line.colorBot);
    
    // Highlights
    const highlightColor = line.text === 'AI EDITION' ? COLORS.cloudLight : COLORS.sand;
    drawWordHighlights(logo, line.text, x, line.y, line.scale, highlightColor);
    
    // Subtle inner shadow
    drawWordLayer(logo, line.text, x + 1, line.y + 1, line.scale, [12, 12, 12, 40]);
  };

  drawLine(line1);
  drawLine(line2);
  drawLine(line3);

  // Add extra sparkle to gold words
  const addSparks = (lineText: string, y: number, scale: number) => {
    if (lineText === 'AI EDITION') return;
    const w = measureWordWidth(lineText, scale);
    const x = Math.floor((logo.width - w) / 2);
    for (let i = 0; i < 5; i++) {
      const sx = x + Math.random() * w;
      const sy = y + Math.random() * (7 * scale);
      setPixel(logo, Math.floor(sx), Math.floor(sy), [255, 255, 255, 180]);
    }
  };
  addSparks('SUPER', 12, 6);
  addSparks('BART', 62, 9);

  strokeRect(logo, 0, 0, logo.width, logo.height, [29, 29, 29, 120]);

  const output = path.join(repoRoot, 'public/assets/sprites/title_logo.png');
  writePng(output, logo);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeMapNodes(): void {
  const makeNode = (center: Rgba, edge: Rgba, rim: Rgba, detail?: (img: PixelImage) => void): PixelImage => {
    const node = createImage(16, 16, [0, 0, 0, 0]);
    drawDisk(node, 8, 8, 6, edge);
    drawDisk(node, 8, 8, 4, center);
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const px = getPixel(node, x, y);
        if (px[3] === 0) {
          continue;
        }
        if (y < 7) {
          setPixel(node, x, y, rim);
        }
      }
    }
    outlineOpaquePixels(node, COLORS.outlineUi, STYLE_OUTLINE_UI_PX);
    if (detail) {
      detail(node);
    }
    return node;
  };

  const open = makeNode(COLORS.mapOpenLight, COLORS.mapOpenDark, COLORS.hudBlueLight);
  const done = makeNode(COLORS.mapDoneLight, COLORS.mapDoneDark, COLORS.grassTop, (node) => {
    drawLine(node, 5, 8, 7, 10, COLORS.sand);
    drawLine(node, 7, 10, 11, 6, COLORS.sand);
    drawLine(node, 5, 9, 7, 11, COLORS.inkDark);
    drawLine(node, 7, 11, 11, 7, COLORS.inkDark);
  });
  const locked = makeNode(COLORS.mapLockedLight, COLORS.mapLockedDark, COLORS.steel, (node) => {
    fillRect(node, 6, 8, 4, 3, COLORS.inkDeep);
    fillRect(node, 5, 7, 6, 1, COLORS.inkDeep);
    fillRect(node, 6, 5, 1, 2, COLORS.inkDeep);
    fillRect(node, 9, 5, 1, 2, COLORS.inkDeep);
  });
  const selected = makeNode(COLORS.checkpointGold, COLORS.groundWarm, COLORS.sand, (node) => {
    drawDisk(node, 8, 8, 2, COLORS.inkDark);
    drawDisk(node, 8, 8, 1, COLORS.sand);
  });

  const pathDot = createImage(8, 8, [0, 0, 0, 0]);
  drawDisk(pathDot, 4, 4, 2, COLORS.checkpointGold);
  drawDisk(pathDot, 4, 4, 1, COLORS.sand);
  outlineOpaquePixels(pathDot, COLORS.inkDeep, STYLE_OUTLINE_UI_PX);
  outlineOpaquePixels(pathDot, COLORS.outlineUi, STYLE_OUTLINE_UI_PX);

  const outputDir = path.join(repoRoot, 'public/assets/sprites');
  const outputs: Array<{ file: string; image: PixelImage }> = [
    { file: 'map_node_open.png', image: open },
    { file: 'map_node_done.png', image: done },
    { file: 'map_node_locked.png', image: locked },
    { file: 'map_node_selected.png', image: selected },
    { file: 'map_path_dot.png', image: pathDot },
  ];

  for (const output of outputs) {
    const outputPath = path.join(outputDir, output.file);
    writePng(outputPath, output.image);
    console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
  }
}

function makeHills(): void {
  // Far Hills: Dithered dark green with subtle rim
  const far = createImage(80, 44, [0, 0, 0, 0]);
  const farDark = COLORS.hillFarDark;
  const farLight = COLORS.hillFarLight;
  
  // Base shapes
  drawDisk(far, 22, 32, 24, farDark);
  drawDisk(far, 50, 29, 24, farDark);
  drawDisk(far, 62, 32, 18, farDark);
  
  // Dithered gradient for volume
  for (let y = 10; y < 44; y++) {
    for (let x = 0; x < 80; x++) {
       const px = getPixel(far, x, y);
       if (px[3] === 0) continue;
       if (y < 25 && (x + y) % 2 === 0) setPixel(far, x, y, farLight);
       if (y < 20) setPixel(far, x, y, farLight);
    }
  }
  
  outlineOpaquePixels(far, COLORS.outline, STYLE_OUTLINE_WORLD_PX);

  // Near Hills: Lush green with highlights
  const near = createImage(88, 46, [0, 0, 0, 0]);
  const nearDark = COLORS.hillNearDark;
  const nearLight = COLORS.hillNearLight;
  
  drawDisk(near, 26, 35, 24, nearDark);
  drawDisk(near, 56, 30, 28, nearDark);
  drawDisk(near, 72, 33, 16, nearDark);
  
  // Highlighting
  for (let y = 10; y < 46; y++) {
    for (let x = 0; x < 88; x++) {
       const px = getPixel(near, x, y);
       if (px[3] === 0) continue;
       if (y < 28 && (x + y) % 2 === 0) setPixel(near, x, y, nearLight);
       if (y < 22) setPixel(near, x, y, nearLight);
    }
  }
  
  outlineOpaquePixels(near, COLORS.outline, STYLE_OUTLINE_WORLD_PX);

  const outFar = path.join(repoRoot, 'public/assets/sprites/hill_far.png');
  const outNear = path.join(repoRoot, 'public/assets/sprites/hill_near.png');
  writePng(outFar, far);
  writePng(outNear, near);
  console.log(`Wrote ${path.relative(repoRoot, outFar)}`);
  console.log(`Wrote ${path.relative(repoRoot, outNear)}`);
}

const FONT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-!?., ';

function makeBitmapFont(): void {
  const cellWidth = 8;
  const cellHeight = 8;
  const columns = 16;
  const rows = Math.ceil(FONT_CHARSET.length / columns);
  const atlas = createImage(columns * cellWidth, rows * cellHeight, [0, 0, 0, 0]);

  FONT_CHARSET.split('').forEach((char, idx) => {
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const ox = col * cellWidth + 1;
    const oy = row * cellHeight;

    glyph.forEach((line, gy) => {
      for (let gx = 0; gx < line.length; gx += 1) {
        if (line[gx] === '1') {
          setPixel(atlas, ox + gx, oy + gy, COLORS.cloudLight);
          if (gy > 0) {
            const above = getPixel(atlas, ox + gx, oy + gy - 1);
            if (above[3] === 0) {
              setPixel(atlas, ox + gx, oy + gy - 1, [18, 18, 18, 128]);
            }
          }
          if (gx + 1 < line.length) {
            const right = getPixel(atlas, ox + gx + 1, oy + gy);
            if (right[3] === 0) {
              setPixel(atlas, ox + gx + 1, oy + gy, COLORS.cloudShade);
            }
          }
        }
      }
    });
  });

  const fontDir = path.join(repoRoot, 'public/assets/fonts');
  ensureDir(fontDir);

  const pngPath = path.join(fontDir, 'bitmap_font.png');
  writePng(pngPath, atlas);
  console.log(`Wrote ${path.relative(repoRoot, pngPath)}`);

  const charLines: string[] = [];
  FONT_CHARSET.split('').forEach((char, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const x = col * cellWidth;
    const y = row * cellHeight;
    const code = char.charCodeAt(0);
    charLines.push(
      `    <char id="${code}" x="${x}" y="${y}" width="6" height="8" xoffset="0" yoffset="0" xadvance="7" page="0" chnl="0" />`,
    );
  });

  const fntXml = [
    '<?xml version="1.0"?>',
    '<font>',
    '  <info face="SuperBARTBitmap" size="8" bold="0" italic="0" charset="" unicode="0" stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1" />',
    `  <common lineHeight="8" base="7" scaleW="${atlas.width}" scaleH="${atlas.height}" pages="1" packed="0" />`,
    '  <pages>',
    '    <page id="0" file="bitmap_font.png" />',
    '  </pages>',
    `  <chars count="${FONT_CHARSET.length}">`,
    ...charLines,
    '  </chars>',
    '</font>',
    '',
  ].join('\n');

  const fntPath = path.join(fontDir, 'bitmap_font.fnt');
  fs.writeFileSync(fntPath, fntXml, 'utf-8');
  console.log(`Wrote ${path.relative(repoRoot, fntPath)}`);
}

function makeDustPuff(): void {
  const puff = createImage(8, 8, [0, 0, 0, 0] as Rgba);
  drawDisk(puff, 4, 4, 3, COLORS.cloudShade);
  drawDisk(puff, 4, 4, 2, COLORS.cloudLight);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const [r, g, b, a] = getPixel(puff, x, y);
      if (a > 0) {
        const dist = Math.sqrt((x - 4) ** 2 + (y - 4) ** 2);
        const fade = Math.max(0, 1 - dist / 3.5);
        setPixel(puff, x, y, [r, g, b, Math.round(a * fade)] as Rgba);
      }
    }
  }
  outlineOpaquePixels(puff, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/dust_puff.png');
  writePng(output, puff);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeSpark(): void {
  const spark = createImage(8, 8, [0, 0, 0, 0]);
  fillRect(spark, 3, 1, 2, 6, [255, 250, 180, 255]);
  fillRect(spark, 1, 3, 6, 2, [255, 250, 180, 255]);
  setPixel(spark, 3, 3, [255, 255, 255, 255]);
  setPixel(spark, 4, 3, [255, 255, 255, 255]);
  setPixel(spark, 3, 4, [255, 255, 255, 255]);
  setPixel(spark, 4, 4, [255, 255, 255, 255]);
  outlineOpaquePixels(spark, COLORS.outline);
  const out = path.join(repoRoot, 'public/assets/sprites/particle_spark.png');
  writePng(out, spark);
  console.log(`Wrote ${path.relative(repoRoot, out)}`);
}

function makeChainLink(): void {
  const img = createImage(8, 8, [0, 0, 0, 0]);
  fillRect(img, 2, 1, 4, 6, [160, 165, 180, 255]);
  fillRect(img, 3, 2, 2, 4, [0, 0, 0, 0]); // hole
  setPixel(img, 2, 1, COLORS.outline);
  setPixel(img, 5, 1, COLORS.outline);
  setPixel(img, 2, 6, COLORS.outline);
  setPixel(img, 5, 6, COLORS.outline);
  outlineOpaquePixels(img, COLORS.outline);
  const out = path.join(repoRoot, 'public/assets/sprites/particle_chain.png');
  writePng(out, img);
  console.log(`Wrote ${path.relative(repoRoot, out)}`);
}

function makeBossHealthBar(): void {
  const w = 128;
  const h = 8;
  const bg = createImage(w, h, [0, 0, 0, 0]);
  fillRect(bg, 0, 0, w, h, COLORS.outline);
  fillRect(bg, 1, 1, w - 2, h - 2, [60, 20, 20, 255]);
  const outBg = path.join(repoRoot, 'public/assets/sprites/boss_health_bg.png');
  writePng(outBg, bg);
  console.log(`Wrote ${path.relative(repoRoot, outBg)}`);

  const fill = createImage(w, h, [0, 0, 0, 0]);
  fillRect(fill, 1, 1, w - 2, h - 2, [220, 40, 40, 255]);
  fillRect(fill, 1, 1, w - 2, 2, [255, 100, 100, 255]);
  outlineOpaquePixels(fill, COLORS.outline);
  const outFill = path.join(repoRoot, 'public/assets/sprites/boss_health_fill.png');
  writePng(outFill, fill);
  console.log(`Wrote ${path.relative(repoRoot, outFill)}`);
}

function selectedPassFromArg(): GeneratorPass {
  const passArg = process.argv.find((arg, index, args) => arg === '--pass' && index + 1 < args.length);
  if (!passArg) {
    return 'all';
  }

  const raw = process.argv[process.argv.indexOf(passArg) + 1];
  if (raw === 'objects' || raw === 'hud' || raw === 'all') {
    return raw;
  }

  throw new Error(`Invalid --pass value: ${raw}. Expected objects|hud|all.`);
}

function runGeneratorPass(pass: GeneratorPass): void {
  const executeAll = (): void => {
    const tasks: Array<() => void> = [
      makeTileset,
      makeTileGround,
      makeTileOneWay,
      makeCoin,
      makeQuestionBlock,
      makeQuestionBlockUsed,
      makePickupToken,
      makePickupEval,
      makePickupGPUAllocation,
      makePickupCopilot,
      makePickupSemanticKernel,
      makePickupDeployToProd,
      makePickupWorksOnMyMachine,
      makeProjectile,
      makeFlag,
      makeCheckpointSprite,
      makeSpring,
      makeSpike,
      makeThwomp,
      makeMovingPlatform,
      makeClouds,
      makeHills,
      makeMapNodes,
      makeTitleLogo,
      makeBitmapFont,
      makeDustPuff,
      makeSpark,
      makeChainLink,
      makeBossHealthBar,
    ];
    for (const task of tasks) {
      task();
    }
  };

  const executeObjects = (): void => {
    const tasks: Array<() => void> = [
      makeTileGround,
      makeTileOneWay,
      makeCoin,
      makeQuestionBlock,
      makeQuestionBlockUsed,
      makePickupToken,
      makePickupEval,
      makePickupGPUAllocation,
      makePickupCopilot,
      makePickupSemanticKernel,
      makePickupDeployToProd,
      makePickupWorksOnMyMachine,
      makeProjectile,
      makeFlag,
      makeCheckpointSprite,
      makeSpring,
      makeSpike,
      makeThwomp,
      makeMovingPlatform,
    ];
    for (const task of tasks) {
      task();
    }
  };

  const executeHud = (): void => {
    const tasks: Array<() => void> = [
      makeClouds,
      makeHills,
      makeMapNodes,
      makeTitleLogo,
      makeBitmapFont,
      makeDustPuff,
    ];
    for (const task of tasks) {
      task();
    }
  };

  const runs: Record<GeneratorPass, () => void> = {
    all: executeAll,
    objects: executeObjects,
    hud: executeHud,
  };

  runs[pass]();
}

function main(): number {
  const pass = selectedPassFromArg();
  runGeneratorPass(pass);
  writeOutlineContractMetadata();
  return 0;
}

process.exitCode = main();
