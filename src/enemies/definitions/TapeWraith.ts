import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class TapeWraith extends BaseEnemy {
  // Note: tape_reel SFX exists for this enemy
  private direction: number = 1;
  private walkSpeed: number = 45;
  private sourceReelX: number; // Position of the source reel that animates this entity
  private sourceReelY: number;
  private patrolTimer: number = 0;
  private isTethered: boolean = true;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 2;
    this.sourceReelX = config.x + 30; // Assume reel is placed nearby
    this.sourceReelY = config.y - 40;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0x997755); // Brown tape color
    this.setScale(1.9);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    this.setVelocityX(this.walkSpeed * this.direction);
    this.isTethered = true;
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'tape_wraith';
  }

  public get displayName(): string {
    return 'TAPE WRAITH';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.setVelocityX(this.walkSpeed * this.direction);
        this.patrolTimer = 0;
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

      // Occasional pause
      if (this.patrolTimer > 2000 && Math.random() < 0.003) {
        this.transitionTo('idle');
        this.scene.time.delayedCall(600 + Math.random() * 400, () => {
          if (this.currentState === 'idle') {
            this.direction = Math.random() > 0.5 ? 1 : -1;
            this.transitionTo('patrol');
          }
        });
      }
    }
  }

  public die(sourceX?: number): void {
    if (this.isTethered) {
      // When defeated, becomes dormant but can reform
      // TODO: Set a timer to reform unless source reel is destroyed
      this.transitionTo('dead');
      this.setTint(0x555555);
      if (this.body) {
        this.body.checkCollision.none = true;
      }

      // After 3 seconds, reform (unless source reel was destroyed)
      const reformTimer = this.scene.time.delayedCall(3000, () => {
        if (this.currentState === 'dead' && this.isTethered) {
          this.hp = 2;
          this.setTint(0x997755);
          if (this.body) {
            this.body.checkCollision.none = false;
          }
          this.transitionTo('patrol');
        }
      });

      // TODO: On source reel destruction event, clear this timer
    } else {
      super.die(sourceX);
    }
  }

  public setSourceReelPosition(x: number, y: number): void {
    this.sourceReelX = x;
    this.sourceReelY = y;
  }

  public breakTether(): void {
    this.isTethered = false;
  }

  public serializeDebug(): Record<string, unknown> {
    return {
      kind: this.kind,
      state: this.currentState,
      hp: this.hp,
      isTethered: this.isTethered,
      sourceReel: { x: this.sourceReelX, y: this.sourceReelY },
    };
  }
}
