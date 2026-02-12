import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave } from '../systems/save';

export class FinalVictoryScene extends Phaser.Scene {
  constructor() {
    super('FinalVictoryScene');
  }

  create(): void {
    runtimeStore.mode = 'victory';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    const p = runtimeStore.save.progression;
    const timeSec = Math.floor(p.timeMs / 1000);

    this.add.text(210, 96, 'CASTLE CLEARED!', { fontSize: '56px', color: '#ffe082', fontFamily: 'monospace' });
    this.add.text(
      216,
      200,
      `Score: ${p.score}\nCoins: ${p.coins}\nStars: ${p.stars}\nDeaths: ${p.deaths}\nTime: ${timeSec}s`,
      { fontSize: '24px', color: '#f2fdfd', fontFamily: 'monospace' }
    );
    this.add.text(186, 392, 'ENTER: LEVEL SELECT   R: RESET CAMPAIGN   ESC: TITLE', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace'
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      audio.playSfx('menu_confirm');
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });
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
