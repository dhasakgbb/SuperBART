
import { readPng, writePng, createImage, getPixel, setPixel, crop, blit, resizeNearest } from './lib/pixel';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = process.argv[2] ?? process.env.SUPERBART_ARTIFACTS_DIR;
if (!ARTIFACTS_DIR) {
    console.error('Usage: tsx tools/slice_enemies.ts <artifactsDir> [sourcePng]');
    process.exit(1);
}
const OUT_DIR = 'public/assets/sprites';

const SRC_PATH = process.argv[3] ?? path.join(ARTIFACTS_DIR, 'enemy_sprites_gen.png');

function isBg(px: number[] | readonly number[], bg: number[] | readonly number[]): boolean {
    const diff = Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]);
    return diff < 40; // Fuzzy match
}

function autoCrop(img: any, bg: number[] | readonly number[]): any {
    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
    
    for(let y=0; y<img.height; y++) {
        for(let x=0; x<img.width; x++) {
            const px = getPixel(img, x, y);
            if (!isBg(px, bg)) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (minX > maxX) return null; // Empty
    
    // Add 1px padding
    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(img.width, maxX + 2);
    maxY = Math.min(img.height, maxY + 2);
    
    return crop(img, minX, minY, maxX - minX, maxY - minY);
}

function processAndSave(quadrantImg: any, name: string, bg: number[] | readonly number[]) {
    const cropped = autoCrop(quadrantImg, bg);
    if (!cropped) {
        console.log(`Quadrant for ${name} is empty.`);
        return;
    }
    
    // Create opaque mask -> transparent
    const withAlpha = createImage(cropped.width, cropped.height, [0,0,0,0]);
    for(let y=0; y<cropped.height; y++) {
        for(let x=0; x<cropped.width; x++) {
            const px = getPixel(cropped, x, y);
            if (isBg(px, bg)) {
                setPixel(withAlpha, x, y, [0,0,0,0]);
            } else {
                setPixel(withAlpha, x, y, [px[0], px[1], px[2], 255]);
            }
        }
    }
    
    // Resize to fit in 24x24 (max dimension)
    // Actually, simple blit to center of 32x32 is better if it's small enough.
    // If larger than 32, resize.
    
    let finalSprite = withAlpha;
    if (finalSprite.width > 28 || finalSprite.height > 28) {
        // Resize logic is complex in pure JS without canvas, assume pixel art is roughly right size?
        // Generated image is 640x640, so quadrants are 320x320. 
        // The sprites inside are likely 100x100ish.
        // We MUST resize down to ~32px.
        // Nearest neighbor resize.
        const scale = Math.min(28 / finalSprite.width, 28 / finalSprite.height);
        const nw = Math.floor(finalSprite.width * scale);
        const nh = Math.floor(finalSprite.height * scale);
        finalSprite = resizeNearest(finalSprite, nw, nh);
    }
    
    // Center in 32x32
    const frame = createImage(32, 32, [0,0,0,0]);
    const ox = Math.floor((32 - finalSprite.width) / 2);
    const oy = Math.floor((32 - finalSprite.height) / 2);
    blit(frame, finalSprite, ox, oy);
    
    writePng(path.join(OUT_DIR, name), frame);
    console.log(`Wrote ${name}`);
}


try {
    const src = readPng(SRC_PATH);
    const bg = getPixel(src, 0, 0); // Top-left is BG
    
    console.log(`Processing ${SRC_PATH} (BG: ${bg})`);

    // Quadrant 1 (Top-Left) -> Walker (AI Robot)
    const q1 = crop(src, 0, 0, 320, 320);
    processAndSave(q1, 'enemy_walker.png', bg);

    // Quadrant 2 (Top-Right) -> Flying (Spam)
    const q2 = crop(src, 320, 0, 320, 320);
    processAndSave(q2, 'enemy_flying.png', bg);
    
    // Quadrant 3 (Bot-Left) -> Spitter (Bug)
    const q3 = crop(src, 0, 320, 320, 320);
    processAndSave(q3, 'enemy_spitter.png', bg);
    
    // Quadrant 4 (Bot-Right) -> Shell (Firewall)
    const q4 = crop(src, 320, 320, 320, 320);
    processAndSave(q4, 'enemy_shell.png', bg);
    
} catch (e) {
    console.error(e);
}
