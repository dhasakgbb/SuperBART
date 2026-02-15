#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildUnityMediaPlan,
  type MediaAssetRecord,
  type MediaProfile,
  parseMediaProfile,
  collectDiscoveredPublicAssets,
} from './unity_media_utils';

type CliOptions = {
  outDir: string;
  profile: MediaProfile;
  includeAudio: boolean;
  manifestPath: string;
  strict: boolean;
};

type ManifestEntry = {
  source: string;
  destination: string;
  category: string;
  required: boolean;
  bucket?: string;
};

type AuditReport = {
  version: number;
  generatedAt: string;
  sourceRoot: string;
  profile: MediaProfile;
  includeAudio: boolean;
  catalog: {
    discoveredCount: number;
    deferredFromExpectedCount: number;
    deferredFromExpected: string[];
  };
  manifest: {
    path: string;
    exists: boolean;
  };
  counts: {
    expectedTotal: number;
    expectedRequired: number;
    expectedOptional: number;
    manifestTotal: number;
    skippedManifest: number;
    sourceMissingRequired: number;
    sourceMissingOptional: number;
  };
  diff: {
    expectedMissingFromManifest: string[];
    manifestExtras: string[];
    destinationMismatches: Array<{
      source: string;
      expected: string;
      manifest: string;
    }>;
    requiredSourceMissing: string[];
    optionalSourceMissing: string[];
  };
};

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'unity');
const DEFAULT_MANIFEST = path.resolve(process.cwd(), 'unity-port-kit', 'MediaSyncManifest.json');

function getArgValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }
  return argv[index + 1];
}

function parseBoolean(argv: string[], name: string, fallback: boolean): boolean {
  const value = getArgValue(argv, name);
  if (value == null) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function parseOptions(argv: string[]): CliOptions {
  return {
    outDir: path.resolve(process.cwd(), getArgValue(argv, 'out') ?? DEFAULT_OUT_DIR),
    profile: parseMediaProfile(getArgValue(argv, 'profile')),
    includeAudio: parseBoolean(argv, 'audio', true),
    manifestPath: path.resolve(process.cwd(), getArgValue(argv, 'manifest') ?? DEFAULT_MANIFEST),
    strict: parseBoolean(argv, 'strict', false),
  };
}

function readManifest(manifestPath: string): ManifestEntry[] {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw) as { assets?: unknown };

  if (!Array.isArray(parsed.assets)) {
    return [];
  }

  const entries: ManifestEntry[] = [];
  for (const asset of parsed.assets) {
    if (asset == null || typeof asset !== 'object') {
      continue;
    }
    const entry = asset as Partial<ManifestEntry>;
    if (typeof entry.source !== 'string' || typeof entry.destination !== 'string' || typeof entry.category !== 'string') {
      continue;
    }
    const required = typeof entry.required === 'boolean' ? entry.required : false;
    const bucket = typeof entry.bucket === 'string' ? entry.bucket : undefined;
    entries.push({
      source: entry.source,
      destination: entry.destination,
      category: entry.category,
      required,
      bucket,
    });
  }

  return entries;
}

function normalizeManifest(manifest: ManifestEntry[]): Map<string, ManifestEntry> {
  const map = new Map<string, ManifestEntry>();
  for (const entry of manifest) {
    if (!map.has(entry.source)) {
      map.set(entry.source, entry);
    }
  }
  return map;
}

function buildIndex(assets: MediaAssetRecord[]): Map<string, MediaAssetRecord> {
  const map = new Map<string, MediaAssetRecord>();
  for (const asset of assets) {
    map.set(asset.source, asset);
  }

  return map;
}

function buildAuditReport(
  manifestEntries: ManifestEntry[],
  expectedAssets: MediaAssetRecord[],
  options: {
    profile: MediaProfile;
    includeAudio: boolean;
    manifestPath: string;
    manifestExists: boolean;
  },
): AuditReport {
  const sourceRoot = path.resolve(process.cwd(), 'public');
  const manifest = normalizeManifest(manifestEntries);
  const expected = buildIndex(expectedAssets);
  const discovered = collectDiscoveredPublicAssets(path.resolve(process.cwd(), 'public', 'assets')).discovered;
  const expectedMissingFromManifest: string[] = [];
  const requiredSourceMissing: string[] = [];
  const optionalSourceMissing: string[] = [];
  const destinationMismatches: AuditReport['diff']['destinationMismatches'] = [];
  const deferredFromExpected: string[] = [];

  for (const expectedAsset of expected.values()) {
    const manifestAsset = manifest.get(expectedAsset.source);
    if (!manifestAsset) {
      expectedMissingFromManifest.push(expectedAsset.source);
      if (expectedAsset.required) {
        requiredSourceMissing.push(expectedAsset.source);
      } else {
        optionalSourceMissing.push(expectedAsset.source);
      }
      continue;
    }

    if (manifestAsset.destination !== expectedAsset.destination) {
      destinationMismatches.push({
        source: expectedAsset.source,
        expected: expectedAsset.destination,
        manifest: manifestAsset.destination,
      });
    }

    if (!fs.existsSync(path.resolve(sourceRoot, expectedAsset.source))) {
      if (expectedAsset.required) {
        requiredSourceMissing.push(expectedAsset.source);
      } else {
        optionalSourceMissing.push(expectedAsset.source);
      }
    }
  }

  const manifestExtras: string[] = [];
  for (const manifestAsset of manifest.values()) {
    if (!expected.has(manifestAsset.source)) {
      manifestExtras.push(manifestAsset.source);
    }
  }

  for (const discoveredAsset of discovered) {
    if (!expected.has(discoveredAsset)) {
      deferredFromExpected.push(discoveredAsset);
    }
  }

  expectedMissingFromManifest.sort((a, b) => a.localeCompare(b));
  manifestExtras.sort((a, b) => a.localeCompare(b));
  destinationMismatches.sort((a, b) => a.source.localeCompare(b.source));
  requiredSourceMissing.sort((a, b) => a.localeCompare(b));
  optionalSourceMissing.sort((a, b) => a.localeCompare(b));
  deferredFromExpected.sort((a, b) => a.localeCompare(b));

  let expectedRequired = 0;
  let expectedOptional = 0;
  for (const asset of expected.values()) {
    if (asset.required) {
      expectedRequired += 1;
    } else {
      expectedOptional += 1;
    }
  }

  const sourceMissingRequired = requiredSourceMissing.length;
  const sourceMissingOptional = optionalSourceMissing.length;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceRoot: path.relative(process.cwd(), sourceRoot),
    profile: options.profile,
    includeAudio: options.includeAudio,
    catalog: {
      discoveredCount: discovered.length,
      deferredFromExpectedCount: deferredFromExpected.length,
      deferredFromExpected,
    },
    manifest: {
      path: path.relative(process.cwd(), options.manifestPath),
      exists: options.manifestExists,
    },
    counts: {
      expectedTotal: expected.size,
      expectedRequired,
      expectedOptional,
      manifestTotal: manifestEntries.length,
      skippedManifest: manifestExtras.length,
      sourceMissingRequired,
      sourceMissingOptional,
    },
    diff: {
      expectedMissingFromManifest,
      manifestExtras,
      destinationMismatches,
      requiredSourceMissing,
      optionalSourceMissing,
    },
  };
}

function writeAuditReport(report: AuditReport, outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`Unity media audit written: ${path.relative(process.cwd(), outputPath)}\n`);
}

function printSummary(report: AuditReport): void {
  process.stdout.write('\nUnity media audit summary:\n');
  process.stdout.write(
    [
      `- Expected assets: ${report.counts.expectedTotal} (required=${report.counts.expectedRequired}, optional=${report.counts.expectedOptional})`,
      `- Manifest assets: ${report.counts.manifestTotal}`,
      `- Discovered public assets: ${report.catalog.discoveredCount}`,
      `- Deferred assets for profile "${report.profile}": ${report.catalog.deferredFromExpectedCount}`,
      `- Missing in manifest: ${report.diff.expectedMissingFromManifest.length}`,
      `- Manifest extras: ${report.diff.manifestExtras.length}`,
      `- Destination mismatches: ${report.diff.destinationMismatches.length}`,
      `- Missing required source files: ${report.counts.sourceMissingRequired}`,
      `- Missing optional source files: ${report.counts.sourceMissingOptional}`,
    ].join('\n') + '\n'
  );
}

function runCli(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      [
        'SUPERBART -> Unity media audit',
        '',
      'Usage:',
      '  npx tsx scripts/export_unity_media_audit.ts',
      '',
      'Options:',
      '  --out <path>      Output directory (default: artifacts/unity)',
        '  --profile <m1|ui|full> Media profile for expected set (default: m1)',
        '  --audio <true|false> Include AI music in expected set (default: true)',
        '  --manifest <path> Path to MediaSyncManifest.json (default: unity-port-kit/MediaSyncManifest.json)',
        '  --strict <true|false> Fail if manifest drifts from expected assets (default: false)',
        '',
      ].join('\n')
    );
    return;
  }

  const options = parseOptions(argv);
  const outPath = path.resolve(options.outDir, `media-audit-${options.profile}${options.includeAudio ? '' : '-nomedia'}.json`);

  const expectedAssets = buildUnityMediaPlan({
    profile: options.profile,
    includeAudio: options.includeAudio,
  });

  const manifestEntries = readManifest(options.manifestPath);
  const manifestExists = fs.existsSync(options.manifestPath);
  const report = buildAuditReport(manifestEntries, expectedAssets, {
    profile: options.profile,
    includeAudio: options.includeAudio,
    manifestPath: options.manifestPath,
    manifestExists,
  });

  writeAuditReport(report, outPath);
  printSummary(report);

  const hasCriticalErrors =
    report.counts.sourceMissingRequired > 0 ||
    report.diff.expectedMissingFromManifest.length > 0 ||
    report.diff.destinationMismatches.length > 0;

  if (!options.strict) {
    return;
  }

  if (!report.manifest.exists || hasCriticalErrors) {
    throw new Error('Media audit failed in strict mode. Please refresh manifest and re-run sync.');
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (pathToFileURL(invokedPath).href === import.meta.url) {
  runCli(process.argv.slice(2));
}
