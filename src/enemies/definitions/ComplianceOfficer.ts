import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';
import type { EnemyContext } from '../types';

export class ComplianceOfficer extends BaseEnemy {
  private direction: number = 1;
  private readonly patrolSpeed: number = 45;
  private isPlatform: boolean = false;
  private platformUntilMs: number = 0;
  private readonly PLATFORM_DURATION_MS = 5000;
  private ctx: EnemyContext;

  constructor(config: EnemyConfig, ctx: EnemyContext) {
    super(config);
    this.ctx = ctx;
    this.hp = 1;
    this.direction = 1;
    this.setScale(1.85);
    if (this.body) {
      this.body.setSize(12, 10).setOffset(2, 6);
    }
    this.setVelocityX(this.patrolSpeed);
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'compliance_officer';
  }

  public get displayName(): string {
    return 'COMPLIANCE OFFICER';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.isPlatform = false;
        this.clearTint();
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).moves = true;
        }
        this.setVelocityX(this.patrolSpeed * this.direction);
        break;
      case 'idle':
        // Platform mode
        this.isPlatform = true;
        this.setVelocityX(0);
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).moves = false;
        }
        this.setTint(0xbadf00);
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    if (this.isPlatform) {
      const now = this.ctx.nowMs ? this.ctx.nowMs() : 0;
      if (now >= this.platformUntilMs) {
        this.transitionTo('patrol');
      }
      return;
    }

    // Patrol wall bounce
    if (this.body?.blocked.left) {
      this.direction = 1;
      this.setVelocityX(this.patrolSpeed);
    } else if (this.body?.blocked.right) {
      this.direction = -1;
      this.setVelocityX(-this.patrolSpeed);
    }

    if (this.body && !this.body.velocity.x) {
      this.setVelocityX(this.patrolSpeed * this.direction);
    }

    this.setFlipX(this.direction < 0);
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' | 'harmless' {
    if (this.currentState === 'dead') return 'damage';
    if (!this.body || !player.body) return 'damage';

    const stomp = player.body.bottom < this.body.top + 8 && player.body.velocity.y > 0;
    if (stomp && !this.isPlatform) {
      // Become a platform instead of dying
      this.platformUntilMs = (this.ctx.nowMs ? this.ctx.nowMs() : 0) + this.PLATFORM_DURATION_MS;
      this.transitionTo('idle');
      return 'stomp';
    }
    return stomp ? 'stomp' : 'damage';
  }
}
