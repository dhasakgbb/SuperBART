import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

export type Rgba = readonly [number, number, number, number];

export interface PixelImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function createImage(width: number, height: number, fill: Rgba = [0, 0, 0, 0]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  const image: PixelImage = { width, height, data };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(image, x, y, fill);
    }
  }
  return image;
}

export function cloneImage(image: PixelImage): PixelImage {
  return {
    width: image.width,
    height: image.height,
    data: new Uint8ClampedArray(image.data),
  };
}

function indexOf(image: PixelImage, x: number, y: number): number {
  return (y * image.width + x) * 4;
}

export function inBounds(image: PixelImage, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < image.width && y < image.height;
}

export function getPixel(image: PixelImage, x: number, y: number): Rgba {
  if (!inBounds(image, x, y)) {
    return [0, 0, 0, 0];
  }
  const idx = indexOf(image, x, y);
  return [
    image.data[idx],
    image.data[idx + 1],
    image.data[idx + 2],
    image.data[idx + 3],
  ];
}

export function setPixel(image: PixelImage, x: number, y: number, color: Rgba): void {
  if (!inBounds(image, x, y)) {
    return;
  }
  const idx = indexOf(image, x, y);
  image.data[idx] = color[0];
  image.data[idx + 1] = color[1];
  image.data[idx + 2] = color[2];
  image.data[idx + 3] = color[3];
}

export function fillRect(
  image: PixelImage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgba,
): void {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      setPixel(image, px, py, color);
    }
  }
}

export function strokeRect(
  image: PixelImage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgba,
): void {
  for (let px = x; px < x + width; px += 1) {
    setPixel(image, px, y, color);
    setPixel(image, px, y + height - 1, color);
  }
  for (let py = y; py < y + height; py += 1) {
    setPixel(image, x, py, color);
    setPixel(image, x + width - 1, py, color);
  }
}

export function drawDisk(
  image: PixelImage,
  cx: number,
  cy: number,
  radius: number,
  color: Rgba,
): void {
  const rr = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) {
        setPixel(image, x, y, color);
      }
    }
  }
}

export function drawLine(
  image: PixelImage,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgba,
): void {
  let sx = x0;
  let sy = y0;
  const dx = Math.abs(x1 - sx);
  const dy = -Math.abs(y1 - sy);
  const stepx = sx < x1 ? 1 : -1;
  const stepy = sy < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    setPixel(image, sx, sy, color);
    if (sx === x1 && sy === y1) {
      break;
    }
    const err2 = err * 2;
    if (err2 >= dy) {
      err += dy;
      sx += stepx;
    }
    if (err2 <= dx) {
      err += dx;
      sy += stepy;
    }
  }
}

export function blit(dst: PixelImage, src: PixelImage, dstX: number, dstY: number): void {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const [r, g, b, a] = getPixel(src, x, y);
      if (a === 0) {
        continue;
      }
      setPixel(dst, dstX + x, dstY + y, [r, g, b, a]);
    }
  }
}

export function resizeNearest(image: PixelImage, outWidth: number, outHeight: number): PixelImage {
  const out = createImage(outWidth, outHeight);
  const sx = image.width / outWidth;
  const sy = image.height / outHeight;
  for (let y = 0; y < outHeight; y += 1) {
    for (let x = 0; x < outWidth; x += 1) {
      const srcX = Math.min(image.width - 1, Math.floor(x * sx));
      const srcY = Math.min(image.height - 1, Math.floor(y * sy));
      setPixel(out, x, y, getPixel(image, srcX, srcY));
    }
  }
  return out;
}

export function crop(image: PixelImage, x: number, y: number, width: number, height: number): PixelImage {
  const out = createImage(width, height);
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      setPixel(out, px, py, getPixel(image, x + px, y + py));
    }
  }
  return out;
}

export function mapImage(image: PixelImage, mapper: (r: number, g: number, b: number, a: number, x: number, y: number) => Rgba): PixelImage {
  const out = createImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = getPixel(image, x, y);
      setPixel(out, x, y, mapper(r, g, b, a, x, y));
    }
  }
  return out;
}

export function readPng(filePath: string): PixelImage {
  const buf = fs.readFileSync(filePath);
  const png = PNG.sync.read(buf);
  return {
    width: png.width,
    height: png.height,
    data: new Uint8ClampedArray(png.data),
  };
}

export function writePng(filePath: string, image: PixelImage): void {
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, PNG.sync.write(png, { colorType: 6 }));
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function parseHex(hex: string, alpha = 255): Rgba {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    throw new Error(`Expected 6-digit hex, got: ${hex}`);
  }
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return [r, g, b, alpha];
}

export function imageDimensions(filePath: string): { width: number; height: number } {
  const png = PNG.sync.read(fs.readFileSync(filePath), { checkCRC: false });
  return { width: png.width, height: png.height };
}
