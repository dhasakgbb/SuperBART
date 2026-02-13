import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave } from '../systems/save';
import { SCENE_TEXT } from '../content/contentManifest';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    runtimeStore.mode = 'game_over';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    audio.playSfx('game_over');
    this.add.text(180, 170, SCENE_TEXT.gameOver.heading, { fontSize: '42px', color: '#ff5252', fontFamily: 'monospace' });
    this.add.text(250, 290, SCENE_TEXT.gameOver.hint, { fontSize: '24px', color: '#ffffff' });

    this.input.keyboard?.once('keydown-R', () => {
      audio.playSfx('menu_confirm');
      runtimeStore.save = defaultSave();
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      this.scene.start('TitleScene');
    });
  }
}
