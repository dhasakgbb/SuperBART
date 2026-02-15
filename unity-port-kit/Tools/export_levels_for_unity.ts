/**
 * SUPERBART → Unity level exporter (wrapper)
 *
 * This kit is designed to be copied into a Unity project, but the level generator
 * lives in the SuperBART TypeScript codebase. So exporting levels is only supported
 * when this kit is present inside the SuperBART repository.
 *
 * Canonical workflow (from repo root):
 *   npm run unity:fixtures:build
 *   npm run unity:export:single
 *
 * Advanced (from repo root):
 *   npx tsx scripts/export_levels_for_unity.ts --out artifacts/unity/levels --world 1 --levels 2
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const KIT_DIR = path.resolve(process.cwd());
const REPO_ROOT = path.resolve(KIT_DIR, '..', '..');
const CANONICAL_EXPORTER = path.join(REPO_ROOT, 'scripts', 'export_levels_for_unity.ts');

function printNotInRepo(): void {
  process.stderr.write(
    [
      'This exporter wrapper must be run from within the SuperBART repo (where the TS generator exists).',
      '',
      'From the SuperBART repo root, run one of:',
      '  npm run unity:fixtures:build',
      '  npm run unity:export:single',
      '',
      'Or explicitly:',
      '  npx tsx scripts/export_levels_for_unity.ts --out artifacts/unity/levels --world 1 --levels 2',
      '',
    ].join('\n')
  );
}

function run(): number {
  if (!fs.existsSync(CANONICAL_EXPORTER)) {
    printNotInRepo();
    return 1;
  }

  const result = spawnSync('npx', ['tsx', CANONICAL_EXPORTER, ...process.argv.slice(2)], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: false,
  });

  return result.status ?? 1;
}

process.exit(run());
