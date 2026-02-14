#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blit,
  createImage,
  ensureDir,
  fillRect as libFillRect,
  getPixel,
  parseHex,
  setPixel as libSetPixel,
  drawLine as libDrawLine,
  writePng,
  type PixelImage,
  type Rgba,
} from './lib/pixel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// NES-inspired body palette with SNES-style shading extensions
const PALETTE_REGULAR = {
  outline: parseHex('#1D1D1D', 220),
  outlineDark: parseHex('#121214', 220),
  shirt: parseHex('#2B2B30'),  // Dark charcoal
  shirtDark: parseHex('#141418'), // Deep black shadow
  shirtLight: parseHex('#4A4A52'), // Highlight
  pants: parseHex('#1B4D95'),
  pantsDark: parseHex('#0D2A54'),
  pantsLight: parseHex('#3D72C2'),
  skin: parseHex('#E9B48E'),
  skinDark: parseHex('#BF8263'),
  skinLight: parseHex('#F5D1B8'),
  belt: parseHex('#DED256'),
  beltLight: parseHex('#F2FDFD'),
  shoe: parseHex('#2B2824'),
  shoeDark: parseHex('#1A1816'),
};

const PALETTE_FIRE = {
  ...PALETTE_REGULAR,
  shirt: parseHex('#76B900'),       // GPU Green
  shirtDark: parseHex('#0A582C'),   // Deep dark green
  shirtLight: parseHex('#A2EA32'),  // Bright green highlight
  pants: parseHex('#CF5151'),       // Red pants for fire form
  pantsDark: parseHex('#7B1F1F'),
  pantsLight: parseHex('#E36863'),
  belt: parseHex('#DC7C1D'),
  beltLight: parseHex('#F1C55F'),
};

type BodyPalette = typeof PALETTE_REGULAR;
const C = PALETTE_REGULAR; // Compatibility shadow

const SMALL_WIDTH = 32;
const SMALL_HEIGHT = 32;
const BIG_WIDTH = 32;
const BIG_HEIGHT = 48;

// Original drawing bounds (legacy NES size) to preserve offsets
const DRAW_SMALL_W = 16;
const DRAW_SMALL_H = 24;
const DRAW_BIG_W = 16;
const DRAW_BIG_H = 32;

// Offset for centering the legacy 16px drawings in 32px frames
const CX = (SMALL_WIDTH - DRAW_SMALL_W) / 2; // 8px shift
const CY_SMALL = SMALL_HEIGHT - DRAW_SMALL_H; // bottom-aligned 8px shift
const CY_BIG = BIG_HEIGHT - DRAW_BIG_H; // bottom-aligned 16px shift

// ── Offset-aware drawing helpers ────────────────────────────────

function getOffsets(img: PixelImage) {
  const oy = img.height === SMALL_HEIGHT ? CY_SMALL : CY_BIG;
  return { ox: CX, oy };
}

function fillRect(img: PixelImage, x: number, y: number, w: number, h: number, color: Rgba): void {
  const { ox, oy } = getOffsets(img);
  libFillRect(img, x + ox, y + oy, w, h, color);
}

function setPixel(img: PixelImage, x: number, y: number, color: Rgba): void {
  const { ox, oy } = getOffsets(img);
  libSetPixel(img, x + ox, y + oy, color);
}

function drawLine(img: PixelImage, x0: number, y0: number, x1: number, y1: number, color: Rgba): void {
  const { ox, oy } = getOffsets(img);
  libDrawLine(img, x0 + ox, y0 + oy, x1 + ox, y1 + oy, color);
}

/** Shaded box with automatic offsets */
function box(img: PixelImage, x: number, y: number, w: number, h: number, fill: Rgba, outlineColor: Rgba, shadow?: Rgba, highlight?: Rgba): void {
  fillRect(img, x, y, w, h, outlineColor);
  if (w > 2 && h > 2) {
    fillRect(img, x + 1, y + 1, w - 2, h - 2, fill);
    if (highlight) {
      drawLine(img, x + 1, y + 1, x + w - 2, y + 1, highlight); // Top
      drawLine(img, x + 1, y + 1, x + 1, y + h - 2, highlight); // Left
    }
    if (shadow) {
      drawLine(img, x + 2, y + h - 2, x + w - 2, y + h - 2, shadow); // Bottom
      drawLine(img, x + w - 2, y + 2, x + w - 2, y + h - 2, shadow); // Right
    }
  }
}

// Compatibility aliases for already-updated functions
function fillOffset(img: PixelImage, x: number, y: number, w: number, h: number, color: Rgba): void {
  fillRect(img, x, y, w, h, color);
}
function setOffset(img: PixelImage, x: number, y: number, color: Rgba): void {
  setPixel(img, x, y, color);
}

// ── Small body frame drawers (16x24 each) ──────────────────────

function drawSmallIdle(f: PixelImage, p: BodyPalette): void {
  // Torso (centered)
  box(f, 4, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  // Belt
  fillOffset(f, 4, 10, 8, 1, p.belt);
  setOffset(f, 4, 10, p.beltLight); // Subtle belt highlight
  setOffset(f, 11, 10, p.beltLight);
  // Arms at sides
  fillOffset(f, 2, 3, 2, 6, p.skin);
  setOffset(f, 2, 3, p.outline);
  setOffset(f, 3, 3, p.outline);
  setOffset(f, 2, 8, p.outline);
  // Highlight on arms
  setOffset(f, 3, 4, p.skinLight);
  setOffset(f, 12, 4, p.skinLight);
  
  fillOffset(f, 12, 3, 2, 6, p.skin);
  setOffset(f, 12, 3, p.outline);
  setOffset(f, 13, 3, p.outline);
  setOffset(f, 13, 8, p.outline);
  // Pants
  box(f, 4, 11, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs split
  fillOffset(f, 7, 14, 2, 2, p.outline); // gap between legs
  // Left leg
  fillOffset(f, 4, 16, 4, 4, p.pants);
  setOffset(f, 4, 16, p.outline);
  setOffset(f, 4, 19, p.outline);
  setOffset(f, 5, 17, p.pantsLight); // Leg highlight
  // Right leg
  fillOffset(f, 8, 16, 4, 4, p.pants);
  setOffset(f, 11, 16, p.outline);
  setOffset(f, 11, 19, p.outline);
  setOffset(f, 10, 17, p.pantsLight);
  // Shoes
  fillOffset(f, 3, 20, 5, 3, p.shoe);
  fillOffset(f, 8, 20, 5, 3, p.shoe);
  // Shoe shading
  setOffset(f, 4, 21, p.shoeDark);
  setOffset(f, 9, 21, p.shoeDark);
  // Shoe outline
  setOffset(f, 3, 20, p.outline);
  setOffset(f, 7, 22, p.outline);
  setOffset(f, 8, 22, p.outline);
  setOffset(f, 12, 20, p.outline);
}

function drawSmallWalk1(f: PixelImage, p: BodyPalette): void {
  // Torso
  box(f, 4, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillOffset(f, 4, 10, 8, 1, p.belt);
  // Arms swinging
  fillOffset(f, 2, 4, 2, 5, p.skin);
  setOffset(f, 2, 4, p.outline);
  setOffset(f, 2, 6, p.skinLight);
  fillOffset(f, 12, 2, 2, 5, p.skin);
  setOffset(f, 13, 2, p.outline);
  setOffset(f, 13, 4, p.skinLight);
  // Pants
  box(f, 4, 11, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Left leg forward
  fillOffset(f, 3, 15, 4, 5, p.pants);
  setOffset(f, 3, 15, p.outline);
  setOffset(f, 4, 17, p.pantsLight);
  fillOffset(f, 2, 20, 5, 3, p.shoe);
  // Right leg back
  fillOffset(f, 9, 15, 4, 4, p.pants);
  setOffset(f, 12, 15, p.outline);
  fillOffset(f, 9, 19, 5, 3, p.shoe);
}

function drawSmallWalk2(f: PixelImage, p: BodyPalette): void {
  // Torso (slight bob - 1px lower start)
  box(f, 4, 3, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillOffset(f, 4, 11, 8, 1, p.belt);
  // Arms mid
  fillOffset(f, 2, 4, 2, 5, p.skin);
  setOffset(f, 2, 4, p.outline);
  fillOffset(f, 12, 4, 2, 5, p.skin);
  setOffset(f, 13, 4, p.outline);
  // Pants
  box(f, 4, 12, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs together
  fillOffset(f, 5, 16, 3, 4, p.pants);
  fillOffset(f, 8, 16, 3, 4, p.pants);
  // Shoes
  fillOffset(f, 4, 20, 4, 3, p.shoe);
  fillOffset(f, 8, 20, 4, 3, p.shoe);
}

function drawSmallWalk3(f: PixelImage, p: BodyPalette): void {
  // Torso
  box(f, 4, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillOffset(f, 4, 10, 8, 1, p.belt);
  // Arms swinging (opposite)
  fillOffset(f, 2, 2, 2, 5, p.skin);
  setOffset(f, 2, 2, p.outline);
  setOffset(f, 2, 4, p.skinLight);
  fillOffset(f, 12, 4, 2, 5, p.skin);
  setOffset(f, 13, 4, p.outline);
  setOffset(f, 13, 6, p.skinLight);
  // Pants
  box(f, 4, 11, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Right leg forward
  fillOffset(f, 9, 15, 4, 5, p.pants);
  setOffset(f, 12, 15, p.outline);
  setOffset(f, 10, 17, p.pantsLight);
  fillOffset(f, 9, 20, 5, 3, p.shoe);
  // Left leg back
  fillOffset(f, 3, 15, 4, 4, p.pants);
  setOffset(f, 3, 15, p.outline);
  fillOffset(f, 2, 19, 5, 3, p.shoe);
}

function drawSmallRun1(f: PixelImage, p: BodyPalette): void {
  // Torso leaning forward
  box(f, 5, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 10, 8, 1, p.belt);
  // Arms pumping
  fillRect(f, 3, 2, 2, 4, p.skin);
  setPixel(f, 3, 2, p.outline);
  fillRect(f, 13, 4, 2, 5, p.skin);
  setPixel(f, 14, 4, p.outline);
  // Pants
  box(f, 5, 11, 8, 3, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Left leg far forward
  fillRect(f, 2, 14, 4, 6, p.pants);
  setPixel(f, 2, 14, p.outline);
  fillRect(f, 1, 20, 5, 3, p.shoe);
  // Right leg far back
  fillRect(f, 10, 14, 4, 4, p.pants);
  setPixel(f, 13, 14, p.outline);
  fillRect(f, 10, 18, 5, 3, p.shoe);
}

function drawSmallRun2(f: PixelImage, p: BodyPalette): void {
  // Torso leaning forward (bob)
  box(f, 5, 3, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 11, 8, 1, p.belt);
  // Arms mid
  fillRect(f, 3, 3, 2, 5, p.skin);
  setPixel(f, 3, 3, p.outline);
  fillRect(f, 13, 3, 2, 5, p.skin);
  setPixel(f, 14, 3, p.outline);
  // Pants
  box(f, 5, 12, 8, 3, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs together-ish
  fillRect(f, 5, 15, 3, 5, p.pants);
  fillRect(f, 9, 15, 3, 5, p.pants);
  fillRect(f, 4, 20, 4, 3, p.shoe);
  fillRect(f, 9, 20, 4, 3, p.shoe);
}

function drawSmallRun3(f: PixelImage, p: BodyPalette): void {
  // Torso leaning forward
  box(f, 5, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 10, 8, 1, p.belt);
  // Arms pumping (opposite)
  fillRect(f, 3, 4, 2, 5, p.skin);
  setPixel(f, 3, 4, p.outline);
  fillRect(f, 13, 2, 2, 4, p.skin);
  setPixel(f, 14, 2, p.outline);
  // Pants
  box(f, 5, 11, 8, 3, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Right leg far forward
  fillRect(f, 10, 14, 4, 6, p.pants);
  setPixel(f, 13, 14, p.outline);
  fillRect(f, 10, 20, 5, 3, p.shoe);
  // Left leg far back
  fillRect(f, 2, 14, 4, 4, p.pants);
  setPixel(f, 2, 14, p.outline);
  fillRect(f, 1, 18, 5, 3, p.shoe);
}

function drawSmallSkid(f: PixelImage, p: BodyPalette): void {
  // Torso leaning back
  box(f, 3, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 10, 8, 1, p.belt);
  // Arms bracing
  fillRect(f, 1, 3, 2, 5, p.skin);
  setPixel(f, 1, 3, p.outline);
  setPixel(f, 2, 5, p.skinLight);
  fillRect(f, 11, 2, 3, 4, p.skin);
  setPixel(f, 13, 2, p.outline);
  setPixel(f, 12, 4, p.skinLight);
  // Pants
  box(f, 3, 11, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs wide planted
  fillRect(f, 2, 15, 4, 5, p.pants);
  fillRect(f, 1, 20, 5, 3, p.shoe);
  fillRect(f, 9, 15, 4, 5, p.pants);
  fillRect(f, 9, 20, 5, 3, p.shoe);
}

function drawSmallJump(f: PixelImage, p: BodyPalette): void {
  // Torso
  box(f, 4, 1, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 9, 8, 1, p.belt);
  // Arms up
  fillRect(f, 2, 0, 2, 5, p.skin);
  setPixel(f, 2, 0, p.outline);
  setPixel(f, 2, 2, p.skinLight);
  fillRect(f, 12, 0, 2, 5, p.skin);
  setPixel(f, 13, 0, p.outline);
  setPixel(f, 13, 2, p.skinLight);
  // Pants
  box(f, 4, 10, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs tucked
  fillRect(f, 4, 14, 4, 4, p.pants);
  fillRect(f, 8, 14, 4, 4, p.pants);
  // Shoes tucked under
  fillRect(f, 3, 18, 5, 3, p.shoe);
  fillRect(f, 8, 18, 5, 3, p.shoe);
}

function drawSmallFall(f: PixelImage, p: BodyPalette): void {
  // Torso
  box(f, 4, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 10, 8, 1, p.belt);
  // Arms slightly up
  fillRect(f, 2, 1, 2, 5, p.skin);
  setPixel(f, 2, 1, p.outline);
  setPixel(f, 2, 3, p.skinLight);
  fillRect(f, 12, 1, 2, 5, p.skin);
  setPixel(f, 13, 1, p.outline);
  setPixel(f, 13, 3, p.skinLight);
  // Pants
  box(f, 4, 11, 8, 3, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs extended down
  fillRect(f, 4, 14, 4, 6, p.pants);
  fillRect(f, 8, 14, 4, 6, p.pants);
  // Shoes
  fillRect(f, 3, 20, 5, 3, p.shoe);
  fillRect(f, 8, 20, 5, 3, p.shoe);
}

function drawSmallLand(f: PixelImage, p: BodyPalette): void {
  // Torso compressed (crouch)
  box(f, 4, 6, 8, 6, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  // Arms out
  fillRect(f, 1, 7, 3, 4, p.skin);
  setPixel(f, 1, 7, p.outline);
  setPixel(f, 2, 8, p.skinLight);
  fillRect(f, 12, 7, 3, 4, p.skin);
  setPixel(f, 14, 7, p.outline);
  setPixel(f, 13, 8, p.skinLight);
  // Pants (short)
  box(f, 4, 13, 8, 3, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs bent
  fillRect(f, 3, 16, 5, 4, p.pants);
  fillRect(f, 8, 16, 5, 4, p.pants);
  // Shoes wide
  fillRect(f, 2, 20, 5, 3, p.shoe);
  fillRect(f, 9, 20, 5, 3, p.shoe);
}

function drawSmallHurt(f: PixelImage, p: BodyPalette): void {
  // Torso recoiling
  box(f, 3, 3, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 11, 8, 1, p.belt);
  // Arms flung out
  fillRect(f, 0, 2, 3, 4, p.skin);
  setPixel(f, 0, 2, p.outline);
  setPixel(f, 1, 3, p.skinLight);
  fillRect(f, 11, 1, 3, 4, p.skin);
  setPixel(f, 13, 1, p.outline);
  setPixel(f, 12, 2, p.skinLight);
  // Pants
  box(f, 4, 12, 7, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs splayed
  fillRect(f, 3, 16, 4, 4, p.pants);
  fillRect(f, 9, 16, 4, 4, p.pants);
  fillRect(f, 2, 20, 5, 3, p.shoe);
  fillRect(f, 9, 20, 5, 3, p.shoe);
}

function drawSmallWin(f: PixelImage, p: BodyPalette): void {
  // Torso
  box(f, 4, 2, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 10, 8, 1, p.belt);
  // Left arm up (victory!)
  fillRect(f, 2, 0, 2, 3, p.skin);
  setPixel(f, 2, 0, p.outline);
  setPixel(f, 2, 1, p.skinLight);
  // Right arm at side
  fillRect(f, 12, 4, 2, 5, p.skin);
  setPixel(f, 13, 4, p.outline);
  setPixel(f, 13, 6, p.skinLight);
  // Pants
  box(f, 4, 11, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs together
  fillRect(f, 5, 16, 3, 4, p.pants);
  fillRect(f, 8, 16, 3, 4, p.pants);
  fillRect(f, 4, 20, 4, 3, p.shoe);
  fillRect(f, 8, 20, 4, 3, p.shoe);
}

function drawSmallDead(f: PixelImage, p: BodyPalette): void {
  // Torso flat/ragdoll (shifted down)
  box(f, 3, 6, 10, 6, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 12, 10, 1, p.belt);
  // Arms limp
  fillRect(f, 1, 7, 2, 5, p.skin);
  setPixel(f, 1, 7, p.outline);
  fillRect(f, 13, 7, 2, 5, p.skin);
  setPixel(f, 14, 7, p.outline);
  // Pants
  box(f, 4, 13, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  // Legs flat
  fillRect(f, 4, 17, 4, 3, p.pants);
  fillRect(f, 8, 17, 4, 3, p.pants);
  fillRect(f, 3, 20, 5, 3, p.shoe);
  fillRect(f, 8, 20, 5, 3, p.shoe);
}

// ── Big body frame drawers (16x32 each) ────────────────────────
// Big form is taller: extra torso/leg height

function drawBigIdle(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  setPixel(f, 4, 12, p.beltLight);
  setPixel(f, 11, 12, p.beltLight);
  
  fillRect(f, 2, 3, 2, 8, p.skin);
  setPixel(f, 2, 3, p.outline);
  setPixel(f, 2, 10, p.outline);
  setPixel(f, 3, 4, p.skinLight);

  fillRect(f, 12, 3, 2, 8, p.skin);
  setPixel(f, 13, 3, p.outline);
  setPixel(f, 13, 10, p.outline);
  setPixel(f, 12, 4, p.skinLight);

  box(f, 4, 13, 8, 7, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 7, 18, 2, 2, p.outline);
  fillRect(f, 4, 20, 4, 6, p.pants);
  setPixel(f, 4, 20, p.outline);
  setPixel(f, 4, 25, p.outline);
  setPixel(f, 5, 21, p.pantsLight);

  fillRect(f, 8, 20, 4, 6, p.pants);
  setPixel(f, 11, 20, p.outline);
  setPixel(f, 11, 25, p.outline);
  setPixel(f, 10, 21, p.pantsLight);

  fillRect(f, 3, 26, 5, 4, p.shoe);
  fillRect(f, 8, 26, 5, 4, p.shoe);
  setPixel(f, 4, 28, p.shoeDark);
  setPixel(f, 9, 28, p.shoeDark);
  setPixel(f, 3, 26, p.outline);
  setPixel(f, 12, 26, p.outline);
}

function drawBigWalk1(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  fillRect(f, 2, 4, 2, 7, p.skin);
  setPixel(f, 2, 4, p.outline);
  setPixel(f, 2, 6, p.skinLight);

  fillRect(f, 12, 2, 2, 7, p.skin);
  setPixel(f, 13, 2, p.outline);
  setPixel(f, 13, 4, p.skinLight);

  box(f, 4, 13, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 3, 18, 4, 8, p.pants);
  setPixel(f, 3, 18, p.outline);
  setPixel(f, 4, 20, p.pantsLight);
  fillRect(f, 2, 26, 5, 4, p.shoe);

  fillRect(f, 9, 18, 4, 6, p.pants);
  setPixel(f, 12, 18, p.outline);
  fillRect(f, 9, 24, 5, 4, p.shoe);
}

function drawBigWalk2(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 3, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 13, 8, 1, p.belt);
  fillRect(f, 2, 4, 2, 8, p.skin);
  setPixel(f, 2, 4, p.outline);
  fillRect(f, 12, 4, 2, 8, p.skin);
  setPixel(f, 13, 4, p.outline);

  box(f, 4, 14, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 5, 19, 3, 7, p.pants);
  fillRect(f, 8, 19, 3, 7, p.pants);
  fillRect(f, 4, 26, 4, 4, p.shoe);
  fillRect(f, 8, 26, 4, 4, p.shoe);
}

function drawBigWalk3(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  fillRect(f, 2, 2, 2, 7, p.skin);
  setPixel(f, 2, 2, p.outline);
  setPixel(f, 2, 4, p.skinLight);

  fillRect(f, 12, 4, 2, 7, p.skin);
  setPixel(f, 13, 4, p.outline);
  setPixel(f, 13, 6, p.skinLight);

  box(f, 4, 13, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 9, 18, 4, 8, p.pants);
  setPixel(f, 12, 18, p.outline);
  setPixel(f, 10, 20, p.pantsLight);
  fillRect(f, 9, 26, 5, 4, p.shoe);

  fillRect(f, 3, 18, 4, 6, p.pants);
  setPixel(f, 3, 18, p.outline);
  fillRect(f, 2, 24, 5, 4, p.shoe);
}

function drawBigRun1(f: PixelImage, p: BodyPalette): void {
  box(f, 5, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 12, 8, 1, p.belt);
  fillRect(f, 3, 2, 2, 5, p.skin);
  setPixel(f, 3, 2, p.outline);
  setPixel(f, 3, 4, p.skinLight);

  fillRect(f, 13, 4, 2, 7, p.skin);
  setPixel(f, 14, 4, p.outline);
  setPixel(f, 14, 6, p.skinLight);

  box(f, 5, 13, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 2, 17, 4, 9, p.pants);
  setPixel(f, 2, 17, p.outline);
  setPixel(f, 3, 19, p.pantsLight);
  fillRect(f, 1, 26, 5, 4, p.shoe);

  fillRect(f, 10, 17, 4, 6, p.pants);
  setPixel(f, 13, 17, p.outline);
  fillRect(f, 10, 23, 5, 4, p.shoe);
}

function drawBigRun2(f: PixelImage, p: BodyPalette): void {
  box(f, 5, 3, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 13, 8, 1, p.belt);
  fillRect(f, 3, 3, 2, 7, p.skin);
  setPixel(f, 3, 3, p.outline);
  fillRect(f, 13, 3, 2, 7, p.skin);
  setPixel(f, 14, 3, p.outline);

  box(f, 5, 14, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 5, 18, 3, 8, p.pants);
  fillRect(f, 9, 18, 3, 8, p.pants);
  fillRect(f, 4, 26, 4, 4, p.shoe);
  fillRect(f, 9, 26, 4, 4, p.shoe);
}

function drawBigRun3(f: PixelImage, p: BodyPalette): void {
  box(f, 5, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 5, 12, 8, 1, p.belt);
  fillRect(f, 3, 4, 2, 7, p.skin);
  setPixel(f, 3, 4, p.outline);
  setPixel(f, 3, 6, p.skinLight);

  fillRect(f, 13, 2, 2, 5, p.skin);
  setPixel(f, 14, 2, p.outline);
  setPixel(f, 14, 4, p.skinLight);

  box(f, 5, 13, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 10, 17, 4, 9, p.pants);
  setPixel(f, 13, 17, p.outline);
  setPixel(f, 11, 19, p.pantsLight);
  fillRect(f, 10, 26, 5, 4, p.shoe);

  fillRect(f, 2, 17, 4, 6, p.pants);
  setPixel(f, 2, 17, p.outline);
  fillRect(f, 1, 23, 5, 4, p.shoe);
}

function drawBigSkid(f: PixelImage, p: BodyPalette): void {
  box(f, 3, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 12, 8, 1, p.belt);
  fillRect(f, 1, 3, 2, 7, p.skin);
  setPixel(f, 1, 3, p.outline);
  setPixel(f, 2, 5, p.skinLight);
  fillRect(f, 11, 2, 3, 5, p.skin);
  setPixel(f, 13, 2, p.outline);
  setPixel(f, 12, 4, p.skinLight);
  box(f, 3, 13, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 2, 18, 4, 8, p.pants);
  fillRect(f, 1, 26, 5, 4, p.shoe);
  fillRect(f, 9, 18, 4, 8, p.pants);
  fillRect(f, 9, 26, 5, 4, p.shoe);
}

function drawBigJump(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 1, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 11, 8, 1, p.belt);
  fillRect(f, 2, 0, 2, 6, p.skin);
  setPixel(f, 2, 0, p.outline);
  setPixel(f, 2, 3, p.skinLight);
  fillRect(f, 12, 0, 2, 6, p.skin);
  setPixel(f, 13, 0, p.outline);
  setPixel(f, 13, 3, p.skinLight);
  box(f, 4, 12, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 4, 17, 4, 6, p.pants);
  fillRect(f, 8, 17, 4, 6, p.pants);
  fillRect(f, 3, 23, 5, 4, p.shoe);
  fillRect(f, 8, 23, 5, 4, p.shoe);
}

function drawBigFall(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  fillRect(f, 2, 1, 2, 7, p.skin);
  setPixel(f, 2, 1, p.outline);
  setPixel(f, 2, 4, p.skinLight);
  fillRect(f, 12, 1, 2, 7, p.skin);
  setPixel(f, 13, 1, p.outline);
  setPixel(f, 13, 4, p.skinLight);
  box(f, 4, 13, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 4, 17, 4, 9, p.pants);
  fillRect(f, 8, 17, 4, 9, p.pants);
  fillRect(f, 3, 26, 5, 4, p.shoe);
  fillRect(f, 8, 26, 5, 4, p.shoe);
}

function drawBigLand(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 8, 8, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 16, 8, 1, p.belt);
  fillRect(f, 1, 9, 3, 6, p.skin);
  setPixel(f, 1, 9, p.outline);
  setPixel(f, 2, 11, p.skinLight);
  fillRect(f, 12, 9, 3, 6, p.skin);
  setPixel(f, 14, 9, p.outline);
  setPixel(f, 13, 11, p.skinLight);
  box(f, 4, 17, 8, 4, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 3, 21, 5, 5, p.pants);
  fillRect(f, 8, 21, 5, 5, p.pants);
  fillRect(f, 2, 26, 5, 4, p.shoe);
  fillRect(f, 9, 26, 5, 4, p.shoe);
}

function drawBigHurt(f: PixelImage, p: BodyPalette): void {
  box(f, 3, 3, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 13, 8, 1, p.belt);
  fillRect(f, 0, 2, 3, 5, p.skin);
  setPixel(f, 0, 2, p.outline);
  setPixel(f, 1, 4, p.skinLight);
  fillRect(f, 11, 1, 3, 5, p.skin);
  setPixel(f, 13, 1, p.outline);
  setPixel(f, 12, 3, p.skinLight);
  box(f, 4, 14, 7, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 3, 19, 4, 7, p.pants);
  fillRect(f, 9, 19, 4, 7, p.pants);
  fillRect(f, 2, 26, 5, 4, p.shoe);
  fillRect(f, 9, 26, 5, 4, p.shoe);
}

function drawBigWin(f: PixelImage, p: BodyPalette): void {
  box(f, 4, 2, 8, 10, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 4, 12, 8, 1, p.belt);
  fillRect(f, 2, 0, 2, 3, p.skin);
  setPixel(f, 2, 0, p.outline);
  setPixel(f, 2, 1, p.skinLight);
  fillRect(f, 12, 4, 2, 7, p.skin);
  setPixel(f, 13, 4, p.outline);
  setPixel(f, 13, 6, p.skinLight);
  box(f, 4, 13, 8, 7, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 5, 20, 3, 6, p.pants);
  fillRect(f, 8, 20, 3, 6, p.pants);
  fillRect(f, 4, 26, 4, 4, p.shoe);
  fillRect(f, 8, 26, 4, 4, p.shoe);
}

function drawBigDead(f: PixelImage, p: BodyPalette): void {
  box(f, 3, 8, 10, 8, p.shirt, p.outline, p.shirtDark, p.shirtLight);
  fillRect(f, 3, 16, 10, 1, p.belt);
  fillRect(f, 1, 9, 2, 7, p.skin);
  setPixel(f, 1, 9, p.outline);
  fillRect(f, 13, 9, 2, 7, p.skin);
  setPixel(f, 14, 9, p.outline);
  box(f, 4, 17, 8, 5, p.pants, p.outline, p.pantsDark, p.pantsLight);
  fillRect(f, 4, 22, 4, 4, p.pants);
  fillRect(f, 8, 22, 4, 4, p.pants);
  fillRect(f, 3, 26, 5, 4, p.shoe);
  fillRect(f, 8, 26, 5, 4, p.shoe);
}

// ── Head offset data ───────────────────────────────────────────

export interface HeadOffset {
  dx: number;
  dy: number;
}

const SMALL_HEAD_OFFSETS: HeadOffset[] = [
  { dx: 0, dy: -12 },  // 0  idle
  { dx: 0, dy: -12 },  // 1  walk_1
  { dx: 0, dy: -11 },  // 2  walk_2 (bob)
  { dx: 0, dy: -12 },  // 3  walk_3
  { dx: 1, dy: -12 },  // 4  run_1 (lean)
  { dx: 1, dy: -11 },  // 5  run_2 (lean+bob)
  { dx: 1, dy: -12 },  // 6  run_3 (lean)
  { dx: -1, dy: -12 }, // 7  skid (lean back)
  { dx: 0, dy: -13 },  // 8  jump (arms up)
  { dx: 0, dy: -12 },  // 9  fall
  { dx: 0, dy: -8 },   // 10 land (crouch)
  { dx: -1, dy: -11 }, // 11 hurt (recoil)
  { dx: 0, dy: -14 },  // 12 win (arm up)
  { dx: 0, dy: -8 },   // 13 dead (low)
];

const BIG_HEAD_OFFSETS: HeadOffset[] = [
  { dx: 0, dy: -14 },  // 0  idle
  { dx: 0, dy: -14 },  // 1  walk_1
  { dx: 0, dy: -13 },  // 2  walk_2 (bob)
  { dx: 0, dy: -14 },  // 3  walk_3
  { dx: 1, dy: -14 },  // 4  run_1 (lean)
  { dx: 1, dy: -13 },  // 5  run_2 (lean+bob)
  { dx: 1, dy: -14 },  // 6  run_3 (lean)
  { dx: -1, dy: -14 }, // 7  skid (lean back)
  { dx: 0, dy: -15 },  // 8  jump (arms up)
  { dx: 0, dy: -14 },  // 9  fall
  { dx: 0, dy: -8 },   // 10 land (crouch)
  { dx: -1, dy: -13 }, // 11 hurt (recoil)
  { dx: 0, dy: -16 },  // 12 win (arm up)
  { dx: 0, dy: -8 },   // 13 dead (low)
];

// ── Sheet assembly ─────────────────────────────────────────────

const SMALL_DRAWERS = [
  drawSmallIdle, drawSmallWalk1, drawSmallWalk2, drawSmallWalk3,
  drawSmallRun1, drawSmallRun2, drawSmallRun3, drawSmallSkid,
  drawSmallJump, drawSmallFall, drawSmallLand, drawSmallHurt,
  drawSmallWin, drawSmallDead,
];

const BIG_DRAWERS = [
  drawBigIdle, drawBigWalk1, drawBigWalk2, drawBigWalk3,
  drawBigRun1, drawBigRun2, drawBigRun3, drawBigSkid,
  drawBigJump, drawBigFall, drawBigLand, drawBigHurt,
  drawBigWin, drawBigDead,
];

function buildSheet(drawers: Array<(f: PixelImage) => void>, frameW: number, frameH: number): PixelImage {
  const cols = 7;
  const rows = Math.ceil(drawers.length / cols);
  const sheet = createImage(cols * frameW, rows * frameH, [0, 0, 0, 0]);
  drawers.forEach((drawer, i) => {
    const f = createImage(frameW, frameH, [0, 0, 0, 0]);
    drawer(f);
    const col = i % cols;
    const row = Math.floor(i / cols);
    blit(sheet, f, col * frameW, row * frameH);
  });
  return sheet;
}

function writeHeadOffsets(): void {
  const lines = [
    '// Auto-generated by tools/make_body_spritesheet.ts — do not edit manually',
    '',
    'export interface HeadOffset {',
    '  dx: number;',
    '  dy: number;',
    '}',
    '',
    'export const SMALL_HEAD_OFFSETS: readonly HeadOffset[] = [',
  ];
  for (const o of SMALL_HEAD_OFFSETS) {
    lines.push(`  { dx: ${o.dx}, dy: ${o.dy} },`);
  }
  lines.push('] as const;');
  lines.push('');
  lines.push('export const BIG_HEAD_OFFSETS: readonly HeadOffset[] = [');
  for (const o of BIG_HEAD_OFFSETS) {
    lines.push(`  { dx: ${o.dx}, dy: ${o.dy} },`);
  }
  lines.push('] as const;');
  lines.push('');

  const outPath = path.join(repoRoot, 'src/anim/headOffsets.ts');
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
}

function main(): void {
  const spriteDir = path.join(repoRoot, 'public/assets/sprites');
  ensureDir(spriteDir);

  const smallFrames = SMALL_DRAWERS.map(d => (f: PixelImage) => d(f, PALETTE_REGULAR));
  const bigFrames = BIG_DRAWERS.map(d => (f: PixelImage) => d(f, PALETTE_REGULAR));
  const fireSmall = SMALL_DRAWERS.map(d => (f: PixelImage) => d(f, PALETTE_FIRE));
  const fireBig = BIG_DRAWERS.map(d => (f: PixelImage) => d(f, PALETTE_FIRE));

  const small = buildSheet(smallFrames, SMALL_WIDTH, SMALL_HEIGHT);
  writePng(path.join(spriteDir, 'bart_body_small.png'), small);
  console.log(`wrote bart_body_small.png (${small.width}x${small.height})`);

  const big = buildSheet(bigFrames, BIG_WIDTH, BIG_HEIGHT);
  writePng(path.join(spriteDir, 'bart_body_big.png'), big);
  console.log(`wrote bart_body_big.png (${big.width}x${big.height})`);

  const fs = buildSheet(fireSmall, SMALL_WIDTH, SMALL_HEIGHT);
  writePng(path.join(spriteDir, 'bart_body_small_fire.png'), fs);
  console.log(`wrote bart_body_small_fire.png (${fs.width}x${fs.height})`);

  const fb = buildSheet(fireBig, BIG_WIDTH, BIG_HEIGHT);
  writePng(path.join(spriteDir, 'bart_body_big_fire.png'), fb);
  console.log(`wrote bart_body_big_fire.png (${fb.width}x${fb.height})`);

  writeHeadOffsets();
  console.log('wrote src/anim/headOffsets.ts');
}

main();
