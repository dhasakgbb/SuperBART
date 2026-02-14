
import { readPng, writePng } from './lib/pixel';
import { PNG } from 'pngjs';
import path from 'node:path';

const SRC = '/Users/damian/.gemini/antigravity/brain/759ccdf6-979e-4751-a5e4-7fd4b8efe2d6/hill_near_w1_magenta_1771045710000.png'; // Need actual timestamp
        const args = process.argv.slice(2);
        if (args.length < 2) {
            console.error("Usage: tsx tools/remove_magenta.ts <source_file> <dest_file>");
            process.exit(1);
        }
        
        const srcPath = args[0];
        const destPath = args[1];
        console.log(`Processing ${srcPath} -> ${destPath}...`);
        
        const img = readPng(srcPath);
        
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const idx = (img.width * y + x) << 2;
                const r = img.data[idx];
                const g = img.data[idx + 1];
                const b = img.data[idx + 2];
                
                // Check if Magenta (approximate to be safe)
                if (r > 240 && g < 20 && b > 240) {
                    img.data[idx + 3] = 0; // Transparent
                }
            }
        }
        
        writePng(destPath, img);
        console.log(`Wrote transparent image to ${destPath}`);
        
    } catch (e) {
        console.error(e);
    }
}

process();
