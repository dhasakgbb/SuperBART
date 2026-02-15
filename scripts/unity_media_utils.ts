import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { ASSET_MANIFEST } from '../src/core/assetManifest';
import { AI_MUSIC_TRACKS } from '../src/audio/aiMusic';
import type { AssetImageSource } from '../src/core/assetManifest';

export type MediaProfile = 'm1' | 'ui' | 'full';

export type MediaBucket = 'runtime' | 'ui' | 'full' | 'audio';

export interface MediaAssetRecord {
  source: string;
  destination: string;
  category: string;
  required: boolean;
  bucket: MediaBucket;
}

export interface MediaDiscoveredAsset {
  source: string;
  reason: 'included' | 'ignored';
}

export const DEFAULT_MEDIA_PROFILE: MediaProfile = 'm1';
export const PUBLIC_MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.fnt']);
export const PUBLIC_MEDIA_IGNORE_SUBSTRINGS = [
  '/.DS_Store',
  '/unnamed',
  '/Gemini_Generated_',
  '/.gitkeep',
];

export const UI_MEDIA_ASSETS = [
  'assets/title_bart.png',
  'assets/title_bart_clean.png',
  'assets/title_bg_forest.png',
  'assets/title_bg_ice.png',
  'assets/title_bg_magma.png',
  'assets/title_bg_premium.png',
  'assets/title_bg_void.png',
  'assets/bg/title_sky_premium.png',
  'assets/world_map_premium.png',
  'assets/target_look.png',
  'assets/target_look_2.jpeg',
  'assets/bart_hero_premium.png',
  'assets/sprites/title_logo_premium.png',
  'assets/sprites/title_logo_clean.png',
];

export function parseMediaProfile(value: string | undefined): MediaProfile {
  if (!value) {
    return DEFAULT_MEDIA_PROFILE;
  }

  const profile = value.toLowerCase();
  if (profile === 'm1' || profile === 'ui' || profile === 'full') {
    return profile;
  }

  throw new Error(`Unsupported --profile "${value}". Allowed values: m1, ui, full`);
}

export function normalizeSourcePath(raw: string): string {
  return raw.startsWith('/') ? raw.slice(1) : raw;
}

function addAssetRecord(
  collector: Map<string, MediaAssetRecord>,
  sourceRel: string,
  destinationRel: string,
  category: string,
  required: boolean,
  bucket: MediaBucket,
): void {
  const source = normalizeSourcePath(sourceRel);
  if (!collector.has(source)) {
    collector.set(source, {
      source,
      destination: normalizeSourcePath(destinationRel),
      category,
      required,
      bucket,
    });
  }
}

export function collectRuntimeAssetRecords(collector: Map<string, MediaAssetRecord>): void {
  for (const [key, imageSource] of Object.entries(ASSET_MANIFEST.images) as Array<[string, AssetImageSource]>) {
    const source = typeof imageSource === 'string' ? imageSource : imageSource.path;
    addAssetRecord(collector, source, source, `image:${key}`, true, 'runtime');
  }

  for (const [key, sheet] of Object.entries(ASSET_MANIFEST.spritesheets)) {
    addAssetRecord(collector, sheet.path, sheet.path, `spritesheet:${key}`, true, 'runtime');
  }

  for (const [key, font] of Object.entries(ASSET_MANIFEST.bitmapFonts)) {
    addAssetRecord(collector, font.texture, font.texture, `fontTexture:${key}`, true, 'runtime');
    addAssetRecord(collector, font.data, font.data, `fontData:${key}`, true, 'runtime');
  }
}

export function collectAudioAssetRecords(collector: Map<string, MediaAssetRecord>): void {
  for (const track of Object.values(AI_MUSIC_TRACKS)) {
    const source = normalizeSourcePath(track.url);
    addAssetRecord(collector, source, source, `audio:${track.id}`, false, 'audio');
  }
}

export function collectUiProfileAssetRecords(collector: Map<string, MediaAssetRecord>): void {
  for (const source of UI_MEDIA_ASSETS) {
    addAssetRecord(collector, source, source, `ui:${source}`, false, 'ui');
  }
}

export function shouldIgnorePublicAsset(relPath: string): boolean {
  return PUBLIC_MEDIA_IGNORE_SUBSTRINGS.some((fragment) => relPath.includes(fragment));
}

function walkPublicMedia(absDir: string, relDir: string, found: string[], ignored: string[]): void {
  const entries = readdirSync(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const nextRelPath = relDir === '' ? entry.name : `${relDir}/${entry.name}`;
    const nextAbsPath = path.join(absDir, entry.name);

    if (entry.isDirectory()) {
      walkPublicMedia(nextAbsPath, nextRelPath, found, ignored);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const stats = statSync(nextAbsPath);
      if (!stats.isDirectory()) {
        continue;
      }
      walkPublicMedia(nextAbsPath, nextRelPath, found, ignored);
      continue;
    }

    const normalized = `assets/${nextRelPath}`;
    if (shouldIgnorePublicAsset(normalized)) {
      ignored.push(normalized);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!PUBLIC_MEDIA_EXTENSIONS.has(extension)) {
      continue;
    }

    found.push(normalized);
  }
}

export function collectDiscoveredPublicAssets(
  absAssetsDir: string,
): { discovered: string[]; ignored: string[] } {
  const found: string[] = [];
  const ignored: string[] = [];

  walkPublicMedia(absAssetsDir, '', found, ignored);

  found.sort((a, b) => a.localeCompare(b));
  ignored.sort((a, b) => a.localeCompare(b));

  return { discovered: found, ignored };
}

export function buildUnityMediaPlan(
  options: {
    profile?: MediaProfile;
    includeAudio?: boolean;
  } = {},
): MediaAssetRecord[] {
  const profile = options.profile ?? DEFAULT_MEDIA_PROFILE;
  const includeAudio = options.includeAudio ?? true;
  const collector = new Map<string, MediaAssetRecord>();

  collectRuntimeAssetRecords(collector);

  if (profile === 'ui' || profile === 'full') {
    collectUiProfileAssetRecords(collector);
  }

  if (includeAudio) {
    collectAudioAssetRecords(collector);
  }

  if (profile === 'full') {
    const { discovered } = collectDiscoveredPublicAssets(path.resolve(process.cwd(), 'public', 'assets'));
    for (const source of discovered) {
      if (!collector.has(source)) {
        addAssetRecord(collector, source, source, `fullProfile:${path.extname(source).toLowerCase()}`, false, 'full');
      }
    }
  }

  return [...collector.values()].sort((a, b) => a.source.localeCompare(b.source));
}
