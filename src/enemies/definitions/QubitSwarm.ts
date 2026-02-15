import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class QubitSwarm extends BaseEnemy {
  // Add playSfx for use later
  private direction: number = 1;
  private walkSpeed: number = 40;
  private patrolTimer: number = 0;
  private statePhaseTimer: number = 0;
  private readonly CYCLE_DURATION = 2000; // 2s active, 2s dormant
  private isActive: boolean = false;
  private readonly STATE_TRANSITION_MS = 300; // 0.3s transition

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 1;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0xBB88FF); // Purple
    this.setScale(1.8);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    // Start dormant
    this.isActive = false;
    this.setAlpha(0.3); // Translucent when dormant
    this.setVelocityX(0);
    this.transitionTo('idle');
  }

  public get kind(): EnemyKind {
    return 'qubit_swarm';
  }

  public get displayName(): string {
    return 'QUBIT SWARM';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.isActive = true;
        this.setVelocityX(this.walkSpeed * this.direction);
        this.statePhaseTimer = 0;
        // Fade to solid
        this.scene.tweens.add({
          targets: this,
          alpha: 1.0,
          duration: this.STATE_TRANSITION_MS,
          ease: 'Linear',
        });
        break;
      case 'idle':
        this.isActive = false;
        this.setVelocityX(0);
        this.statePhaseTimer = 0;
        // Fade to translucent
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          duration: this.STATE_TRANSITION_MS,
          ease: 'Linear',
        });
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    this.statePhaseTimer += delta;

    // Toggle between active and dormant every CYCLE_DURATION
    if (this.statePhaseTimer >= this.CYCLE_DURATION) {
      if (this.isActive) {
        this.transitionTo('idle');
      } else {
        this.transitionTo('patrol');
      }
    }

    if (this.isActive && this.currentState === 'patrol') {
      // Only check walls when active
      if (this.body?.blocked.left) {
        this.direction = 1;
        this.setVelocityX(this.walkSpeed);
      } else if (this.body?.blocked.right) {
        this.direction = -1;
        this.setVelocityX(-this.walkSpeed);
      }
      this.setFlipX(this.direction < 0);
    }
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' | 'harmless' {
    // Harmless during dormant phase
    if (!this.isActive) {
      return 'harmless';
    }
    return super.onPlayerCollision(player);
  }
}
