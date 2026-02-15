
import { readPng, getPixel } from './lib/pixel';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: tsx tools/visualize_layout.ts <sourcePng>');
    process.exit(1);
}

const SRC_PATH = args[0]!;

try {
    const img = readPng(SRC_PATH);
    console.log(`Dimensions: ${img.width}x${img.height}`);
    
    // Sample grid 64x64
    const cols = 64;
    const rows = 32;
    const stepX = Math.floor(img.width / cols);
    const stepY = Math.floor(img.height / rows);

    let output = '';
    
    // Get background color guess (top-left)
    const bg = getPixel(img, 0, 0);
    console.log(`Guessed BG Color: ${bg.join(',')}`);

    for(let y=0; y<rows; y++) {
        for(let x=0; x<cols; x++) {
            const px = getPixel(img, x * stepX + stepX/2, y * stepY + stepY/2);
            // Distance from BG
            const diff = Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]);
            
            if (diff < 30) {
                output += '.';
            } else {
                output += '#';
            }
        }
        output += '\n';
    }
    console.log(output);

} catch (e) {
    console.error(e);
}
