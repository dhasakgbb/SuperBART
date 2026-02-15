#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

function runUnityManualBuild(outDir) {
  const commands = [
    'Unity editor command not found in this environment.',
    '',
    'To run a real WebGL build, run this from a Unity-capable CI host:',
    '  /Applications/Unity/Hub/Editor/<version>/Unity.app/Contents/MacOS/Unity',
    `  -quit -batchmode -projectPath "${path.resolve(ROOT_DIR, 'unity-port-kit')}`,
    `  -executeMethod Superbart.Build.WebGlBuild`,
    `  -logFile -`,
    `  -buildTarget WebGL`,
    `  -buildPath "${outDir}"`,
  ];

  process.stdout.write(commands.join('\n') + '\n');
}

function ensurePackageArtifact() {
  const candidate = path.resolve(ROOT_DIR, 'artifacts/superbart-unity-port-kit.zip');
  if (!existsSync(candidate)) {
    const result = spawnSync(process.platform === 'win32' ? 'npm' : 'node', ['scripts/package_unity_port_kit.mjs'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      process.exit(result.status);
    }
  }

  process.stdout.write(`Unity ship build artifact: ${path.relative(ROOT_DIR, candidate)}\n`);
}

function main() {
  const outDir = process.argv.includes('--out')
    ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
    : path.resolve(ROOT_DIR, 'artifacts', 'unity-webgl');

  runUnityManualBuild(outDir);
  ensurePackageArtifact();
}

main();

