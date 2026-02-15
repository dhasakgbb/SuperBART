
import { readPng, writePng, createImage, getPixel, setPixel, crop, blit, resizeNearest } from './lib/pixel';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACTS_DIR = process.argv[2] ?? process.env.SUPERBART_ARTIFACTS_DIR;
if (!ARTIFACTS_DIR) {
    console.error('Usage: tsx tools/slice_boss.ts <artifactsDir>');
    process.exit(1);
}
const OUT_DIR = 'public/assets/sprites';
// Find latest boss_sprites_gen
const files = fs.readdirSync(ARTIFACTS_DIR)
  .filter(f => f.startsWith('boss_sprites_gen') && f.endsWith('.png'));
const latest = files.map(f => ({
  name: f,
  time: fs.statSync(path.join(ARTIFACTS_DIR, f)).mtime.getTime()
})).sort((a, b) => b.time - a.time)[0];

const SRC_PATH = path.join(ARTIFACTS_DIR, latest.name);

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

function resizeToFit(img: any, size: number): any {
    if (img.width <= size && img.height <= size) return img;
    const scale = Math.min(size / img.width, size / img.height);
    return resizeNearest(img, Math.floor(img.width * scale), Math.floor(img.height * scale));
}

try {
    const src = readPng(SRC_PATH);
    const bg = [...getPixel(src, 0, 0)];
    console.log(`Processing Boss from ${SRC_PATH} (BG: ${bg})`);

    // Assume 3 frames in a row (Idle, Attack, Hurt) based on prompt "Arrange in a row"
    // Since generated image is likely square 640x640, "row" might mean top half 
    // or it effectively put them in a line.
    // I'll assume 3 distinct blobs.
    // I'll just split width by 3? 
    // Or I can use autoCrop on 3 horizontal segments.
    // 640 / 3 = ~213 px width for each slot.
    
    // Output is a spritesheet 64x64 frames. 3 frames = 192x64 image.
    const sheet = createImage(192, 64, [0,0,0,0]);
    
    const segmentWidth = Math.floor(src.width / 3);
    
    for(let i=0; i<3; i++) {
        const seg = crop(src, i * segmentWidth, 0, segmentWidth, src.height);
        const cropped = autoCrop(seg, bg);
        if (cropped) {
             // Make transparent
             const withAlpha = createImage(cropped.width, cropped.height, [0,0,0,0]);
             for(let y=0; y<cropped.height; y++) {
                for(let x=0; x<cropped.width; x++) {
                    const px = getPixel(cropped, x, y);
                    if (!isBg(px, bg)) {
                        setPixel(withAlpha, x, y, [px[0], px[1], px[2], 255]);
                    }
                }
             }
             
             // Resize to fit in 64x64
             const sized = resizeToFit(withAlpha, 64);
             
             // Blit to sheet
             const ox = (i * 64) + Math.floor((64 - sized.width) / 2);
             const oy = Math.floor((64 - sized.height) / 2);
             
             blit(sheet, sized, ox, oy);
             console.log(`Processed Frame ${i}`);
        } else {
             console.log(`Frame ${i} is empty??`);
        }
    }
    
    writePng(path.join(OUT_DIR, 'boss_sheet.png'), sheet);
    console.log('Wrote boss_sheet.png');

} catch (e) {
    console.error(e);
}
