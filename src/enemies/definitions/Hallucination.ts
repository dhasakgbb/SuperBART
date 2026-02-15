import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class Hallucination extends BaseEnemy {
  private direction: number = 1;
  private walkSpeed: number = 45;
  private sprintSpeed: number = 110;
  private patrolTimer: number = 0;

  constructor(config: EnemyConfig) {
    super(config);
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.setVelocityX(this.walkSpeed * this.direction);
    this.transitionTo('patrol');
    
    // Randomize initial tint slightly to show "instability"
    // varying slightly from pure white
    const r = 255;
    const g = 240 + Math.random() * 15;
    const b = 240 + Math.random() * 15;
    this.setTint(Phaser.Display.Color.GetColor(r, g, b));
  }

  public get kind(): EnemyKind {
    return 'hallucination';
  }

  public get displayName(): string {
    return 'HALLUCINATION';
  }

  protected onStateEnter(state: EnemyState): void {
      switch (state) {
          case 'patrol':
              this.setVelocityX(this.walkSpeed * this.direction);
              this.patrolTimer = 0;
              break;
          case 'alert': // Sprinting
              this.setVelocityX(this.sprintSpeed * this.direction);
              this.setTint(0xffaaaa); // Reddish tint when sprinting
              break;
          case 'idle':
              this.setVelocityX(0);
              break;
      }
  }

  protected updateState(delta: number): void {
      if (this.currentState === 'dead' || this.currentState === 'hurt') return;

      // Ground detection for turning
      if (this.body?.blocked.left) {
          this.direction = 1;
          this.setVelocityX(this.currentState === 'alert' ? this.sprintSpeed : this.walkSpeed);
      } else if (this.body?.blocked.right) {
          this.direction = -1;
          this.setVelocityX(-(this.currentState === 'alert' ? this.sprintSpeed : this.walkSpeed));
      }

      this.setFlipX(this.direction < 0);

      // AI Logic
      if (this.currentState === 'patrol') {
          this.patrolTimer += delta;
          
          // Chance to start sprinting "confidently"
          if (this.patrolTimer > 2000 && Math.random() < 0.005) {
              this.transitionTo('alert');
              this.scene.time.delayedCall(1500, () => {
                  if (this.currentState === 'alert') {
                      this.transitionTo('patrol');
                      this.clearTint();
                  }
              });
          }

          // Chance to stop and "buffer"
          if (this.patrolTimer > 1000 && Math.random() < 0.002) {
              this.transitionTo('idle');
              this.scene.time.delayedCall(800 + Math.random() * 800, () => {
                  if (this.currentState === 'idle') {
                      this.direction = Math.random() > 0.5 ? 1 : -1;
                      this.transitionTo('patrol');
                  }
              });
          }
      }

      // Occasional random jump
      if (this.body?.blocked.down && Math.random() < 0.001) {
          this.setVelocityY(-250);
      }
  }
}
