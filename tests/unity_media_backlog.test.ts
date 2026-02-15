import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, test } from 'vitest';

type MediaBacklogReport = {
  version: number;
  generatedAt: string;
  sourceRoot: string;
  profile: string;
  includeAudio: boolean;
  totals: {
    discovered: number;
    expected: number;
    deferred: number;
  };
  groups: Array<{
    group: string;
    count: number;
    files: string[];
  }>;
};

function runBacklogCommand(args: string[]): string {
  const command = spawnSync('npx', ['tsx', 'scripts/export_unity_media_backlog.ts', ...args], {
    encoding: 'utf8',
  });

  if (command.error) {
    throw command.error;
  }

  expect(command.status).toBe(0);
  return command.stdout + (command.stderr ?? '');
}

function withTempDir<T>(run: (dir: string) => T): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'superbart-unity-backlog-'));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('unity media backlog', () => {
  test('exports JSON backlog with stable schema', () => {
    withTempDir((tmpDir) => {
      const outPath = path.join(tmpDir, 'media-backlog.json');

      runBacklogCommand(['--out', outPath, '--profile', 'm1', '--audio', 'true', '--format', 'json']);

      expect(fs.existsSync(outPath)).toBe(true);
      const report = JSON.parse(fs.readFileSync(outPath, 'utf8')) as MediaBacklogReport;

      expect(report.version).toBe(1);
      expect(report.profile).toBe('m1');
      expect(report.includeAudio).toBe(true);
      expect(report.totals.discovered).toBeGreaterThan(0);
      expect(report.totals.expected).toBeGreaterThan(0);
      expect(report.totals.deferred).toBe(report.groups.reduce((sum, g) => sum + g.count, 0));
      expect(report.totals.deferred).toBeGreaterThanOrEqual(0);

      for (const group of report.groups) {
        expect(group.group).toBeTypeOf('string');
        expect(group.count).toBe(group.files.length);
        expect(Array.isArray(group.files)).toBe(true);
        expect(group.files).toEqual([...group.files].sort((a, b) => a.localeCompare(b)));
      }
    });
  });

  test('exports CSV backlog with expected header', () => {
    withTempDir((tmpDir) => {
      const outPath = path.join(tmpDir, 'media-backlog.csv');

      runBacklogCommand(['--out', outPath, '--profile', 'm1', '--audio', 'false', '--format', 'csv']);

      expect(fs.existsSync(outPath)).toBe(true);
      const raw = fs.readFileSync(outPath, 'utf8').trim();
      const lines = raw.split('\n');

      expect(lines[0]).toBe('group,count,file');
      const rows = lines.slice(1).filter((line) => line.trim().length > 0);

      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        const match = /^"([^"]*)",([0-9]+),"([^"]*)"$/.exec(row);
        expect(match).toBeTruthy();
        if (match != null) {
          const [, group, count, file] = match;
          expect(group.length).toBeGreaterThan(0);
          expect(Number.isFinite(Number(count))).toBe(true);
          expect(file.startsWith('assets/')).toBe(true);
        }
      }
    });
  });
});
