
import fs from 'node:fs';
import path from 'node:path';
import {
  createImage,
  crop,
  readPng,
  writePng,
  type PixelImage,
} from './lib/pixel';

const ARTIFACTS_DIR = process.argv[2] ?? process.env.SUPERBART_ARTIFACTS_DIR;
if (!ARTIFACTS_DIR) {
  console.error('Usage: tsx tools/slice_tileset.ts <artifactsDir>');
  process.exit(1);
}
const OUT_DIR = 'public/assets/tiles';

const WORLDS = ['w1', 'w2', 'w3', 'w4', 'w5'];

WORLDS.forEach(world => {
  const files = fs.readdirSync(ARTIFACTS_DIR)
    .filter(f => f.startsWith(`tileset_${world}_gen`) && f.endsWith('.png'));

  if (files.length === 0) {
    console.warn(`No tileset found for ${world}`);
    return;
  }

  // Sort by time
  const latest = files.map(f => ({
    name: f,
    time: fs.statSync(path.join(ARTIFACTS_DIR, f)).mtime.getTime()
  })).sort((a, b) => b.time - a.time)[0];

  const SRC_PATH = path.join(ARTIFACTS_DIR, latest.name);
  console.log(`Processing ${world} from ${SRC_PATH}`);

  const img = readPng(SRC_PATH);

  // Determine X offset
  let offsetX = 0;
  if (img.width > 16) {
      // Assume centered strip
      offsetX = Math.floor((img.width - 16) / 2);
      console.log(`  > Image width ${img.width}, cropping from x=${offsetX}`);
  }

  // Slicing
  const topTile = crop(img, offsetX, 0, 16, 16);
  const midTile = crop(img, offsetX, 16, 16, 16);
  const botTile = crop(img, offsetX, 32, 16, 16); // inner
  const onewayTile = crop(img, offsetX, 48, 16, 16); 

  writePng(path.join(OUT_DIR, `tile_ground_${world}_top.png`), topTile);
  writePng(path.join(OUT_DIR, `tile_ground_${world}_mid.png`), midTile);
  writePng(path.join(OUT_DIR, `tile_ground_${world}_bot.png`), botTile);
  writePng(path.join(OUT_DIR, `tile_oneway_${world}.png`), onewayTile);
  
  console.log(`  > Wrote ${world} tiles.`);
});

console.log('All worlds processed.');
