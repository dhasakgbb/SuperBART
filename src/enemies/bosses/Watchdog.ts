import { BossBase, type BossConfig, type BossPhaseConfig } from './BossBase';

/**
 * Watchdog - Prologue mini-boss
 * Simple single-phase boss with charge-stagger-expose pattern
 * HP: 3 hits to defeat
 */
export class Watchdog extends BossBase {
  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'THE WATCHDOG',
      maxHp: 3,
      phases: [
        {
          id: 'phase_1',
          hpThreshold: 0,
          telegraphMs: 800,
          attackMs: 1200,
          moveSpeedMultiplier: 1.0,
        },
      ],
    });
  }

  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      {
        id: 'phase_1',
        hpThreshold: 0,
        telegraphMs: 800,
        attackMs: 1200,
        moveSpeedMultiplier: 1.0,
      },
    ];
  }

  protected getAttackPattern(phase: number): void {
    // Simple charge attack - boss already handles velocity in base class
    // Watchdog just runs the base charge behavior
  }

  protected onVictory(): void {
    // Spark and disappear - base death animation handles this
  }
}
