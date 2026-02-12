#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageDimensions } from './lib/pixel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const REQUIRED_FILES: Array<{ file: string; dimensions?: [number, number] }> = [
  { file: 'public/assets/tiles/tileset.png', dimensions: [16, 112] },
  { file: 'public/assets/sprites/coin.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/question_block.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/title_logo.png', dimensions: [512, 160] },
  { file: 'public/assets/sprites/cloud_1.png', dimensions: [24, 16] },
  { file: 'public/assets/sprites/cloud_2.png', dimensions: [32, 18] },
  { file: 'public/assets/sprites/hill_far.png', dimensions: [80, 44] },
  { file: 'public/assets/sprites/hill_near.png', dimensions: [88, 46] },
  { file: 'public/assets/sprites/map_node_open.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/map_node_done.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/map_node_locked.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/map_node_selected.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/map_path_dot.png', dimensions: [8, 8] },
  { file: 'public/assets/fonts/bitmap_font.png', dimensions: [128, 24] },
  { file: 'public/assets/fonts/bitmap_font.fnt' },
  { file: 'public/assets/sprites/bart_head_32.png', dimensions: [32, 32] },
  { file: 'public/assets/sprites/bart_head_48.png', dimensions: [48, 48] },
  { file: 'public/assets/sprites/bart_head_64.png', dimensions: [64, 64] },
  { file: 'public/assets/sprites/bart_portrait_96.png', dimensions: [96, 96] },
];

function main(): number {
  const failures: string[] = [];

  for (const requirement of REQUIRED_FILES) {
    const absolute = path.join(repoRoot, requirement.file);
    if (!fs.existsSync(absolute)) {
      failures.push(`missing asset: ${requirement.file}`);
      continue;
    }

    if (!requirement.dimensions) {
      continue;
    }

    try {
      const size = imageDimensions(absolute);
      const [expectedWidth, expectedHeight] = requirement.dimensions;
      if (size.width !== expectedWidth || size.height !== expectedHeight) {
        failures.push(
          `wrong dimensions for ${requirement.file}: expected ${expectedWidth}x${expectedHeight}, got ${size.width}x${size.height}`,
        );
      }
    } catch (error) {
      failures.push(`invalid png: ${requirement.file} (${String(error)})`);
    }
  }

  if (failures.length > 0) {
    console.error('Asset validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    return 1;
  }

  console.log('Asset validation passed.');
  return 0;
}

process.exitCode = main();
