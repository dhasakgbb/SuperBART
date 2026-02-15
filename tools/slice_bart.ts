
import { readPng, writePng, createImage, getPixel, setPixel, crop, blit, resizeNearest } from './lib/pixel';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = process.argv[2] ?? process.env.SUPERBART_ARTIFACTS_DIR;
if (!ARTIFACTS_DIR) {
    console.error('Usage: tsx tools/slice_bart.ts <artifactsDir>');
    process.exit(1);
}
const OUT_DIR = 'public/assets/sprites';

const SRC_PATH = path.join(ARTIFACTS_DIR, 'bart_ref.png');

function isBg(px: number[] | readonly number[], bg: number[] | readonly number[]): boolean {
    const diff = Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]);
    return diff < 40;
}

function autoCrop(img: any, bg: number[] | readonly number[]): any {
    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
    for(let y=0; y<img.height; y++) {
        for(let x=0; x<img.width; x++) {
            const px = getPixel(img, x, y);
            if (!isBg(px, bg)) {
                if (x < minX) minX = x;
                if (maxX < x) maxX = x;
                if (y < minY) minY = y;
                if (maxY < y) maxY = y;
            }
        }
    }
    if (minX > maxX) return null;
    return crop(img, minX, minY, maxX - minX + 1, maxY - minY + 1);
}

const resizeToFit = (img: any, w: number, h: number): any => {
     if (img.width <= w && img.height <= h) return img;
     const scale = Math.min(w / img.width, h / img.height);
     return resizeNearest(img, Math.floor(img.width * scale), Math.floor(img.height * scale));
};


try {
    const src = readPng(SRC_PATH);
    const bg = [...getPixel(src, 0, 0)];
    console.log(`Processing Bart from ${SRC_PATH} (BG: ${bg})`);

    // The image has distinctive groups.
    // Top-Left Large: Idle/Stand
    // Top-Right Row: Run (4 frames)
    // Mid-Right Row: Jump (4 frames?) - actually "Run" is 4 frames, the checkboard pattern.
    // Bot-Right Row: Punch (3 frames)
    
    // Hardcoded quadrants based on visual inspection of the user provided image
    // Image is roughly 640x640?
    // Let's assume the user image layout:
    // Left side (0 to ~200px): Big Idle Sprite.
    // Right side (200 to end): Small sprites rows.
    
    // We need 32x48 output frames.
    const SHEET_WIDTH = 32;
    const SHEET_HEIGHT = 48;
    
    // 1. Idle (Big Sprite on Left) -> Frame 0
    // Actually game uses small sprites usually.
    // Let's take the first "Run" frame as Idle?
    // Or scale down the Big Sprite? 
    // The user said "Perfect Bart" and showed a big sprite.
    // Let's try to use the Big Sprite as Idle if it fits, or scale it.
    
    const bigIdle = crop(src, 0, 0, Math.floor(src.width * 0.35), Math.floor(src.height * 0.5));
    const bigIdleCropped = autoCrop(bigIdle, bg);
    
    // 2. Run Frames (Top Right Row)
    // x: 35% to 100%, y: 0 to 25%
    const runStrip = crop(src, Math.floor(src.width * 0.35), 0, Math.floor(src.width * 0.65), Math.floor(src.height * 0.25));
    // Split into 4?
    const run1 = crop(runStrip, 0, 0, Math.floor(runStrip.width / 4), runStrip.height);
    const run2 = crop(runStrip, Math.floor(runStrip.width / 4), 0, Math.floor(runStrip.width / 4), runStrip.height);
    const run3 = crop(runStrip, Math.floor(runStrip.width / 2), 0, Math.floor(runStrip.width / 4), runStrip.height);
    const run4 = crop(runStrip, Math.floor(runStrip.width * 0.75), 0, Math.floor(runStrip.width / 4), runStrip.height);
    
    // 3. Jump/Action (Mid Right)
    // x: 35% to 100%, y: 25% to 50%
    const midStrip = crop(src, Math.floor(src.width * 0.35), Math.floor(src.height * 0.25), Math.floor(src.width * 0.65), Math.floor(src.height * 0.25));
    const jump = crop(midStrip, Math.floor(midStrip.width * 0.5), 0, Math.floor(midStrip.width / 4), midStrip.height); // Roughly center
    
    // Construct final sheet
    // Layout: 
    // Frame 0: Idle
    // Frame 1: Run 1
    // Frame 2: Run 2
    // Frame 3: Run 3
    // Frame 4: Run 4
    // Frame 5: Jump
    // Frame 6: Fall (same as jump?)
    // Frame 7: Skid/Slide
    
    const frameCount = 8;
    const finalSheet = createImage(SHEET_WIDTH * frameCount, SHEET_HEIGHT, [0,0,0,0]);

    const addToSheet = (img: any, index: number) => {
        const c = autoCrop(img, bg);
        if(!c) return;
        
        // Remove BG
        const transparent = createImage(c.width, c.height, [0,0,0,0]);
        for(let y=0; y<c.height; y++) {
            for(let x=0; x<c.width; x++) {
                const px = getPixel(c, x, y);
                if (!isBg(px, bg)) {
                    setPixel(transparent, x, y, [px[0], px[1], px[2], 255]);
                }
            }
        }
        
        const sized = resizeToFit(transparent, SHEET_WIDTH, SHEET_HEIGHT);
        const ox = (index * SHEET_WIDTH) + Math.floor((SHEET_WIDTH - sized.width) / 2);
        const oy = Math.floor((SHEET_HEIGHT - sized.height) / 2); // Center vertical? Or align bottom?
        // Align bottom usually better for platformers
        const oyBot = SHEET_HEIGHT - sized.height;
        
        blit(finalSheet, sized, ox, oyBot);
    };
    
    // Idle
    addToSheet(bigIdle, 0);
    // Runs
    addToSheet(run1, 1);
    addToSheet(run2, 2);
    addToSheet(run3, 3);
    addToSheet(run4, 4);
    // Jump
    addToSheet(jump, 5);
    // Fall (reuse jump for now)
    addToSheet(jump, 6);
    // Skid (reuse run 4?)
    addToSheet(run4, 7);
    
    writePng(path.join(OUT_DIR, 'bart_body_big.png'), finalSheet);
    console.log('Wrote bart_body_big.png');

    // Generate Small Version (32x32)
    // We can't just resize the whole sheet because 32x48 -> 32x32 change aspect ratio or crop?
    // Let's just resize the whole sheet to 256x32? 
    // Frame width 32 -> 32 (Same). Height 48 -> 32.
    // This squashes the height. Pixel art might look bad.
    // Better to crop the top/bottom or just resize.
    // Given "Perfect Bart", maybe small bart should just be a mini version?
    // Let's resize.
    const smallSheet = resizeNearest(finalSheet, SHEET_WIDTH * frameCount, 32);
    writePng(path.join(OUT_DIR, 'bart_body_small.png'), smallSheet);
    console.log('Wrote bart_body_small.png');
    
} catch (e) {
    console.error(e);
}
