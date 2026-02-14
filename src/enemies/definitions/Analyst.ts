import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';
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

    // Initial timer offset to stagger or start immediately? 
    // Registry initialized shellMoveSpeed (timer) to 0. So it shoots immediately?
    // "if ((local.phaseMs ?? 0) >= (local.shellMoveSpeed ?? 0))" -> 0 >= 0 is true.
    // So yes, immediate shot.
    this.timer = this.cadence; // Force immediate shot?
    // Actually, let's start at 0 and fire when it reaches 0?
    // Registry logic: `phaseMs += dt`. `if phaseMs >= limit`. limit starts 0.
    // So fire at t=0. Then limit becomes cadence.
    // So distinct from `timer -= dt`.
    // Let's use `timer` counting up to `cadence`.
    this.timer = this.cadence; // Trigger immediately
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

      // Recoil recovery
      if (this.y < this.baseY - 4 && this.timer > 2000) { 
          // Registry: `if (sprite.y < baseY - 4 && (local.phaseMs ?? 0) > 2000)`
          // This implies it recoils UPWARDS and drifts down?
          // Or wait, `sprite.setY(sprite.y + 0.3)` moves DOWN.
          // So it must have moved UP during firing?
          // Registry didn't show recoil usage. Maybe it was manual or physics recoil?
          // "b1.setVelocity(-130, 0)" .. physics doesn't apply recoil to thrower unless coded.
          // Maybe I should add recoil.
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
