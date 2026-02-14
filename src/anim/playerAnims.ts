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

    // We only have 4 run frames (1,2,3,4) in the new sheet.
    // Use them for both walk and run for now, maybe different speed.
    scene.anims.create({
      key: `${prefix}walk`,
      frames: scene.anims.generateFrameNumbers(key, { start: 1, end: 4 }),
      frameRate: config.walkFps,
      repeat: -1,
    });

    scene.anims.create({
      key: `${prefix}run`,
      frames: scene.anims.generateFrameNumbers(key, { start: 1, end: 4 }),
      frameRate: config.runFps,
      repeat: -1,
    });

    const singleFrames: Array<[string, number]> = [
      ['skid', 7],
      ['jump', 5],
      ['fall', 6],
      ['land', 0], // Revert to idle
      ['hurt', 6], // Use fall frame for hurt for now
      ['win', 5],  // Use jump frame for win
      ['dead', 6], // Use fall frame for dead
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
