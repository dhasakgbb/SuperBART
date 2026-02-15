import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { SfxKey } from '../audio/sfx';
import type { EnemyKind, EnemyKillSource, EnemyKillEvent } from './types';

export type { EnemyKind, EnemyKillSource, EnemyKillEvent };

export type EnemyState = 'idle' | 'patrol' | 'alert' | 'attack' | 'hurt' | 'dead' | 'drift' | 'warn' | 'burst' | 'slide';

export interface EnemyConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  frame?: string | number;
}

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  protected currentState: EnemyState = 'idle';
  protected stateTime: number = 0;
  protected hp: number = 1;
  protected isInvulnerable: boolean = false;
  
  // Physics tuning
  protected moveSpeed: number = 50;
  protected gravityY: number = 800;
  protected bounceRestitution: number = 0;

  constructor(config: EnemyConfig) {
    super(config.scene, config.x, config.y, config.texture, config.frame);

    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(this.bounceRestitution);
    this.setGravityY(this.gravityY);
    
    // Default size, can be overridden
    if (this.body) {
      this.body.setSize(12, 12);
    }
  }

  public abstract get kind(): EnemyKind;
  public abstract get displayName(): string;

  public manualUpdate(delta: number): void {
    this.stateTime += delta;
    
    // Run state-specific logic
    this.updateState(delta);

    // Common physics checks
    if (this.y > this.scene.physics.world.bounds.height + 100) {
      this.destroy(); // Fell out of world
    }
  }

  // Override update to do nothing, as we are manually updating
  public update(_time: number, _delta: number): void {
    // no-op
  }

  protected abstract updateState(delta: number): void;

  public transitionTo(newState: EnemyState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.stateTime = 0;
    this.onStateEnter(newState);
  }

  protected onStateEnter(state: EnemyState): void {
    // Override in subclasses
  }

  public takeDamage(amount: number = 1, sourceX?: number): void {
    if (this.isInvulnerable || this.currentState === 'dead') return;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.die(sourceX);
    } else {
      this.transitionTo('hurt');
      this.setVelocityX(sourceX ? Math.sign(this.x - sourceX) * 100 : 0);
      this.setVelocityY(-150);
      this.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        this.clearTint();
        if (this.currentState === 'hurt') {
            this.transitionTo('patrol');
        }
      });
    }
  }

  public die(sourceX?: number): void {
    this.transitionTo('dead');
    this.setTint(0x555555);
    if (this.body) {
        this.body.checkCollision.none = true;
        this.setVelocityX(sourceX ? Math.sign(this.x - sourceX) * 80 : 0);
        this.setVelocityY(-200);
        this.setGravityY(1000);
    }
    
    // Disable body after a short movement or immediately?
    // Let it fall off screen
    this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        delay: 200,
        onComplete: () => this.destroy()
    });
  }

  public onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' | 'harmless' {
    if (this.currentState === 'dead') return 'damage';
    
    // Default collision logic
    if (player.body && this.body) {
         const stomp = player.body.bottom < this.body.top + 10 && player.body.velocity.y > 0;
         return stomp ? 'stomp' : 'damage';
    }
    return 'damage';
  }

  public createKillEvent(source: EnemyKillSource): EnemyKillEvent {
      return {
          enemyType: this.kind,
          source,
          isBoss: false,
          x: this.x,
          y: this.y,
      };
  }

  public playSfx(key: SfxKey): void {
      // AudioEngine is singleton but we might not want to import it here to keep coupling loose?
      // Actually, PlayScene usually exposes playSfx.
      // Or we can import AudioEngine.
      // Let's import AudioEngine to keep it simple.
      AudioEngine.shared().playSfx(key);
  }

  public serializeDebug(): Record<string, unknown> {
      return {
          kind: this.kind,
          state: this.currentState,
          hp: this.hp,
      };
  }
}
