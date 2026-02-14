import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { imageDimensions, readPng } from '../lib/pixel';

// Use pixelmatch-like logic or simple difference
function diffImages(
  img1Path: string,
  img2Path: string,
  outputPath: string
): void {
  const img1 = readPng(img1Path);
  const img2 = readPng(img2Path);
  
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);
  
  const diff = new PNG({ width, height });
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      
      const r1 = x < img1.width && y < img1.height ? img1.data[idx] : 0;
      const g1 = x < img1.width && y < img1.height ? img1.data[idx + 1] : 0;
      const b1 = x < img1.width && y < img1.height ? img1.data[idx + 2] : 0;
      
      const r2 = x < img2.width && y < img2.height ? img2.data[idx] : 0;
      const g2 = x < img2.width && y < img2.height ? img2.data[idx + 1] : 0;
      const b2 = x < img2.width && y < img2.height ? img2.data[idx + 2] : 0;
      
      const dr = Math.abs(r1 - r2);
      const dg = Math.abs(g1 - g2);
      const db = Math.abs(b1 - b2);
      
      if (dr + dg + db > 0) {
        diff.data[idx] = 255;
        diff.data[idx + 1] = 0;
        diff.data[idx + 2] = 0;
        diff.data[idx + 3] = 255;
      } else {
        // Fade out unchanged
        diff.data[idx] = r1;
        diff.data[idx + 1] = g1;
        diff.data[idx + 2] = b1;
        diff.data[idx + 3] = 64; 
      }
    }
  }
  
  fs.writeFileSync(outputPath, PNG.sync.write(diff));
  console.log(`Generated diff: ${outputPath}`);
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("Usage: tsx diff_sheet.ts <golden> <current> <output>");
  process.exit(1);
}

diffImages(args[0], args[1], args[2]);
