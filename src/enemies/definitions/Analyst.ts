import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyKind } from '../BaseEnemy';
import { EnemyContext } from '../types';

export class Analyst extends BaseEnemy {
  private baseY: number;
  private cadence: number = 2100;
  private timer: number = 0;
  private context?: EnemyContext;

  constructor(config: EnemyConfig, context?: EnemyContext) {
    super(config);
    this.context = context;
    this.baseY = config.y;
    
    // Analyst is stationary but might recoil
    this.setImmovable(true);
    if (this.body) {
        this.body.setSize(10, 10);
        this.body.setOffset(3, 3);
        (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }
    
    this.setScale(1.8);

    this.timer = this.cadence; // Trigger first shot immediately
  }

  public get kind(): EnemyKind {
    return 'analyst';
  }

  public get displayName(): string {
    return 'ANALYST';
  }

  protected updateState(delta: number): void {
      this.timer += delta;
      
      // Telegraphing
      if (this.timer >= this.cadence - 500) {
          // Pulse scale/tint
          const t = (this.timer - (this.cadence - 500)) / 500; // 0 to 1
          this.setTint(Phaser.Display.Color.GetColor(255, 255 * (1-t), 255 * (1-t))); // Redden
          this.setScale(1.8 + Math.sin(t * Math.PI * 4) * 0.1); // Shake/Pulse
      } else {
          this.clearTint();
          this.setScale(1.8);
      }
      
      if (this.timer >= this.cadence) {
          this.timer = 0;
          this.playSfx('spit_attack');
          this.fireProjectiles();
      }

      // Recoil recovery: drift back down after firing recoil
      if (this.y < this.baseY - 4 && this.timer > 2000) {
          this.y += 0.3;
      }
  }

  private fireProjectiles() {
      if (!this.context) return;
      
      const { projectiles, spawnLingerZone } = this.context;
      
      const createProjectile = (vx: number, vy: number) => {
          const p = projectiles.create(this.x - 10, this.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
          p.setData('owner', 'analyst');
          if (p.body) {
              (p.body as Phaser.Physics.Arcade.Body).allowGravity = false;
              p.setVelocity(vx, vy);
              p.setCollideWorldBounds(false);
          }
      };

      createProjectile(-130, 0);
      createProjectile(-115, -55);
      createProjectile(-115, 55);

      if (spawnLingerZone) {
          spawnLingerZone(this.x, this.baseY + 12);
      }
      
      // Add recoil effect
      this.y -= 5; 
  }
}
