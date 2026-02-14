import Phaser from 'phaser';
import styleConfig from '../style/styleConfig';

/**
 * Register all player body animations for both small and big forms.
 * Call once in PlayScene.create() before using PlayerAnimator.
 */
export function createPlayerAnimations(scene: Phaser.Scene): void {
  const config = styleConfig.playerAnimation;

  const forms: Array<['small' | 'big', boolean]> = [
    ['small', false],
    ['big', false],
    ['small', true],
    ['big', true],
  ];

  for (const [form, isFire] of forms) {
    const suffix = isFire ? '_fire' : '';
    const key = `bart_body_${form}${suffix}`;
    const prefix = `bart_${form[0]}${suffix}_`;

    scene.anims.create({
      key: `${prefix}idle`,
      frames: [{ key, frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: `${prefix}walk`,
      frames: scene.anims.generateFrameNumbers(key, { start: 1, end: 3 }),
      frameRate: config.walkFps,
      repeat: -1,
    });

    scene.anims.create({
      key: `${prefix}run`,
      frames: scene.anims.generateFrameNumbers(key, { start: 4, end: 6 }),
      frameRate: config.runFps,
      repeat: -1,
    });

    const singleFrames: Array<[string, number]> = [
      ['skid', 7],
      ['jump', 8],
      ['fall', 9],
      ['land', 10],
      ['hurt', 11],
      ['win', 12],
      ['dead', 13],
    ];

    for (const [name, frame] of singleFrames) {
      scene.anims.create({
        key: `${prefix}${name}`,
        frames: [{ key, frame }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }
}
