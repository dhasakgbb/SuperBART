
import path from 'node:path';
import fs from 'node:fs';
import { readPng, getPixel } from './lib/pixel';

const ARTIFACTS_DIR = '/Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6';
// Find the latest generated tileset in artifacts
const files = fs.readdirSync(ARTIFACTS_DIR)
  .filter(f => f.startsWith('tileset_w1_gen') && f.endsWith('.png'));
const latest = files.map(f => ({
  name: f,
  time: fs.statSync(path.join(ARTIFACTS_DIR, f)).mtime.getTime()
})).sort((a, b) => b.time - a.time)[0];

// const SRC_PATH = path.join(ARTIFACTS_DIR, latest.name);
const TILE_PATH = 'public/assets/tiles/tile_ground_w1_top.png';

const SRC_PATH = '/Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6/enemy_sprites_gen_1771044428200.png';

console.log(`Checking Enemy Sprites: ${SRC_PATH}`);
try {
    const src = readPng(SRC_PATH);
    console.log(`Source dims: ${src.width}x${src.height}`);
    
    // Scan down the center (x=320) to find rows
    let inContent = false;
    let contentStart = -1;
    const rows = [];
    
    for(let y=0; y<src.height; y++) {
        let hasPixel = false;
        // Check a horizontal strip
        for(let x=0; x<src.width; x+=10) {
             if (getPixel(src, x, y)[3] > 0) hasPixel = true;
        }
        
        if (hasPixel && !inContent) {
            inContent = true;
            contentStart = y;
        } else if (!hasPixel && inContent) {
            inContent = false;
            rows.push({start: contentStart, end: y});
        }
    }
    if (inContent) rows.push({start: contentStart, end: src.height});
    
    console.log(`Found ${rows.length} content rows:`);
    rows.forEach((r, i) => console.log(`  Row ${i}: Y=${r.start} to Y=${r.end} (Height: ${r.end - r.start})`));
    
} catch (e) {
    console.error('Failed to read source:', e);
}

console.log(`Checking Tile: ${TILE_PATH}`);
try {
    const tile = readPng(TILE_PATH);
    console.log(`Tile dims: ${tile.width}x${tile.height}`);
    const px = getPixel(tile, 8, 8);
    console.log(`Tile Center Pixel (8,8): RGBA(${px.join(',')})`);
    
    // Check if fully transparent
    let hasContent = false;
    for(let y=0; y<tile.height; y++) {
        for(let x=0; x<tile.width; x++) {
            if (getPixel(tile, x, y)[3] > 0) hasContent = true;
        }
    }
    console.log(`Tile has content: ${hasContent}`);
} catch (e) {
    console.error('Failed to read tile:', e);
}
