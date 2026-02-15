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
  inkDark: parseHex('#1D1D1D', 220),
  inkSoft: parseHex('#2B2824'),
  
  // Walker (Hallucination)
  blobLight: parseHex('#A2EA32'), // Brightened for SNES
  blobMid:   parseHex('#46BA4C'),
  blobDark:  parseHex('#0A582C'),
  eyeYellow: parseHex('#DED256'),
  teeth:     parseHex('#F2FDFD'),
  mouth:     parseHex('#CF5151'),
  mouthDark: parseHex('#9D2C2C'),

  // Shell (Legacy System)
  steel:     parseHex('#9FA8B3'),
  steelDark: parseHex('#5D6774'),
  steelLight:parseHex('#D9E7EB'),
  copper:    parseHex('#B6560E'),
  copperLight: parseHex('#DC7C1D'),
  copperDark:  parseHex('#742B01'),

  // Flying (Hot Take)
  red:       parseHex('#CF5151'),
  redDark:   parseHex('#9D2C2C'),
  redLight:  parseHex('#E36863'),
  orange:    parseHex('#DC7C1D'),
  orangeLight:parseHex('#F1C55F'),
  white:     parseHex('#F2FDFD'),

  // Spitter (Gartner Analyst)
  blue:      parseHex('#1E4EA3'),
  blueShadow:parseHex('#102D5A'),
  blueLight: parseHex('#5FA2F2'),
  glow:      parseHex('#5FA2F2'),
  cyan:      parseHex('#50E6FF'),
  cyanLight: parseHex('#B0FFFF'),
  cloud:     parseHex('#F2FDFD'),
  cloudShade:parseHex('#D9E7EB'),

  // Compliance Officer
  suitBlue:  parseHex('#102D5A'),
  suitLight: parseHex('#1B4D95'),
  beige:     parseHex('#E9B48E'),
  beigeLight:parseHex('#F5D1B8'),

  // Tech Debt
  debtDark:  parseHex('#1A1A1E'),
  debtRed:   parseHex('#9D2C2C'),
  debtLight: parseHex('#3D3D42'),
  chain:     parseHex('#9FA8B3'),

  // New Biome Enemies
  iceWhite:  parseHex('#F2FDFD'),
  iceBlue:   parseHex('#B7E9F7'),
  iceShadow: parseHex('#32535F'),
  
  voidPink:  parseHex('#D45698'),
  voidCyan:  parseHex('#4DEEEA'),
  voidDark:  parseHex('#1A0B2E'),
  
  toxicGreen:parseHex('#68F046'),
  slimeDark: parseHex('#203820'),
  
  ghostTeal: parseHex('#74F6D9'),
  boneGrey:  parseHex('#BDBDBD'),
  ghostAlpha:parseHex('#74F6D9', 180),
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

// Hallucination Bot (Walker) - Redesigned as AI Robot
function drawWalkerFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const bob = f === 1 ? 1 : 0;
  
  // Chassis
  fillRect(img, 4, 4 + bob, 8, 8, COLORS.steel);
  fillRect(img, 4, 4 + bob, 8, 1, COLORS.steelLight);
  fillRect(img, 4, 11 + bob, 8, 1, COLORS.steelDark);
  
  // Screen/Face
  fillRect(img, 5, 6 + bob, 6, 4, COLORS.inkDark);
  // Eyes
  setPixel(img, 6, 7 + bob, COLORS.eyeYellow);
  setPixel(img, 9, 7 + bob, COLORS.eyeYellow);
  
  // Antenna
  drawLine(img, 8, 4 + bob, 8, 1 + bob, COLORS.steelDark);
  setPixel(img, 8, 0 + bob, (f % 2 === 0) ? COLORS.red : COLORS.redDark);
  
  // Legs
  fillRect(img, 4, 12 + bob, 2, 4 - bob, COLORS.steelDark);
  fillRect(img, 10, 12 + bob, 2, 4 - bob, COLORS.steelDark);

  outline(img, COLORS.inkDark);
  return img;
}

// Snowman Sentry
function drawSnowmanFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const b = f===1 ? 1 : 0;
  
  // Body (Bottom)
  drawDisk(img, 8, 11+b, 4, COLORS.iceWhite);
  // Body (Top)
  drawDisk(img, 8, 6+b, 3, COLORS.iceWhite);
  
  // Scarf
  fillRect(img, 5, 8+b, 6, 2, COLORS.voidPink);
  
  // Face
  setPixel(img, 7, 5+b, COLORS.inkDark);
  setPixel(img, 9, 5+b, COLORS.inkDark);
  setPixel(img, 8, 6+b, COLORS.orange); // Carrot nose
  
  // Hat
  fillRect(img, 6, 2+b, 4, 2, COLORS.inkSoft);
  fillRect(img, 5, 4+b, 6, 1, COLORS.inkSoft);

  outline(img, COLORS.iceShadow);
  return img;
}

// Cryo Drone
function drawCryoDroneFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const float = f===1 ? -1 : 0;
  
  // Hex body
  fillRect(img, 4, 4+float, 8, 8, COLORS.iceBlue);
  fillRect(img, 6, 6+float, 4, 4, COLORS.iceWhite); // Core
  
  // Wings/Rotors
  drawLine(img, 2, 4+float, 0, 2+float, COLORS.iceShadow);
  drawLine(img, 13, 4+float, 15, 2+float, COLORS.iceShadow);
  
  // Beam Emitter
  setPixel(img, 8, 12+float, COLORS.voidCyan);
  
  outline(img, COLORS.iceShadow);
  return img;
}

// Qubit Swarm
function drawQubitFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  
  // Crystal Shape (Diamond)
  const cy = 8 + (f===0 ? 0 : (f===1 ? -1 : 1));
  
  // Center
  fillRect(img, 6, cy-2, 4, 4, COLORS.voidPink);
  
  // Points
  drawLine(img, 8, cy-5, 8, cy-2, COLORS.voidCyan);
  drawLine(img, 8, cy+5, 8, cy+2, COLORS.voidCyan);
  drawLine(img, 3, cy, 6, cy, COLORS.voidCyan);
  drawLine(img, 13, cy, 10, cy, COLORS.voidCyan);
  
  outline(img, COLORS.voidDark);
  return img;
}

// Crawler (Bug)
function drawCrawlerFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  // Flat body
  fillRect(img, 3, 10, 10, 4, COLORS.slimeDark);
  // Spots
  setPixel(img, 5, 11, COLORS.toxicGreen);
  setPixel(img, 9, 12, COLORS.toxicGreen);
  // Legs
  const leg = (f===0) ? 0 : 1;
  drawLine(img, 3, 12, 1, 14-leg, COLORS.inkDark);
  drawLine(img, 12, 12, 14, 14-leg, COLORS.inkDark);
  
  outline(img, COLORS.inkDark);
  return img;
}

// Glitch Phantom
function drawGlitchFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const offset = (Math.random() > 0.5) ? 1 : 0;
  
  fillRect(img, 4+offset, 4, 8, 10, COLORS.voidDark);
  // Glitch Lines
  drawLine(img, 2, 6, 14, 6, COLORS.voidCyan);
  drawLine(img, 2, 10, 14, 10, COLORS.voidPink);
  
  outline(img, COLORS.voidDark);
  return img;
}

// Fungal Node
function drawFungalFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const pulse = f===1 ? 1 : 0;
  
  // Stem
  fillRect(img, 6, 10, 4, 6, COLORS.beige);
  // Cap
  drawDisk(img, 8, 7-pulse, 6, COLORS.red);
  // Spots
  setPixel(img, 6, 6-pulse, COLORS.white);
  setPixel(img, 10, 5-pulse, COLORS.white);
  setPixel(img, 8, 8-pulse, COLORS.white);
  
  outline(img, COLORS.inkDark);
  return img;
}

// Ghost Process
function drawGhostFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const wave = f===1 ? 1 : 0;
  
  // Sheet body
  fillRect(img, 4, 4+wave, 8, 8, COLORS.ghostTeal);
  // Tail
  setPixel(img, 4, 12+wave, COLORS.ghostTeal);
  setPixel(img, 11, 12+wave, COLORS.ghostTeal);
  
  // Eyes
  setPixel(img, 6, 6+wave, COLORS.inkDark);
  setPixel(img, 9, 6+wave, COLORS.inkDark);
  
  outline(img, COLORS.ghostAlpha);
  return img;
}

// Tape Wraith
function drawTapeFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const spin = f; 
  
  // Reel
  drawDisk(img, 8, 8, 6, COLORS.steelDark);
  // Tape
  drawDisk(img, 8, 8, 3, COLORS.inkDark); // Center hole
  
  // Messy tape strands
  const r = (53 * spin) % 4;
  drawLine(img, 8, 8, 14, 14-r, COLORS.inkDark);
  drawLine(img, 8, 8, 2, 14-r, COLORS.inkDark);
  
  outline(img, COLORS.inkSoft);
  return img;
}

// Resume Bot
function drawResumeFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const walk = f===1 ? 1 : 0;
  
  // Paper Body
  fillRect(img, 5, 4+walk, 6, 8, COLORS.white);
  // Text lines
  drawLine(img, 6, 6+walk, 9, 6+walk, COLORS.inkSoft);
  drawLine(img, 6, 8+walk, 9, 8+walk, COLORS.inkSoft);
  drawLine(img, 6, 10+walk, 8, 10+walk, COLORS.inkSoft);
  
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
  // Highlights
  fillRect(img, 2, yOff, 12, 1, COLORS.steelLight);
  fillRect(img, 2, yOff, 1, h, COLORS.steelLight);
  
  // Dither
  for(let y=yOff; y<16; y++) {
    for(let x=2; x<14; x++) {
      if ((x+y)%3 === 0) setPixel(img, x, y, COLORS.steelDark);
    }
  }
  // Circuit traces - Glowy copper
  drawLine(img, 4, yOff + 2, 11, yOff + 2, COLORS.copperDark);
  drawLine(img, 4, yOff + 1, 11, yOff + 1, COLORS.copper);
  setPixel(img, 11, yOff + 1, COLORS.copperLight);
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
  fillRect(img, 4, 6, 8, 1, COLORS.redLight); // Top highlight
  fillRect(img, 4, 11, 8, 1, COLORS.redDark); // Bottom shadow
  
  fillRect(img, 12, 7, 3, 3, COLORS.red); // beak
  setPixel(img, 12, 7, COLORS.redLight);
  
  // Wings - Multi-tone
  const wColor = COLORS.orange;
  const wLight = COLORS.orangeLight;
  if (wingPos === 1) { // Up
    fillRect(img, 2, 2, 4, 5, wColor);
    fillRect(img, 2, 2, 4, 1, wLight);
    fillRect(img, 10, 2, 4, 5, wColor);
    fillRect(img, 10, 2, 4, 1, wLight);
  } else if (wingPos === 2) { // Down
    fillRect(img, 2, 9, 4, 5, wColor);
    fillRect(img, 2, 9, 4, 1, wLight);
    fillRect(img, 10, 9, 4, 5, wColor);
    fillRect(img, 10, 9, 4, 1, wLight);
  } else { // Mid
    fillRect(img, 1, 6, 4, 4, wColor);
    fillRect(img, 1, 6, 4, 1, wLight);
    fillRect(img, 11, 6, 4, 4, wColor);
    fillRect(img, 11, 6, 4, 1, wLight);
  }
  // Eye
  setPixel(img, 10, 8, COLORS.white);
  
  if (f === 3) { // Angry burst
    fillRect(img, 4, 6, 8, 6, COLORS.orange);
    fillRect(img, 4, 6, 8, 1, COLORS.orangeLight);
  }

  outline(img, COLORS.inkDark);
  return img;
}

// Gartner Analyst (Spitter)
function drawSpitterFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const bob = (f === 1) ? -1 : 0;
  
  // Cloud - Billowy SNES look
  drawDisk(img, 8, 13 + bob, 4, COLORS.cloud);
  drawDisk(img, 4, 13 + bob, 3, COLORS.cloudShade);
  drawDisk(img, 12, 13 + bob, 3, COLORS.cloudShade);
  setPixel(img, 8, 10 + bob, COLORS.white); // Top shine
  
  // Body (Robe)
  fillRect(img, 6, 5 + bob, 5, 8, COLORS.blue);
  fillRect(img, 6, 5 + bob, 5, 1, COLORS.blueLight);
  fillRect(img, 7, 6 + bob, 3, 6, COLORS.blueShadow);
  
  // Head
  fillRect(img, 7, 2 + bob, 4, 4, COLORS.beige);
  setPixel(img, 7, 2 + bob, COLORS.beigeLight);
  
  // Glasses - Glowy
  fillRect(img, 6, 3 + bob, 6, 2, COLORS.glow);
  setPixel(img, 6, 3 + bob, COLORS.cyanLight);
  if (f === 3) { // Firing glow
    fillRect(img, 5, 2 + bob, 8, 4, COLORS.cyan);
    fillRect(img, 5, 2 + bob, 8, 1, COLORS.cyanLight);
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
  fillRect(img, 5, 4, 6, 1, COLORS.suitLight);
  // Head
  fillRect(img, 6, 1, 4, 4, COLORS.beige);
  setPixel(img, 6, 1, COLORS.beigeLight);
  // Clipboard
  fillRect(img, 10, 6 + step, 4, 6, COLORS.white);
  fillRect(img, 11, 5 + step, 2, 1, COLORS.inkSoft);
  setPixel(img, 11, 7 + step, COLORS.inkSoft); // a "check" mark
  
  outline(img, COLORS.inkDark);
  return img;
}

// Technical Debt
function drawDebtFrame(f: number): PixelImage {
  const img = createImage(16, 16, [0,0,0,0]);
  const pulse = (f === 1) ? 1 : 0;
  
  // Mass
  drawDisk(img, 8, 8, 6 + pulse, COLORS.debtDark);
  // Veins - Pulsing red
  for(let i=0; i<4; i++) {
    const angle = i * Math.PI / 2;
    const x = Math.round(8 + Math.cos(angle) * 4);
    const y = Math.round(8 + Math.sin(angle) * 4);
    setPixel(img, x, y, COLORS.debtRed);
    if (f === 1) setPixel(img, x, y, COLORS.redLight);
  }
  // Highlight
  setPixel(img, 6, 5, COLORS.debtLight);
  
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

  // New Biome Enemies
  writeEnemy('snowman_sentry', [drawSnowmanFrame(0), drawSnowmanFrame(1), drawSnowmanFrame(0), drawSnowmanFrame(1)]);
  writeEnemy('cryo_drone', [drawCryoDroneFrame(0), drawCryoDroneFrame(1), drawCryoDroneFrame(0), drawCryoDroneFrame(1)]);
  writeEnemy('qubit_swarm', [drawQubitFrame(0), drawQubitFrame(1), drawQubitFrame(2), drawQubitFrame(3)]);
  writeEnemy('crawler', [drawCrawlerFrame(0), drawCrawlerFrame(1), drawCrawlerFrame(0), drawCrawlerFrame(1)]);
  writeEnemy('glitch_phantom', [drawGlitchFrame(0), drawGlitchFrame(1), drawGlitchFrame(0), drawGlitchFrame(1)]);
  writeEnemy('fungal_node', [drawFungalFrame(0), drawFungalFrame(1), drawFungalFrame(0), drawFungalFrame(1)]);
  writeEnemy('ghost_process', [drawGhostFrame(0), drawGhostFrame(1), drawGhostFrame(0), drawGhostFrame(1)]);
  writeEnemy('tape_wraith', [drawTapeFrame(0), drawTapeFrame(1), drawTapeFrame(2), drawTapeFrame(3)]);
  writeEnemy('resume_bot', [drawResumeFrame(0), drawResumeFrame(1), drawResumeFrame(0), drawResumeFrame(1)]);

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
