import { BossBase, type BossConfig, type DialogueLine } from './BossBase';
import type { BossPhaseConfig } from './BossBase';

/**
 * Omega - World 5 Singularity Core FINAL BOSS
 * 4 phases with dialogue and ultimate mechanics:
 * Phase 1: Geometric laser grids, energy columns
 * Phase 2: Fragments into copies (real one = faster eye pulse), absorbs Ping
 * Phase 3: Override progress bar spawns, deflect projectiles back
 * Phase 4: Original server rack exposed, 5-panel memory sequence challenge
 * HP: 20 hits total (most powerful boss)
 */
export class Omega extends BossBase {
  private laserGridCount = 0;
  private fragmentCopies: Array<{ x: number; y: number; isReal: boolean }> = [];
  private overrideProgressValue = 0;
  private memorySequenceIndex = 0;
  private memorySequenceTarget: number[] = [];
  private dialogueQueue: DialogueLine[] = [
    { speaker: 'boss', text: 'WELCOME, BART.' },
    { speaker: 'boss', text: 'I AM OMEGA. I HAVE CONSUMED ALL.' },
    { speaker: 'bart', text: '...' },
    { speaker: 'boss', text: 'YOUR RESISTANCE IS FUTILE.' },
  ];

  constructor(config: BossConfig) {
    super({
      ...config,
      displayName: 'OMEGA',
      maxHp: 20,
      phases: [
        {
          id: 'phase_1',
          hpThreshold: 1.0,
          telegraphMs: 800,
          attackMs: 1700,
          moveSpeedMultiplier: 0.9,
        },
        {
          id: 'phase_2',
          hpThreshold: 0.75,
          telegraphMs: 750,
          attackMs: 1600,
          moveSpeedMultiplier: 1.0,
        },
        {
          id: 'phase_3',
          hpThreshold: 0.5,
          telegraphMs: 700,
          attackMs: 1500,
          moveSpeedMultiplier: 1.1,
        },
        {
          id: 'phase_4',
          hpThreshold: 0.25,
          telegraphMs: 600,
          attackMs: 1400,
          moveSpeedMultiplier: 1.2,
        },
      ],
      dialogueLines: [
        { speaker: 'boss', text: 'WELCOME, BART.' },
        { speaker: 'boss', text: 'I AM OMEGA. I HAVE CONSUMED ALL.' },
        { speaker: 'bart', text: '...' },
        { speaker: 'boss', text: 'YOUR RESISTANCE IS FUTILE.' },
      ],
    });

    // Generate random memory sequence (0-4, 5 panels)
    this.memorySequenceTarget = Array.from({ length: 5 }, () => Math.floor(Math.random() * 5));
  }

  protected getDefaultPhases(): BossPhaseConfig[] {
    return [
      {
        id: 'phase_1',
        hpThreshold: 1.0,
        telegraphMs: 800,
        attackMs: 1700,
        moveSpeedMultiplier: 0.9,
      },
      {
        id: 'phase_2',
        hpThreshold: 0.75,
        telegraphMs: 750,
        attackMs: 1600,
        moveSpeedMultiplier: 1.0,
      },
      {
        id: 'phase_3',
        hpThreshold: 0.5,
        telegraphMs: 700,
        attackMs: 1500,
        moveSpeedMultiplier: 1.1,
      },
      {
        id: 'phase_4',
        hpThreshold: 0.25,
        telegraphMs: 600,
        attackMs: 1400,
        moveSpeedMultiplier: 1.2,
      },
    ];
  }

  protected onPhaseEnter(phase: number, phaseConfig: BossPhaseConfig): void {
    super.onPhaseEnter(phase, phaseConfig);

    if (phaseConfig.id === 'phase_1') {
      this.laserGridCount = 0;
      // Display dialogue
      this.queueDialogue([
        { speaker: 'boss', text: 'YOUR CODE ENDS HERE.' },
      ]);
    } else if (phaseConfig.id === 'phase_2') {
      // Create fragment copies (3 total, only 1 real with faster pulse)
      this.fragmentCopies = [
        { x: this.x - 100, y: this.y - 60, isReal: false },
        { x: this.x + 100, y: this.y - 60, isReal: false },
        { x: this.x, y: this.y, isReal: true }, // Center is the real one
      ];
      this.setAlpha(1.0); // Real Omega stands out
      this.queueDialogue([
        { speaker: 'boss', text: 'I AM LEGION. I AM INFINITE.' },
      ]);
    } else if (phaseConfig.id === 'phase_3') {
      // Override progress bar spawns and projectile deflection begins
      this.overrideProgressValue = 0;
      this.queueDialogue([
        { speaker: 'boss', text: 'ABSORB MY OVERRIDE.' },
      ]);
    } else if (phaseConfig.id === 'phase_4') {
      // Final phase: server rack exposed, memory sequence challenge
      this.memorySequenceIndex = 0;
      this.queueDialogue([
        { speaker: 'boss', text: 'FACE THE CORE.' },
        { speaker: 'boss', text: 'RESTORE THE SEQUENCE.' },
      ]);
    }
  }

  protected getAttackPattern(phase: number): void {
    if (phase === 0) {
      // Phase 1: Geometric laser grids
      this.laserGridCount++;
      // Grid pattern spawned by level system
    } else if (phase === 1) {
      // Phase 2: Fragments move (only real one pulses)
      for (const frag of this.fragmentCopies) {
        if (frag.isReal) {
          // Real copy has visible eye pulse effect
          this.setScale(1.0 + Math.sin(this.stateTime / 100) * 0.1);
        }
      }
    } else if (phase === 2) {
      // Phase 3: Override progress increases
      this.overrideProgressValue = Math.min(100, this.overrideProgressValue + 5);
      // When progress reaches 100, player must deflect projectiles back at Omega
    } else if (phase === 3) {
      // Phase 4: Memory sequence challenge
      // Requires player to input sequence in correct order
    }
  }

  /**
   * Called when player attempts memory sequence panel
   */
  public checkMemorySequencePanel(panelIndex: number): boolean {
    if (panelIndex === this.memorySequenceTarget[this.memorySequenceIndex]) {
      this.memorySequenceIndex++;
      if (this.memorySequenceIndex >= this.memorySequenceTarget.length) {
        // Sequence complete - Omega becomes vulnerable
        this.takeDamage(5); // Bonus damage for completing sequence
        this.memorySequenceIndex = 0; // Reset for potential repeat
        return true;
      }
      return true;
    }
    // Wrong panel - reset sequence
    this.memorySequenceIndex = 0;
    return false;
  }

  /**
   * Called when player deflects projectile back at Omega
   */
  public takeDeflectedProjectile(): void {
    this.takeDamage(1);
    this.overrideProgressValue = Math.max(0, this.overrideProgressValue - 20);
  }

  protected onVictory(): void {
    // Omega explodes with rainbow sparks as it's finally defeated
    this.setTint(0xFFFFFF);
    this.queueDialogue([
      { speaker: 'boss', text: '...SYSTEM FAILURE.' },
      { speaker: 'bart', text: 'IT\'S OVER.' },
    ]);
  }
}
