import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave } from '../systems/save';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    runtimeStore.mode = 'game_over';
    this.add.text(300, 170, 'GAME OVER', { fontSize: '58px', color: '#ff5252', fontFamily: 'monospace' });
    this.add.text(250, 290, 'R: Restart Campaign\nEsc: Title', { fontSize: '24px', color: '#ffffff' });

    this.input.keyboard?.once('keydown-R', () => {
      runtimeStore.save = defaultSave();
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
