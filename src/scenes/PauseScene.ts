import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    runtimeStore.mode = 'paused';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.65).setOrigin(0, 0);
    this.add.text(350, 170, 'PAUSED', { fontSize: '58px', color: '#ffe082', fontFamily: 'monospace' });
    this.add.text(230, 290, 'ESC / P: Resume\nL: Level Select\nT: Title', {
      fontSize: '30px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center'
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      this.resumePlay();
    });
    this.input.keyboard?.once('keydown-P', () => {
      audio.playSfx('menu_confirm');
      this.resumePlay();
    });
    this.input.keyboard?.once('keydown-L', () => {
      audio.playSfx('menu_confirm');
      this.scene.stop('PlayScene');
      this.scene.stop();
      this.scene.start('WorldMapScene');
    });
    this.input.keyboard?.once('keydown-T', () => {
      audio.playSfx('menu_confirm');
      this.scene.stop('PlayScene');
      this.scene.stop();
      this.scene.start('TitleScene');
    });
  }

  private resumePlay(): void {
    runtimeStore.mode = 'playing';
    this.scene.stop();
    this.scene.resume('PlayScene');
  }
}
