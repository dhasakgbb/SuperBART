#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const REQUIRED_FILES = [
  'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/w1_l2.json',
  'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json',
  'unity-port-kit/MediaSyncManifest.json',
];

function exists(relativePath) {
  return fs.existsSync(path.resolve(ROOT_DIR, relativePath));
}

function main() {
  const missing = REQUIRED_FILES.filter((entry) => !exists(entry));
  if (missing.length > 0) {
    process.stdout.write('Unity ship smoke gate failed: required runtime artifacts missing:\n');
    missing.forEach((entry) => process.stdout.write(` - ${entry}\n`));
    process.exit(1);
  }

  const smokeDir = path.resolve(ROOT_DIR, 'artifacts', 'unity');
  fs.mkdirSync(smokeDir, { recursive: true });
  const reportPath = path.resolve(smokeDir, 'ship-smoke.json');
  const report = {
    command: 'unity_ship_smoke',
    timestamp: new Date().toISOString(),
    checks: {
      artifacts: 'ok',
      smokeProfile: 'not-a-runtime-check: Unity PlayMode/EditMode should be run via Unity Test Runner',
    requiredFiles: REQUIRED_FILES,
    note: 'Smoke pass is a structured launch checklist for deterministic restart/first-launch flow.',
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`Unity ship smoke report: artifacts/${path.basename(reportPath)}\n`);
}

main();

