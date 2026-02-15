#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

function run(command, args) {
  const proc = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true,
  });

  if (proc.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function main() {
  process.stdout.write('=== Unity QA Ship Gate ===\n');
  run('npm', ['run', 'unity:ship:sync']);
  run('npm', ['run', 'unity:verify:m1']);
  run('npm', ['run', 'unity:ship:smoke']);
  run('npm', ['run', 'unity:ship:build']);
  process.stdout.write('=== Unity QA Ship Gate PASSED ===\n');
}

main();

