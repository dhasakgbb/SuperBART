import Phaser from "phaser";
import styleConfig from "../style/styleConfig";
import { createDustPuff, DustPuffEmitter } from "../player/dustPuff";
import { createSparkleEffect, SparkleEmitter } from "./SparkleEffect";

export type ShakeIntensity = "light" | "medium" | "heavy";

export interface EffectManagerConfig {
  scene: Phaser.Scene;
}

export class EffectManager {
  private scene: Phaser.Scene;
  private dustEmitter: DustPuffEmitter;
  private sparkleEmitter: SparkleEmitter;

  constructor(config: EffectManagerConfig) {
    this.scene = config.scene;
    this.dustEmitter = createDustPuff(this.scene);
    this.sparkleEmitter = createSparkleEffect(this.scene);
  }

  /**
   * Triggers a screen shake on the main camera.
   */
  public shake(intensity: ShakeIntensity = "medium"): void {
    const cameras = this.scene.cameras.main;
    if (!cameras) return;

    switch (intensity) {
      case "light":
        cameras.shake(100, 0.001);
        break;
      case "medium":
        cameras.shake(150, 0.003);
        break;
      case "heavy":
        cameras.shake(250, 0.006);
        break;
    }
  }

  /**
   * Emits dust particles at the given location.
   */
  public emitDust(x: number, y: number, count?: number): void {
    this.dustEmitter.emitAt(x, y, count);
  }

  public emitSparkle(x: number, y: number, color: number, count?: number): void {
    this.sparkleEmitter.emitAt(x, y, color, count);
  }

  /**
   * Triggers a hit-stop (brief pause in physics).
   */
  public hitStop(durationMs: number): void {
    if (!this.scene.physics?.world || this.scene.physics.world.isPaused) {
      return;
    }

    this.scene.physics.world.pause();
    this.scene.time.delayedCall(durationMs, () => {
      if (this.scene.physics?.world?.isPaused) {
        this.scene.physics.world.resume();
      }
    });
  }

  /**
   * Triggers a visual flash on the main camera.
   */
  public flash(durationMs = 100, color = 0xffffff): void {
    this.scene.cameras.main.flash(
      durationMs,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
    );
  }
}
