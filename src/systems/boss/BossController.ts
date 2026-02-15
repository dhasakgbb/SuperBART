import type Phaser from 'phaser';
import { Boss, type BossPhaseConfig } from '../../enemies/definitions/Boss';

export interface SpawnBossConfig {
  x: number;
  y: number;
  texture?: string;
  displayName?: string;
  maxHp?: number;
  phases?: BossPhaseConfig[];
}

export class BossController {
  private activeBoss: Boss | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(config: SpawnBossConfig): Boss {
    if (this.activeBoss?.active) {
      this.activeBoss.destroy();
    }
    this.activeBoss = new Boss({
      scene: this.scene,
      x: config.x,
      y: config.y,
      texture: config.texture ?? 'boss_sheet',
      displayName: config.displayName,
      maxHp: config.maxHp,
      phases: config.phases,
    });
    return this.activeBoss;
  }

  hasActiveBoss(): boolean {
    return Boolean(this.activeBoss?.active);
  }

  update(deltaMs: number): void {
    if (!this.activeBoss?.active) {
      return;
    }
    this.activeBoss.manualUpdate(deltaMs);
  }

  destroy(): void {
    this.activeBoss?.destroy();
    this.activeBoss = null;
  }

  serialize(): Record<string, unknown> | null {
    if (!this.activeBoss?.active) {
      return null;
    }
    return this.activeBoss.serializeBossState();
  }
}
