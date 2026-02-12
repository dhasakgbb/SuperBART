import Phaser from 'phaser';
import { loadSave, persistSave } from '../systems/save';
import { runtimeStore } from '../core/runtime';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    runtimeStore.mode = 'title';
    runtimeStore.save = loadSave();

    this.add.text(250, 120, 'SUPER BART', { fontSize: '56px', color: '#ffd54f', fontFamily: 'monospace' });
    this.add.text(260, 220, 'Enter: Start/Continue\nN: New Game\nS: Settings', {
      fontSize: '22px',
      color: '#ffffff',
      align: 'center'
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('WorldMapScene');
    });

    this.input.keyboard?.on('keydown-N', () => {
      runtimeStore.save = {
        ...runtimeStore.save,
        campaign: { ...runtimeStore.save.campaign, world: 1, levelIndex: 1 },
        progression: { score: 0, coins: 0, stars: 0, deaths: 0, timeMs: 0 }
      };
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });

    this.input.keyboard?.on('keydown-S', () => this.scene.start('SettingsScene'));
  }
}
