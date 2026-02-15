import { BossBase, type BossConfig } from './BossBase';
import type { BossPhaseConfig } from './BossBase';

/**
 * Legacy Daemon - World 4 Digital Graveyard Boss
 * 4 phases with escalating complexity and stun window:
 * Phase 1: CRT projectiles, cable-fist ground slams
 * Phase 2: Tape web grid patterns
 * Phase 2.5 (35% HP): Stun window - shows SHUTDOWN? [Y/N] prompt
 * Phase 3: Absorbs ghost energy, grows larger, slower but wider attacks
 * HP: 12 hits total
 */
export class LegacyDaemon extends BossBase {
  private crtProjectileCount = 0;
  private webGridActive = false;
  private stunWindowActive = false;
  private ghostEnergyAbsorbed = false;
  private daemonSize = 1.0;

  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'LEGACY DAEMON',
      maxHp: 12,
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
          telegraphMs: 650,
          attackMs: 1400,
          moveSpeedMultiplier: 1.05,
        },
        {
          id: 'phase_2_5',
          hpThreshold: 0.35,
          telegraphMs: 800,
          attackMs: 2000, // Longer stun window
          moveSpeedMultiplier: 0.5,
        },
        {
          id: 'phase_3',
          hpThreshold: 0.2,
          telegraphMs: 600,
          attackMs: 1300,
          moveSpeedMultiplier: 0.8, // Slower when larger
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
        telegraphMs: 650,
        attackMs: 1400,
        moveSpeedMultiplier: 1.05,
      },
      {
        id: 'phase_2_5',
        hpThreshold: 0.35,
        telegraphMs: 800,
        attackMs: 2000,
        moveSpeedMultiplier: 0.5,
      },
      {
        id: 'phase_3',
        hpThreshold: 0.2,
        telegraphMs: 600,
        attackMs: 1300,
        moveSpeedMultiplier: 0.8,
      },
    ];
  }

  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    super.onPhaseEnter(phase, phaseConfig);

    if (phaseConfig.id === 'phase_1') {
      this.crtProjectileCount = 0;
      this.webGridActive = false;
      this.stunWindowActive = false;
    } else if (phaseConfig.id === 'phase_2') {
      this.crtProjectileCount = 0;
      this.webGridActive = true;
    } else if (phaseConfig.id === 'phase_2_5') {
      // Stun window phase
      this.stunWindowActive = true;
      this.setTint(0xffff00); // Yellow highlight for stun window
      // In actual implementation, this would trigger UI showing SHUTDOWN? [Y/N]
    } else if (phaseConfig.id === 'phase_3') {
      this.stunWindowActive = false;
      this.clearTint();

      // Absorb ghost energy and grow
      if (!this.ghostEnergyAbsorbed) {
        this.ghostEnergyAbsorbed = true;
        this.daemonSize = 1.4;
        this.setScale(this.daemonSize);
        this.setTint(0xaa00ff); // Purple ghost energy glow
      }
    }
  }

  protected getAttackPattern(phase: number): void {
    if (this.currentState === 'warn') {
      // Visual telegraph
      if (!this.stunWindowActive) {
        this.crtProjectileCount++;
      }
    }

    if (phase === 0) {
      // Phase 1: CRT projectiles and ground slams
      // CRT projectiles would be spawned by level system
    } else if (phase === 1) {
      // Phase 2: Tape web grid
      if (this.webGridActive) {
        // Grid pattern would be created by level system
      }
    } else if (phase === 2) {
      // Phase 2.5: Stun window (player can choose Y or N)
      // If Y: daemon takes bonus damage
      // If N: daemon recovers and continues
    } else if (phase === 3) {
      // Phase 3: Grown daemon with slower, wider attacks
      // Attack hitbox is larger due to scale
    }
  }

  /**
   * Call when player selects Y in SHUTDOWN prompt
   */
  public confirmShutdown(): void {
    if (this.stunWindowActive) {
      // Take bonus damage
      this.takeDamage(2);
    }
  }

  /**
   * Call when player selects N or timeout occurs
   */
  public rejectShutdown(): void {
    if (this.stunWindowActive) {
      // Daemon recovers and continues
      this.stunWindowActive = false;
      this.clearTint();
    }
  }

  protected onVictory(): void {
    // Daemon dissipates with grey sparks as it "dies"
    this.setTint(0x7A7A82);
  }
}
