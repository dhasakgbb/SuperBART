import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class SnowmanSentry extends BaseEnemy {
  private direction: number = 1;
  private walkSpeed: number = 35;
  private patrolTimer: number = 0;
  private throwTimer: number = 0;
  private readonly THROW_INTERVAL = 3000;
  private readonly THROW_TELEGRAPH_MS = 500;
  private isPreppingThrow: boolean = false;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 2;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setVelocityX(this.walkSpeed * this.direction);
    this.setTint(0xAADDFF); // Ice blue
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'snowman_sentry';
  }

  public get displayName(): string {
    return 'SNOWMAN SENTRY';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.setVelocityX(this.walkSpeed * this.direction);
        this.patrolTimer = 0;
        this.throwTimer = 0;
        this.isPreppingThrow = false;
        break;
      case 'alert':
        this.isPreppingThrow = true;
        this.setVelocityX(0);
        break;
      case 'idle':
        this.setVelocityX(0);
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    // Wall collision detection
    if (this.body?.blocked.left) {
      this.direction = 1;
      this.setVelocityX(this.walkSpeed);
    } else if (this.body?.blocked.right) {
      this.direction = -1;
      this.setVelocityX(-this.walkSpeed);
    }

    this.setFlipX(this.direction < 0);

    if (this.currentState === 'patrol') {
      this.patrolTimer += delta;
      this.throwTimer += delta;

      // Time to prepare throw
      if (this.throwTimer >= this.THROW_INTERVAL) {
        this.transitionTo('alert');
        this.scene.time.delayedCall(this.THROW_TELEGRAPH_MS, () => {
          if (this.currentState === 'alert') {
            this.throwIceBall();
            this.transitionTo('patrol');
          }
        });
      }
    }
  }

  private throwIceBall(): void {
    if (!this.scene) return;
    // Visual telegraph: arm raise (represented by scale change)
    this.setScale(1.9 * 1.1);
    this.scene.time.delayedCall(100, () => {
      this.setScale(1.9);
    });
    // TODO: Projectile spawning would happen here if projectile system is available
    this.playSfx('ice_shatter');
  }
}
