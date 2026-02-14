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
  
  // Walker (Hallucination)
  blobLight: parseHex('#46BA4C'),
  blobMid:   parseHex('#20A36D'),
  blobDark:  parseHex('#0A582C'),
  eyeYellow: parseHex('#DED256'),
  teeth:     parseHex('#F2FDFD'),
  mouth:     parseHex('#CF5151'),

  // Shell (Legacy System)
  steel:     parseHex('#9FA8B3'),
  steelDark: parseHex('#66707C'),
  copper:    parseHex('#B6560E'),
  copperLight: parseHex('#DC7C1D'),

  // Flying (Hot Take)
  red:       parseHex('#CF5151'),
  redDark:   parseHex('#9D2C2C'),
  orange:    parseHex('#DC7C1D'),
  white:     parseHex('#F2FDFD'),

  // Spitter (Gartner Analyst)
  blue:      parseHex('#1E4EA3'),
  blueShadow:parseHex('#1B4D95'),
  glow:      parseHex('#5FA2F2'),
  cyan:      parseHex('#50E6FF'),
  cloud:     parseHex('#F2FDFD'),
  cloudShade:parseHex('#D9E7EB'),

  // Compliance Officer
  suitBlue:  parseHex('#102D5A'),
  suitLight: parseHex('#1B4D95'),
  beige:     parseHex('#E9B48E'),

  // Tech Debt
  debtDark:  parseHex('#1A1A1E'),
  debtRed:   parseHex('#9D2C2C'),
  chain:     parseHex('#9FA8B3'),
};

function buildEnemySheet(frames: PixelImage[]): PixelImage {
  const sheet = createImage(frames.length * 16, 16, [0,0,0,0]);
  frames.forEach((f, i) => blit(sheet, f, i * 16, 0));
  return sheet;
}

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

// Hallucination Blob (Walker)
function drawWalkerFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const h = f === 1 ? 11 : 10;
  const yOff = 15 - h;
  // Body - Squat rounded
  drawDisk(img, 8, yOff + h/2, h/2, COLORS.blobMid);
  // Dithering
  for(let y=yOff; y<16; y++) {
    for(let x=0; x<16; x++) {
       const [,,,a] = getPixel(img, x, y);
       if (a > 0 && (x+y)%2 === 0) setPixel(img, x, y, COLORS.blobLight);
       if (a > 0 && y > yOff + h*0.7) setPixel(img, x, y, COLORS.blobDark);
    }
  }
  // Eyes
  setPixel(img, 6, yOff + 4, COLORS.eyeYellow);
  setPixel(img, 10, yOff + 4, COLORS.eyeYellow);
  if (f === 3) { // Thinking
    setPixel(img, 6, yOff + 3, COLORS.eyeYellow);
    setPixel(img, 10, yOff + 3, COLORS.eyeYellow);
  } else {
    setPixel(img, 6, yOff + 4, [0,0,0,255]); // Pupil
    setPixel(img, 10, yOff + 4, [0,0,0,255]);
  }
  // Mouth
  fillRect(img, 6, yOff + 7, 5, 2, COLORS.mouth);
  setPixel(img, 7, yOff + 7, COLORS.teeth);
  setPixel(img, 9, yOff + 7, COLORS.teeth);

  outline(img, COLORS.inkDark);
  return img;
}

// Legacy System (Shell)
function drawShellFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const isRetracted = f === 3;
  const h = isRetracted ? 8 : 10;
  const yOff = 15 - h;

  // Chassis
  fillRect(img, 2, yOff, 12, h, COLORS.steel);
  // Dither
  for(let y=yOff; y<16; y++) {
    for(let x=2; x<14; x++) {
      if ((x+y)%3 === 0) setPixel(img, x, y, COLORS.steelDark);
    }
  }
  // Circuit traces
  drawLine(img, 4, yOff + 2, 11, yOff + 2, COLORS.copper);
  setPixel(img, 11, yOff + 2, COLORS.copperLight);
  // Rivets
  setPixel(img, 3, yOff + 1, COLORS.copperLight);
  setPixel(img, 12, yOff + 1, COLORS.copperLight);

  if (!isRetracted) {
    // Legs
    const step = f === 1 ? 1 : 0;
    fillRect(img, 4 + step, 14, 2, 2, COLORS.inkSoft);
    fillRect(img, 10 - step, 14, 2, 2, COLORS.inkSoft);
  }

  outline(img, COLORS.inkDark);
  return img;
}

// Hot Take (Flying)
function drawFlyingFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const wingPos = f % 3; // 0: mid, 1: up, 2: down
  
  // Body - Angular
  fillRect(img, 4, 6, 8, 6, COLORS.red);
  fillRect(img, 12, 7, 3, 3, COLORS.red); // beak
  // Wings
  if (wingPos === 1) { // Up
    fillRect(img, 2, 2, 4, 5, COLORS.orange);
    fillRect(img, 10, 2, 4, 5, COLORS.orange);
  } else if (wingPos === 2) { // Down
    fillRect(img, 2, 9, 4, 5, COLORS.orange);
    fillRect(img, 10, 9, 4, 5, COLORS.orange);
  } else { // Mid
    fillRect(img, 1, 6, 4, 4, COLORS.orange);
    fillRect(img, 11, 6, 4, 4, COLORS.orange);
  }
  // Eye
  setPixel(img, 10, 8, COLORS.white);
  
  if (f === 3) { // Angry burst
    fillRect(img, 4, 6, 8, 6, COLORS.orange);
  }

  outline(img, COLORS.inkDark);
  return img;
}

// Gartner Analyst (Spitter)
function drawSpitterFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const bob = (f === 1) ? -1 : 0;
  
  // Cloud
  drawDisk(img, 8, 13 + bob, 4, COLORS.cloud);
  drawDisk(img, 4, 13 + bob, 3, COLORS.cloudShade);
  drawDisk(img, 12, 13 + bob, 3, COLORS.cloudShade);
  
  // Body (Robe)
  fillRect(img, 6, 5 + bob, 5, 8, COLORS.blue);
  fillRect(img, 7, 6 + bob, 3, 6, COLORS.blueShadow);
  
  // Head
  fillRect(img, 7, 2 + bob, 4, 4, COLORS.beige);
  // Glasses
  fillRect(img, 6, 3 + bob, 6, 2, COLORS.glow);
  if (f === 3) { // Firing glow
    fillRect(img, 5, 2 + bob, 8, 4, COLORS.cyan);
  }

  outline(img, COLORS.inkDark);
  return img;
}

// Compliance Officer
function drawComplianceFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const step = (f === 1) ? 1 : 0;
  
  // Suit
  fillRect(img, 5, 4, 6, 10, COLORS.suitBlue);
  // Head
  fillRect(img, 6, 1, 4, 4, COLORS.beige);
  // Clipboard
  fillRect(img, 10, 6 + step, 4, 6, COLORS.white);
  fillRect(img, 11, 5 + step, 2, 1, COLORS.inkSoft);
  
  outline(img, COLORS.inkDark);
  return img;
}

// Technical Debt
function drawDebtFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const pulse = (f === 1) ? 1 : 0;
  
  // Mass
  drawDisk(img, 8, 8, 6 + pulse, COLORS.debtDark);
  // Veins
  for(let i=0; i<4; i++) {
    const angle = i * Math.PI / 2;
    const x = Math.round(8 + Math.cos(angle) * 4);
    const y = Math.round(8 + Math.sin(angle) * 4);
    setPixel(img, x, y, COLORS.debtRed);
  }
  // Chain
  drawLine(img, 8, 14, 8, 15, COLORS.chain);
  
  outline(img, COLORS.inkDark);
  return img;
}

async function main() {
  const spriteDir = path.join(repoRoot, 'public/assets/sprites');
  ensureDir(spriteDir);

  const writeEnemy = (name: string, frames: PixelImage[]) => {
    const sheet = buildEnemySheet(frames);
    const filename = `enemy_${name}.png`;
    writePng(path.join(spriteDir, filename), sheet);
    console.log(`Wrote ${filename}`);
  };

  writeEnemy('walker', [drawWalkerFrame(0), drawWalkerFrame(1), drawWalkerFrame(0), drawWalkerFrame(3)]);
  writeEnemy('shell', [drawShellFrame(0), drawShellFrame(1), drawShellFrame(0), drawShellFrame(3)]);
  writeEnemy('flying', [drawFlyingFrame(0), drawFlyingFrame(1), drawFlyingFrame(2), drawFlyingFrame(3)]);
  writeEnemy('spitter', [drawSpitterFrame(0), drawSpitterFrame(1), drawSpitterFrame(0), drawSpitterFrame(3)]);
  writeEnemy('compliance', [drawComplianceFrame(0), drawComplianceFrame(1), drawComplianceFrame(0), drawComplianceFrame(1)]);
  writeEnemy('techdebt', [drawDebtFrame(0), drawDebtFrame(1), drawDebtFrame(0), drawDebtFrame(1)]);

  // Extras
  writePng(path.join(spriteDir, 'enemy_shell_retracted.png'), drawShellFrame(3));
  
  const micro = createImage(16, 16, [0,0,0,0]);
  const shell3 = drawShellFrame(3);
  // Scale down shell manually for microservice
  for(let y=0; y<8; y++) {
    for(let x=0; x<12; x++) {
       const p = getPixel(shell3, x+2, y+8);
       if (p[3] > 0) setPixel(micro, Math.floor(x/2)+6, Math.floor(y/2)+8, p);
    }
  }
  outline(micro, COLORS.inkDark);
  writePng(path.join(spriteDir, 'enemy_microservice.png'), micro);
}

main();
