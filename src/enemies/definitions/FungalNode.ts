import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class FungalNode extends BaseEnemy {
  private sporeReleaseTimer: number = 0;
  private hasReleasedSpore: boolean = false;
  private readonly PROXIMITY_RANGE = 80;
  private readonly SPORE_TELEGRAPH_MS = 400;
  private readonly SPORE_EFFECT_DURATION = 3000;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 1;
    this.setTint(0x88FF44); // Bioluminescent green
    this.setScale(1.8);
    this.setGravityY(0); // Stationary
    if (this.body) {
      this.body.setSize(14, 14);
      this.setCollideWorldBounds(false);
      (this.body as Phaser.Physics.Arcade.Body).moves = false;
    }
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.transitionTo('idle');
  }

  public get kind(): EnemyKind {
    return 'fungal_node';
  }

  public get displayName(): string {
    return 'FUNGAL NODE';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'idle':
        this.sporeReleaseTimer = 0;
        this.hasReleasedSpore = false;
        this.setTint(0x88FF44);
        break;
      case 'alert':
        this.sporeReleaseTimer = 0;
        this.hasReleasedSpore = false;
        this.setTint(0xBBFF77); // Brighter glow for telegraph
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    if (this.currentState === 'idle') {
      // Check for player proximity - this would need context to know player position
      // For now, just periodic release
      this.sporeReleaseTimer += delta;
      if (this.sporeReleaseTimer > 5000 && !this.hasReleasedSpore) {
        this.transitionTo('alert');
        this.scene.time.delayedCall(this.SPORE_TELEGRAPH_MS, () => {
          if (this.currentState === 'alert') {
            this.releaseSporeCloud();
            this.transitionTo('idle');
          }
        });
      }
    }
  }

  private releaseSporeCloud(): void {
    if (!this.scene) return;
    this.hasReleasedSpore = true;
    // Visual effect: particles emanating from this position
    // TODO: Spawn spore particles and lingerZones for signal drift
    this.playSfx('spore_cloud');

    // Reset after cooldown
    this.scene.time.delayedCall(this.SPORE_EFFECT_DURATION + 2000, () => {
      this.hasReleasedSpore = false;
      this.sporeReleaseTimer = 0;
    });
  }
}
