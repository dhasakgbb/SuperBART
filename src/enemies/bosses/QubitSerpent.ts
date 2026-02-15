import { BossBase, type BossConfig } from './BossBase';
import type { BossPhaseConfig } from './BossBase';

/**
 * Qubit Serpent - World 3 Deep Web Catacombs Boss
 * 3 phases with serpentine/coil mechanics:
 * Phase 1: Coil and strike (horizontal then vertical)
 * Phase 2: Splits into 2 serpents (real one glows brighter)
 * Phase 3: Spiral constriction with shrinking center
 * HP: 10 hits total
 */
export class QubitSerpent extends BossBase {
  private strikeDirection: 'horizontal' | 'vertical' = 'horizontal';
  private serpentCount = 1;
  private constrictionRadius = 300;
  private serpentClones: Array<{ x: number; y: number; alpha: number }> = [];

  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'QUBIT SERPENT',
      maxHp: 10,
      phases: [
        {
          id: 'phase_1',
          hpThreshold: 1.0,
          telegraphMs: 800,
          attackMs: 1600,
          moveSpeedMultiplier: 0.95,
        },
        {
          id: 'phase_2',
          hpThreshold: 0.5,
          telegraphMs: 700,
          attackMs: 1400,
          moveSpeedMultiplier: 1.1,
        },
        {
          id: 'phase_3',
          hpThreshold: 0.25,
          telegraphMs: 600,
          attackMs: 1300,
          moveSpeedMultiplier: 1.2,
        },
      ],
    });
  }

  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      {
        id: 'phase_1',
        hpThreshold: 1.0,
        telegraphMs: 800,
        attackMs: 1600,
        moveSpeedMultiplier: 0.95,
      },
      {
        id: 'phase_2',
        hpThreshold: 0.5,
        telegraphMs: 700,
        attackMs: 1400,
        moveSpeedMultiplier: 1.1,
      },
      {
        id: 'phase_3',
        hpThreshold: 0.25,
        telegraphMs: 600,
        attackMs: 1300,
        moveSpeedMultiplier: 1.2,
      },
    ];
  }

  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    super.onPhaseEnter(phase, phaseConfig);
    this.strikeDirection = 'horizontal';

    if (phase === 0) {
      // Phase 1: Single serpent
      this.serpentCount = 1;
      this.setAlpha(1.0);
      this.serpentClones = [];
    } else if (phase === 1) {
      // Phase 2: Split into 2 (one real, one fake)
      this.serpentCount = 2;
      this.serpentClones = [
        {
          x: this.x + 120,
          y: this.y + 40,
          alpha: 0.6, // Fake serpent is dimmer
        },
      ];
    } else if (phase === 2) {
      // Phase 3: Spiral constriction begins
      this.serpentCount = 1;
      this.constrictionRadius = 300;
    }
  }

  protected getAttackPattern(phase: number): void {
    if (phase === 0) {
      // Phase 1: Coil and strike - alternate horizontal and vertical
      if (this.strikeDirection === 'horizontal') {
        this.strikeDirection = 'vertical';
      } else {
        this.strikeDirection = 'horizontal';
      }
    } else if (phase === 1) {
      // Phase 2: Both serpents move (but only one is real)
      // Update clone position
      if (this.serpentClones.length > 0) {
        this.serpentClones[0]!.x = this.x + 120;
        this.serpentClones[0]!.y = this.y + 40;
      }
    } else if (phase === 2) {
      // Phase 3: Spiral constriction - radius shrinks each attack
      this.constrictionRadius = Math.max(100, this.constrictionRadius - 30);
    }
  }

  protected onVictory(): void {
    // Serpent uncoils and disperses with green sparks
    this.setTint(0x5E7D4A);
  }
}
