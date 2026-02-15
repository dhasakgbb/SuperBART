import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class ResumeBot extends BaseEnemy {
  private direction: number = 1;
  private patrolSpeed: number = 35;
  private patrolTimer: number = 0;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 1;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setTint(0xFFEECC); // Paper cream color
    this.setScale(1.8);
    if (this.body) {
      this.body.setSize(12, 12);
    }
    this.setVelocityX(this.patrolSpeed * this.direction);
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'resume_bot';
  }

  public get displayName(): string {
    return 'RESUME BOT';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'patrol':
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.patrolTimer = 0;
        break;
      case 'idle':
        this.setVelocityX(0);
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    // Wall collision - redirect like a Roomba
    if (this.body?.blocked.left) {
      this.direction = 1;
      this.setVelocityX(this.patrolSpeed);
    } else if (this.body?.blocked.right) {
      this.direction = -1;
      this.setVelocityX(-this.patrolSpeed);
    }

    this.setFlipX(this.direction < 0);

    if (this.currentState === 'patrol') {
      this.patrolTimer += delta;

      // Occasional pause (like robot cleaning pattern)
      if (this.patrolTimer > 3000 && Math.random() < 0.002) {
        this.transitionTo('idle');
        this.scene.time.delayedCall(800 + Math.random() * 600, () => {
          if (this.currentState === 'idle') {
            this.direction = Math.random() > 0.5 ? 1 : -1;
            this.transitionTo('patrol');
          }
        });
      }
    }
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' {
    // ResumeBot redirects Bart like a Roomba bumping into furniture
    // No damage, just physics interaction
    if (player.body && this.body) {
      // Push player away gently
      const dx = player.x - this.x;
      const magnitude = Math.max(0.1, Math.abs(dx));
      player.setVelocityX((dx / magnitude) * 100);
    }
    return 'damage'; // No actual damage
  }

  public die(sourceX?: number): void {
    // Destroying ResumeBot creates paper puff effect (no score, no drops)
    this.transitionTo('dead');
    this.setTint(0x999999);
    if (this.body) {
      this.body.checkCollision.none = true;
      this.setVelocityX(sourceX ? Math.sign(this.x - sourceX) * 60 : 0);
      this.setVelocityY(-150);
    }

    // Paper puff particles would spawn here
    // TODO: Spawn puff particles from position
    this.playSfx('paper_puff'); // Paper puff sound for destruction

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      delay: 100,
      onComplete: () => this.destroy(),
    });
  }

  public serializeDebug(): Record<string, unknown> {
    return {
      kind: this.kind,
      state: this.currentState,
      hp: this.hp,
      note: 'Destroying feels wrong. That is intentional.',
    };
  }
}
