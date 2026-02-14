import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class HotTake extends BaseEnemy {
  private baseY: number;
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
    this.baseAmp = 18;

    if (this.body) {
        this.body.setSize(10, 10);
        this.body.setOffset(3, 3);
    }
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
          case 'burst':
              this.burstPhaseMs = 0;
              const amp = 1 + (this.escalation - 1) * 0.3;
              this.setVelocityX((Math.random() < 0.5 ? -1 : 1) * 120);
              this.setVelocityY((Math.random() * 2 - 1) * 120 * amp);
              this.setTint(0xffc44d);
              break;
      }
      this.currentState = state;
  }

  protected updateState(delta: number): void {
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
          
          if (this.scene) {
             this.x += (Math.random() - 0.5) * 4;
             this.y += (Math.random() - 0.5) * 4;
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
