import Phaser from 'phaser';
import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export type HotTakeState = 'drift' | 'warn' | 'burst';

export class HotTake extends BaseEnemy {
  private baseY: number;
  private targetY: number;
  private baseAmp: number;
  
  private phaseMs: number = 0;
  private phaseDuration: number = 2000;
  private burstPhaseMs: number = 0;
  private escalation: number = 1;

  // Constants
  private readonly DRIFT_MS = 2000;
  private readonly WARN_MS = 220;
  private readonly BURST_MS = 280;

  constructor(config: EnemyConfig) {
    super(config);
    this.baseY = config.y;
    this.targetY = config.y;
    this.baseAmp = 18; // Default amp

    if (this.body) {
        this.body.setSize(10, 10);
        this.body.setOffset(3, 3);
    }
    
    
    // Flying enemies often ignore gravity or have custom gravity
    this.setGravityY(0); 
    this.setScale(1.8);
    
    this.transitionTo('drift');
  }

  public get kind(): EnemyKind {
    return 'hot_take';
  }

  public get displayName(): string {
    return 'HOT TAKE';
  }

  protected onStateEnter(state: EnemyState): void {
      switch (state) {
          case 'drift':
              this.phaseMs = 0;
              this.setVelocityX(-35);
              this.clearTint();
              break;
          case 'warn':
              this.phaseMs = 0;
              this.setTint(0xff4444);
              break;
          case 'burst': // Using 'attack' as burst? Or custom state name? BaseEnemy has 'attack'.
              // We can map 'burst' to 'attack' or just use 'burst' string casting if needed?
              // BaseEnemy.EnemyState is broad. Let's use 'attack' for burst.
              // But wait, the logic uses 'burst'. 
              // BaseEnemy types: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead' | 'stumble';
              // 'Drift' maps to 'patrol'. 'Warn' maps to 'chase'? 'Burst' maps to 'attack'?
              // Or I can add custom states effectively by just ignoring the type restriction 
              // or casting. But cleaner to map.
              this.burstPhaseMs = 0;
              const amp = 1 + (this.escalation - 1) * 0.3;
              this.setVelocityX((Math.random() < 0.5 ? -1 : 1) * 120);
              this.setVelocityY((Math.random() * 2 - 1) * 120 * amp);
              this.setTint(0xffc44d);
              break;
      }
      this.currentState = state; // valid cast
  }

  protected updateState(delta: number): void {
      // Escalation logic from registry
      // const escalation = 1 + Math.min(1.5, (Number(ctx.nowMs ? ctx.nowMs() : 0) - Number(ctx.nowMs ? ctx.nowMs() : 0)) / 20000);
      // Wait, the original code had `(Number(ctx.nowMs ? ctx.nowMs() : 0) - Number(ctx.nowMs ? ctx.nowMs() : 0))` which is 0?
      // "Number(ctx.nowMs ? ctx.nowMs() : 0) - Number(ctx.nowMs ? ctx.nowMs() : 0)"
      // Ah, line 216 in registry.ts: 
      // const escalation = 1 + Math.min(1.5, (Number(ctx.nowMs ? ctx.nowMs() : 0) - Number(ctx.nowMs ? ctx.nowMs() : 0)) / 20000);
      // That looks like a bug in the original code? 0 / 20000 is 0. So escalation is always 1?
      // Unless it was supposed to be (now - startTime)?
      // I'll stick to escalation = 1 for now or fix it if I had startTime.

      if (this.currentState === 'drift') {
          const t = this.scene.time.now / 1000;
          this.y = this.baseY + Math.sin(t * 2.4) * (this.baseAmp * (0.5 + Math.min(0.4, this.escalation * 0.1)));
          
          this.phaseMs += delta;
          const duration = this.phaseDuration || (this.DRIFT_MS * 1.4);
          
          if (this.phaseMs >= duration) {
              this.playSfx('charge_warning');
              this.transitionTo('warn');
          }
      } 
      else if (this.currentState === 'warn') {
          this.phaseMs += delta;
          
          // Add shake/jitter
          if (this.scene) {
             this.x += (Math.random() - 0.5) * 4;
             this.y += (Math.random() - 0.5) * 4;
             // Ideally we should oscillate around base position to avoid drift,
             // but short duration jitter is fine for "warn".
             // Better: this.setOffset ? or use a tween?
             // Simple jitter:
          }

          if (this.phaseMs >= this.WARN_MS) {
              this.transitionTo('burst');
          }
      }
      else if (this.currentState === 'burst') {
          this.burstPhaseMs += delta;
          if (this.burstPhaseMs >= this.BURST_MS) {
             this.transitionTo('drift');
             this.phaseDuration = Math.max(1200, 2600 - 900 * Math.min(1, this.escalation * 0.25));
             this.setVelocityY(0);
          }
      }
  }

  // Override transitionTo to accept our custom states if we cast
  public transitionTo(newState: string) {
      this.onStateEnter(newState as EnemyState);
  }
}
