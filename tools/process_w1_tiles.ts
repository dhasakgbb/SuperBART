
import { readPng, writePng, crop, resizeNearest } from './lib/pixel';
import path from 'node:path';

const SRC = '/Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6/tileset_w1_gen_1771043431498.png';
const OUT_DIR = 'public/assets/tiles';

try {
    const img = readPng(SRC);
    console.log(`Loaded tileset: ${img.width}x${img.height}`);

    // The generated image is likely 1024x1024 or similar.
    // We want a standard 32x32 tile.
    // Let's grab a 32x32 chunk from the center for the "mid" tile (repeating pattern).
    const cx = Math.floor(img.width / 2) - 16;
    const cy = Math.floor(img.height / 2) - 16;
    
    // Mid tile (repeating server rack/ice wall)
    const mid = crop(img, cx, cy, 32, 32);
    writePng(path.join(OUT_DIR, 'tile_ground_w1_mid.png'), mid);
    console.log('Wrote tile_ground_w1_mid.png');

    // Top tile (needs a "surface" look, maybe slightly higher up in the image)
    // Let's go up 32 pixels
    const top = crop(img, cx, cy - 32, 32, 32);
    writePng(path.join(OUT_DIR, 'tile_ground_w1_top.png'), top);
    console.log('Wrote tile_ground_w1_top.png');

} catch(e) {
    console.error(e);
}
