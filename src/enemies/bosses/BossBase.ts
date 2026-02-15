import Phaser from 'phaser';
import { BaseEnemy, type EnemyConfig } from '../BaseEnemy';
import type { EnemyKillEvent, EnemyKillSource } from '../types';

export interface BossPhaseConfig {
  id: string;
  hpThreshold: number; // Percentage (0.0-1.0) at which this phase starts
  telegraphMs?: number; // Time for warning state
  attackMs?: number; // Time for attack state
  moveSpeedMultiplier?: number;
}

export interface DialogueLine {
  speaker: 'boss' | 'bart';
  text: string;
}

export interface BossConfig extends EnemyConfig {
  displayName?: string;
  maxHp?: number;
  phases?: BossPhaseConfig[];
  dialogueLines?: DialogueLine[];
}

export abstract class BossBase extends BaseEnemy {
  protected readonly bossName: string;
  protected readonly maxBossHp: number;
  protected readonly phases: BossPhaseConfig[];
  protected currentPhaseIndex = 0;
  protected attackCooldownMs = 0;
  protected dialogueLines: DialogueLine[] = [];
  protected dialogueIndex = 0;

  // Phase lifecycle hooks
  protected readonly onPhaseEnterCallbacks: Map<string, (config: BossPhaseConfig) => void> = new Map();
  protected readonly onPhaseExitCallbacks: Map<string, (config: BossPhaseConfig) => void> = new Map();

  constructor(config: BossConfig) {
    super(config);
    this.bossName = config.displayName ?? 'BOSS';
    this.maxBossHp = Math.max(1, config.maxHp ?? 12);
    this.hp = this.maxBossHp;
    this.moveSpeed = 38;
    this.setImmovable(false);
    this.setCollideWorldBounds(true);
    if (this.body) {
      this.body.setSize(44, 42).setOffset(10, 18);
    }
    this.phases = (config.phases ?? this.getDefaultPhases()).slice().sort((a, b) => b.hpThreshold - a.hpThreshold);
    this.dialogueLines = config.dialogueLines ?? [];
    this.transitionTo('patrol');
  }

  public get kind() {
    return 'boss' as const;
  }

  public get displayName(): string {
    return this.bossName;
  }

  public get phase(): BossPhaseConfig {
    return this.phases[this.currentPhaseIndex] ?? this.phases[0]!;
  }

  /**
   * Override to provide world-specific default phases
   */
  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      { id: 'phase_1', hpThreshold: 1, telegraphMs: 700, attackMs: 1500, moveSpeedMultiplier: 1.0 },
      { id: 'phase_2', hpThreshold: 0.6, telegraphMs: 580, attackMs: 1300, moveSpeedMultiplier: 1.2 },
      { id: 'phase_3', hpThreshold: 0.3, telegraphMs: 460, attackMs: 1100, moveSpeedMultiplier: 1.35 },
    ];
  }

  /**
   * Called when entering a new phase. Override in subclasses for phase-specific behavior.
   */
  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    // Trigger registered callback if any
    const callback = this.onPhaseEnterCallbacks.get(phaseConfig.id);
    if (callback) {
      callback(phaseConfig);
    }
  }

  /**
   * Called when leaving a phase. Override in subclasses.
   */
  protected onPhaseExit(phase: number, phaseConfig: BossPhaseConfig): void {
    const callback = this.onPhaseExitCallbacks.get(phaseConfig.id);
    if (callback) {
      callback(phaseConfig);
    }
  }

  /**
   * Get attack pattern for the current phase. Override in subclasses.
   * Base implementation does nothing.
   */
  protected getAttackPattern(phase: number, phaseConfig: BossPhaseConfig): void {
    // Override in subclasses
  }

  /**
   * Called when the boss is defeated. Can be overridden for custom victory sequences.
   */
  protected onVictory(): void {
    // Override in subclasses for custom victory animations
  }

  /**
   * Queue dialogue to display (managed by DialogueDisplay system)
   */
  public queueDialogue(lines: DialogueLine[]): void {
    this.dialogueLines.push(...lines);
  }

  /**
   * Get next dialogue line if available
   */
  public getNextDialogue(): DialogueLine | null {
    if (this.dialogueIndex >= this.dialogueLines.length) {
      return null;
    }
    return this.dialogueLines[this.dialogueIndex++];
  }

  /**
   * Check if there is more dialogue to display
   */
  public hasMoreDialogue(): boolean {
    return this.dialogueIndex < this.dialogueLines.length;
  }

  protected updateState(delta: number): void {
    if (this.currentState === 'dead') {
      return;
    }
    this.syncPhaseByHp();
    this.attackCooldownMs = Math.max(0, this.attackCooldownMs - delta);

    if (this.currentState === 'patrol') {
      if (this.attackCooldownMs <= 0) {
        this.transitionTo('warn');
        return;
      }
      if (this.body && (this.body.blocked.left || this.body.blocked.right)) {
        this.setVelocityX(-this.body.velocity.x || this.moveSpeed);
      }
      if (!this.body?.velocity.x) {
        this.setVelocityX(this.moveSpeed * (this.phase.moveSpeedMultiplier ?? 1.0));
      }
      return;
    }

    if (this.currentState === 'warn') {
      this.setTint(0xffcf52);
      this.setVelocityX(0);
      if (this.stateTime >= (this.phase.telegraphMs ?? 700)) {
        this.clearTint();
        this.transitionTo('attack');
        this.getAttackPattern(this.currentPhaseIndex, this.phase);
      }
      return;
    }

    if (this.currentState === 'attack') {
      this.setVelocityX((this.flipX ? -1 : 1) * this.moveSpeed * (this.phase.moveSpeedMultiplier ?? 1.0) * 2.1);
      this.setVelocityY(-150);
      if (this.stateTime >= (this.phase.attackMs ?? 1500)) {
        this.attackCooldownMs = this.phase.attackMs ?? 1500;
        this.transitionTo('patrol');
      }
      return;
    }

    if (this.currentState === 'hurt') {
      this.setTint(0xff7777);
      if (this.stateTime >= 220) {
        this.clearTint();
        this.transitionTo('patrol');
      }
    }
  }

  private syncPhaseByHp(): void {
    const normalizedHp = this.hp / this.maxBossHp;
    const nextPhaseIndex = this.phases.findIndex((phase) => normalizedHp >= phase.hpThreshold);
    const newPhaseIndex = nextPhaseIndex === -1 ? this.phases.length - 1 : nextPhaseIndex;

    if (newPhaseIndex !== this.currentPhaseIndex) {
      const oldPhase = this.phases[this.currentPhaseIndex];
      this.onPhaseExit(this.currentPhaseIndex, oldPhase!);

      this.currentPhaseIndex = newPhaseIndex;
      const newPhase = this.phases[newPhaseIndex];
      this.onPhaseEnter(newPhaseIndex, newPhase!);
    }
  }

  public override onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' {
    if (this.currentState === 'dead') {
      return 'damage';
    }
    if (!this.body || !player.body) {
      return 'damage';
    }
    const stomp = player.body.bottom < this.body.top + 12 && player.body.velocity.y > 0;
    if (stomp) {
      this.takeDamage(1, player.x);
      return 'stomp';
    }
    return 'damage';
  }

  public override takeDamage(amount = 1, sourceX?: number): void {
    if (this.currentState === 'dead') {
      return;
    }
    super.takeDamage(amount, sourceX);
  }

  public override die(sourceX?: number): void {
    this.onVictory();
    super.die(sourceX);
  }

  public override createKillEvent(source: EnemyKillSource): EnemyKillEvent {
    return {
      enemyType: this.kind,
      source,
      isBoss: true,
      x: this.x,
      y: this.y,
    };
  }

  public serializeBossState(): Record<string, unknown> {
    return {
      kind: this.kind,
      displayName: this.displayName,
      hp: this.hp,
      maxHp: this.maxBossHp,
      phase: this.phase.id,
      state: this.currentState,
    };
  }
}
