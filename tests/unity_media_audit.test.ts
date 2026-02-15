import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, test } from 'vitest';

const reportPath = path.resolve(process.cwd(), 'artifacts', 'unity', 'media-audit-m1.json');

describe('unity media audit', () => {
  test('generates stable audit report for default profile', () => {
    const result = spawnSync(
      'npx',
      ['tsx', 'scripts/export_unity_media_audit.ts', '--out', path.resolve(process.cwd(), 'artifacts', 'unity'), '--profile', 'm1'],
      {
        encoding: 'utf8',
      }
    );

    expect(result.status).toBe(0);
    expect(fs.existsSync(reportPath)).toBe(true);

    const output = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
      version: number;
      profile: string;
      includeAudio: boolean;
      counts: {
        expectedTotal: number;
        manifestTotal: number;
        sourceMissingRequired: number;
      };
      catalog: {
        discoveredCount: number;
        deferredFromExpectedCount: number;
        deferredFromExpected: string[];
      };
      diff: {
        expectedMissingFromManifest: string[];
        destinationMismatches: Array<unknown>;
      };
    };

    expect(output.version).toBe(1);
    expect(output.profile).toBe('m1');
    expect(output.includeAudio).toBe(true);
    expect(output.counts.expectedTotal).toBeGreaterThan(0);
    expect(output.counts.manifestTotal).toBeGreaterThan(0);
    expect(output.counts.sourceMissingRequired).toBe(0);
    expect(output.diff.expectedMissingFromManifest).toEqual([]);
    expect(output.diff.destinationMismatches).toEqual([]);
    expect(output.catalog.deferredFromExpectedCount).toBeGreaterThanOrEqual(0);
    expect(output.catalog.deferredFromExpected).toHaveLength(output.catalog.deferredFromExpectedCount);
  });
});
