import * as Phaser from 'phaser';

/**
 * Darkness overlay with headlamp cone for World 4 (Deep Web Catacombs).
 * Screen is mostly dark. Player has a headlamp illuminating a cone ahead.
 * Ping adds supplementary green light (smaller radius).
 */

export class DarknessOverlay {
  private overlay: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private enabled = false;
  private headlampRadius = 120;
  private pingRadius = 60;
  private flickerTimer = 0;
  private flickerCycle = 8000; // 8s cycle
  private flickerDim = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.overlay = scene.add.graphics();
    this.overlay.setDepth(50); // Above most game objects, below HUD
    this.overlay.setScrollFactor(0); // Fixed to camera
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.overlay.clear();
  }

  update(
    playerScreenX: number,
    playerScreenY: number,
    pingScreenX?: number,
    pingScreenY?: number,
    deltaMs?: number,
    enableFlicker = false
  ): void {
    if (!this.enabled) return;

    this.overlay.clear();

    // Update flicker timer
    if (enableFlicker && deltaMs) {
      this.flickerTimer += deltaMs;
      if (this.flickerTimer > this.flickerCycle) {
        this.flickerTimer = 0;
      }
      // Dim for 1 second every 8 seconds
      this.flickerDim = this.flickerTimer > this.flickerCycle - 1000;
    }

    const currentRadius = this.flickerDim
      ? this.headlampRadius * 0.3
      : this.headlampRadius;

    // Draw dark overlay with circular cutouts
    // Fill entire screen with semi-transparent darkness
    const cam = this.scene.cameras.main;
    this.overlay.fillStyle(0x000000, 0.85);
    this.overlay.fillRect(0, 0, cam.width, cam.height);

    // Cut out headlamp area using radial gradient approach
    // Draw concentric circles to simulate a falloff
    for (let i = 5; i >= 0; i--) {
      const r = currentRadius * (i / 5);
      const alpha = 0.85 * (i / 5);
      this.overlay.fillStyle(0x000000, alpha);
      this.overlay.fillCircle(playerScreenX, playerScreenY, r);
    }

    // Ping light (green tinted, smaller radius)
    if (pingScreenX !== undefined && pingScreenY !== undefined) {
      for (let i = 3; i >= 0; i--) {
        const r = this.pingRadius * (i / 3);
        const alpha = 0.85 * (i / 3);
        this.overlay.fillStyle(0x000000, alpha);
        this.overlay.fillCircle(pingScreenX, pingScreenY, r);
      }
    }
  }

  destroy(): void {
    this.overlay.destroy();
  }

  /**
   * Reset the flicker timer (e.g., when level starts or on player death).
   */
  resetFlicker(): void {
    this.flickerTimer = 0;
    this.flickerDim = false;
  }
}
