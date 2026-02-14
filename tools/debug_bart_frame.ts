
import { readPng, crop, writePng } from './lib/pixel';
import path from 'node:path';

const SRC = 'public/assets/sprites/bart_body_big.png';
const OUT = 'public/assets/sprites/bart_debug_frame0.png';

try {
    const img = readPng(SRC);
    // Extract frame 0 (32x48)
    const f0 = crop(img, 0, 0, 32, 48);
    writePng(OUT, f0);
    console.log('Wrote frame 0 check');
} catch(e) {
    console.error(e);
}
