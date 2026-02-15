import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class GlitchPhantom extends BaseEnemy {
  // Note: phantom_phase SFX exists for phase shifts
  private direction: number = 1;
  private walkSpeed: number = 50;
  private phaseTimer: number = 0;
  private readonly VISIBLE_DURATION = 1500;
  private readonly INVISIBLE_DURATION = 1500;
  private isVisible: boolean = true;
  private patrolTimer: number = 0;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 1;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0xFFFFFF); // White
    this.setAlpha(0.5); // Translucent
    this.setScale(1.8);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    this.setVelocityX(this.walkSpeed * this.direction);
    this.isVisible = true;
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'glitch_phantom';
  }

  public get displayName(): string {
    return 'GLITCH PHANTOM';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.phaseTimer = 0;
        this.patrolTimer = 0;
        this.setVelocityX(this.walkSpeed * this.direction);
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
      this.phaseTimer += delta;
      this.patrolTimer += delta;

      // Rhythm-based visibility toggle: consistent cycle for player to time passage
      const cycleTime = (this.phaseTimer) % (this.VISIBLE_DURATION + this.INVISIBLE_DURATION);
      const shouldBeVisible = cycleTime < this.VISIBLE_DURATION;

      if (shouldBeVisible !== this.isVisible) {
        this.isVisible = shouldBeVisible;
        if (this.isVisible) {
          this.setAlpha(0.5);
        } else {
          this.setAlpha(0.1);
        }
      }
    }
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' | 'harmless' {
    // Harmless when invisible
    if (!this.isVisible) {
      return 'harmless';
    }
    return super.onPlayerCollision(player);
  }
}
