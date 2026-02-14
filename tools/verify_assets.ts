
import { readPng, crop, writePng } from './lib/pixel';
import path from 'node:path';
import fs from 'node:fs';

const FILES = [
    'public/assets/sprites/bart_body_big.png',
    'public/assets/sprites/bart_body_small.png'
];

FILES.forEach(f => {
    try {
        const stats = fs.statSync(f);
        console.log(`File: ${f}, Size: ${stats.size}, MTime: ${stats.mtime}`);
        const img = readPng(f);
        console.log(`Dimensions: ${img.width}x${img.height}`);
    } catch(e) {
        console.error(`Error checking ${f}:`, e);
    }
});
