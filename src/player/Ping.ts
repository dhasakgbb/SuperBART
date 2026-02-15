import Phaser from 'phaser';

export interface PingState {
  active: boolean;        // Whether Ping is present (false before W4-1 midpoint)
  absorbed: boolean;      // True during Omega Phase 2+
  recovered: boolean;     // True after Omega Phase 4
  brightness: number;     // 0.0 to 1.0, increases near files
  flickerRed: boolean;    // True when ghost processes nearby
}

export class PingCompanion {
  private sprite: Phaser.GameObjects.Rectangle | null = null;
  private eyeSprite: Phaser.GameObjects.Rectangle | null = null;
  private glowLight: Phaser.GameObjects.Rectangle | null = null;
  private scene: Phaser.Scene;
  private state: PingState;
  private targetX = 0;
  private targetY = 0;
  private followLag = 0.08; // lerp factor - trails behind Bart
  private bobPhase = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      active: false,
      absorbed: false,
      recovered: false,
      brightness: 0.5,
      flickerRed: false,
    };
  }

  activate(x: number, y: number): void {
    if (this.sprite) return;
    this.state.active = true;

    // Green cube body (12x12 pixels)
    this.sprite = this.scene.add.rectangle(x, y, 12, 12, 0x44FF44);
    this.sprite.setDepth(15); // Above most entities, below HUD

    // Single LED eye (3x3)
    this.eyeSprite = this.scene.add.rectangle(x + 2, y - 1, 3, 3, 0xFFFFFF);
    this.eyeSprite.setDepth(16);

    // Green glow circle (supplementary light)
    this.glowLight = this.scene.add.rectangle(x, y, 48, 48, 0x44FF44);
    this.glowLight.setAlpha(0.08);
    this.glowLight.setDepth(5);

    this.targetX = x;
    this.targetY = y;
  }

  deactivate(): void {
    this.state.active = false;
    this.sprite?.destroy();
    this.eyeSprite?.destroy();
    this.glowLight?.destroy();
    this.sprite = null;
    this.eyeSprite = null;
    this.glowLight = null;
  }

  absorb(): void {
    this.state.absorbed = true;
    // Ping gets pulled into red mass - shrink and fade to red
    if (this.sprite) {
      this.scene.tweens.add({
        targets: [this.sprite, this.eyeSprite, this.glowLight],
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 800,
        onComplete: () => this.deactivate(),
      });
    }
  }

  recover(x: number, y: number): void {
    this.state.recovered = true;
    this.state.absorbed = false;
    this.activate(x, y);
  }

  update(playerX: number, playerY: number, deltaMs: number): void {
    if (!this.state.active || !this.sprite || this.state.absorbed) return;

    // Follow Bart with lag (trail behind, offset to right and slightly up)
    this.targetX = playerX + 20;
    this.targetY = playerY - 16;

    const currentX = this.sprite.x;
    const currentY = this.sprite.y;

    this.sprite.x += (this.targetX - currentX) * this.followLag;
    this.sprite.y += (this.targetY - currentY) * this.followLag;

    // Bob animation
    this.bobPhase += deltaMs * 0.003;
    const bobOffset = Math.sin(this.bobPhase) * 3;
    this.sprite.y += bobOffset;

    // Update eye and glow positions
    if (this.eyeSprite) {
      this.eyeSprite.x = this.sprite.x + 2;
      this.eyeSprite.y = this.sprite.y - 1 + bobOffset;
    }
    if (this.glowLight) {
      this.glowLight.x = this.sprite.x;
      this.glowLight.y = this.sprite.y;
      this.glowLight.setAlpha(0.06 + this.state.brightness * 0.06);
    }

    // Color based on state
    if (this.state.flickerRed) {
      this.sprite.setFillStyle(0xFF4444);
      // Reset after 500ms
      this.scene.time.delayedCall(500, () => {
        if (this.sprite && !this.state.flickerRed) {
          this.sprite.setFillStyle(0x44FF44);
        }
      });
    } else {
      const green = Math.floor(0xFF * (0.5 + this.state.brightness * 0.5));
      this.sprite.setFillStyle((0x44 << 16) | (green << 8) | 0x44);
    }
  }

  setBrightness(value: number): void {
    this.state.brightness = Math.max(0, Math.min(1, value));
  }

  setFlickerRed(flicker: boolean): void {
    this.state.flickerRed = flicker;
  }

  isActive(): boolean {
    return this.state.active && !this.state.absorbed;
  }

  getPosition(): { x: number; y: number } | null {
    if (!this.sprite) return null;
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getState(): PingState {
    return { ...this.state };
  }

  destroy(): void {
    this.deactivate();
  }
}
