#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const SOURCE_DIR = path.resolve(ROOT_DIR, 'unity-port-kit');
const OUT_DIR = path.resolve(ROOT_DIR, 'artifacts');
const OUT_ZIP = path.resolve(OUT_DIR, 'superbart-unity-port-kit.zip');

function ensureSourceExists() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Missing source directory: ${SOURCE_DIR}`);
  }
}

function packageZip() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(OUT_ZIP)) {
    fs.rmSync(OUT_ZIP, { force: true });
  }

  try {
    execFileSync('zip', ['-rq', OUT_ZIP, 'unity-port-kit'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
  } catch (error) {
    throw new Error(
      `Failed to create zip archive. Ensure the 'zip' command is available. ${(error && error.message) || ''}`
    );
  }
}

function main() {
  ensureSourceExists();
  packageZip();
  process.stdout.write(`Created ${path.relative(ROOT_DIR, OUT_ZIP)}\n`);
}

main();
