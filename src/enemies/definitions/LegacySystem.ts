import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class LegacySystem extends BaseEnemy {
  private direction: number = -1;
  private walkSpeed: number = 55;
  private slideSpeed: number = 220;
  private microservice: boolean = false;
  
  // Shell specific state
  private isRetracted: boolean = false;
  private retractTimer: number = 0;
  private safeTimer: number = 0; // Time before it can be kicked again after stomping

  constructor(config: EnemyConfig, isMicroservice: boolean = false) {
    super(config);
    this.microservice = isMicroservice;
    
    if (this.microservice) {
        this.setTexture('enemy_shell_retracted');
        this.setScale(0.65);
        if (this.body) this.body.setSize(8, 8);
        this.isRetracted = true; // Microservices start as just shells? 
        // Actually registry says they spawn as sliding shells usually. 
        // Let's stick to standard Koopa behavior first.
    } else {
        if (this.body) {
            this.body.setSize(12, 10);
            this.body.setOffset(2, 6);
        }
    }
    
    this.transitionTo('patrol');
  }

  public get kind(): EnemyKind {
    return 'legacy_system';
  }

  public get displayName(): string {
    return 'LEGACY SYSTEM';
  }

  protected onStateEnter(state: EnemyState): void {
      switch (state) {
          case 'patrol':
              this.isRetracted = false;
              this.setTexture('enemy_shell');
              this.setScale(1.85); // Standard scale
              this.setVelocityX(this.walkSpeed * this.direction);
              break;
          case 'idle': // Retracted stationary
              this.isRetracted = true;
              this.setTexture('enemy_shell_retracted');
              this.setScale(1.85);
              this.setVelocityX(0);
              this.retractTimer = 0;
              this.safeTimer = 200; // Brief immunity to prevent instant kick
              break;
          case 'attack': // Sliding
              this.isRetracted = true;
              this.setTexture('enemy_shell_retracted');
              this.setVelocityX(this.slideSpeed * this.direction);
              this.safeTimer = 200;
              break;
      }
  }

  protected updateState(delta: number): void {
      if (this.currentState === 'dead') return;

      this.safeTimer = Math.max(0, this.safeTimer - delta);

      if (this.currentState === 'patrol') {
          // Patrol Logic
          if (this.body && this.body.blocked.left) {
              this.direction = 1;
              this.setVelocityX(this.walkSpeed);
          } else if (this.body && this.body.blocked.right) {
              this.direction = -1;
              this.setVelocityX(-this.walkSpeed);
          } else if (this.body) {
              this.setVelocityX(this.walkSpeed * this.direction);
          }
          this.setFlipX(this.direction > 0); 
      } 
      else if (this.currentState === 'idle') {
          // Idle (Retracted) Logic
          if (this.retractTimer > 0) {
             this.retractTimer -= delta;
             // Add shake effect when close to waking up?
             if (this.retractTimer <= 0) {
                 this.transitionTo('patrol');
             }
          }
      }
      else if (this.currentState === 'slide') {
        const wallHit = (this.body && (this.body.blocked.left || this.body.blocked.right));
        if (wallHit) {
            // Camera shake could be here if we had access to camera
            if (this.scene.cameras?.main) {
                this.scene.cameras.main.shake(100, 0.01);
            }
            // Bounce
            // ...
        }
        
        // Enemy bowling logic
        this.scene.physics.overlap(this, (this.scene as any).enemiesGroup, (me, other) => {
             if (me === other) return;
             const otherEnemy = other as Phaser.Physics.Arcade.Sprite;
             if (otherEnemy.active) {
                 // Kill other enemy
                 // We need a uniform way to kill enemies.
                 // BaseEnemy has 'die()'. But 'other' is just a Sprite here technically,
                 // though likely a BaseEnemy instance.
                 if ('die' in otherEnemy) {
                     (otherEnemy as any).die(this.x);
                     // Maybe add hitstop or sound?
                 } else {
                     otherEnemy.destroy();
                 }
             }
        });
           if (this.body && this.body.blocked.left) {
              this.direction = 1;
              this.setVelocityX(this.slideSpeed);
          } else if (this.body && this.body.blocked.right) {
              this.direction = -1;
              this.setVelocityX(-this.slideSpeed);
          }
      }
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' {
      if (this.currentState === 'dead') return 'damage';
      if (!player.body || !this.body) return 'damage';
      
      const stomp = player.body.bottom < this.body.top + 12 && player.body.velocity.y > 0;

      if (stomp) {
          if (this.currentState === 'patrol') {
              // Stomp to shell
              this.transitionTo('idle');
              // Boost player
              player.setVelocityY(-150);
              return 'stomp';
          } else if (this.currentState === 'idle' || this.currentState === 'attack') {
             if (this.safeTimer > 0) return 'stomp'; // absorb

             // Kick
             if (this.currentState === 'idle') {
                 // Determine direction based on player center vs enemy center
                 this.direction = player.x < this.x ? 1 : -1;
                 this.transitionTo('attack');
             } else {
                 // Stop sliding
                 this.transitionTo('idle');
             }
             player.setVelocityY(-150);
             return 'stomp';
          }
      } else {
          // Non-stomp collision
           if (this.currentState === 'idle') {
              // Kick if running into it? 
              // Standard behavior: touch lateral -> kick.
              if (this.safeTimer <= 0) {
                 this.direction = player.x < this.x ? 1 : -1;
                 this.transitionTo('attack');
                 return 'stomp'; // Technically not a stomp but safe interaction
              }
           }
      }

      return 'damage';
  }
}
