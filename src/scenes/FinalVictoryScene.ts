import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave } from '../systems/save';
import { SCENE_TEXT } from '../content/contentManifest';

export class FinalVictoryScene extends Phaser.Scene {
  constructor() {
    super('FinalVictoryScene');
  }

  create(): void {
    runtimeStore.mode = 'victory';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    audio.playSfx('goal_clear');
    const p = runtimeStore.save.progression;
    const timeSec = Math.floor(p.timeMs / 1000);

    this.add.text(210, 72, SCENE_TEXT.finalVictory.heading, { fontSize: '56px', color: '#ffe082', fontFamily: 'monospace' });
    this.add.text(216, 140, SCENE_TEXT.finalVictory.subheading, {
      fontSize: '16px', color: '#9be564', fontFamily: 'monospace'
    });
    const victoryStatsText = SCENE_TEXT.finalVictory.statsTemplate
      .replace('{time}', String(timeSec))
      .replace('{coins}', String(p.coins))
      .replace('{evals}', String(p.stars))
      .replace('{deaths}', String(p.deaths));

    this.add.text(216, 200, victoryStatsText, { fontSize: '24px', color: '#f2fdfd', fontFamily: 'monospace' });
    this.add.text(156, 392, SCENE_TEXT.finalVictory.hint, {
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
