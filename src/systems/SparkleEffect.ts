import Phaser from 'phaser';

export interface SparkleEmitter {
  emitAt(x: number, y: number, color: number, count?: number): void;
}

export function createSparkleEffect(scene: Phaser.Scene): SparkleEmitter {
  const emitter = scene.add.particles(0, 0, 'particle_dot', {
    lifespan: { min: 300, max: 600 },
    speed: { min: 40, max: 100 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    gravityY: 100,
    quantity: 0,
    emitting: false,
    blendMode: 'ADD'
  });
  emitter.setDepth(1001); // Above most things

  return {
    emitAt(x: number, y: number, color: number, count = 8): void {
      emitter.setParticleTint(color);
      emitter.emitParticle(count, x, y);
    }
  };
}
