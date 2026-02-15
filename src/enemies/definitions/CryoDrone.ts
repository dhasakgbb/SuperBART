import { BaseEnemy, EnemyConfig, EnemyState, EnemyKind } from '../BaseEnemy';

export class CryoDrone extends BaseEnemy {
  private baseY: number;
  private baseAmp: number = 16;
  private driftSpeed: number = -40;
  private chargeTimer: number = 0;
  private readonly CHARGE_INTERVAL = 4000;
  private readonly CHARGE_TELEGRAPH_MS = 750;
  private isCharging: boolean = false;

  constructor(config: EnemyConfig) {
    super(config);
    this.hp = 2;
    this.baseY = config.y;
    this.setGravityY(0); // Floats, no gravity
    this.setTint(0x88CCFF); // Light blue
    this.setScale(1.8);
    if (this.body) {
      this.body.setSize(10, 10);
      this.body.setOffset(3, 3);
    }
    this.setVelocityX(this.driftSpeed);
    this.transitionTo('drift');
  }

  public get kind(): EnemyKind {
    return 'cryo_drone';
  }

  public get displayName(): string {
    return 'CRYO DRONE';
  }

  protected onStateEnter(state: EnemyState): void {
    switch (state) {
      case 'drift':
        this.setVelocityX(this.driftSpeed);
        this.chargeTimer = 0;
        this.isCharging = false;
        this.setTint(0x88CCFF);
        break;
      case 'alert':
        this.setVelocityX(0);
        this.isCharging = true;
        this.setTint(0x4488FF); // Darker blue for charging
        break;
    }
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead' || this.currentState === 'hurt') return;

    // Floating oscillation
    const t = this.scene.time.now / 1000;
    this.y = this.baseY + Math.sin(t * 1.8) * this.baseAmp;

    // Wall bouncing
    if (this.body?.blocked.left || this.body?.blocked.right) {
      this.setVelocityX(-this.driftSpeed);
      this.driftSpeed = -this.driftSpeed;
    }

    if (this.currentState === 'drift') {
      this.chargeTimer += delta;

      if (this.chargeTimer >= this.CHARGE_INTERVAL) {
        this.transitionTo('alert');
        this.playSfx('freeze_beam');

        // After telegraph, fire beam
        this.scene.time.delayedCall(this.CHARGE_TELEGRAPH_MS, () => {
          if (this.currentState === 'alert') {
            this.fireFreezingBeam();
            this.transitionTo('drift');
          }
        });
      }
    }
  }

  private fireFreezingBeam(): void {
    // TODO: Projectile spawning with freeze effect would happen here
    // For now, just visual feedback
    if (!this.scene) return;
    this.scene.time.delayedCall(100, () => {
      this.setTint(0x88CCFF);
    });
  }
}
