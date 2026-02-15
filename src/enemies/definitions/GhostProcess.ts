import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class GhostProcess extends BaseEnemy {
  // Note: ghost_wail SFX exists for this enemy
  private direction: number = 1;
  private driftSpeed: number = 50;
  private phaseTimer: number = 0;
  private readonly SOLID_DURATION = 1000; // 1s solid phase every 4s
  private readonly CYCLE_DURATION = 4000; // 4s total cycle
  private isSolid: boolean = false;
  private isWallPhasing: boolean = true; // Can pass through walls when not solid

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 2;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0xDDDDFF); // Pale blue
    this.setAlpha(0.4); // Very translucent normally
    this.setScale(1.8);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    this.setVelocityX(this.driftSpeed * this.direction);
    this.isSolid = false;
    this.transitionTo('drift');
  }

  public get kind(): EnemyKind {
    return 'ghost_process';
  }

  public get displayName(): string {
    return 'GHOST PROCESS';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'drift':
        this.phaseTimer = 0;
        this.setVelocityX(this.driftSpeed * this.direction);
        this.isSolid = false;
        this.setAlpha(0.4);
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
        }
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    this.phaseTimer += delta;

    // Cycle management: solid phase from 3s to 4s in the 4s cycle
    const cycleProgress = this.phaseTimer % this.CYCLE_DURATION;
    const shouldBeSolid = cycleProgress >= (this.CYCLE_DURATION - this.SOLID_DURATION);

    if (shouldBeSolid !== this.isSolid) {
      this.isSolid = shouldBeSolid;

      if (this.isSolid) {
        // Become solid: brighten
        this.setAlpha(1.0);
        this.setTint(0xFFFFFF);
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
        }
      } else {
        // Become ghostly: dim
        this.setAlpha(0.4);
        this.setTint(0xDDDDFF);
        if (this.body) {
          (this.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
        }
      }
    }

    // Drift movement
    if (!this.isSolid) {
      // When phasing, can pass through world bounds
      this.setVelocityX(this.driftSpeed * this.direction);
    } else {
      // When solid, bounce off walls
      if (this.body?.blocked.left) {
        this.direction = 1;
        this.setVelocityX(this.driftSpeed);
      } else if (this.body?.blocked.right) {
        this.direction = -1;
        this.setVelocityX(-this.driftSpeed);
      }
    }

    this.setFlipX(this.direction < 0);
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' {
    // Only damageable during solid phase
    if (!this.isSolid) {
      return 'damage'; // Harmless when phasing
    }
    return super.onPlayerCollision(player);
  }
}
