
import fs from 'node:fs';
import path from 'node:path';
import {
  createImage,
  crop,
  readPng,
  resizeNearest,
  writePng,
  type PixelImage,
  type Rgba,
} from './lib/pixel';

// Find the latest generated sprite sheet in artifacts
const ARTIFACTS_DIR = process.argv[2] ?? process.env.SUPERBART_ARTIFACTS_DIR;
if (!ARTIFACTS_DIR) {
  console.error('Usage: tsx tools/slice_bart_sprites.ts <artifactsDir>');
  process.exit(1);
}
const files = fs.readdirSync(ARTIFACTS_DIR)
  .filter(f => f.startsWith('bart_spritesheet') && f.endsWith('.png'));

if (files.length === 0) {
  console.error('No sprite sheet found');
  process.exit(1);
}

// Sort by time (hacky, assuming name contains timestamp or just pick last)
// Actually fs.statSync to be sure
const latest = files.map(f => ({
  name: f,
  time: fs.statSync(path.join(ARTIFACTS_DIR, f)).mtime.getTime()
})).sort((a, b) => b.time - a.time)[0];

const SRC_PATH = path.join(ARTIFACTS_DIR, latest.name);
console.log(`Processing ${SRC_PATH}`);

const img = readPng(SRC_PATH);

// Grid settings from generation prompt:
// 48x48 approx per cell? Or 32x32?
// The user prompt said "approximately 32x32 or 48x48".
// Let's deduce from image size.
// Assuming roughly square grid or standard packing.
// Let's assume 4 columns based on typical generation.
const COLS = 4;
const CELL_W = Math.floor(img.width / COLS);
const CELL_H = CELL_W; // Assume square for now

console.log(`Cell size approx: ${CELL_W}x${CELL_H}`);

// Extract frames
const frames: PixelImage[] = [];
for (let y = 0; y < img.height; y += CELL_H) {
  for (let x = 0; x < img.width; x += CELL_W) {
    if (frames.length >= 14) break; // We need roughly 14
    // Safe crop
    if (x + CELL_W <= img.width && y + CELL_H <= img.height) {
        frames.push(crop(img, x, y, CELL_W, CELL_H));
    }
  }
}

// Map to game frames 0-13
// 0: Idle
// 1-3: Walk
// 4-6: Run
// 7: Skid
// 8: Jump
// 9: Fall
// 10: Land
// 11: Hurt
// 12: Win
// 13: Dead

const finalFrames: PixelImage[] = [];

// Helper to safely get frame or fallback
const getFrame = (idx: number) => frames[idx] || frames[frames.length - 1];

// 0: Idle
finalFrames[0] = getFrame(0);

// 1-3: Walk (Use Run frames 0-2 from the run cycle, which are frames 4,5,6 in extraction)
finalFrames[1] = getFrame(4);
finalFrames[2] = getFrame(5);
finalFrames[3] = getFrame(6);

// 4-6: Run (Use Run frames 3-5 from run cycle? Or just loop 4-6? Let's use 7,8,9 if available)
finalFrames[4] = getFrame(7);
finalFrames[5] = getFrame(8);
finalFrames[6] = getFrame(9);

// 7: Skid (Frame 12)
finalFrames[7] = getFrame(12);

// 8: Jump (Frame 10)
finalFrames[8] = getFrame(10);

// 9: Fall (Frame 11)
finalFrames[9] = getFrame(11);

// 10: Land (Reuse Idle 0 or Jump)
finalFrames[10] = getFrame(0);

// 11: Hurt (Reuse Fall)
finalFrames[11] = getFrame(11);

// 12: Win (Reuse Idle 1)
finalFrames[12] = getFrame(1);

// 13: Dead (Reuse Fall)
finalFrames[13] = getFrame(9);

// Resize function
function createSheet(fs: PixelImage[], w: number, h: number): PixelImage {
    const sheet = createImage(w * fs.length, h);
    fs.forEach((f, i) => {
        const resized = resizeNearest(f, w, h);
        // Paste into sheet
        for(let py=0; py<h; py++) {
            for(let px=0; px<w; px++) {
                // simple blit
                 // pixel.ts doesn't have setPixel exposed on image buffer directly usually,
                 // but data is Uint8Array.
                 // let's use a helper if available or manual.
                 // resizeNearest returns a new image.
                 const idxSrc = (py * w + px) * 4;
                 const idxDst = (py * (w * fs.length) + (i * w + px)) * 4;
                 sheet.data[idxDst] = resized.data[idxSrc];
                 sheet.data[idxDst+1] = resized.data[idxSrc+1];
                 sheet.data[idxDst+2] = resized.data[idxSrc+2];
                 sheet.data[idxDst+3] = resized.data[idxSrc+3];
            }
        }
    });
    return sheet;
}

// Create Small (32x32)
const smallSheet = createSheet(finalFrames, 32, 32);
writePng('public/assets/sprites/bart_body_small.png', smallSheet);
writePng('public/assets/sprites/bart_body_small_fire.png', smallSheet); // Reuse for now

// Create Big (32x48)
const bigSheet = createSheet(finalFrames, 32, 48);
writePng('public/assets/sprites/bart_body_big.png', bigSheet);
writePng('public/assets/sprites/bart_body_big_fire.png', bigSheet); // Reuse for now

console.log('Processed sprites successfully.');
