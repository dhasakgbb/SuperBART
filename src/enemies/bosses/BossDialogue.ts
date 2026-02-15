import Phaser from 'phaser';

export interface DialogueLine {
  speaker: 'boss' | 'bart';
  text: string;
}

/**
 * Displays boss dialogue in a simple text box above the arena
 */
export class BossDialogue {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private textObject: Phaser.GameObjects.Text | null = null;
  private speakerObject: Phaser.GameObjects.Text | null = null;
  private displayTimeMs = 0;
  private autoAdvanceMs = 3000; // Auto-advance after 3 seconds

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Display a dialogue line
   */
  public display(line: DialogueLine): void {
    // Clean up existing dialogue
    this.hide();

    const worldCenterX = this.scene.cameras.main.width / 2;
    const worldCenterY = 80; // Top of screen

    // Create container
    this.container = this.scene.add.container(worldCenterX, worldCenterY);
    this.container.setDepth(1000); // Ensure it's on top

    // Semi-transparent background
    const background = this.scene.add.rectangle(0, 0, 400, 100, 0x000000, 0.7);
    this.container.add(background);

    // Speaker name
    const speakerText = line.speaker === 'boss' ? 'OMEGA' : 'BART';
    const speakerColor = line.speaker === 'boss' ? '#FF4444' : '#44DDFF';

    this.speakerObject = this.scene.add.text(0, -35, speakerText, {
      font: 'bold 14px monospace',
      color: speakerColor,
    });
    this.speakerObject.setOrigin(0.5, 0.5);
    this.container.add(this.speakerObject);

    // Dialogue text (word wrapped)
    this.textObject = this.scene.add.text(0, 10, line.text, {
      font: '12px monospace',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 360, useAdvancedWrap: true },
    });
    this.textObject.setOrigin(0.5, 0.5);
    this.container.add(this.textObject);

    this.displayTimeMs = 0;
  }

  /**
   * Update dialogue (for auto-advance timing)
   */
  public update(deltaMs: number): void {
    if (!this.container) {
      return;
    }
    this.displayTimeMs += deltaMs;

    // Auto-advance after duration
    if (this.displayTimeMs >= this.autoAdvanceMs) {
      this.hide();
    }
  }

  /**
   * Hide current dialogue
   */
  public hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
      this.textObject = null;
      this.speakerObject = null;
    }
    this.displayTimeMs = 0;
  }

  /**
   * Check if dialogue is currently displayed
   */
  public isVisible(): boolean {
    return this.container !== null && this.container.active;
  }

  /**
   * Set auto-advance duration (0 = manual advance only)
   */
  public setAutoAdvanceMs(ms: number): void {
    this.autoAdvanceMs = ms;
  }

  /**
   * Manually advance to next dialogue line
   */
  public skipToNext(): void {
    this.displayTimeMs = this.autoAdvanceMs;
  }

  /**
   * Destroy dialogue system
   */
  public destroy(): void {
    this.hide();
  }
}
