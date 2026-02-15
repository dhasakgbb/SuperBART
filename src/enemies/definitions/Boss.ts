import { BossBase } from '../bosses/BossBase';
import type { BossConfig, BossPhaseConfig } from '../bosses/BossBase';

// Re-export from BossBase for backward compatibility
export type { BossPhaseConfig, BossConfig } from '../bosses/BossBase';

/**
 * Generic Boss class - kept for backward compatibility
 * New bosses should extend BossBase directly or create specific implementations
 */
export class Boss extends BossBase {
  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: config.displayName ?? 'BOSS',
      maxHp: config.maxHp ?? 12,
      phases: config.phases,
    });
  }

  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      { id: 'phase_1', hpThreshold: 1, telegraphMs: 700, attackMs: 1500, moveSpeedMultiplier: 1.0 },
      { id: 'phase_2', hpThreshold: 0.6, telegraphMs: 580, attackMs: 1300, moveSpeedMultiplier: 1.2 },
      { id: 'phase_3', hpThreshold: 0.3, telegraphMs: 460, attackMs: 1100, moveSpeedMultiplier: 1.35 },
    ];
  }
}
