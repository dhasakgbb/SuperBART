import Phaser from 'phaser';
import styleConfig from '../style/styleConfig';

export interface DustPuffEmitter {
  emitAt(x: number, y: number): void;
}

export function createDustPuff(scene: Phaser.Scene): DustPuffEmitter {
  const config = styleConfig.playerAnimation;
  const emitter = scene.add.particles(0, 0, 'dust_puff', {
    lifespan: config.dustPuffLifeMs,
    speed: { min: 15, max: 35 },
    scale: { start: config.dustPuffScale, end: 0 },
    alpha: { start: config.dustPuffAlpha, end: 0 },
    angle: { min: 200, max: 340 },
    quantity: 0,
    emitting: false,
  });
  emitter.setDepth(999);

  return {
    emitAt(x: number, y: number): void {
      emitter.emitParticle(config.dustPuffCount, x, y);
    },
  };
}
