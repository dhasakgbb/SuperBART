#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageDimensions, readPng } from './lib/pixel';
import { ASSET_MANIFEST } from '../src/core/assetManifest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const REFERENCE_CONSTRAINTS: Record<
  string,
  { extensions: Set<string>; requiredMagic?: Buffer }
> = {
  'public/assets/target_look.png': { extensions: new Set(['.png']), requiredMagic: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  'public/assets/target_look_2.jpeg': { extensions: new Set(['.jpeg', '.jpg']), requiredMagic: Buffer.from([0xff, 0xd8, 0xff]) },
};

type ManifestImageDescriptor = {
  path: string;
  pass?: string;
  frameTiming?: {
    fps?: number;
    frameCount?: number;
  };
};

type SpriteSheetDescriptor = {
  path: string;
  frameWidth: number;
  frameHeight: number;
};

const REQUIRED_MANIFEST_IMAGES = new Set<string>([
  'bart_head_32',
  'bart_head_48',
  'bart_head_64',
  'bart_portrait_96',
  'dust_puff',
  'enemy_shell_retracted',
  'enemy_microservice',
  'projectile',
  'question_block',
  'question_block_used',
  'title_logo',
  'cloud_1',
  'cloud_2',
  'hill_far',
  'hill_near',
  'map_node_open',
  'map_node_done',
  'map_node_locked',
  'map_node_selected',
  'map_path_dot',
  'pickup_token',
  'pickup_eval',
  'pickup_gpu_allocation',
  'pickup_copilot_mode',
  'pickup_semantic_kernel',
  'pickup_deploy_to_prod',
  'pickup_works_on_my_machine',
  'flag',
  'checkpoint',
  'spring',
  'spike',
  'thwomp',
  'moving_platform',
  'dust_puff',
  'particle_spark',
  'particle_chain',
  'boss_health_bg',
  'boss_health_fill',
  'tile_ground',
  'tile_oneway',
]);

const REQUIRED_MANIFEST_SPRITESHEETS = new Set<string>(['bart_body_small', 'bart_body_big', 'bart_body_small_fire', 'bart_body_big_fire', 'boss_sheet']);
const REQUIRED_BITMAP_FONTS = new Set<string>(['hud']);
const REQUIRED_PASS_ASSIGNMENTS = new Map<string, string>([
  ['enemy_walker', 'enemy'],
  ['enemy_shell', 'enemy'],
  ['enemy_shell_retracted', 'enemy'],
  ['enemy_flying', 'enemy'],
  ['enemy_spitter', 'enemy'],
  ['projectile', 'object'],
  ['question_block', 'object'],
  ['question_block_used', 'object'],
  ['pickup_token', 'object'],
  ['pickup_eval', 'object'],
  ['pickup_gpu_allocation', 'object'],
  ['pickup_copilot_mode', 'object'],
  ['pickup_semantic_kernel', 'object'],
  ['pickup_deploy_to_prod', 'object'],
  ['pickup_works_on_my_machine', 'object'],
  ['flag', 'object'],
  ['checkpoint', 'object'],
  ['spring', 'hazard'],
  ['spike', 'hazard'],
  ['thwomp', 'hazard'],
  ['moving_platform', 'hazard'],
  ['dust_puff', 'object'],
  ['boss_health_bg', 'hud'],
  ['boss_health_fill', 'hud'],
  ['particle_spark', 'object'],
  ['particle_chain', 'object'],
  ['enemy_compliance', 'enemy'],
  ['enemy_techdebt', 'enemy'],
]);
const REQUIRED_SPRITESHEET_FRAMECOUNTS = new Map<string, number>([
  ['bart_body_small', 14],
  ['bart_body_big', 14],
  ['bart_body_small_fire', 14],
  ['bart_body_big_fire', 14],
  ['enemy_walker', 4],
  ['enemy_shell', 4],
  ['enemy_flying', 4],
  ['enemy_spitter', 4],
  ['enemy_compliance', 4],
  ['enemy_techdebt', 4],
  ['boss_sheet', 4],
]);
const REQUIRED_SPRITESHEET_FRAME_QUALITY: Record<string, { minOpaquePerFrame: number; minUniqueFrames: number }> = {
  bart_body_small: { minOpaquePerFrame: 6, minUniqueFrames: 8 },
  bart_body_big: { minOpaquePerFrame: 6, minUniqueFrames: 8 },
};
const REQUIRED_ANIM_FRAMECOUNTS = new Map<string, number>([
  ['thwomp', 2],
]);

function manifestImagePathToAbsPath(manifestPath: string): string {
  const normalized = manifestPath.startsWith('/') ? manifestPath.slice(1) : manifestPath;
  if (normalized.startsWith('assets/')) {
    return path.resolve(repoRoot, 'public', normalized);
  }
  if (normalized.startsWith('public/')) {
    return path.resolve(repoRoot, normalized);
  }
  return path.resolve(repoRoot, normalized);
}

type FrameQualitySpec = {
  minOpaquePerFrame: number;
  minUniqueFrames: number;
};

type PixelImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

function frameSignature(image: PixelImage, x: number, y: number, width: number, height: number): { opaque: number; signature: string } {
  let signature = 2166136261;
  let opaque = 0;
  const maxY = y + height;
  const maxX = x + width;
  for (let row = y; row < maxY; row += 1) {
    for (let col = x; col < maxX; col += 1) {
      const idx = (row * image.width + col) * 4;
      const alpha = image.data[idx + 3];
      if (alpha > 0) {
        opaque += 1;
      }
      signature ^= image.data[idx];
      signature = Math.imul(signature, 16777619) >>> 0;
      signature ^= image.data[idx + 1];
      signature = Math.imul(signature, 16777619) >>> 0;
      signature ^= image.data[idx + 2];
      signature = Math.imul(signature, 16777619) >>> 0;
      signature ^= image.data[idx + 3];
      signature = Math.imul(signature, 16777619) >>> 0;
    }
  }
  return { opaque, signature: signature.toString(16) };
}

function validateSpritesheetFrameQuality(
  failures: string[],
  key: string,
  imagePath: string,
  frameWidth: number,
  frameHeight: number,
  spec: FrameQualitySpec,
): void {
  let image: PixelImage;
  try {
    image = readPng(imagePath);
  } catch {
    failures.push(`failed to decode spritesheet image for "${key}": ${imagePath}`);
    return;
  }

  if (!frameWidth || !frameHeight || frameWidth > image.width || frameHeight > image.height) {
    failures.push(
      `spritesheet "${key}" has invalid frame dimensions ${frameWidth}x${frameHeight} for image ${image.width}x${image.height}.`,
    );
    return;
  }

  const columns = Math.floor(image.width / frameWidth);
  const rows = Math.floor(image.height / frameHeight);
  if (columns <= 0 || rows <= 0) {
    failures.push(`spritesheet "${key}" has invalid frame grid ${columns}x${rows} for frame size ${frameWidth}x${frameHeight}.`);
    return;
  }

  const totalFrames = columns * rows;
  const uniqueSignatures = new Set<string>();
  let totalOpaque = 0;
  let frameIndex = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const left = col * frameWidth;
      const top = row * frameHeight;
      const { opaque, signature } = frameSignature(image, left, top, frameWidth, frameHeight);
      totalOpaque += opaque;
      uniqueSignatures.add(signature);
      if (opaque === 0) {
        failures.push(`spritesheet "${key}" has an empty frame at index ${frameIndex}.`);
      } else if (opaque < spec.minOpaquePerFrame) {
        failures.push(
          `spritesheet "${key}" frame ${frameIndex} has only ${opaque} opaque pixels (minimum required ${spec.minOpaquePerFrame}).`,
        );
      }
      frameIndex += 1;
    }
  }

  if (totalOpaque === 0) {
    failures.push(`spritesheet "${key}" contains no opaque pixels.`);
  }

  if (uniqueSignatures.size < spec.minUniqueFrames) {
    failures.push(
      `spritesheet "${key}" has too little frame variance: ${uniqueSignatures.size}/${totalFrames} unique frames, expected >= ${spec.minUniqueFrames}.`,
    );
  }
}

function validateManifestRuntimeManifest(errors: string[]): void {
  for (const key of REQUIRED_MANIFEST_IMAGES) {
    if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.images, key)) {
      errors.push(`missing required manifest image key: ${key}`);
    }
  }

  for (const key of REQUIRED_MANIFEST_SPRITESHEETS) {
    if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.spritesheets, key)) {
      errors.push(`missing required manifest spritesheet key: ${key}`);
    }
  }

  for (const key of REQUIRED_BITMAP_FONTS) {
    if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.bitmapFonts, key)) {
      errors.push(`missing required manifest bitmap font key: ${key}`);
    }
  }

  const passCoverage = new Set<string>();
  const seenKeys = new Set<string>();
  for (const [key, descriptor] of Object.entries(ASSET_MANIFEST.images) as Array<[string, string | ManifestImageDescriptor]>) {
    if (seenKeys.has(key)) {
      errors.push(`ASSET_MANIFEST contains duplicate image key: ${key}`);
      continue;
    }
    seenKeys.add(key);

    const resolved = typeof descriptor === 'string' ? { path: descriptor } : descriptor;
    if (!resolved.path || typeof resolved.path !== 'string') {
      errors.push(`ASSET_MANIFEST image key "${key}" has invalid path descriptor.`);
      continue;
    }

    if (!resolved.path.toLowerCase().endsWith('.png')) {
      errors.push(`ASSET_MANIFEST image key "${key}" must be a PNG runtime asset, received ${resolved.path}`);
      continue;
    }

    const abs = manifestImagePathToAbsPath(resolved.path);
    if (!fs.existsSync(abs)) {
      errors.push(`ASSET_MANIFEST image key "${key}" does not exist on disk: ${resolved.path}`);
      continue;
    }

    const expectedPass = REQUIRED_PASS_ASSIGNMENTS.get(key);
    if (expectedPass != null) {
      passCoverage.add(expectedPass);
      if (typeof resolved.pass !== 'string') {
        errors.push(`ASSET_MANIFEST image key "${key}" must define pass "${expectedPass}".`);
      } else if (resolved.pass !== expectedPass) {
        errors.push(`ASSET_MANIFEST image key "${key}" pass must be "${expectedPass}", received "${resolved.pass}".`);
      }
    }

    const requiredFrameCount = REQUIRED_ANIM_FRAMECOUNTS.get(key);
    if (requiredFrameCount != null) {
      if (!resolved.frameTiming || typeof resolved.frameTiming !== 'object') {
        errors.push(`ASSET_MANIFEST image key "${key}" must define frameTiming for animated assets.`);
      } else if (resolved.frameTiming.frameCount !== requiredFrameCount) {
        errors.push(
          `ASSET_MANIFEST image key "${key}" frameCount must be ${requiredFrameCount}, received ${
            resolved.frameTiming.frameCount ?? 'missing'
          }.`,
        );
      }
    }

    if (resolved.frameTiming && resolved.frameTiming.frameCount != null && resolved.frameTiming.frameCount < 1) {
      errors.push(`ASSET_MANIFEST image key "${key}" frameCount must be >=1, received ${resolved.frameTiming.frameCount}.`);
    }
    if (resolved.frameTiming && typeof resolved.frameTiming.fps !== 'number') {
      errors.push(`ASSET_MANIFEST image key "${key}" frameTiming.fps must be defined.`);
    }
  }

  for (const key of REQUIRED_PASS_ASSIGNMENTS.keys()) {
    if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.images, key)) {
      continue;
    }
    if (!passCoverage.has(REQUIRED_PASS_ASSIGNMENTS.get(key)!)) {
      errors.push(`ASSET_MANIFEST does not include any assets for pass "${REQUIRED_PASS_ASSIGNMENTS.get(key)}".`);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.images, 'bart_portrait_96')) {
    errors.push('ASSET_MANIFEST must include bart_portrait_96 HUD portrait key.');
  }

  for (const [fontKey, fontDescriptor] of Object.entries(ASSET_MANIFEST.bitmapFonts) as Array<[string, { texture: string; data: string }]>) {
    const textureAbs = manifestImagePathToAbsPath(fontDescriptor.texture);
    if (!fs.existsSync(textureAbs)) {
      errors.push(`ASSET_MANIFEST bitmap font "${fontKey}" texture missing: ${fontDescriptor.texture}`);
    } else if (!fontDescriptor.texture.toLowerCase().endsWith('.png')) {
      errors.push(`ASSET_MANIFEST bitmap font "${fontKey}" texture must be PNG, received ${fontDescriptor.texture}`);
    }

    const dataAbs = manifestImagePathToAbsPath(fontDescriptor.data);
    if (!fs.existsSync(dataAbs)) {
      errors.push(`ASSET_MANIFEST bitmap font "${fontKey}" data missing: ${fontDescriptor.data}`);
    } else if (!fontDescriptor.data.toLowerCase().endsWith('.fnt')) {
      errors.push(`ASSET_MANIFEST bitmap font "${fontKey}" data must be .fnt, received ${fontDescriptor.data}`);
    }
  }

  for (const [key, sprite] of Object.entries(ASSET_MANIFEST.spritesheets) as Array<[string, SpriteSheetDescriptor]>) {
    if (!Object.prototype.hasOwnProperty.call(ASSET_MANIFEST.spritesheets, key)) {
      continue;
    }
    const abs = manifestImagePathToAbsPath(sprite.path);
    if (!sprite.path.toLowerCase().endsWith('.png')) {
      errors.push(`ASSET_MANIFEST spritesheet "${key}" must reference a PNG path, received ${sprite.path}.`);
      continue;
    }
    if (!fs.existsSync(abs)) {
      errors.push(`ASSET_MANIFEST spritesheet "${key}" path does not exist: ${sprite.path}`);
      continue;
    }

    try {
      const size = imageDimensions(abs);
      const expectedFrameCount = REQUIRED_SPRITESHEET_FRAMECOUNTS.get(key);
      const qualitySpec = REQUIRED_SPRITESHEET_FRAME_QUALITY[key];

      const isAligned = size.width % sprite.frameWidth === 0 && size.height % sprite.frameHeight === 0;
      if (!isAligned) {
        errors.push(
          `ASSET_MANIFEST spritesheet "${key}" dimensions must be divisible by frame size ${sprite.frameWidth}x${sprite.frameHeight}: ${size.width}x${size.height}.`,
        );
      }
      const frameCount = isAligned ? (size.width / sprite.frameWidth) * (size.height / sprite.frameHeight) : NaN;
      if (expectedFrameCount != null && isAligned && frameCount !== expectedFrameCount) {
        errors.push(
          `ASSET_MANIFEST spritesheet "${key}" frame count must be ${expectedFrameCount}, received ${frameCount}.`,
        );
      }

      if (isAligned && qualitySpec != null) {
        validateSpritesheetFrameQuality(errors, key, abs, sprite.frameWidth, sprite.frameHeight, qualitySpec);
      }
    } catch (error) {
      errors.push(`invalid spritesheet dimensions for ${key}: ${String(error)}`);
    }
  }
}

function readMagicHeader(absolutePath: string, length: number): Buffer | undefined {
  const fd = fs.openSync(absolutePath, 'r');
  try {
    const header = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, header, 0, length, 0);
    return bytesRead === length ? header : undefined;
  } finally {
    fs.closeSync(fd);
  }
}

const REQUIRED_FILES: Array<{ file: string; dimensions?: [number, number] }> = [
  { file: 'public/assets/target_look.png' },
  { file: 'public/assets/target_look_2.jpeg' },
  { file: 'public/assets/tiles/tileset.png', dimensions: [16, 112] },
  { file: 'public/assets/sprites/pickup_token.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_eval.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_gpu_allocation.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_copilot_mode.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_semantic_kernel.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_deploy_to_prod.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/pickup_works_on_my_machine.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/enemy_walker.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/enemy_shell.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/enemy_shell_retracted.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/enemy_microservice.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/enemy_flying.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/enemy_spitter.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/enemy_compliance.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/enemy_techdebt.png', dimensions: [64, 16] },
  { file: 'public/assets/sprites/projectile.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/flag.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/checkpoint.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/spring.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/spike.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/thwomp.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/moving_platform.png', dimensions: [32, 8] },
  { file: 'public/assets/sprites/question_block.png', dimensions: [16, 16] },
  { file: 'public/assets/sprites/question_block_used.png', dimensions: [16, 16] },
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
  { file: 'public/assets/sprites/bart_body_small.png', dimensions: [224, 64] },
  { file: 'public/assets/sprites/bart_body_big.png', dimensions: [224, 96] },
  { file: 'public/assets/sprites/dust_puff.png', dimensions: [8, 8] },
];

function collectSourceFilesRecursive(rootDir: string, out: string[] = []): string[] {
  if (!fs.existsSync(rootDir)) {
    return out;
  }
  const allowedExtensions = new Set(['.ts', '.js', '.tsx', '.jsx']);
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      collectSourceFilesRecursive(fullPath, out);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }
    if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    out.push(fullPath);
  }
  return out;
}

function validateNoRuntimeSvgReferences(errors: string[]): void {
  const sourceFiles = collectSourceFilesRecursive(path.resolve(repoRoot, 'src'));
  const svgLiteralRegex = /["'`][^"'`]*\.svg[^"'`]*["'`]/g;

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf-8');
    const matches = source.match(svgLiteralRegex);
    if (!matches) {
      continue;
    }

    const uniqueMatches = new Set(matches);
    for (const match of uniqueMatches) {
      errors.push(
        `Runtime source file ${path.relative(repoRoot, file)} references SVG asset ${match} in code path; production gameplay must consume PNG/JPG raster assets.`,
      );
    }
  }
}

function main(): number {
  const failures: string[] = [];
  validateManifestRuntimeManifest(failures);
  validateNoRuntimeSvgReferences(failures);

  for (const requirement of REQUIRED_FILES) {
    const absolute = path.join(repoRoot, requirement.file);
    if (!fs.existsSync(absolute)) {
      failures.push(`missing asset: ${requirement.file}`);
      continue;
    }

    if (!requirement.dimensions) {
      if (REFERENCE_CONSTRAINTS[requirement.file]) {
        const { extensions, requiredMagic } = REFERENCE_CONSTRAINTS[requirement.file]!;
        const suffix = path.extname(requirement.file).toLowerCase();
        if (!extensions.has(suffix)) {
          failures.push(`invalid extension for ${requirement.file}: expected ${[...extensions].join(' or ')}, received ${suffix}`);
        }
        if (requiredMagic) {
          const header = readMagicHeader(absolute, requiredMagic.length);
          if (!header || !header.equals(requiredMagic)) {
            failures.push(`invalid file signature for ${requirement.file}: does not match expected format`);
          }
        }
      }
      continue;
    }

    try {
      const size = imageDimensions(absolute);
      const [expectedWidth, expectedHeight] = requirement.dimensions;
      if (REFERENCE_CONSTRAINTS[requirement.file]) {
        const { extensions, requiredMagic } = REFERENCE_CONSTRAINTS[requirement.file]!;
        const suffix = path.extname(requirement.file).toLowerCase();
        if (!extensions.has(suffix)) {
          failures.push(
            `invalid extension for ${requirement.file}: expected ${[...extensions].join(' or ')}, received ${suffix}`,
          );
        }
        if (requiredMagic) {
          const header = readMagicHeader(absolute, requiredMagic.length);
          if (!header || !header.equals(requiredMagic)) {
            failures.push(`invalid file signature for ${requirement.file}: does not match expected format`);
          }
        }
      }
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
