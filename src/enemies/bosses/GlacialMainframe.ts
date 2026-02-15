import { BossBase, type BossConfig } from './BossBase';
import type { BossPhaseConfig } from './BossBase';

/**
 * Glacial Mainframe - World 2 Tundra Boss
 * 3 phases with increasing complexity:
 * Phase 1: Horizontal beam sweeps, icicle drops
 * Phase 2: Floor freeze patches, spawns cryo drones
 * Phase 3: Full-floor freeze blast, floating ice platforms rise
 * HP: 8 hits total
 */
export class GlacialMainframe extends BossBase {
  private icicleShadowTimers: number[] = [];
  private freezePatchTimers: number[] = [];
  private droneSpawnCounter = 0;

  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'GLACIAL MAINFRAME',
      maxHp: 8,
      phases: [
        {
          id: 'phase_1',
          hpThreshold: 1.0,
          telegraphMs: 700,
          attackMs: 1500,
          moveSpeedMultiplier: 1.0,
        },
        {
          id: 'phase_2',
          hpThreshold: 0.5,
          telegraphMs: 600,
          attackMs: 1300,
          moveSpeedMultiplier: 1.15,
        },
        {
          id: 'phase_3',
          hpThreshold: 0.25,
          telegraphMs: 500,
          attackMs: 1100,
          moveSpeedMultiplier: 1.3,
        },
      ],
    });
  }

  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      {
        id: 'phase_1',
        hpThreshold: 1.0,
        telegraphMs: 700,
        attackMs: 1500,
        moveSpeedMultiplier: 1.0,
      },
      {
        id: 'phase_2',
        hpThreshold: 0.5,
        telegraphMs: 600,
        attackMs: 1300,
        moveSpeedMultiplier: 1.15,
      },
      {
        id: 'phase_3',
        hpThreshold: 0.25,
        telegraphMs: 500,
        attackMs: 1100,
        moveSpeedMultiplier: 1.3,
      },
    ];
  }

  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    super.onPhaseEnter(phase, phaseConfig);
    // Reset attack counters when entering new phase
    this.icicleShadowTimers = [];
    this.freezePatchTimers = [];
    this.droneSpawnCounter = 0;
  }

  protected getAttackPattern(phase: number): void {
    if (phase === 0) {
      // Phase 1: Horizontal beam sweeps and icicle drops
      // Triggered by base attack state
    } else if (phase === 1) {
      // Phase 2: Floor freeze patches and cryo drone spawn
      this.droneSpawnCounter++;
      if (this.droneSpawnCounter % 2 === 0) {
        // Spawn 2 cryo drones periodically
        // This would be handled by the level/scene spawner
      }
    } else if (phase === 2) {
      // Phase 3: Full-floor freeze blast
      // Floating ice platforms rise (visual/environmental effect)
    }
  }

  protected onVictory(): void {
    // Mainframe explodes with blue sparks
    this.setTint(0x6FA8DC);
  }
}
