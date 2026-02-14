import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';
import { EnemyContext } from '../types';

export class TechnicalDebt extends BaseEnemy {
  private anchorX: number;
  private anchorY: number;
  private chainGraphics?: Phaser.GameObjects.Graphics;
  private context?: EnemyContext;
  
  private lungeSpeed: number = 180;
  private returnSpeed: number = 60;
  
  private lungeTimer: number = 0;
  private cooldownTimer: number = 0;
  
  // Tuning
  private detectionRadius: number = 140;
  private lungeDuration: number = 400;
  private cooldownDuration: number = 1200;

  constructor(config: EnemyConfig, context?: EnemyContext) {
    super(config);
    this.context = context;
    this.anchorX = config.x;
    this.anchorY = config.y;
    
    if (this.body) {
        this.body.setSize(14, 14);
        this.body.setOffset(1, 1);
    }
    this.setTint(0x8d5fd3);
    this.setScale(1.75);
    this.setGravityY(0);

    this.transitionTo('patrol');

    this.on('destroy', () => {
        this.chainGraphics?.destroy();
    });
  }

  public get kind(): EnemyKind {
    return 'technical_debt';
  }

  public get displayName(): string {
    return 'TECHNICAL DEBT';
  }

  protected onStateEnter(state: EnemyState): void {
      switch (state) {
          case 'patrol':
             this.setVelocity(0, 0);
             break;
          case 'attack': // Lunging
             this.lungeTimer = this.lungeDuration;
             // Velocity set in update
             break;
          case 'idle': // Cooldown / Returning
             this.cooldownTimer = this.cooldownDuration;
             break;
      }
  }

  protected updateState(delta: number): void {
      // Draw chain
      if (!this.chainGraphics && this.scene) {
          this.chainGraphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xaaaaaa } });
      }
      if (this.chainGraphics) {
          this.chainGraphics.clear();
          this.chainGraphics.lineStyle(2, 0xaaaaaa);
          this.chainGraphics.lineBetween(this.anchorX, this.anchorY, this.x, this.y);
      }

      if (this.currentState === 'patrol') {
          // Look for player
          const p = this.context?.getPlayerPosition?.();
          
          if (!p) return;

          if (Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) < this.detectionRadius) {
              this.transitionTo('attack');
              this.playSfx('chain_extend');
              // Calculate lunge velocity once
              const angle = Phaser.Math.Angle.Between(this.x, this.y, p.x, p.y);
              this.setVelocity(Math.cos(angle) * this.lungeSpeed, Math.sin(angle) * this.lungeSpeed);
          }
      } 
      else if (this.currentState === 'attack') {
          this.lungeTimer -= delta;
          if (this.lungeTimer <= 0) {
              this.transitionTo('idle'); // Cooldown/Return
          }
      }
      else if (this.currentState === 'idle') {
          // Returning to anchor
          const dist = Phaser.Math.Distance.Between(this.x, this.y, this.anchorX, this.anchorY);
          if (dist < 5) {
              this.setPosition(this.anchorX, this.anchorY);
              this.setVelocity(0, 0);
              this.cooldownTimer -= delta;
              if (this.cooldownTimer <= 0) {
                  this.transitionTo('patrol');
              }
          } else {
              const angle = Phaser.Math.Angle.Between(this.x, this.y, this.anchorX, this.anchorY);
              this.setVelocity(Math.cos(angle) * this.returnSpeed, Math.sin(angle) * this.returnSpeed);
          }
      }

  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' {
      if (this.currentState === 'idle') return 'damage';
      if (!this.body || !player.body) return 'damage';
      
      const stomp = player.body.bottom < this.body.top + 12 && player.body.velocity.y > 0;
      if (stomp) {
          this.transitionTo('idle'); // Stun/Reset
          this.cooldownTimer = 2000; // Long stun
           player.setVelocityY(-200);
          return 'stomp';
      }
      return 'damage';
  }
}
