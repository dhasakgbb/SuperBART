#!/usr/bin/env node
/**
 * Unity M1 Verification Script
 * Validates that all first-playable milestone components are present and functional
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const checks = [
  {
    name: 'Unity kit source folder exists',
    path: 'unity-port-kit',
    type: 'dir',
  },
  {
    name: 'Unity scripts folder exists',
    path: 'unity-port-kit/Assets/SuperbartPort/Scripts',
    type: 'dir',
  },
  {
    name: 'Unity test folders exist',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/EditMode',
    type: 'dir',
  },
  {
    name: 'Unity test folders exist',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/PlayMode',
    type: 'dir',
  },
  {
    name: 'Synthetic moving-platform fixture exists',
    path: 'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/synthetic_moving_platform.json',
    type: 'file',
  },
  {
    name: 'Campaign test level fixture exists',
    path: 'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/w1_l2.json',
    type: 'file',
  },
  {
    name: 'Movement metrics fixture exists',
    path: 'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json',
    type: 'file',
  },
  {
    name: 'Level export script exists',
    path: 'scripts/export_levels_for_unity.ts',
    type: 'file',
  },
  {
    name: 'Movement metrics export script exists',
    path: 'scripts/export_unity_movement_metrics.ts',
    type: 'file',
  },
  {
    name: 'Unity fixture build script exists',
    path: 'scripts/build_unity_fixtures.mjs',
    type: 'file',
  },
  {
    name: 'Unity kit packaging script exists',
    path: 'scripts/package_unity_port_kit.mjs',
    type: 'file',
  },
  {
    name: 'Unity port documentation exists',
    path: 'docs/unity_port.md',
    type: 'file',
  },
  {
    name: 'Unity M1 status document exists',
    path: 'docs/unity_m1_status.md',
    type: 'file',
  },
  {
    name: 'EditMode tests exist',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/EditMode/LevelLoaderEditModeTests.cs',
    type: 'file',
  },
  {
    name: 'PlayMode moving platform tests exist',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/PlayMode/MovingPlatformPlayModeTests.cs',
    type: 'file',
  },
  {
    name: 'PlayMode movement parity tests exist',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/PlayMode/MovementParityPlayModeTests.cs',
    type: 'file',
  },
  {
    name: 'TestFixtureLoader utility exists',
    path: 'unity-port-kit/Assets/SuperbartPort/Tests/TestFixtureLoader.cs',
    type: 'file',
  },
];

function checkPath(checkPath, type) {
  const fullPath = path.resolve(ROOT, checkPath);
  try {
    const stat = fs.statSync(fullPath);
    if (type === 'dir') {
      return stat.isDirectory();
    } else if (type === 'file') {
      return stat.isFile();
    }
    return false;
  } catch (error) {
    return false;
  }
}

function checkPackageJson() {
  const packageJsonPath = path.resolve(ROOT, 'package.json');
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    const requiredScripts = [
      'unity:kit:zip',
      'unity:export:single',
      'unity:metrics:export',
      'unity:media:audit',
      'unity:fixtures:build',
    ];

    const missing = requiredScripts.filter((script) => !pkg.scripts || !pkg.scripts[script]);
    return missing.length === 0 ? { ok: true } : { ok: false, missing };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function validateSyntheticFixture() {
  const fixturePath = path.resolve(
    ROOT,
    'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/synthetic_moving_platform.json'
  );
  try {
    const content = fs.readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(content);

    const hasGrid = Array.isArray(fixture.tileGrid);
    const hasMoving = Array.isArray(fixture.movingPlatforms) && fixture.movingPlatforms.length > 0;
    const hasOneWay = Array.isArray(fixture.oneWayPlatforms) && fixture.oneWayPlatforms.length > 0;
    const hasSpawn = fixture.entities && fixture.entities.some((e) => e.type === 'spawn');
    const hasGoal = fixture.goal && fixture.goal.x != null && fixture.goal.y != null;

    return { ok: hasGrid && hasMoving && hasOneWay && hasSpawn && hasGoal };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function validateMovementMetrics() {
  const metricsPath = path.resolve(
    ROOT,
    'unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json'
  );
  try {
    const content = fs.readFileSync(metricsPath, 'utf8');
    const artifact = JSON.parse(content);

    const hasVersion = artifact.version === 1;
    const hasTolerances = artifact.tolerances != null;
    const hasMetrics = artifact.metrics != null;

    return { ok: hasVersion && hasTolerances && hasMetrics };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function main() {
  process.stdout.write('=== Unity M1 First-Playable Verification ===\n\n');

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const exists = checkPath(check.path, check.type);
    if (exists) {
      process.stdout.write(`✅ ${check.name}\n`);
      passed += 1;
    } else {
      process.stdout.write(`❌ ${check.name}\n   Missing: ${check.path}\n`);
      failed += 1;
    }
  }

  process.stdout.write('\n--- Package.json Unity Scripts ---\n');
  const pkgCheck = checkPackageJson();
  if (pkgCheck.ok) {
    process.stdout.write('✅ All Unity npm scripts present\n');
    passed += 1;
  } else {
    process.stdout.write(`❌ Missing Unity npm scripts: ${pkgCheck.missing?.join(', ') || pkgCheck.error}\n`);
    failed += 1;
  }

  process.stdout.write('\n--- Fixture Validation ---\n');
  const syntheticCheck = validateSyntheticFixture();
  if (syntheticCheck.ok) {
    process.stdout.write('✅ Synthetic moving-platform fixture valid\n');
    passed += 1;
  } else {
    process.stdout.write(`❌ Synthetic fixture invalid: ${syntheticCheck.error || 'missing required fields'}\n`);
    failed += 1;
  }

  const metricsCheck = validateMovementMetrics();
  if (metricsCheck.ok) {
    process.stdout.write('✅ Movement metrics artifact valid\n');
    passed += 1;
  } else {
    process.stdout.write(`❌ Movement metrics invalid: ${metricsCheck.error || 'missing required fields'}\n`);
    failed += 1;
  }

  process.stdout.write('\n=== Verification Summary ===\n');
  process.stdout.write(`Passed: ${passed}\n`);
  process.stdout.write(`Failed: ${failed}\n`);

  if (failed === 0) {
    process.stdout.write('\n✅ All Unity M1 components verified successfully!\n');
    process.stdout.write('Ready for first-playable milestone.\n');
    process.exit(0);
  } else {
    process.stdout.write('\n❌ Some Unity M1 components are missing or invalid.\n');
    process.stdout.write('Run `npm run unity:fixtures:build` to refresh fixtures.\n');
    process.exit(1);
  }
}

main();
