#!/usr/bin/env node
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

const ARTIFACT_LEVELS_DIR = path.resolve(ROOT_DIR, 'artifacts', 'unity', 'levels');

const UNITY_FIXTURES_LEVELS_DIR = path.resolve(
  ROOT_DIR,
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Resources',
  'Fixtures',
  'levels'
);

const UNITY_FIXTURES_PARITY_DIR = path.resolve(
  ROOT_DIR,
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Resources',
  'Fixtures',
  'parity'
);
const UNITY_TEST_FIXTURES_LEVELS_DIR = path.resolve(
  ROOT_DIR,
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Tests',
  'Resources',
  'levels'
);
const UNITY_TEST_FIXTURES_PARITY_DIR = path.resolve(
  ROOT_DIR,
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Tests',
  'Resources',
  'parity'
);

const DEFAULT_MEDIA_PROFILE = 'm1';
const MANIFEST_PATH = path.resolve(ROOT_DIR, 'unity-port-kit', 'MediaSyncManifest.json');
const MEDIA_AUDIT_DIR = path.resolve(ROOT_DIR, 'artifacts', 'unity');
const UNITY_MEDIA_BACKLOG_PATH = (mediaProfile) => path.resolve(ROOT_DIR, 'artifacts', 'unity', `media-backlog-${mediaProfile}.json`);

function getArgValue(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function parseMediaProfile(value) {
  if (!value) {
    return DEFAULT_MEDIA_PROFILE;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'm1' || normalized === 'ui' || normalized === 'full') {
    return normalized;
  }

  throw new Error(`Unsupported --media-profile "${value}". Allowed values: m1, ui, full`);
}

function printUsage() {
  process.stdout.write([
    'SUPERBART -> Unity fixture orchestration',
    '',
    'Usage:',
    '  node scripts/build_unity_fixtures.mjs --media-profile ui',
    '',
    'Options:',
    '  --media-profile <m1|ui|full> Media profile for generated Unity assets (default: m1)',
    '                                     m1: runtime baseline, ui: + curated UI assets, full: ui + auto-discovered media',
    '',
  ].join('\n'));
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function ensureDirs() {
  [
    ARTIFACT_LEVELS_DIR,
    UNITY_FIXTURES_LEVELS_DIR,
    UNITY_FIXTURES_PARITY_DIR,
    UNITY_TEST_FIXTURES_LEVELS_DIR,
    UNITY_TEST_FIXTURES_PARITY_DIR,
  ].forEach((dir) => mkdirSync(dir, { recursive: true }));
}

function copyFixtureFiles(sourceDir, targetDir) {
  cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
  });
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }

  const mediaProfile = parseMediaProfile(getArgValue('media-profile'));

  ensureDirs();

  // Export all 28 campaign levels to Unity fixtures and artifacts
  run('npx', [
    'tsx',
    'scripts/export_levels_for_unity.ts',
    '--all',
    '--out',
    path.relative(ROOT_DIR, UNITY_FIXTURES_LEVELS_DIR),
  ]);

  run('npx', [
    'tsx',
    'scripts/export_levels_for_unity.ts',
    '--all',
    '--out',
    path.relative(ROOT_DIR, ARTIFACT_LEVELS_DIR),
  ]);

  run('npx', [
    'tsx',
    'scripts/export_unity_movement_metrics.ts',
    '--out',
    path.relative(ROOT_DIR, path.join(UNITY_FIXTURES_PARITY_DIR, 'movement_metrics.json')),
  ]);

  run('npx', [
    'tsx',
    'scripts/export_unity_media.ts',
    '--out',
    path.relative(ROOT_DIR, path.join(ROOT_DIR, 'unity-port-kit', 'Assets', 'SuperbartAssets')),
    '--profile',
    mediaProfile,
    '--audio',
    'true',
    '--manifest',
    'true',
  ]);

  run('npx', [
    'tsx',
    'scripts/export_unity_media_audit.ts',
    '--out',
    path.relative(ROOT_DIR, MEDIA_AUDIT_DIR),
    '--profile',
    mediaProfile,
    '--audio',
    'true',
    '--manifest',
    path.relative(ROOT_DIR, MANIFEST_PATH),
    '--strict',
    'true',
  ]);

  copyFixtureFiles(
    path.join(UNITY_FIXTURES_LEVELS_DIR),
    UNITY_TEST_FIXTURES_LEVELS_DIR
  );
  copyFixtureFiles(
    path.join(UNITY_FIXTURES_PARITY_DIR, 'movement_metrics.json'),
    path.join(UNITY_TEST_FIXTURES_PARITY_DIR, 'movement_metrics.json')
  );

  run('npx', [
    'tsx',
    'scripts/export_unity_media_backlog.ts',
    '--out',
    path.relative(ROOT_DIR, UNITY_MEDIA_BACKLOG_PATH(mediaProfile)),
    '--profile',
    mediaProfile,
    '--audio',
    'true',
  ]);

  process.stdout.write('Unity fixtures refreshed:\n');
  process.stdout.write(`- ${path.relative(ROOT_DIR, UNITY_FIXTURES_LEVELS_DIR)}/ (all campaign levels)\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, ARTIFACT_LEVELS_DIR)}/ (all campaign levels)\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, UNITY_FIXTURES_PARITY_DIR)}/movement_metrics.json\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, UNITY_TEST_FIXTURES_LEVELS_DIR)}/ (test fixtures)\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, UNITY_TEST_FIXTURES_PARITY_DIR)}/movement_metrics.json\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, path.join(MEDIA_AUDIT_DIR, 'media-audit-' + mediaProfile + '.json'))}\n`);
  process.stdout.write(`- ${path.relative(ROOT_DIR, UNITY_MEDIA_BACKLOG_PATH(mediaProfile))}\n`);
}

main();
