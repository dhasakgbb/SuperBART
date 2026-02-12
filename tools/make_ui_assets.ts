#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  blit,
  createImage,
  drawDisk,
  drawLine,
  ensureDir,
  fillRect,
  getPixel,
  parseHex,
  setPixel,
  strokeRect,
  type PixelImage,
  type Rgba,
  writePng,
} from './lib/pixel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const COLORS = {
  inkDark: parseHex('#1D1D1D'),
  inkSoft: parseHex('#2B2824'),
  inkDeep: parseHex('#111114'),
  grassTop: parseHex('#46BA4C'),
  grassMid: parseHex('#20A36D'),
  mossDark: parseHex('#0A582C'),
  hillFarDark: parseHex('#1B5B59'),
  hillFarLight: parseHex('#248773'),
  hillNearDark: parseHex('#2E8E6B'),
  hillNearLight: parseHex('#4AC16E'),
  groundShadow: parseHex('#742B01'),
  groundMid: parseHex('#B6560E'),
  groundWarm: parseHex('#DC7C1D'),
  sand: parseHex('#DED256'),
  hudBlue: parseHex('#1E4EA3'),
  hudBlueLight: parseHex('#5FA2F2'),
  cloudLight: parseHex('#F2FDFD'),
  cloudShade: parseHex('#D9E7EB'),
  steel: parseHex('#9FA8B3'),
  steelDark: parseHex('#66707C'),
  checkpointBlue: parseHex('#3CA4E8'),
  checkpointGold: parseHex('#F1C55F'),
  checkpointRed: parseHex('#D0644A'),
  mapLockedDark: parseHex('#4E545E'),
  mapLockedLight: parseHex('#7B8591'),
  mapDoneDark: parseHex('#1D7E44'),
  mapDoneLight: parseHex('#59C66F'),
  mapOpenDark: parseHex('#1B4D95'),
  mapOpenLight: parseHex('#77B7FA'),
};

const TILE_SIZE = 16;

function isTransparent(pixel: Rgba): boolean {
  return pixel[3] === 0;
}

function drawGroundTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.groundMid);
  for (let y = 4; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const tone = (x + y) % 3;
      setPixel(tile, x, y, tone === 0 ? COLORS.groundWarm : tone === 1 ? COLORS.groundMid : COLORS.groundShadow);
    }
  }

  fillRect(tile, 0, 0, TILE_SIZE, 2, COLORS.grassTop);
  fillRect(tile, 0, 2, TILE_SIZE, 2, COLORS.grassMid);
  for (let x = 0; x < TILE_SIZE; x += 2) {
    setPixel(tile, x, 3, COLORS.mossDark);
  }
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
}

function drawBrickTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.groundWarm);
  for (let y = 0; y < TILE_SIZE; y += 4) {
    fillRect(tile, 0, y, TILE_SIZE, 1, COLORS.groundShadow);
  }
  for (let x = 0; x < TILE_SIZE; x += 8) {
    fillRect(tile, x, 4, 1, 4, COLORS.groundShadow);
    fillRect(tile, x + 4, 8, 1, 4, COLORS.groundShadow);
    fillRect(tile, x, 12, 1, 4, COLORS.groundShadow);
  }
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
}

function drawPlatformTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.steelDark);
  fillRect(tile, 0, 0, TILE_SIZE, 3, COLORS.steel);
  for (let y = 3; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 2) {
      setPixel(tile, x, y, COLORS.steel);
    }
  }
  fillRect(tile, 3, 6, 10, 2, COLORS.inkSoft);
  fillRect(tile, 4, 7, 8, 1, COLORS.sand);
  strokeRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, COLORS.inkDark);
}

function drawOneWayTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 1, 6, 14, 3, COLORS.groundWarm);
  fillRect(tile, 1, 9, 14, 2, COLORS.groundShadow);
  for (let x = 2; x < TILE_SIZE - 2; x += 4) {
    fillRect(tile, x, 6, 1, 5, COLORS.inkSoft);
  }
  strokeRect(tile, 1, 6, 14, 5, COLORS.inkDark);
}

function drawSpikeTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 0, 13, TILE_SIZE, 3, COLORS.groundShadow);
  for (let peak = 0; peak < 4; peak += 1) {
    const baseX = peak * 4;
    drawLine(tile, baseX, 13, baseX + 2, 6, COLORS.steel);
    drawLine(tile, baseX + 4, 13, baseX + 2, 6, COLORS.steel);
    fillRect(tile, baseX + 1, 10, 3, 3, COLORS.cloudShade);
  }
  for (let x = 0; x < TILE_SIZE; x += 1) {
    setPixel(tile, x, 13, COLORS.inkDark);
  }
  strokeRect(tile, 0, 13, TILE_SIZE, 3, COLORS.inkDark);
}

function drawCheckpointTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 7, 2, 2, 12, COLORS.steel);
  fillRect(tile, 9, 4, 5, 3, COLORS.checkpointBlue);
  fillRect(tile, 9, 7, 4, 2, COLORS.checkpointGold);
  fillRect(tile, 4, 13, 8, 2, COLORS.groundShadow);
  strokeRect(tile, 4, 13, 8, 2, COLORS.inkDark);
  strokeRect(tile, 9, 4, 5, 5, COLORS.inkDark);
  for (let y = 3; y < 14; y += 2) {
    setPixel(tile, 7, y, COLORS.inkDark);
    setPixel(tile, 8, y, COLORS.inkDark);
  }
}

function drawGoalTile(tile: PixelImage): void {
  fillRect(tile, 0, 0, TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
  fillRect(tile, 2, 12, 12, 3, COLORS.groundShadow);
  strokeRect(tile, 2, 12, 12, 3, COLORS.inkDark);
  fillRect(tile, 5, 3, 6, 9, COLORS.checkpointRed);
  fillRect(tile, 6, 4, 4, 7, COLORS.checkpointGold);
  strokeRect(tile, 5, 3, 6, 9, COLORS.inkDark);
  drawDisk(tile, 8, 8, 2, COLORS.sand);
}

function makeTileset(): void {
  const tileBuilders = [
    drawGroundTile,
    drawBrickTile,
    drawPlatformTile,
    drawOneWayTile,
    drawSpikeTile,
    drawCheckpointTile,
    drawGoalTile,
  ];

  const tileset = createImage(TILE_SIZE, TILE_SIZE * tileBuilders.length, [0, 0, 0, 0]);
  tileBuilders.forEach((builder, index) => {
    const tile = createImage(TILE_SIZE, TILE_SIZE, [0, 0, 0, 0]);
    builder(tile);
    blit(tileset, tile, 0, index * TILE_SIZE);
  });

  const output = path.join(repoRoot, 'public/assets/tiles/tileset.png');
  writePng(output, tileset);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeCoin(): void {
  const coin = createImage(16, 16, [0, 0, 0, 0]);
  drawDisk(coin, 8, 8, 6, COLORS.checkpointGold);
  drawDisk(coin, 8, 8, 4, COLORS.sand);
  fillRect(coin, 7, 4, 2, 8, COLORS.groundWarm);

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const [r, g, b, a] = getPixel(coin, x, y);
      if (a === 0) {
        continue;
      }
      const isEdge = isTransparent(getPixel(coin, x - 1, y)) || isTransparent(getPixel(coin, x + 1, y)) || isTransparent(getPixel(coin, x, y - 1)) || isTransparent(getPixel(coin, x, y + 1));
      if (isEdge) {
        setPixel(coin, x, y, COLORS.inkDark);
      } else if (x < 8 && y < 7) {
        setPixel(coin, x, y, [Math.min(r + 18, 255), Math.min(g + 18, 255), Math.min(b + 12, 255), a]);
      }
    }
  }

  const output = path.join(repoRoot, 'public/assets/sprites/coin.png');
  writePng(output, coin);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeQuestionBlock(): void {
  const block = createImage(16, 16, [0, 0, 0, 0]);
  fillRect(block, 0, 0, 16, 16, COLORS.groundWarm);
  fillRect(block, 1, 1, 14, 14, COLORS.checkpointGold);
  fillRect(block, 2, 2, 12, 4, COLORS.sand);

  const dark = COLORS.groundShadow;
  const q = [
    [6, 5], [7, 5], [8, 5],
    [9, 6],
    [8, 7],
    [7, 8],
    [7, 10],
  ];
  q.forEach(([x, y]) => setPixel(block, x, y, dark));

  fillRect(block, 6, 12, 4, 2, COLORS.groundMid);
  strokeRect(block, 0, 0, 16, 16, COLORS.inkDark);

  const output = path.join(repoRoot, 'public/assets/sprites/question_block.png');
  writePng(output, block);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function outlineOpaquePixels(image: PixelImage, outline: Rgba): void {
  const snapshot = createImage(image.width, image.height, [0, 0, 0, 0]);
  blit(snapshot, image, 0, 0);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const px = getPixel(snapshot, x, y);
      if (px[3] !== 0) {
        continue;
      }
      const neighbors = [
        getPixel(snapshot, x - 1, y),
        getPixel(snapshot, x + 1, y),
        getPixel(snapshot, x, y - 1),
        getPixel(snapshot, x, y + 1),
      ];
      if (neighbors.some((neighbor) => neighbor[3] > 0)) {
        setPixel(image, x, y, outline);
      }
    }
  }
}

function drawCloud(baseWidth: number, baseHeight: number, variant: 1 | 2): PixelImage {
  const cloud = createImage(baseWidth, baseHeight, [0, 0, 0, 0]);
  const puffs = variant === 1
    ? [[6, 9, 5], [12, 7, 6], [18, 9, 5]]
    : [[7, 10, 5], [13, 7, 7], [20, 7, 6], [26, 10, 5]];

  for (const [cx, cy, radius] of puffs) {
    drawDisk(cloud, cx, cy, radius, COLORS.cloudLight);
    drawDisk(cloud, cx, cy + 1, Math.max(2, radius - 1), COLORS.cloudShade);
  }

  for (let y = 0; y < cloud.height; y += 1) {
    for (let x = 0; x < cloud.width; x += 1) {
      const pixel = getPixel(cloud, x, y);
      if (pixel[3] === 0) {
        continue;
      }
      if (y < cloud.height / 2) {
        setPixel(cloud, x, y, COLORS.cloudLight);
      }
    }
  }

  outlineOpaquePixels(cloud, COLORS.inkDark);
  return cloud;
}

function makeClouds(): void {
  const cloud1 = drawCloud(24, 16, 1);
  const cloud2 = drawCloud(32, 18, 2);

  const out1 = path.join(repoRoot, 'public/assets/sprites/cloud_1.png');
  const out2 = path.join(repoRoot, 'public/assets/sprites/cloud_2.png');
  writePng(out1, cloud1);
  writePng(out2, cloud2);
  console.log(`Wrote ${path.relative(repoRoot, out1)}`);
  console.log(`Wrote ${path.relative(repoRoot, out2)}`);
}

type Glyph = string[];

const GLYPHS: Record<string, Glyph> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10001', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '00100', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00010', '00100', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function measureWordWidth(text: string, scale: number): number {
  const step = 5 * scale + scale;
  return Math.max(0, text.length * step - scale);
}

function drawWordLayer(image: PixelImage, text: string, x: number, y: number, scale: number, color: Rgba): void {
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') {
          continue;
        }
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, scale, color);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function drawWordHighlights(image: PixelImage, text: string, x: number, y: number, scale: number): void {
  const highlight = COLORS.sand;
  const highlightHeight = Math.max(1, Math.floor(scale * 0.5));
  let cursorX = x;
  for (const rawChar of text) {
    const char = rawChar.toUpperCase();
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    for (let gy = 0; gy < glyph.length; gy += 1) {
      if (gy > 1) {
        continue;
      }
      const row = glyph[gy] ?? '';
      for (let gx = 0; gx < row.length; gx += 1) {
        if (row[gx] !== '1') {
          continue;
        }
        fillRect(image, cursorX + gx * scale, y + gy * scale, scale, highlightHeight, highlight);
      }
    }
    cursorX += 5 * scale + scale;
  }
}

function makeTitleLogo(): void {
  const logo = createImage(512, 160, [0, 0, 0, 0]);

  drawDisk(logo, 256, 36, 82, [246, 213, 139, 48]);
  drawDisk(logo, 256, 42, 114, [246, 213, 139, 22]);

  const line1 = { text: 'SUPER', y: 20, scale: 7 };
  const line2 = { text: 'BART', y: 86, scale: 8 };

  const drawLine = (line: { text: string; y: number; scale: number }): void => {
    const width = measureWordWidth(line.text, line.scale);
    const x = Math.floor((logo.width - width) / 2);
    const dropOffsets = [
      [0, 3],
      [1, 3],
      [2, 4],
      [3, 4],
      [2, 2],
    ];
    for (const [dx, dy] of dropOffsets) {
      drawWordLayer(logo, line.text, x + dx, line.y + dy, line.scale, COLORS.inkDeep);
    }

    const outlineOffsets = [
      [-2, 0], [2, 0], [0, -2], [0, 2],
      [-2, -2], [2, -2], [-2, 2], [2, 2],
      [-3, 0], [3, 0], [0, -3], [0, 3],
    ];
    for (const [dx, dy] of outlineOffsets) {
      drawWordLayer(logo, line.text, x + dx, line.y + dy, line.scale, COLORS.inkDark);
    }

    drawWordLayer(logo, line.text, x, line.y + 1, line.scale, COLORS.groundMid);
    drawWordLayer(logo, line.text, x, line.y, line.scale, COLORS.checkpointGold);
    drawWordLayer(logo, line.text, x, line.y - 1, line.scale, COLORS.sand);
    drawWordHighlights(logo, line.text, x, line.y, line.scale);
  };

  drawLine(line1);
  drawLine(line2);

  strokeRect(logo, 0, 0, logo.width, logo.height, [29, 29, 29, 120]);

  const output = path.join(repoRoot, 'public/assets/sprites/title_logo.png');
  writePng(output, logo);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function makeMapNodes(): void {
  const makeNode = (center: Rgba, edge: Rgba, rim: Rgba, detail?: (img: PixelImage) => void): PixelImage => {
    const node = createImage(16, 16, [0, 0, 0, 0]);
    drawDisk(node, 8, 8, 6, edge);
    drawDisk(node, 8, 8, 4, center);
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const px = getPixel(node, x, y);
        if (px[3] === 0) {
          continue;
        }
        if (y < 8) {
          setPixel(node, x, y, rim);
        }
      }
    }
    outlineOpaquePixels(node, COLORS.inkDark);
    if (detail) {
      detail(node);
    }
    return node;
  };

  const open = makeNode(COLORS.mapOpenLight, COLORS.mapOpenDark, COLORS.hudBlueLight);
  const done = makeNode(COLORS.mapDoneLight, COLORS.mapDoneDark, COLORS.grassTop, (node) => {
    drawLine(node, 5, 8, 7, 10, COLORS.sand);
    drawLine(node, 7, 10, 11, 6, COLORS.sand);
    drawLine(node, 5, 9, 7, 11, COLORS.inkDark);
    drawLine(node, 7, 11, 11, 7, COLORS.inkDark);
  });
  const locked = makeNode(COLORS.mapLockedLight, COLORS.mapLockedDark, COLORS.steel, (node) => {
    fillRect(node, 6, 8, 4, 3, COLORS.inkDark);
    fillRect(node, 5, 7, 6, 1, COLORS.inkDark);
    fillRect(node, 6, 5, 1, 2, COLORS.inkDark);
    fillRect(node, 9, 5, 1, 2, COLORS.inkDark);
  });
  const selected = makeNode(COLORS.checkpointGold, COLORS.groundWarm, COLORS.sand, (node) => {
    drawDisk(node, 8, 8, 2, COLORS.inkDark);
    drawDisk(node, 8, 8, 1, COLORS.sand);
  });

  const pathDot = createImage(8, 8, [0, 0, 0, 0]);
  drawDisk(pathDot, 4, 4, 2, COLORS.checkpointGold);
  drawDisk(pathDot, 4, 4, 1, COLORS.sand);
  outlineOpaquePixels(pathDot, COLORS.inkDark);

  const outputDir = path.join(repoRoot, 'public/assets/sprites');
  const outputs: Array<{ file: string; image: PixelImage }> = [
    { file: 'map_node_open.png', image: open },
    { file: 'map_node_done.png', image: done },
    { file: 'map_node_locked.png', image: locked },
    { file: 'map_node_selected.png', image: selected },
    { file: 'map_path_dot.png', image: pathDot },
  ];

  for (const output of outputs) {
    const outputPath = path.join(outputDir, output.file);
    writePng(outputPath, output.image);
    console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
  }
}

function makeHills(): void {
  const far = createImage(80, 44, [0, 0, 0, 0]);
  drawDisk(far, 22, 32, 24, COLORS.hillFarDark);
  drawDisk(far, 50, 28, 26, COLORS.hillFarDark);
  drawDisk(far, 62, 30, 18, COLORS.hillFarDark);
  drawDisk(far, 48, 20, 12, COLORS.hillFarLight);
  drawDisk(far, 24, 24, 10, COLORS.hillFarLight);
  outlineOpaquePixels(far, COLORS.inkDark);

  const near = createImage(88, 46, [0, 0, 0, 0]);
  drawDisk(near, 26, 34, 24, COLORS.hillNearDark);
  drawDisk(near, 56, 30, 28, COLORS.hillNearDark);
  drawDisk(near, 72, 33, 16, COLORS.hillNearDark);
  drawDisk(near, 52, 22, 14, COLORS.hillNearLight);
  drawDisk(near, 28, 26, 12, COLORS.hillNearLight);
  outlineOpaquePixels(near, COLORS.inkDark);

  const outFar = path.join(repoRoot, 'public/assets/sprites/hill_far.png');
  const outNear = path.join(repoRoot, 'public/assets/sprites/hill_near.png');
  writePng(outFar, far);
  writePng(outNear, near);
  console.log(`Wrote ${path.relative(repoRoot, outFar)}`);
  console.log(`Wrote ${path.relative(repoRoot, outNear)}`);
}

const FONT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-!?., ';

function makeBitmapFont(): void {
  const cellWidth = 8;
  const cellHeight = 8;
  const columns = 16;
  const rows = Math.ceil(FONT_CHARSET.length / columns);
  const atlas = createImage(columns * cellWidth, rows * cellHeight, [0, 0, 0, 0]);

  FONT_CHARSET.split('').forEach((char, idx) => {
    const glyph = GLYPHS[char] ?? GLYPHS[' '];
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const ox = col * cellWidth + 1;
    const oy = row * cellHeight;

    glyph.forEach((line, gy) => {
      for (let gx = 0; gx < line.length; gx += 1) {
        if (line[gx] === '1') {
          setPixel(atlas, ox + gx, oy + gy, COLORS.cloudLight);
          if (gy > 0) {
            const above = getPixel(atlas, ox + gx, oy + gy - 1);
            if (above[3] === 0) {
              setPixel(atlas, ox + gx, oy + gy - 1, [18, 18, 18, 128]);
            }
          }
        }
      }
    });
  });

  const fontDir = path.join(repoRoot, 'public/assets/fonts');
  ensureDir(fontDir);

  const pngPath = path.join(fontDir, 'bitmap_font.png');
  writePng(pngPath, atlas);
  console.log(`Wrote ${path.relative(repoRoot, pngPath)}`);

  const charLines: string[] = [];
  FONT_CHARSET.split('').forEach((char, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const x = col * cellWidth;
    const y = row * cellHeight;
    const code = char.charCodeAt(0);
    charLines.push(
      `    <char id="${code}" x="${x}" y="${y}" width="6" height="8" xoffset="0" yoffset="0" xadvance="7" page="0" chnl="0" />`,
    );
  });

  const fntXml = [
    '<?xml version="1.0"?>',
    '<font>',
    '  <info face="SuperBARTBitmap" size="8" bold="0" italic="0" charset="" unicode="0" stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1" />',
    `  <common lineHeight="8" base="7" scaleW="${atlas.width}" scaleH="${atlas.height}" pages="1" packed="0" />`,
    '  <pages>',
    '    <page id="0" file="bitmap_font.png" />',
    '  </pages>',
    `  <chars count="${FONT_CHARSET.length}">`,
    ...charLines,
    '  </chars>',
    '</font>',
    '',
  ].join('\n');

  const fntPath = path.join(fontDir, 'bitmap_font.fnt');
  fs.writeFileSync(fntPath, fntXml, 'utf-8');
  console.log(`Wrote ${path.relative(repoRoot, fntPath)}`);
}

function makeDustPuff(): void {
  const puff = createImage(8, 8, [0, 0, 0, 0] as Rgba);
  drawDisk(puff, 4, 4, 3, COLORS.cloudShade);
  drawDisk(puff, 4, 4, 2, COLORS.cloudLight);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const [r, g, b, a] = getPixel(puff, x, y);
      if (a > 0) {
        const dist = Math.sqrt((x - 4) ** 2 + (y - 4) ** 2);
        const fade = Math.max(0, 1 - dist / 3.5);
        setPixel(puff, x, y, [r, g, b, Math.round(a * fade)] as Rgba);
      }
    }
  }
  const output = path.join(repoRoot, 'public/assets/sprites/dust_puff.png');
  writePng(output, puff);
  console.log(`Wrote ${path.relative(repoRoot, output)}`);
}

function main(): number {
  makeTileset();
  makeCoin();
  makeQuestionBlock();
  makeClouds();
  makeHills();
  makeMapNodes();
  makeTitleLogo();
  makeBitmapFont();
  makeDustPuff();
  return 0;
}

process.exitCode = main();
