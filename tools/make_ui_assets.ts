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
  const hex = SWATCH_BY_NAME.get(swatch);
  if (hex == null) {
    throw new Error(`Style contract requires swatch "${swatch}" in styleConfig.palette.swatches.`);
  }
  const [r, g, b] = parseHex(hex);
  return [r, g, b, 255] as Rgba;
}

const STYLE_OUTLINE_WORLD: Rgba = [...swatchColor(STYLE_OUTLINE_WORLD_SWATCH).slice(0, 3), STYLE_OUTLINE_ALPHA] as Rgba;
const STYLE_OUTLINE_UI: Rgba = [...swatchColor(STYLE_OUTLINE_UI_SWATCH).slice(0, 3), STYLE_OUTLINE_ALPHA] as Rgba;
const STYLE_OUTLINE: Rgba = STYLE_OUTLINE_WORLD;

const COLORS = {
  inkDark: swatchColor('inkDark'),
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

function drawGroundTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.groundMid);
  for (let y = 4; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const tone = (x + y) % 3;
      setPixel(tile, x, y, tone === 0 ? COLORS.groundWarm : tone === 1 ? COLORS.groundMid : COLORS.groundShadow);
    }
  }

  fillRect(tile, 0, 0, TILE_SIZE, 2, COLORS.grassTop);
  fillRect(tile, 0, 2, TILE_SIZE, 2, COLORS.grassMid);
  for (let x = 0; x < TILE_SIZE; x += 2) {
    setPixel(tile, x, 3, COLORS.mossDark);
  }
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
}

function drawBrickTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.groundWarm);
  for (let y = 0; y < TILE_SIZE; y += 4) {
    fillRect(tile, 0, y, TILE_SIZE, 1, COLORS.groundShadow);
  }
  for (let x = 0; x < TILE_SIZE; x += 8) {
    fillRect(tile, x, 4, 1, 4, COLORS.groundShadow);
    fillRect(tile, x + 4, 8, 1, 4, COLORS.groundShadow);
    fillRect(tile, x, 12, 1, 4, COLORS.groundShadow);
  }
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
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
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 1, 6, 14, 3, COLORS.groundWarm);
  fillRect(tile, 1, 9, 14, 2, COLORS.groundShadow);
  fillRect(tile, 6, 7, 4, 1, COLORS.sand);
  for (let x = 2; x < TILE_SIZE - 2; x += 4) {
    fillRect(tile, x, 6, 1, 5, COLORS.inkSoft);
  }
  strokeRect(tile, 1, 6, 14, 5, COLORS.inkDark);
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
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 7, 2, 2, 12, COLORS.steel);
  fillRect(tile, 9, 4, 5, 3, COLORS.checkpointBlue);
  fillRect(tile, 9, 7, 4, 2, COLORS.checkpointGold);
  fillRect(tile, 4, 13, 8, 2, COLORS.groundShadow);
  strokeRect(tile, 4, 13, 8, 2, COLORS.inkDark);
  strokeRect(tile, 9, 4, 5, 5, COLORS.inkDark);
  for (let y = 3; y < 14; y += 2) {
    setPixel(tile, 7, y, COLORS.inkDark);
    setPixel(tile, 8, y, COLORS.inkDark);
  }
}

function drawGoalTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 2, 12, 12, 3, COLORS.groundShadow);
  strokeRect(tile, 2, 12, 12, 3, COLORS.inkDark);
  fillRect(tile, 5, 3, 6, 9, COLORS.checkpointRed);
  fillRect(tile, 6, 4, 4, 7, COLORS.checkpointGold);
  strokeRect(tile, 5, 3, 6, 9, COLORS.inkDark);
  drawDisk(tile, 8, 8, 2, COLORS.sand);
}

function makeTileGround(): void {
  const tile = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  drawGroundTile(tile);
  const output = path.join(repoRoot, 'public/assets/tiles/tile_ground.png');
  writeSprite(output, tile);
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

function makeEnemyShellRetracted(): void {
  const enemy = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(enemy, 3, 2, 10, 11, COLORS.shellShell);
  fillRect(enemy, 3, 12, 10, 2, COLORS.shellRust);
  fillRect(enemy, 4, 4, 8, 3, COLORS.shellGlow);
  outlineOpaquePixels(enemy, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/enemy_shell_retracted.png');
  writeSprite(output, enemy);
}

function makeEnemyFlying(): void {
  const enemy = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(enemy, 0, 5, 16, 4, COLORS.inkDark);
  fillRect(enemy, 1, 3, 14, 2, COLORS.ghostTeal);
  fillRect(enemy, 2, 2, 12, 2, COLORS.chipGrid);
  drawDisk(enemy, 8, 4, 4, COLORS.cloudLight);
  fillRect(enemy, 2, 9, 12, 1, COLORS.chipBlue);
  for (let x = 2; x < 14; x += 2) {
    if (x % 4 === 0) {
      drawLine(enemy, x, 12, x + 1, 10, COLORS.ghostTeal);
    }
  }
  outlineOpaquePixels(enemy, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/enemy_flying.png');
  writeSprite(output, enemy);
}

function makeEnemySpitter(): void {
  const enemy = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(enemy, 2, 3, 12, 9, COLORS.inkDark);
  fillRect(enemy, 3, 4, 10, 2, COLORS.glitch);
  fillRect(enemy, 3, 7, 10, 3, COLORS.chipBlue);
  fillRect(enemy, 3, 10, 2, 2, COLORS.shellShell);
  fillRect(enemy, 11, 10, 2, 2, COLORS.shellShell);
  fillRect(enemy, 7, 9, 2, 3, COLORS.shellGlow);
  outlineOpaquePixels(enemy, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/enemy_spitter.png');
  writeSprite(output, enemy);
}

function makeProjectile(): void {
  const proj = createImage(8, 8, [0, 0, 0, 0]);
  fillRect(proj, 1, 2, 6, 4, COLORS.groundShadow);
  fillRect(proj, 2, 3, 4, 2, COLORS.groundWarm);
  fillRect(proj, 2, 4, 4, 1, COLORS.groundMid);
  setPixel(proj, 0, 4, COLORS.groundMid);
  setPixel(proj, 7, 4, COLORS.groundMid);
  outlineOpaquePixels(proj, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/projectile.png');
  writeSprite(output, proj);
}

function makeFlag(): void {
  const flag = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(flag, 6, 11, 3, 4, COLORS.inkDark);
  fillRect(flag, 6, 1, 4, 2, COLORS.inkDark);
  fillRect(flag, 8, 2, 5, 2, COLORS.coinCore);
  fillRect(flag, 10, 4, 2, 2, COLORS.coinEdge);
  drawLine(flag, 9, 1, 13, 1, COLORS.groundWarm);
  fillRect(flag, 9, 2, 5, 4, COLORS.checkpointGold);
  fillRect(flag, 10, 6, 4, 1, COLORS.inkDark);
  outlineOpaquePixels(flag, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/flag.png');
  writeSprite(output, flag);
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
  const evalIcon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(evalIcon, 3, 2, 10, 2, COLORS.coinCore);
  fillRect(evalIcon, 4, 4, 8, 8, COLORS.hudAccent);
  fillRect(evalIcon, 5, 5, 6, 6, COLORS.coinEdge);
  outlineOpaquePixels(evalIcon, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_eval.png');
  writeSprite(output, evalIcon);
}

function makePickupGPUAllocation(): void {
  const chip = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(chip, 2, 1, 12, 12, COLORS.chipBlue);
  fillRect(chip, 3, 2, 10, 10, COLORS.chipGrid);
  for (let i = 3; i < 13; i += 2) {
    fillRect(chip, i, 6, 1, 2, COLORS.inkDark);
    if ((i % 4) === 3) {
      fillRect(chip, i, 9, 1, 1, COLORS.hudBlueLight);
    }
  }
  fillRect(chip, 6, 3, 4, 4, COLORS.sand);
  fillRect(chip, 4, 11, 8, 2, COLORS.coinCore);
  outlineOpaquePixels(chip, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_gpu_allocation.png');
  writeSprite(output, chip);
}

function makePickupCopilot(): void {
  const icon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(icon, 2, 2, 12, 6, COLORS.skyMid);
  fillRect(icon, 3, 8, 10, 4, COLORS.groundWarm);
  fillRect(icon, 4, 4, 8, 3, COLORS.inkDark);
  for (let y = 7; y < 12; y += 1) {
    setPixel(icon, 2, y, COLORS.inkDark);
    setPixel(icon, 13, y, COLORS.inkDark);
  }
  outlineOpaquePixels(icon, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_copilot_mode.png');
  writeSprite(output, icon);
}

function makePickupSemanticKernel(): void {
  const icon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(icon, 1, 1, 14, 3, COLORS.inkDark);
  fillRect(icon, 2, 4, 12, 10, COLORS.hudBlue);
  fillRect(icon, 3, 5, 10, 8, COLORS.hudBlueLight);
  fillRect(icon, 4, 6, 8, 2, COLORS.sand);
  for (let y = 4; y < 12; y += 2) {
    fillRect(icon, 6, y, 4, 1, COLORS.inkDark);
  }
  outlineOpaquePixels(icon, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_semantic_kernel.png');
  writeSprite(output, icon);
}

function makePickupDeployToProd(): void {
  const icon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(icon, 4, 1, 8, 6, COLORS.mushroomCap);
  fillRect(icon, 5, 7, 6, 8, COLORS.mushroomStem);
  fillRect(icon, 2, 4, 11, 2, COLORS.shellShell);
  fillRect(icon, 3, 8, 4, 1, COLORS.inkDark);
  fillRect(icon, 9, 8, 4, 1, COLORS.inkDark);
  fillRect(icon, 6, 11, 4, 3, COLORS.groundMid);
  outlineOpaquePixels(icon, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_deploy_to_prod.png');
  writeSprite(output, icon);
}

function makePickupWorksOnMyMachine(): void {
  const icon = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(icon, 4, 1, 8, 6, COLORS.mushroomOff);
  fillRect(icon, 5, 7, 6, 8, COLORS.inkSoft);
  fillRect(icon, 2, 4, 11, 2, COLORS.inkDark);
  fillRect(icon, 3, 8, 4, 1, COLORS.mushroomCap);
  fillRect(icon, 9, 8, 4, 1, COLORS.mushroomCap);
  fillRect(icon, 6, 11, 4, 3, COLORS.groundShadow);
  outlineOpaquePixels(icon, COLORS.outline);
  const output = path.join(repoRoot, 'public/assets/sprites/pickup_works_on_my_machine.png');
  writeSprite(output, icon);
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
  const coin = createImage(16, 16, [0, 0, 0, 0]);
  drawDisk(coin, 8, 8, 6, COLORS.inkDark);
  drawDisk(coin, 8, 8, 5, COLORS.groundMid);
  drawDisk(coin, 8, 8, 4, COLORS.groundWarm);
  drawDisk(coin, 8, 8, 3, COLORS.checkpointGold);
  drawDisk(coin, 8, 8, 2, COLORS.sand);
  drawDisk(coin, 8, 8, 1, COLORS.inkDark);
  outlineOpaquePixels(coin, COLORS.inkDeep);

  const output = path.join(repoRoot, 'public/assets/sprites/coin.png');
  writePng(output, coin);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeQuestionBlock(): void {
  const block = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(block, 0, 0, 16, 16, COLORS.inkDark);
  fillRect(block, 1, 1, 14, 14, COLORS.groundMid);
  fillRect(block, 2, 2, 12, 12, COLORS.groundWarm);
  strokeRect(block, 1, 1, 14, 14, COLORS.groundShadow);
  const q = [
    [6, 4], [7, 4], [8, 4], [9, 5], [8, 6], [8, 7], [6, 9], [6, 10], [7, 11], [8, 10],
  ];
  q.forEach(([x, y]) => setPixel(block, x, y, COLORS.groundWarm));
  fillRect(block, 8, 12, 1, 2, COLORS.inkDark);
  fillRect(block, 2, 2, 12, 1, COLORS.inkDark);
  fillRect(block, 2, 13, 12, 1, COLORS.inkDark);
  strokeRect(block, 0, 0, 16, 16, COLORS.inkDark);

  const output = path.join(repoRoot, 'public/assets/sprites/question_block.png');
  writePng(output, block);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
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

function drawCloud(baseWidth: number, baseHeight: number, variant: 1 | 2): PixelImage {
  const cloud = createImage(baseWidth, baseHeight, [0, 0, 0, 0]);
  const puffs = variant === 1
    ? [[6, 9, 5], [12, 7, 5], [18, 9, 5]]
    : [[7, 10, 5], [13, 7, 7], [20, 7, 6], [26, 10, 5]];

  for (const [cx, cy, radius] of puffs) {
    drawDisk(cloud, cx, cy, radius, COLORS.cloudLight);
    drawDisk(cloud, cx + 1, cy + 1, Math.max(2, radius - 1), COLORS.cloudShade);
  }

  for (let y = 0; y < cloud.height; y += 1) {
    for (let x = 0; x < cloud.width; x += 1) {
      const pixel = getPixel(cloud, x, y);
      if (pixel[3] === 0) {
        continue;
      }
      const topBand = y < cloud.height / 2;
      if (topBand) {
        setPixel(cloud, x, y, COLORS.cloudLight);
      } else if ((x + y) % 3 === 0) {
        setPixel(cloud, x, y, COLORS.cloudShade);
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

function drawWordHighlights(image: PixelImage, text: string, x: number, y: number, scale: number): void {
  const highlight = COLORS.sand;
  const highlightHeight = Math.max(1, Math.floor(scale * 0.5));
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      if (gy > 1) {
        continue;
      }
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') {
          continue;
        }
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, highlightHeight, highlight);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function makeTitleLogo(): void {
  const logo = createImage(512, 160, [0, 0, 0, 0]);

  drawDisk(logo, 256, 36, 82, [246, 213, 139, 26]);
  drawDisk(logo, 256, 40, 112, [246, 213, 139, 16]);
  fillRect(logo, 0, 9, 512, 2, [16, 17, 22, 190]);
  fillRect(logo, 0, 149, 512, 2, [16, 17, 22, 190]);

  const line1 = { text: 'SUPER', y: 20, scale: 7 };
  const line2 = { text: 'BART', y: 86, scale: 8 };

  const drawLine = (line: { text: string; y: number; scale: number }): void => {
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

    drawWordLayer(logo, line.text, x, line.y + 1, line.scale, COLORS.groundMid);
    drawWordLayer(logo, line.text, x, line.y, line.scale, COLORS.checkpointGold);
    drawWordLayer(logo, line.text, x, line.y - 1, line.scale, COLORS.sand);
    drawWordHighlights(logo, line.text, x, line.y, line.scale);
    drawWordLayer(logo, line.text, x + 1, line.y + 1, line.scale, [12, 12, 12, 60]);
  };

  drawLine(line1);
  drawLine(line2);

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
  const far = createImage(80, 44, [0, 0, 0, 0]);
  drawDisk(far, 22, 32, 24, COLORS.hillFarDark);
  drawDisk(far, 50, 29, 24, COLORS.hillFarDark);
  drawDisk(far, 62, 32, 18, COLORS.hillFarDark);
  drawDisk(far, 48, 20, 12, COLORS.hillFarLight);
  drawDisk(far, 24, 22, 10, COLORS.hillFarLight);
  drawDisk(far, 0, 43, 16, COLORS.hillFarDark);
  fillRect(far, 2, 34, 18, 1, COLORS.hillFarLight);
  fillRect(far, 45, 31, 10, 1, COLORS.hillFarLight);
  outlineOpaquePixels(far, COLORS.outline, STYLE_OUTLINE_WORLD_PX);

  const near = createImage(88, 46, [0, 0, 0, 0]);
  drawDisk(near, 26, 35, 24, COLORS.hillNearDark);
  drawDisk(near, 56, 30, 28, COLORS.hillNearDark);
  drawDisk(near, 72, 33, 16, COLORS.hillNearDark);
  drawDisk(near, 52, 22, 14, COLORS.hillNearLight);
  drawDisk(near, 28, 24, 10, COLORS.hillNearLight);
  fillRect(near, 10, 32, 30, 1, COLORS.hillNearLight);
  fillRect(near, 60, 26, 10, 1, COLORS.hillNearLight);
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
  const output = path.join(repoRoot, 'public/assets/sprites/dust_puff.png');
  writePng(output, puff);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
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
      makeEnemyWalker,
      makeEnemyShell,
      makeEnemyShellRetracted,
      makeEnemyFlying,
      makeEnemySpitter,
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
      makeEnemyWalker,
      makeEnemyShell,
      makeEnemyShellRetracted,
      makeEnemyFlying,
      makeEnemySpitter,
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
