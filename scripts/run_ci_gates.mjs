#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const LOG_PATH = path.resolve(ROOT_DIR, 'artifacts', 'superbart_gate_runs.jsonl');

const gates = [
  { gate: 1, name: 'gen_all', command: 'npm run gen:all' },
  { gate: 2, name: 'lint_assets', command: 'npm run lint:assets' },
  { gate: 3, name: 'lint_style', command: 'npm run lint:style' },
  { gate: 4, name: 'lint_audio', command: 'npm run lint:audio' },
  { gate: 5, name: 'lint_visual', command: 'npm run lint:visual' },
  { gate: 6, name: 'test', command: 'npm test' },
  { gate: 7, name: 'build', command: 'npm run build' },
];

function currentStatusEntries() {
  try {
    const output = execSync('git status --short', { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.slice(3).trim())
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

function recordGate(result) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(result)}\n`, 'utf8');
}

function normalizeStatus(lines, baselineLines) {
  const baseline = new Set(baselineLines);
  return lines.filter((line) => !baseline.has(line));
}

function runGate(runId, gate) {
  const start = Date.now();
  const baseline = currentStatusEntries();

  const proc = spawnSync(gate.command, {
    cwd: ROOT_DIR,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8',
  });

  const exitCode = proc.status ?? 0;
  const after = currentStatusEntries();
  const changedFiles = normalizeStatus(after, baseline);
  const entry = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    gate: gate.gate,
    name: gate.name,
    command: gate.command,
    status: exitCode === 0 ? 'PASS' : 'FAIL',
    exit_code: exitCode,
    duration_ms: Date.now() - start,
    changed_files: changedFiles,
    notes: proc.error ? proc.error.message : exitCode === 0 ? 'completed' : 'command failed',
    rollback_required: exitCode !== 0,
  };

  recordGate(entry);

  if (exitCode !== 0) {
    console.error(`Gate ${gate.gate} (${gate.name}) failed: ${gate.command}`);
    process.exitCode = exitCode;
    process.exit(exitCode);
  }

  return entry;
}

function main() {
  const runId = process.env.CI_GATES_RUN_ID || `${new Date().toISOString()}_${process.pid}`;
  for (const gate of gates) {
    runGate(runId, gate);
  }
  process.stdout.write(`Gate run ${runId} completed successfully.\n`);
}

main();
