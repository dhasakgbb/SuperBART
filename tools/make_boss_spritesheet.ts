#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blit,
  createImage,
  fillRect,
  setPixel,
  getPixel,
  parseHex,
  type PixelImage,
  type Rgba,
  writePng,
  ensureDir,
  drawLine,
  strokeRect,
  drawDisk,
} from './lib/pixel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const COLORS = {
  inkDark: parseHex('#1D1D1D'),
  inkSoft: parseHex('#2B2824'),
  
  // AI Overlord Omega
  body:      parseHex('#1A1A1D'),
  bodyLight: parseHex('#2B2B30'),
  bodyShadow:parseHex('#0A0A0C'),
  
  gold:      parseHex('#FFD700'),
  goldLight: parseHex('#FFEB9C'),
  goldDark:  parseHex('#B8860B'),
  
  cyan:      parseHex('#50E6FF'),
  cyanLight: parseHex('#B0FFFF'),
  cyanDark:  parseHex('#1E4EA3'),
  
  red:       parseHex('#FF5252'),
  redLight:  parseHex('#FFB0B0'),
};

function outline(img: PixelImage, color: Rgba): void {
  const temp = createImage(img.width, img.height, [0,0,0,0]);
  blit(temp, img, 0, 0);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const [,,,a] = getPixel(temp, x, y);
      if (a > 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
              const [,,,na] = getPixel(temp, nx, ny);
              if (na === 0) setPixel(img, nx, ny, color);
            }
          }
        }
      }
    }
  }
}

// Boss Omega is 64x64
function drawBossOmega(f: number): PixelImage {
  const img = createImage(64, 64, [0,0,0,0]);
  const bob = Math.sin(f * 0.5) * 2;
  
  // Throne Base (Floating)
  fillRect(img, 12, 48 + bob, 40, 8, COLORS.body);
  fillRect(img, 12, 48 + bob, 40, 1, COLORS.bodyLight);
  fillRect(img, 12, 55 + bob, 40, 1, COLORS.bodyShadow);
  
  // Power Veins in throne
  for(let x=14; x<50; x+=4) {
    setPixel(img, x, 51 + bob, COLORS.cyan);
    setPixel(img, x, 52 + bob, COLORS.cyanDark);
  }

  // Backrests (Angular wings)
  // Left wing
  drawLine(img, 12, 48 + bob, 4, 16 + bob, COLORS.body);
  drawLine(img, 13, 48 + bob, 5, 16 + bob, COLORS.bodyLight);
  // Right wing
  drawLine(img, 51, 48 + bob, 59, 16 + bob, COLORS.body);
  drawLine(img, 50, 48 + bob, 58, 16 + bob, COLORS.bodyLight);

  // Big Central Core (Floating Golem style)
  const coreY = 32 + bob;
  drawDisk(img, 32, coreY, 14, COLORS.body);
  // Shading on core
  for(let y=coreY-14; y<coreY+14; y++) {
    for(let x=32-14; x<32+14; x++) {
      const dist = Math.sqrt((x-32)**2 + (y-coreY)**2);
      if (dist < 14) {
        if (y < coreY - 6) setPixel(img, x, y, COLORS.bodyLight);
        if (y > coreY + 6) setPixel(img, x, y, COLORS.bodyShadow);
      }
    }
  }
  
  // The Eye of Omega
  drawDisk(img, 32, coreY - 2, 6, COLORS.cyanDark);
  drawDisk(img, 32, coreY - 2, 4, COLORS.cyan);
  setPixel(img, 31, coreY - 4, COLORS.cyanLight); // Glimt
  
  // Crown / Gold Plates
  fillRect(img, 24, coreY - 16, 16, 4, COLORS.gold);
  fillRect(img, 24, coreY - 16, 16, 1, COLORS.goldLight);
  fillRect(img, 24, coreY - 13, 16, 1, COLORS.goldDark);
  
  // Floating Arms/Hands
  const handL_X = 10 + Math.cos(f * 0.3) * 4;
  const handL_Y = 32 + Math.sin(f * 0.3) * 4 + bob;
  fillRect(img, handL_X, handL_Y, 8, 8, COLORS.body);
  fillRect(img, handL_X + 2, handL_Y + 2, 4, 4, COLORS.gold);
  
  const handR_X = 46 - Math.cos(f * 0.3) * 4;
  const handR_Y = 32 + Math.sin(f * 0.3) * 4 + bob;
  fillRect(img, handR_X, handR_Y, 8, 8, COLORS.body);
  fillRect(img, handR_X + 2, handR_Y + 2, 4, 4, COLORS.gold);

  outline(img, COLORS.inkDark);
  return img;
}

async function main() {
  const spriteDir = path.join(repoRoot, 'public/assets/sprites');
  ensureDir(spriteDir);

  const frames = 4;
  const sheet = createImage(frames * 64, 64, [0,0,0,0]);
  for(let i=0; i<frames; i++) {
    const f = drawBossOmega(i);
    blit(sheet, f, i * 64, 0);
  }
  
  const filename = 'boss_omega.png';
  writePng(path.join(spriteDir, filename), sheet);
  console.log(`Wrote ${filename}`);
}

await main();
