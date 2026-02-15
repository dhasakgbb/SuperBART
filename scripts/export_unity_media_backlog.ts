#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  collectDiscoveredPublicAssets,
  buildUnityMediaPlan,
  type MediaProfile,
  parseMediaProfile,
} from './unity_media_utils';

type CliOptions = {
  outPath: string;
  profile: MediaProfile;
  includeAudio: boolean;
  format: 'json' | 'csv';
};

type BacklogGroup = {
  group: string;
  count: number;
  files: string[];
};

type MediaBacklogReport = {
  version: number;
  generatedAt: string;
  sourceRoot: string;
  profile: MediaProfile;
  includeAudio: boolean;
  totals: {
    discovered: number;
    expected: number;
    deferred: number;
  };
  groups: BacklogGroup[];
};

type Format = 'json' | 'csv';

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'unity');
const DEFAULT_FORMAT: Format = 'json';

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

function parseFormat(raw: string | undefined, outPath: string): Format {
  if (raw != null) {
    const candidate = raw.toLowerCase();
    if (candidate === 'json' || candidate === 'csv') {
      return candidate;
    }
    throw new Error(`Unsupported --format "${raw}". Allowed values: json, csv`);
  }

  if (outPath.toLowerCase().endsWith('.csv')) {
    return 'csv';
  }

  if (outPath.toLowerCase().endsWith('.json')) {
    return 'json';
  }

  return DEFAULT_FORMAT;
}

function parseOptions(argv: string[]): CliOptions {
  const outPath = path.resolve(process.cwd(), getArgValue(argv, 'out') ?? path.join(DEFAULT_OUT_DIR, 'media-backlog-m1.json'));
  const format = parseFormat(getArgValue(argv, 'format'), outPath);

  return {
    outPath,
    profile: parseMediaProfile(getArgValue(argv, 'profile')),
    includeAudio: parseBoolean(argv, 'audio', true),
    format,
  };
}

function normalizeSource(pathValue: string): string {
  return pathValue.startsWith('/') ? pathValue.substring(1) : pathValue;
}

function folderGroup(source: string): string {
  const normalized = normalizeSource(source);
  const dir = path.posix.dirname(normalized);
  return dir === '.' ? '(root)' : dir;
}

function buildBacklogReport(profile: MediaProfile, includeAudio: boolean): MediaBacklogReport {
  const discovered = collectDiscoveredPublicAssets(path.resolve(process.cwd(), 'public', 'assets')).discovered;
  const expected = buildUnityMediaPlan({
    profile,
    includeAudio,
  }).map((asset) => normalizeSource(asset.source));

  const expectedSet = new Set(expected);
  const deferred = discovered.filter((asset) => !expectedSet.has(asset));
  const grouped = new Map<string, string[]>();

  for (const source of deferred) {
    const group = folderGroup(source);
    const paths = grouped.get(group);
    if (paths == null) {
      grouped.set(group, [source]);
      continue;
    }
    paths.push(source);
  }

  const groups: BacklogGroup[] = Array.from(grouped.entries())
    .map(([group, files]) => {
      files.sort((a, b) => a.localeCompare(b));
      return {
        group,
        count: files.length,
        files,
      };
    })
    .sort((a, b) => a.group.localeCompare(b.group));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceRoot: path.relative(process.cwd(), path.resolve(process.cwd(), 'public')),
    profile,
    includeAudio,
    totals: {
      discovered: discovered.length,
      expected: expectedSet.size,
      deferred: deferred.length,
    },
    groups,
  };
}

function csvSerialize(report: MediaBacklogReport): string {
  const lines = ['group,count,file'];
  for (const group of report.groups) {
    if (group.files.length === 0) {
      lines.push(`${group.group},${group.count},`);
      continue;
    }

    for (const file of group.files) {
      const escapedGroup = `"${group.group.replaceAll('"', '""')}"`;
      const escapedFile = `"${file.replaceAll('"', '""')}"`;
      lines.push(`${escapedGroup},${group.count},${escapedFile}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function writeReport(options: CliOptions, report: MediaBacklogReport): void {
  const outputDir = path.dirname(options.outPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const output = options.format === 'csv' ? csvSerialize(report) : `${JSON.stringify(report, null, 2)}\n`;
  fs.writeFileSync(options.outPath, output, 'utf8');
  process.stdout.write(`Unity media backlog written: ${path.relative(process.cwd(), options.outPath)}\n`);
}

function printSummary(report: MediaBacklogReport): void {
  process.stdout.write('\nUnity media backlog summary:\n');
  process.stdout.write(
    [
      `- Profile: ${report.profile}`,
      `- Include audio: ${report.includeAudio}`,
      `- Discovered assets: ${report.totals.discovered}`,
      `- Expected assets: ${report.totals.expected}`,
      `- Deferred assets: ${report.totals.deferred}`,
      `- Group count: ${report.groups.length}`,
    ].join('\n') + '\n'
  );
}

function printUsage(): void {
  process.stdout.write(
    [
      'SUPERBART -> Unity media backlog',
      '',
      'Usage:',
      '  npx tsx scripts/export_unity_media_backlog.ts',
      '',
      'Options:',
      '  --out <path>      Output path (default: artifacts/unity/media-backlog-m1.json)',
      '  --profile <m1|ui|full> Media profile for expected set (default: m1)',
      '  --audio <true|false> Include AI music in expected set (default: true)',
      '  --format <json|csv> Output format (default: inferred from filename, falls back to json)',
      '',
    ].join('\n')
  );
}

function runCli(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseOptions(argv);
  const report = buildBacklogReport(options.profile, options.includeAudio);
  writeReport(options, report);
  printSummary(report);
}

const invokedPath = process.argv[1] ? path.resolve(process.cwd(), process.argv[1]) : '';
if (pathToFileURL(invokedPath).href === import.meta.url) {
  runCli(process.argv.slice(2));
}
