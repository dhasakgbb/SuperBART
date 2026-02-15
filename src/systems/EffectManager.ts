import Phaser from "phaser";
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
  private stompBurstEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private impactEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private blockHitEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(config: EffectManagerConfig) {
    this.scene = config.scene;
    this.dustEmitter = createDustPuff(this.scene);
    this.sparkleEmitter = createSparkleEffect(this.scene);

    // Stomp burst: radial star-burst when stomping an enemy (NES-style pop)
    this.stompBurstEmitter = this.scene.add.particles(0, 0, 'particle_dot', {
      lifespan: { min: 180, max: 350 },
      speed: { min: 80, max: 200 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      angle: { min: 180, max: 360 }, // Upward hemisphere
      gravityY: 200,
      quantity: 0,
      emitting: false,
      blendMode: 'ADD',
    });
    this.stompBurstEmitter.setDepth(1002);

    // Landing impact: ground-level spray that fans outward
    this.impactEmitter = this.scene.add.particles(0, 0, 'dust_puff', {
      lifespan: { min: 150, max: 280 },
      speed: { min: 30, max: 80 },
      scale: { start: 1.0, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      angle: { min: 160, max: 200 }, // Horizontal fan at ground level
      gravityY: 60,
      quantity: 0,
      emitting: false,
    });
    this.impactEmitter.setDepth(998);

    // Running dust trail: small puffs kicked up behind the player
    this.trailEmitter = this.scene.add.particles(0, 0, 'dust_puff', {
      lifespan: { min: 120, max: 200 },
      speed: { min: 10, max: 25 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.4, end: 0 },
      angle: { min: 240, max: 300 }, // Upward behind player
      gravityY: 30,
      quantity: 0,
      emitting: false,
    });
    this.trailEmitter.setDepth(997);

    // Block hit: debris chunks flying up from question block hits
    this.blockHitEmitter = this.scene.add.particles(0, 0, 'particle_dot', {
      lifespan: { min: 300, max: 500 },
      speed: { min: 60, max: 140 },
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 1, end: 0 },
      angle: { min: 220, max: 320 }, // Upward fan
      gravityY: 250,
      quantity: 0,
      emitting: false,
    });
    this.blockHitEmitter.setDepth(1000);
  }

  /** Screen shake with proper intensity curves. */
  public shake(intensity: ShakeIntensity = "medium"): void {
    const cameras = this.scene.cameras.main;
    if (!cameras) return;

    switch (intensity) {
      case "light":
        cameras.shake(80, 0.0015);
        break;
      case "medium":
        cameras.shake(120, 0.004);
        break;
      case "heavy":
        cameras.shake(200, 0.008);
        break;
    }
  }

  /** Directional shake - shakes more on one axis. */
  public shakeDirectional(durationMs: number, intensityX: number, intensityY: number): void {
    const cam = this.scene.cameras.main;
    if (!cam) return;
    cam.shake(durationMs, new Phaser.Math.Vector2(intensityX, intensityY));
  }

  /** Emits dust particles at the given location. */
  public emitDust(x: number, y: number, count?: number): void {
    this.dustEmitter.emitAt(x, y, count);
  }

  public emitSparkle(x: number, y: number, color: number, count?: number): void {
    this.sparkleEmitter.emitAt(x, y, color, count);
  }

  /** Radial stomp burst - fires when stomping an enemy. Big, satisfying pop. */
  public emitStompBurst(x: number, y: number, color = 0xffffff): void {
    this.stompBurstEmitter.setParticleTint(color);
    this.stompBurstEmitter.emitParticle(12, x, y);
  }

  /** Landing impact - ground spray when landing from a height. */
  public emitLandingImpact(x: number, y: number, intensity = 1): void {
    const count = Math.max(2, Math.round(4 * intensity));
    this.impactEmitter.emitParticle(count, x, y);
  }

  /** Running dust trail - small puffs while running on ground. */
  public emitRunTrail(x: number, y: number): void {
    this.trailEmitter.emitParticle(1, x, y);
  }

  /** Block hit debris - chunks fly when hitting a question block from below. */
  public emitBlockHit(x: number, y: number, color = 0xffd700): void {
    this.blockHitEmitter.setParticleTint(color);
    this.blockHitEmitter.emitParticle(6, x, y);
  }

  /** Triggers a hit-stop (brief pause in physics). */
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

  /** Triggers a visual flash on the main camera. */
  public flash(durationMs = 100, color = 0xffffff): void {
    this.scene.cameras.main.flash(
      durationMs,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
    );
  }

  /** Brief white flash + shake combo for big moments (goal, boss hit, etc). */
  public bigMoment(): void {
    this.flash(80, 0xffffff);
    this.shake("heavy");
  }
}
