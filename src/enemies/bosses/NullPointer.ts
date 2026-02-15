import { BossBase, type BossConfig } from './BossBase';
import type { BossPhaseConfig } from './BossBase';

/**
 * Null Pointer - World 2 Quantum Void Boss
 * 3 phases with shifting/phasing mechanics:
 * Phase 1: Solid/phased alternation, crystal shard projectiles
 * Phase 2: Forms desynchronize and move independently
 * Phase 3: Fragments into 4 pieces (only one solid at a time)
 * HP: 10 hits total
 */
export class NullPointer extends BossBase {
  private phaseCycle = 0;
  private isSolid = true;
  private fragmentCount = 1;
  private fragmentPositions: Array<{ x: number; y: number }> = [];

  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'NULL POINTER',
      maxHp: 10,
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
          attackMs: 1400,
          moveSpeedMultiplier: 1.1,
        },
        {
          id: 'phase_3',
          hpThreshold: 0.25,
          telegraphMs: 500,
          attackMs: 1300,
          moveSpeedMultiplier: 1.25,
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
        attackMs: 1400,
        moveSpeedMultiplier: 1.1,
      },
      {
        id: 'phase_3',
        hpThreshold: 0.25,
        telegraphMs: 500,
        attackMs: 1300,
        moveSpeedMultiplier: 1.25,
      },
    ];
  }

  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    super.onPhaseEnter(phase, phaseConfig);
    this.phaseCycle = 0;

    if (phase === 0) {
      // Phase 1: Single entity, toggle solid/phased
      this.fragmentCount = 1;
      this.isSolid = true;
    } else if (phase === 1) {
      // Phase 2: Desynchronized pair (two copies moving independently)
      this.fragmentCount = 2;
      this.fragmentPositions = [
        { x: this.x - 60, y: this.y },
        { x: this.x + 60, y: this.y },
      ];
    } else if (phase === 2) {
      // Phase 3: Four fragments (only one solid at a time)
      this.fragmentCount = 4;
      this.fragmentPositions = [
        { x: this.x - 100, y: this.y - 40 },
        { x: this.x + 100, y: this.y - 40 },
        { x: this.x - 100, y: this.y + 40 },
        { x: this.x + 100, y: this.y + 40 },
      ];
    }
  }

  protected getAttackPattern(phase: number): void {
    this.phaseCycle++;

    if (phase === 0) {
      // Phase 1: Toggle solid/phased and fire crystal shards
      this.isSolid = !this.isSolid;
      if (this.isSolid) {
        this.setAlpha(1.0);
      } else {
        this.setAlpha(0.5);
      }
    } else if (phase === 1) {
      // Phase 2: Forms move independently
      if (this.body && this.fragmentPositions.length >= 2) {
        // Update fragment positions (would be synced with clones in actual implementation)
        this.fragmentPositions[0]!.x += (Math.random() - 0.5) * 50;
        this.fragmentPositions[1]!.x -= (Math.random() - 0.5) * 50;
      }
    } else if (phase === 2) {
      // Phase 3: Cycle which fragment is solid
      const solidIndex = this.phaseCycle % this.fragmentCount;
      for (let i = 0; i < this.fragmentPositions.length; i++) {
        // Visual indicator of which is solid
      }
    }
  }

  protected onVictory(): void {
    // Null Pointer dissipates into void with purple sparks
    this.setTint(0x9B59B6);
  }
}
