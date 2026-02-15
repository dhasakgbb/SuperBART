#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildUnityMediaPlan,
  collectDiscoveredPublicAssets,
  type MediaAssetRecord,
  type MediaProfile,
  parseMediaProfile,
} from './unity_media_utils';

type CliOptions = {
  outDir: string;
  includeAudio: boolean;
  emitManifest: boolean;
  profile: MediaProfile;
};

type AssetRecord = MediaAssetRecord;

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) {
    return process.argv[index + 1];
  }
  return undefined;
}

function parseBoolean(name: string, defaultValue: boolean): boolean {
  const value = getArgValue(name);
  if (value == null) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseOptions(): CliOptions {
  return {
    outDir: path.resolve(process.cwd(), getArgValue('out') ?? path.join('unity-port-kit', 'Assets', 'SuperbartAssets')),
    includeAudio: parseBoolean('audio', true),
    emitManifest: parseBoolean('manifest', true),
    profile: parseMediaProfile(getArgValue('profile')),
  };
}

function copyArtifacts(options: CliOptions, artifacts: AssetRecord[]): void {
  const sourceRoot = path.resolve(process.cwd(), 'public');
  const outRoot = options.outDir;
  let copied = 0;
  const skipped: AssetRecord[] = [];

  for (const artifact of artifacts) {
    const source = path.resolve(sourceRoot, artifact.source);
    const destination = path.resolve(outRoot, artifact.destination);
    const destinationDir = path.dirname(destination);

    if (!existsSync(source)) {
      if (artifact.required) {
        throw new Error(`Missing required source asset: ${artifact.source}`);
      }
      skipped.push(artifact);
      continue;
    }

    mkdirSync(destinationDir, { recursive: true });
    cpSync(source, destination, { force: true });
    copied += 1;
  }

  process.stdout.write(`Unity media sync copied ${copied} files to ${path.relative(process.cwd(), outRoot)}.\n`);
  if (skipped.length > 0) {
    process.stdout.write(
      `Skipped ${skipped.length} optional assets (not present in source):\n${skipped.map((item) => `- ${item.source}`).join('\n')}\n`
    );
  }
}

function writeManifest(
  options: CliOptions,
  artifacts: AssetRecord[],
  generatedAt: string,
): void {
  if (!options.emitManifest) return;

  const manifestPath = path.resolve(process.cwd(), 'unity-port-kit', 'MediaSyncManifest.json');
  const manifest = {
    version: 1,
    generatedAt,
    outputDir: path.relative(process.cwd(), options.outDir),
    profile: options.profile,
    includeAudio: options.includeAudio,
    assetCount: artifacts.length,
  assets: artifacts.map((asset) => ({
    source: asset.source,
    destination: asset.destination,
    category: asset.category,
    required: asset.required,
    bucket: asset.bucket,
  })),
  };

  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  process.stdout.write(`Unity media manifest written: ${path.relative(process.cwd(), manifestPath)}\n`);
}

function writeProfileSummary(profile: MediaProfile, includeAudio: boolean, count: number): void {
  if (profile === 'full') {
    const { discovered, ignored } = collectDiscoveredPublicAssets(path.resolve(process.cwd(), 'public', 'assets'));
    const ignoredInProfile = ignored.length;
    const discoveredCount = discovered.length;
    const matchedCount = count;
    process.stdout.write(
      `FULL profile summary:\n` +
        `- Discovered media assets in public/assets: ${discoveredCount}\n` +
        `- Ignored candidates: ${ignoredInProfile}\n` +
        `- Planned sync count (including required/runtime): ${matchedCount}\n`
    );
  } else {
    process.stdout.write(`Profile ${profile} sync complete with ${count} assets (audio ${includeAudio ? 'enabled' : 'disabled'}).\n`);
  }
}

function printUsage(): void {
  process.stdout.write(
    [
      'SUPERBART -> Unity media sync',
      '',
      'Usage:',
      '  npx tsx scripts/export_unity_media.ts --out unity-port-kit/Assets/SuperbartAssets --audio true --manifest true',
      '',
      'Options:',
      '  --out <dir>      Output directory under repository root (default: unity-port-kit/Assets/SuperbartAssets)',
      '  --audio <true|false>  Include AI music tracks in /music/ai (default: true)',
      '  --manifest <true|false> Emit unity-port-kit/MediaSyncManifest.json (default: true)',
      '  --profile <m1|ui|full> Media profile for sync: m1=runtime baseline, ui=include UI polish, full=ui + discovered non-manifest media',
      '',
    ].join('\n')
  );
}

function runCli(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseOptions();
  const artifacts = buildUnityMediaPlan({
    profile: options.profile,
    includeAudio: options.includeAudio,
  });

  const artifactList = [...artifacts].sort((a, b) => a.source.localeCompare(b.source));

  const generatedAt = new Date().toISOString();

  copyArtifacts(options, artifactList);
  writeManifest(options, artifactList, generatedAt);
  writeProfileSummary(options.profile, options.includeAudio, artifactList.length);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (pathToFileURL(invokedPath).href === import.meta.url) {
  runCli(process.argv.slice(2));
}
