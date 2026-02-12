#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cloneImage,
  createImage,
  crop,
  getPixel,
  parseHex,
  readPng,
  resizeNearest,
  setPixel,
  type PixelImage,
  type Rgba,
  writePng,
} from './lib/pixel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SOURCE = path.join(repoRoot, 'public/assets/bart_source.png');
const OUTPUT_DIR = path.join(repoRoot, 'public/assets/sprites');

const OUTPUTS = [
  { file: 'bart_head_32.png', size: 32, sample: 10 },
  { file: 'bart_head_48.png', size: 48, sample: 14 },
  { file: 'bart_head_64.png', size: 64, sample: 18 },
  { file: 'bart_portrait_96.png', size: 96, sample: 24 },
] as const;

const WHITE_THRESHOLD = 244;
const MARGIN_RATIO = 0.08;
const OUTLINE: Rgba = [22, 22, 24, 220];

const BART_PALETTE: Rgba[] = [
  parseHex('#101010'),
  parseHex('#1D1D1D'),
  parseHex('#2B2824'),
  parseHex('#412F2A'),
  parseHex('#5D4438'),
  parseHex('#754B3D'),
  parseHex('#8D5C4A'),
  parseHex('#A66E54'),
  parseHex('#BF8263'),
  parseHex('#D89A76'),
  parseHex('#E9B48E'),
  parseHex('#F2C98E'),
  parseHex('#E6D05A'),
  parseHex('#F1DD77'),
  parseHex('#F4E3A1'),
  parseHex('#9D2C2C'),
  parseHex('#B63A3A'),
  parseHex('#CF5151'),
  parseHex('#E36863'),
  parseHex('#F3F3F3'),
];

function maskWhiteBackground(source: PixelImage): PixelImage {
  const masked = cloneImage(source);
  for (let y = 0; y < masked.height; y += 1) {
    for (let x = 0; x < masked.width; x += 1) {
      const [r, g, b, a] = getPixel(masked, x, y);
      if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
        setPixel(masked, x, y, [r, g, b, 0]);
      } else {
        setPixel(masked, x, y, [r, g, b, a]);
      }
    }
  }
  return masked;
}

function alphaBounds(image: PixelImage): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [, , , alpha] = getPixel(image, x, y);
      if (alpha === 0) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return { minX: 0, minY: 0, maxX: image.width - 1, maxY: image.height - 1 };
  }

  return { minX, minY, maxX, maxY };
}

function cropSquare(image: PixelImage): PixelImage {
  const bounds = alphaBounds(image);
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  const side = Math.ceil(Math.max(width, height) * (1 + MARGIN_RATIO * 2));
  const centerX = bounds.minX + Math.floor(width / 2);
  const centerY = bounds.minY + Math.floor(height / 2);

  const left = Math.max(0, Math.min(image.width - side, centerX - Math.floor(side / 2)));
  const top = Math.max(0, Math.min(image.height - side, centerY - Math.floor(side / 2)));

  return crop(image, left, top, side, side);
}

function nearestPaletteColor(r: number, g: number, b: number): Rgba {
  let best = BART_PALETTE[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of BART_PALETTE) {
    const dr = r - candidate[0];
    const dg = g - candidate[1];
    const db = b - candidate[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

function quantizePalette(image: PixelImage): PixelImage {
  const quantized = createImage(image.width, image.height, [0, 0, 0, 0]);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = getPixel(image, x, y);
      if (a === 0) {
        continue;
      }
      const nearest = nearestPaletteColor(r, g, b);
      setPixel(quantized, x, y, [nearest[0], nearest[1], nearest[2], 255]);
    }
  }
  return quantized;
}

function addSubtleOutline(image: PixelImage): PixelImage {
  const outlined = cloneImage(image);
  const snapshot = cloneImage(image);

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [, , , alpha] = getPixel(snapshot, x, y);
      if (alpha > 0) {
        continue;
      }
      const neighbors = [
        getPixel(snapshot, x - 1, y),
        getPixel(snapshot, x + 1, y),
        getPixel(snapshot, x, y - 1),
        getPixel(snapshot, x, y + 1),
      ];
      if (neighbors.some((neighbor) => neighbor[3] > 0)) {
        setPixel(outlined, x, y, OUTLINE);
      }
    }
  }

  return outlined;
}

function main(): number {
  let source: PixelImage;
  try {
    source = readPng(SOURCE);
  } catch {
    console.error(`ERROR: missing or invalid source image: ${SOURCE}`);
    return 1;
  }

  const masked = maskWhiteBackground(source);
  const cropped = cropSquare(masked);

  for (const output of OUTPUTS) {
    const downscaled = resizeNearest(cropped, output.sample, output.sample);
    const quantized = quantizePalette(downscaled);
    const upscaled = resizeNearest(quantized, output.size, output.size);
    const outlined = addSubtleOutline(upscaled);

    const outputPath = path.join(OUTPUT_DIR, output.file);
    writePng(outputPath, outlined);
    console.log(`Wrote ${path.relative(repoRoot, outputPath)} (${output.size}x${output.size})`);
  }

  return 0;
}

process.exitCode = main();
