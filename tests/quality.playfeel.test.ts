import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { PLAYER_CONSTANTS } from '../src/core/constants';
import {
  framesToTargetVelocity,
  measureAirVsGroundAccel,
  measureJumpCutReapplication,
  measureJumpCutPulseFrames,
  measureSkidFrameSpan,
  runChargeFramesToRunState,
} from './helpers/movementAcceptance';

type PlayfeelContract = {
  run_speed_ratio: number;
  air_accel_ratio: number;
  run_transition_ms: number;
  run_to_walk_speed_ratio_min: number;
  air_accel_ratio_max?: number;
  run_transition_frames_max: number;
  jump_cut_frames: number;
  jump_cut_window_ms: number;
  stomp_cooldown_ms: number;
  has_stomp_hitstop: boolean;
  stomp_hitstop_ms: number;
  stomp_hitstop_frames_min: number;
  stomp_hitstop_frames_max: number;
  skid_trigger_distance: number;
  skid_duration_ms_max: number;
  world_label_violations: number;
  telegraph_before_lethal_ratio: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.join(__dirname, '..', 'scripts', 'playfeel_contract.json');
const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as PlayfeelContract;

describe('clone-feel quality contract', () => {
  const airAccelLimit = contract.air_accel_ratio_max ?? contract.air_accel_ratio;

  test('run-to-walk speed ratio meets contract target', () => {
    const walk = runChargeFramesToRunState({
      dtMs: 16,
      inputX: 1,
      onGround: true,
      runHeld: false,
      maxFrames: 1,
    }).finalOutput.vx;
    const runResult = runChargeFramesToRunState({
      dtMs: 16,
      inputX: 1,
      onGround: true,
      runHeld: true,
      maxFrames: contract.run_transition_frames_max,
    });
    expect(runResult.reachedRun).toBe(true);
    expect(runResult.framesToRun).toBeLessThanOrEqual(contract.run_transition_frames_max);
    expect(runResult.finalOutput.vx / walk).toBeGreaterThanOrEqual(contract.run_to_walk_speed_ratio_min);
    expect(PLAYER_CONSTANTS.runSpeedMultiplier).toBeGreaterThanOrEqual(contract.run_speed_ratio);
  });

  test('run transition completes and reaches run charge target', () => {
    const transition = runChargeFramesToRunState({
      dtMs: 16,
      inputX: 1,
      onGround: true,
      runHeld: true,
      maxFrames: 20,
    });
    expect(transition.reachedRun).toBe(true);
    expect(transition.finalOutput.feel.runChargeMs).toBeGreaterThanOrEqual(contract.run_transition_ms);
  });

  test('air acceleration is capped below ground target', () => {
    const result = measureAirVsGroundAccel({
      dtMs: 16,
      inputX: 1,
      onGround: true,
      jumpHeld: true,
      runHeld: false,
    });
    expect(result.ratio).toBeLessThanOrEqual(airAccelLimit);
  });

  test('jump-cut remains one-shot even with re-press/release jitter in one air arc', () => {
    const reapply = measureJumpCutReapplication({
      dtMs: 16,
      inputX: 0,
      holdForFrames: 1,
      firstReleaseFrames: 3,
      rePressFrames: 2,
      secondReleaseFrames: 4,
    });
    expect(reapply.cutCount).toBe(contract.jump_cut_frames);
    expect(reapply.firstCutFrame).toBe(0);
    expect(reapply.secondCutFrame).toBeNull();
  });

  test('jump cut applies once per release and shortens upward arc', () => {
    const tap = measureJumpCutPulseFrames({
      dtMs: 16,
      initialVx: 0,
      initialVy: 120,
      inputX: 0,
      holdForFrames: 1,
      cutWindowFrames: 3,
    });
    expect(tap.cutCount).toBe(contract.jump_cut_frames);
    expect(tap.cutFrame).toBe(0);
    expect(tap.secondPostReleaseVy).toBeGreaterThan(tap.firstPostReleaseVy);
    expect(tap.finalOutput.feel.jumpCutApplied).toBe(true);
  });

  test('skim-jump release before cut window shortens jump compared to sustained hold', () => {
    const tap = measureJumpCutPulseFrames({
      dtMs: 16,
      initialVx: 0,
      initialVy: 120,
      inputX: 0,
      holdForFrames: 1,
      cutWindowFrames: 6,
    });
    const hold = measureJumpCutPulseFrames({
      dtMs: 16,
      initialVx: 0,
      initialVy: 120,
      inputX: 0,
      holdForFrames: 8,
      cutWindowFrames: 6,
    });

    expect(hold.cutCount).toBe(0);
    expect(tap.cutCount).toBe(contract.jump_cut_frames);
    expect(tap.cutFrame).toBeLessThanOrEqual(Math.floor(contract.jump_cut_window_ms / 16));
    expect(tap.secondPostReleaseVy).toBeGreaterThan(hold.secondPostReleaseVy);
  });

  test('stomp hit-stop and cooldown are in expected playfeel contract', () => {
    expect(contract.has_stomp_hitstop).toBe(true);
    expect(contract.stomp_hitstop_ms).toBeGreaterThanOrEqual(24);
    expect(contract.stomp_hitstop_ms).toBeLessThanOrEqual(90);
    expect(PLAYER_CONSTANTS.stompHitstopMs).toBe(contract.stomp_hitstop_ms);
    expect(PLAYER_CONSTANTS.stompCooldownMs).toBe(contract.stomp_cooldown_ms);
    expect(contract.stomp_hitstop_frames_min).toBeGreaterThan(0);
    expect(contract.stomp_hitstop_frames_max).toBeLessThanOrEqual(3);
    expect(contract.world_label_violations).toBe(0);
    expect(contract.telegraph_before_lethal_ratio).toBeGreaterThanOrEqual(1);

    const frameMs = 1000 / 60;
    const minFrames = Math.max(1, Math.floor(contract.stomp_hitstop_ms / frameMs));
    const maxFrames = Math.ceil(contract.stomp_hitstop_ms / frameMs);
    expect(minFrames).toBeGreaterThanOrEqual(contract.stomp_hitstop_frames_min);
    expect(maxFrames).toBeLessThanOrEqual(contract.stomp_hitstop_frames_max);
  });

  test('skid threshold and span are in contract bounds', () => {
    const skid = measureSkidFrameSpan({
      dtMs: 16,
      inputX: 1,
      runHeld: true,
      onGround: true,
      maxFrames: 12,
      reversalFrames: 16,
      reverseInput: -1,
    });
    expect(PLAYER_CONSTANTS.skidThresholdPxPerSec).toBe(contract.skid_trigger_distance);
    expect(skid.firstSkidFrame).not.toBeNull();
    expect(skid.firstSkidFrame).toBeLessThanOrEqual(2);
    expect(skid.skidSpanFrames).toBeGreaterThan(0);
    const skewMs = skid.skidSpanFrames * 16;
    expect(skewMs).toBeLessThanOrEqual(contract.skid_duration_ms_max);
  });

  test('run transition and skid feel states recover without lock-in', () => {
    const walk = framesToTargetVelocity({
      dtMs: 16,
      inputX: 1,
      onGround: true,
      runHeld: false,
      initialVx: 0,
      targetSpeed: PLAYER_CONSTANTS.maxSpeed * 0.4,
      maxFrames: 12,
    });
    expect(walk.reached).toBe(true);

    const postSkid = measureSkidFrameSpan({
      dtMs: 16,
      inputX: -1,
      runHeld: false,
      onGround: true,
      maxFrames: 20,
      reversalFrames: 12,
      reverseInput: 1,
    });
    expect(postSkid.skidSpanFrames).toBeGreaterThan(0);
  });
});
