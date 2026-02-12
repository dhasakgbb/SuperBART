#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blit,
  createImage,
  fillRect,
  setPixel,
  parseHex,
  type PixelImage,
  type Rgba,
  writePng,
  ensureDir,
} from './lib/pixel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// NES-inspired body palette
const C = {
  outline: parseHex('#1D1D1D'),
  shirt: parseHex('#CF5151'),
  shirtDark: parseHex('#9D2C2C'),
  pants: parseHex('#1B4D95'),
  pantsDark: parseHex('#102D5A'),
  skin: parseHex('#E9B48E'),
  skinDark: parseHex('#BF8263'),
  shoe: parseHex('#2B2824'),
  belt: parseHex('#DED256'),
};

const FRAME_W = 16;
const FRAME_H_SMALL = 24;
const FRAME_H_BIG = 32;

// ── Pixel drawing helpers ──────────────────────────────────────

/** Draw a filled rectangle with outline */
function box(img: PixelImage, x: number, y: number, w: number, h: number, fill: Rgba, outline: Rgba): void {
  fillRect(img, x, y, w, h, outline);
  if (w > 2 && h > 2) {
    fillRect(img, x + 1, y + 1, w - 2, h - 2, fill);
  }
}

// ── Small body frame drawers (16x24 each) ──────────────────────

function drawSmallIdle(f: PixelImage): void {
  // Torso (centered)
  box(f, 4, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 2, C.shirtDark); // shadow fold
  // Belt
  fillRect(f, 4, 10, 8, 1, C.belt);
  // Arms at sides
  fillRect(f, 2, 3, 2, 6, C.skin);
  setPixel(f, 2, 3, C.outline);
  setPixel(f, 3, 3, C.outline);
  setPixel(f, 2, 8, C.outline);
  fillRect(f, 12, 3, 2, 6, C.skin);
  setPixel(f, 12, 3, C.outline);
  setPixel(f, 13, 3, C.outline);
  setPixel(f, 13, 8, C.outline);
  // Pants
  box(f, 4, 11, 8, 5, C.pants, C.outline);
  fillRect(f, 8, 12, 3, 3, C.pantsDark);
  // Legs split
  fillRect(f, 7, 14, 2, 2, C.outline); // gap between legs
  // Left leg
  fillRect(f, 4, 16, 4, 4, C.pants);
  setPixel(f, 4, 16, C.outline);
  setPixel(f, 4, 19, C.outline);
  // Right leg
  fillRect(f, 8, 16, 4, 4, C.pants);
  setPixel(f, 11, 16, C.outline);
  setPixel(f, 11, 19, C.outline);
  // Shoes
  fillRect(f, 3, 20, 5, 3, C.shoe);
  fillRect(f, 8, 20, 5, 3, C.shoe);
  // Shoe outline
  setPixel(f, 3, 20, C.outline);
  setPixel(f, 7, 22, C.outline);
  setPixel(f, 8, 22, C.outline);
  setPixel(f, 12, 20, C.outline);
}

function drawSmallWalk1(f: PixelImage): void {
  // Torso
  box(f, 4, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 2, C.shirtDark);
  fillRect(f, 4, 10, 8, 1, C.belt);
  // Arms swinging
  fillRect(f, 2, 4, 2, 5, C.skin);
  setPixel(f, 2, 4, C.outline);
  fillRect(f, 12, 2, 2, 5, C.skin);
  setPixel(f, 13, 2, C.outline);
  // Pants
  box(f, 4, 11, 8, 4, C.pants, C.outline);
  // Left leg forward
  fillRect(f, 3, 15, 4, 5, C.pants);
  setPixel(f, 3, 15, C.outline);
  fillRect(f, 2, 20, 5, 3, C.shoe);
  // Right leg back
  fillRect(f, 9, 15, 4, 4, C.pants);
  setPixel(f, 12, 15, C.outline);
  fillRect(f, 9, 19, 5, 3, C.shoe);
}

function drawSmallWalk2(f: PixelImage): void {
  // Torso (slight bob - 1px lower start)
  box(f, 4, 3, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 4, 6, 2, C.shirtDark);
  fillRect(f, 4, 11, 8, 1, C.belt);
  // Arms mid
  fillRect(f, 2, 4, 2, 5, C.skin);
  setPixel(f, 2, 4, C.outline);
  fillRect(f, 12, 4, 2, 5, C.skin);
  setPixel(f, 13, 4, C.outline);
  // Pants
  box(f, 4, 12, 8, 4, C.pants, C.outline);
  // Legs together
  fillRect(f, 5, 16, 3, 4, C.pants);
  fillRect(f, 8, 16, 3, 4, C.pants);
  // Shoes
  fillRect(f, 4, 20, 4, 3, C.shoe);
  fillRect(f, 8, 20, 4, 3, C.shoe);
}

function drawSmallWalk3(f: PixelImage): void {
  // Torso
  box(f, 4, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 2, C.shirtDark);
  fillRect(f, 4, 10, 8, 1, C.belt);
  // Arms swinging (opposite)
  fillRect(f, 2, 2, 2, 5, C.skin);
  setPixel(f, 2, 2, C.outline);
  fillRect(f, 12, 4, 2, 5, C.skin);
  setPixel(f, 13, 4, C.outline);
  // Pants
  box(f, 4, 11, 8, 4, C.pants, C.outline);
  // Right leg forward
  fillRect(f, 9, 15, 4, 5, C.pants);
  setPixel(f, 12, 15, C.outline);
  fillRect(f, 9, 20, 5, 3, C.shoe);
  // Left leg back
  fillRect(f, 3, 15, 4, 4, C.pants);
  setPixel(f, 3, 15, C.outline);
  fillRect(f, 2, 19, 5, 3, C.shoe);
}

function drawSmallRun1(f: PixelImage): void {
  // Torso leaning forward
  box(f, 5, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 6, 3, 6, 2, C.shirtDark);
  fillRect(f, 5, 10, 8, 1, C.belt);
  // Arms pumping
  fillRect(f, 3, 2, 2, 4, C.skin);
  setPixel(f, 3, 2, C.outline);
  fillRect(f, 13, 4, 2, 5, C.skin);
  setPixel(f, 14, 4, C.outline);
  // Pants
  box(f, 5, 11, 8, 3, C.pants, C.outline);
  // Left leg far forward
  fillRect(f, 2, 14, 4, 6, C.pants);
  setPixel(f, 2, 14, C.outline);
  fillRect(f, 1, 20, 5, 3, C.shoe);
  // Right leg far back
  fillRect(f, 10, 14, 4, 4, C.pants);
  setPixel(f, 13, 14, C.outline);
  fillRect(f, 10, 18, 5, 3, C.shoe);
}

function drawSmallRun2(f: PixelImage): void {
  // Torso leaning forward (bob)
  box(f, 5, 3, 8, 8, C.shirt, C.outline);
  fillRect(f, 6, 4, 6, 2, C.shirtDark);
  fillRect(f, 5, 11, 8, 1, C.belt);
  // Arms mid
  fillRect(f, 3, 3, 2, 5, C.skin);
  setPixel(f, 3, 3, C.outline);
  fillRect(f, 13, 3, 2, 5, C.skin);
  setPixel(f, 14, 3, C.outline);
  // Pants
  box(f, 5, 12, 8, 3, C.pants, C.outline);
  // Legs together-ish
  fillRect(f, 5, 15, 3, 5, C.pants);
  fillRect(f, 9, 15, 3, 5, C.pants);
  fillRect(f, 4, 20, 4, 3, C.shoe);
  fillRect(f, 9, 20, 4, 3, C.shoe);
}

function drawSmallRun3(f: PixelImage): void {
  // Torso leaning forward
  box(f, 5, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 6, 3, 6, 2, C.shirtDark);
  fillRect(f, 5, 10, 8, 1, C.belt);
  // Arms pumping (opposite)
  fillRect(f, 3, 4, 2, 5, C.skin);
  setPixel(f, 3, 4, C.outline);
  fillRect(f, 13, 2, 2, 4, C.skin);
  setPixel(f, 14, 2, C.outline);
  // Pants
  box(f, 5, 11, 8, 3, C.pants, C.outline);
  // Right leg far forward
  fillRect(f, 10, 14, 4, 6, C.pants);
  setPixel(f, 13, 14, C.outline);
  fillRect(f, 10, 20, 5, 3, C.shoe);
  // Left leg far back
  fillRect(f, 2, 14, 4, 4, C.pants);
  setPixel(f, 2, 14, C.outline);
  fillRect(f, 1, 18, 5, 3, C.shoe);
}

function drawSmallSkid(f: PixelImage): void {
  // Torso leaning back
  box(f, 3, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 4, 3, 6, 2, C.shirtDark);
  fillRect(f, 3, 10, 8, 1, C.belt);
  // Arms bracing
  fillRect(f, 1, 3, 2, 5, C.skin);
  setPixel(f, 1, 3, C.outline);
  fillRect(f, 11, 2, 3, 4, C.skin);
  setPixel(f, 13, 2, C.outline);
  // Pants
  box(f, 3, 11, 8, 4, C.pants, C.outline);
  // Legs wide planted
  fillRect(f, 2, 15, 4, 5, C.pants);
  fillRect(f, 1, 20, 5, 3, C.shoe);
  fillRect(f, 9, 15, 4, 5, C.pants);
  fillRect(f, 9, 20, 5, 3, C.shoe);
}

function drawSmallJump(f: PixelImage): void {
  // Torso
  box(f, 4, 1, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 2, 6, 2, C.shirtDark);
  fillRect(f, 4, 9, 8, 1, C.belt);
  // Arms up
  fillRect(f, 2, 0, 2, 5, C.skin);
  setPixel(f, 2, 0, C.outline);
  fillRect(f, 12, 0, 2, 5, C.skin);
  setPixel(f, 13, 0, C.outline);
  // Pants
  box(f, 4, 10, 8, 4, C.pants, C.outline);
  // Legs tucked
  fillRect(f, 4, 14, 4, 4, C.pants);
  fillRect(f, 8, 14, 4, 4, C.pants);
  // Shoes tucked under
  fillRect(f, 3, 18, 5, 3, C.shoe);
  fillRect(f, 8, 18, 5, 3, C.shoe);
}

function drawSmallFall(f: PixelImage): void {
  // Torso
  box(f, 4, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 2, C.shirtDark);
  fillRect(f, 4, 10, 8, 1, C.belt);
  // Arms slightly up
  fillRect(f, 2, 1, 2, 5, C.skin);
  setPixel(f, 2, 1, C.outline);
  fillRect(f, 12, 1, 2, 5, C.skin);
  setPixel(f, 13, 1, C.outline);
  // Pants
  box(f, 4, 11, 8, 3, C.pants, C.outline);
  // Legs extended down
  fillRect(f, 4, 14, 4, 6, C.pants);
  fillRect(f, 8, 14, 4, 6, C.pants);
  // Shoes
  fillRect(f, 3, 20, 5, 3, C.shoe);
  fillRect(f, 8, 20, 5, 3, C.shoe);
}

function drawSmallLand(f: PixelImage): void {
  // Torso compressed (crouch)
  box(f, 4, 6, 8, 6, C.shirt, C.outline);
  fillRect(f, 5, 7, 6, 2, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  // Arms out
  fillRect(f, 1, 7, 3, 4, C.skin);
  setPixel(f, 1, 7, C.outline);
  fillRect(f, 12, 7, 3, 4, C.skin);
  setPixel(f, 14, 7, C.outline);
  // Pants (short)
  box(f, 4, 13, 8, 3, C.pants, C.outline);
  // Legs bent
  fillRect(f, 3, 16, 5, 4, C.pants);
  fillRect(f, 8, 16, 5, 4, C.pants);
  // Shoes wide
  fillRect(f, 2, 20, 5, 3, C.shoe);
  fillRect(f, 9, 20, 5, 3, C.shoe);
}

function drawSmallHurt(f: PixelImage): void {
  // Torso recoiling
  box(f, 3, 3, 8, 8, C.shirt, C.outline);
  fillRect(f, 4, 4, 6, 2, C.shirtDark);
  fillRect(f, 3, 11, 8, 1, C.belt);
  // Arms flung out
  fillRect(f, 0, 2, 3, 4, C.skin);
  setPixel(f, 0, 2, C.outline);
  fillRect(f, 11, 1, 3, 4, C.skin);
  setPixel(f, 13, 1, C.outline);
  // Pants
  box(f, 4, 12, 7, 4, C.pants, C.outline);
  // Legs splayed
  fillRect(f, 3, 16, 4, 4, C.pants);
  fillRect(f, 9, 16, 4, 4, C.pants);
  fillRect(f, 2, 20, 5, 3, C.shoe);
  fillRect(f, 9, 20, 5, 3, C.shoe);
}

function drawSmallWin(f: PixelImage): void {
  // Torso
  box(f, 4, 2, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 2, C.shirtDark);
  fillRect(f, 4, 10, 8, 1, C.belt);
  // Left arm up (victory!)
  fillRect(f, 2, 0, 2, 3, C.skin);
  setPixel(f, 2, 0, C.outline);
  // Right arm at side
  fillRect(f, 12, 4, 2, 5, C.skin);
  setPixel(f, 13, 4, C.outline);
  // Pants
  box(f, 4, 11, 8, 5, C.pants, C.outline);
  // Legs together
  fillRect(f, 5, 16, 3, 4, C.pants);
  fillRect(f, 8, 16, 3, 4, C.pants);
  fillRect(f, 4, 20, 4, 3, C.shoe);
  fillRect(f, 8, 20, 4, 3, C.shoe);
}

function drawSmallDead(f: PixelImage): void {
  // Torso flat/ragdoll (shifted down)
  box(f, 3, 6, 10, 6, C.shirt, C.outline);
  fillRect(f, 4, 7, 8, 2, C.shirtDark);
  fillRect(f, 3, 12, 10, 1, C.belt);
  // Arms limp
  fillRect(f, 1, 7, 2, 5, C.skin);
  setPixel(f, 1, 7, C.outline);
  fillRect(f, 13, 7, 2, 5, C.skin);
  setPixel(f, 14, 7, C.outline);
  // Pants
  box(f, 4, 13, 8, 4, C.pants, C.outline);
  // Legs flat
  fillRect(f, 4, 17, 4, 3, C.pants);
  fillRect(f, 8, 17, 4, 3, C.pants);
  fillRect(f, 3, 20, 5, 3, C.shoe);
  fillRect(f, 8, 20, 5, 3, C.shoe);
}

// ── Big body frame drawers (16x32 each) ────────────────────────
// Big form is taller: extra torso/leg height

function drawBigIdle(f: PixelImage): void {
  box(f, 4, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 3, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  fillRect(f, 2, 3, 2, 8, C.skin);
  setPixel(f, 2, 3, C.outline);
  setPixel(f, 2, 10, C.outline);
  fillRect(f, 12, 3, 2, 8, C.skin);
  setPixel(f, 13, 3, C.outline);
  setPixel(f, 13, 10, C.outline);
  box(f, 4, 13, 8, 7, C.pants, C.outline);
  fillRect(f, 8, 14, 3, 5, C.pantsDark);
  fillRect(f, 7, 18, 2, 2, C.outline);
  fillRect(f, 4, 20, 4, 6, C.pants);
  setPixel(f, 4, 20, C.outline);
  setPixel(f, 4, 25, C.outline);
  fillRect(f, 8, 20, 4, 6, C.pants);
  setPixel(f, 11, 20, C.outline);
  setPixel(f, 11, 25, C.outline);
  fillRect(f, 3, 26, 5, 4, C.shoe);
  fillRect(f, 8, 26, 5, 4, C.shoe);
  setPixel(f, 3, 26, C.outline);
  setPixel(f, 12, 26, C.outline);
}

function drawBigWalk1(f: PixelImage): void {
  box(f, 4, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 3, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  fillRect(f, 2, 4, 2, 7, C.skin);
  setPixel(f, 2, 4, C.outline);
  fillRect(f, 12, 2, 2, 7, C.skin);
  setPixel(f, 13, 2, C.outline);
  box(f, 4, 13, 8, 5, C.pants, C.outline);
  fillRect(f, 3, 18, 4, 8, C.pants);
  setPixel(f, 3, 18, C.outline);
  fillRect(f, 2, 26, 5, 4, C.shoe);
  fillRect(f, 9, 18, 4, 6, C.pants);
  setPixel(f, 12, 18, C.outline);
  fillRect(f, 9, 24, 5, 4, C.shoe);
}

function drawBigWalk2(f: PixelImage): void {
  box(f, 4, 3, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 4, 6, 3, C.shirtDark);
  fillRect(f, 4, 13, 8, 1, C.belt);
  fillRect(f, 2, 4, 2, 8, C.skin);
  setPixel(f, 2, 4, C.outline);
  fillRect(f, 12, 4, 2, 8, C.skin);
  setPixel(f, 13, 4, C.outline);
  box(f, 4, 14, 8, 5, C.pants, C.outline);
  fillRect(f, 5, 19, 3, 7, C.pants);
  fillRect(f, 8, 19, 3, 7, C.pants);
  fillRect(f, 4, 26, 4, 4, C.shoe);
  fillRect(f, 8, 26, 4, 4, C.shoe);
}

function drawBigWalk3(f: PixelImage): void {
  box(f, 4, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 3, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  fillRect(f, 2, 2, 2, 7, C.skin);
  setPixel(f, 2, 2, C.outline);
  fillRect(f, 12, 4, 2, 7, C.skin);
  setPixel(f, 13, 4, C.outline);
  box(f, 4, 13, 8, 5, C.pants, C.outline);
  fillRect(f, 9, 18, 4, 8, C.pants);
  setPixel(f, 12, 18, C.outline);
  fillRect(f, 9, 26, 5, 4, C.shoe);
  fillRect(f, 3, 18, 4, 6, C.pants);
  setPixel(f, 3, 18, C.outline);
  fillRect(f, 2, 24, 5, 4, C.shoe);
}

function drawBigRun1(f: PixelImage): void {
  box(f, 5, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 6, 3, 6, 3, C.shirtDark);
  fillRect(f, 5, 12, 8, 1, C.belt);
  fillRect(f, 3, 2, 2, 5, C.skin);
  setPixel(f, 3, 2, C.outline);
  fillRect(f, 13, 4, 2, 7, C.skin);
  setPixel(f, 14, 4, C.outline);
  box(f, 5, 13, 8, 4, C.pants, C.outline);
  fillRect(f, 2, 17, 4, 9, C.pants);
  setPixel(f, 2, 17, C.outline);
  fillRect(f, 1, 26, 5, 4, C.shoe);
  fillRect(f, 10, 17, 4, 6, C.pants);
  setPixel(f, 13, 17, C.outline);
  fillRect(f, 10, 23, 5, 4, C.shoe);
}

function drawBigRun2(f: PixelImage): void {
  box(f, 5, 3, 8, 10, C.shirt, C.outline);
  fillRect(f, 6, 4, 6, 3, C.shirtDark);
  fillRect(f, 5, 13, 8, 1, C.belt);
  fillRect(f, 3, 3, 2, 7, C.skin);
  setPixel(f, 3, 3, C.outline);
  fillRect(f, 13, 3, 2, 7, C.skin);
  setPixel(f, 14, 3, C.outline);
  box(f, 5, 14, 8, 4, C.pants, C.outline);
  fillRect(f, 5, 18, 3, 8, C.pants);
  fillRect(f, 9, 18, 3, 8, C.pants);
  fillRect(f, 4, 26, 4, 4, C.shoe);
  fillRect(f, 9, 26, 4, 4, C.shoe);
}

function drawBigRun3(f: PixelImage): void {
  box(f, 5, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 6, 3, 6, 3, C.shirtDark);
  fillRect(f, 5, 12, 8, 1, C.belt);
  fillRect(f, 3, 4, 2, 7, C.skin);
  setPixel(f, 3, 4, C.outline);
  fillRect(f, 13, 2, 2, 5, C.skin);
  setPixel(f, 14, 2, C.outline);
  box(f, 5, 13, 8, 4, C.pants, C.outline);
  fillRect(f, 10, 17, 4, 9, C.pants);
  setPixel(f, 13, 17, C.outline);
  fillRect(f, 10, 26, 5, 4, C.shoe);
  fillRect(f, 2, 17, 4, 6, C.pants);
  setPixel(f, 2, 17, C.outline);
  fillRect(f, 1, 23, 5, 4, C.shoe);
}

function drawBigSkid(f: PixelImage): void {
  box(f, 3, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 4, 3, 6, 3, C.shirtDark);
  fillRect(f, 3, 12, 8, 1, C.belt);
  fillRect(f, 1, 3, 2, 7, C.skin);
  setPixel(f, 1, 3, C.outline);
  fillRect(f, 11, 2, 3, 5, C.skin);
  setPixel(f, 13, 2, C.outline);
  box(f, 3, 13, 8, 5, C.pants, C.outline);
  fillRect(f, 2, 18, 4, 8, C.pants);
  fillRect(f, 1, 26, 5, 4, C.shoe);
  fillRect(f, 9, 18, 4, 8, C.pants);
  fillRect(f, 9, 26, 5, 4, C.shoe);
}

function drawBigJump(f: PixelImage): void {
  box(f, 4, 1, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 2, 6, 3, C.shirtDark);
  fillRect(f, 4, 11, 8, 1, C.belt);
  fillRect(f, 2, 0, 2, 6, C.skin);
  setPixel(f, 2, 0, C.outline);
  fillRect(f, 12, 0, 2, 6, C.skin);
  setPixel(f, 13, 0, C.outline);
  box(f, 4, 12, 8, 5, C.pants, C.outline);
  fillRect(f, 4, 17, 4, 6, C.pants);
  fillRect(f, 8, 17, 4, 6, C.pants);
  fillRect(f, 3, 23, 5, 4, C.shoe);
  fillRect(f, 8, 23, 5, 4, C.shoe);
}

function drawBigFall(f: PixelImage): void {
  box(f, 4, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 3, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  fillRect(f, 2, 1, 2, 7, C.skin);
  setPixel(f, 2, 1, C.outline);
  fillRect(f, 12, 1, 2, 7, C.skin);
  setPixel(f, 13, 1, C.outline);
  box(f, 4, 13, 8, 4, C.pants, C.outline);
  fillRect(f, 4, 17, 4, 9, C.pants);
  fillRect(f, 8, 17, 4, 9, C.pants);
  fillRect(f, 3, 26, 5, 4, C.shoe);
  fillRect(f, 8, 26, 5, 4, C.shoe);
}

function drawBigLand(f: PixelImage): void {
  box(f, 4, 8, 8, 8, C.shirt, C.outline);
  fillRect(f, 5, 9, 6, 3, C.shirtDark);
  fillRect(f, 4, 16, 8, 1, C.belt);
  fillRect(f, 1, 9, 3, 6, C.skin);
  setPixel(f, 1, 9, C.outline);
  fillRect(f, 12, 9, 3, 6, C.skin);
  setPixel(f, 14, 9, C.outline);
  box(f, 4, 17, 8, 4, C.pants, C.outline);
  fillRect(f, 3, 21, 5, 5, C.pants);
  fillRect(f, 8, 21, 5, 5, C.pants);
  fillRect(f, 2, 26, 5, 4, C.shoe);
  fillRect(f, 9, 26, 5, 4, C.shoe);
}

function drawBigHurt(f: PixelImage): void {
  box(f, 3, 3, 8, 10, C.shirt, C.outline);
  fillRect(f, 4, 4, 6, 3, C.shirtDark);
  fillRect(f, 3, 13, 8, 1, C.belt);
  fillRect(f, 0, 2, 3, 5, C.skin);
  setPixel(f, 0, 2, C.outline);
  fillRect(f, 11, 1, 3, 5, C.skin);
  setPixel(f, 13, 1, C.outline);
  box(f, 4, 14, 7, 5, C.pants, C.outline);
  fillRect(f, 3, 19, 4, 7, C.pants);
  fillRect(f, 9, 19, 4, 7, C.pants);
  fillRect(f, 2, 26, 5, 4, C.shoe);
  fillRect(f, 9, 26, 5, 4, C.shoe);
}

function drawBigWin(f: PixelImage): void {
  box(f, 4, 2, 8, 10, C.shirt, C.outline);
  fillRect(f, 5, 3, 6, 3, C.shirtDark);
  fillRect(f, 4, 12, 8, 1, C.belt);
  fillRect(f, 2, 0, 2, 3, C.skin);
  setPixel(f, 2, 0, C.outline);
  fillRect(f, 12, 4, 2, 7, C.skin);
  setPixel(f, 13, 4, C.outline);
  box(f, 4, 13, 8, 7, C.pants, C.outline);
  fillRect(f, 5, 20, 3, 6, C.pants);
  fillRect(f, 8, 20, 3, 6, C.pants);
  fillRect(f, 4, 26, 4, 4, C.shoe);
  fillRect(f, 8, 26, 4, 4, C.shoe);
}

function drawBigDead(f: PixelImage): void {
  box(f, 3, 8, 10, 8, C.shirt, C.outline);
  fillRect(f, 4, 9, 8, 3, C.shirtDark);
  fillRect(f, 3, 16, 10, 1, C.belt);
  fillRect(f, 1, 9, 2, 7, C.skin);
  setPixel(f, 1, 9, C.outline);
  fillRect(f, 13, 9, 2, 7, C.skin);
  setPixel(f, 14, 9, C.outline);
  box(f, 4, 17, 8, 5, C.pants, C.outline);
  fillRect(f, 4, 22, 4, 4, C.pants);
  fillRect(f, 8, 22, 4, 4, C.pants);
  fillRect(f, 3, 26, 5, 4, C.shoe);
  fillRect(f, 8, 26, 5, 4, C.shoe);
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

function buildSheet(drawers: ((f: PixelImage) => void)[], frameW: number, frameH: number): PixelImage {
  const sheet = createImage(frameW * drawers.length, frameH);
  for (let i = 0; i < drawers.length; i++) {
    const frame = createImage(frameW, frameH);
    drawers[i](frame);
    blit(sheet, frame, i * frameW, 0);
  }
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
  const spritesDir = path.join(repoRoot, 'public/assets/sprites');
  ensureDir(spritesDir);

  const smallSheet = buildSheet(SMALL_DRAWERS, FRAME_W, FRAME_H_SMALL);
  writePng(path.join(spritesDir, 'bart_body_small.png'), smallSheet);
  console.log(`wrote bart_body_small.png (${smallSheet.width}x${smallSheet.height})`);

  const bigSheet = buildSheet(BIG_DRAWERS, FRAME_W, FRAME_H_BIG);
  writePng(path.join(spritesDir, 'bart_body_big.png'), bigSheet);
  console.log(`wrote bart_body_big.png (${bigSheet.width}x${bigSheet.height})`);

  writeHeadOffsets();
  console.log('wrote src/anim/headOffsets.ts');
}

main();
