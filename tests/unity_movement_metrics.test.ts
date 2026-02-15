import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { buildUnityMovementMetricsArtifact } from '../scripts/export_unity_movement_metrics';

interface PlayfeelContract {
  run_to_walk_speed_ratio_min: number;
  air_accel_ratio: number;
  air_accel_ratio_max?: number;
  run_transition_frames_max: number;
  jump_cut_frames: number;
  skid_duration_ms_max: number;
}

const metricsPath = path.resolve(
  process.cwd(),
  'unity-port-kit',
  'Assets',
  'SuperbartPort',
  'Resources',
  'Fixtures',
  'parity',
  'movement_metrics.json'
);
const contractPath = path.resolve(process.cwd(), 'scripts', 'playfeel_contract.json');

describe('unity movement metrics artifact', () => {
  test('file exists with stable schema', () => {
    expect(fs.existsSync(metricsPath)).toBe(true);

    const artifact = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as ReturnType<typeof buildUnityMovementMetricsArtifact>;

    expect(artifact.version).toBe(1);
    expect(typeof artifact.generatedAt).toBe('string');
    expect(typeof artifact.sourceCommit).toBe('string');
    expect(typeof artifact.dtMs).toBe('number');
    expect(artifact.tolerances.scalarPct).toBe(0.03);
    expect(artifact.tolerances.frameCount).toBe(1);
    expect(artifact.tolerances.booleanExact).toBe(true);

    expect(typeof artifact.metrics.runTransitionFrames).toBe('number');
    expect(typeof artifact.metrics.runToWalkSpeedRatio).toBe('number');
    expect(typeof artifact.metrics.airGroundAccelRatio).toBe('number');
    expect(typeof artifact.metrics.jumpBufferLandingSuccess).toBe('boolean');
    expect(typeof artifact.metrics.jumpCutOneShotCount).toBe('number');
    expect(typeof artifact.metrics.skidDurationMs).toBe('number');
  });

  test('metrics satisfy current playfeel contract bounds', () => {
    const artifact = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as ReturnType<typeof buildUnityMovementMetricsArtifact>;
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')) as PlayfeelContract;

    const airAccelCap = contract.air_accel_ratio_max ?? contract.air_accel_ratio;

    expect(artifact.metrics.runTransitionFrames).toBeLessThanOrEqual(contract.run_transition_frames_max);
    expect(artifact.metrics.runToWalkSpeedRatio).toBeGreaterThanOrEqual(contract.run_to_walk_speed_ratio_min);
    expect(artifact.metrics.airGroundAccelRatio).toBeLessThanOrEqual(airAccelCap);
    expect(artifact.metrics.jumpBufferLandingSuccess).toBe(true);
    expect(artifact.metrics.jumpCutOneShotCount).toBe(contract.jump_cut_frames);
    expect(artifact.metrics.jumpCutSecondFrame).toBeNull();
    expect(artifact.metrics.skidDurationMs).toBeLessThanOrEqual(contract.skid_duration_ms_max);
  });

  test('regenerated metrics stay aligned with committed fixture', () => {
    const artifact = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as ReturnType<typeof buildUnityMovementMetricsArtifact>;
    const regenerated = buildUnityMovementMetricsArtifact();

    expect(regenerated.metrics).toEqual(artifact.metrics);
    expect(regenerated.tolerances).toEqual(artifact.tolerances);
  });
});
