import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class Crawler extends BaseEnemy {
  private direction: number = 1;
  private lungeSpeed: number = 140;
  private wallX: number;
  private wallEmergeTime: number = 0;
  private readonly EMERGENCE_TELEGRAPH_MS = 750;
  private isEmerging: boolean = false;
  private hasEmerged: boolean = false;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 2;
    this.wallX = config.x;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0x44AA44); // Green
    this.setScale(1.9);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    this.setVelocityX(0);
    this.transitionTo('idle');
  }

  public get kind(): EnemyKind {
    return 'crawler';
  }

  public get displayName(): string {
    return 'CRAWLER';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'idle':
        this.setVelocityX(0);
        this.isEmerging = false;
        this.wallEmergeTime = 0;
        this.setAlpha(1.0);
        this.setTint(0x44AA44);
        break;
      case 'alert':
        this.isEmerging = true;
        this.wallEmergeTime = 0;
        this.hasEmerged = false;
        // Glow effect for telegraph
        this.setTint(0x66DD66);
        this.playSfx('crawler_emerge');
        break;
      case 'patrol':
        this.isEmerging = false;
        this.setVelocityX(this.lungeSpeed * this.direction);
        this.setTint(0x44AA44);
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    if (this.isEmerging) {
      this.wallEmergeTime += delta;

      // Telegraph phase: wall glow
      if (this.wallEmergeTime < this.EMERGENCE_TELEGRAPH_MS) {
        // Keep at wall position
        this.x = this.wallX;
      } else if (this.wallEmergeTime >= this.EMERGENCE_TELEGRAPH_MS && !this.hasEmerged) {
        // Emerge and lunge
        this.hasEmerged = true;
        this.transitionTo('patrol');
      }
    } else if (this.currentState === 'patrol') {
      // Check if lunge target is reached or time out
      const lungeDistance = Math.abs(this.x - this.wallX);
      if (lungeDistance > 400) {
        // Traveled far enough, return to idle
        this.direction = -this.direction;
        this.transitionTo('idle');
      }
    }
  }
}
