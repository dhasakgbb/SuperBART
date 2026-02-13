import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { completeCurrentLevel, persistSave } from '../systems/save';
import { SCENE_TEXT } from '../content/contentManifest';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create(data: { stats: { timeSec: number; coins: number; stars: number; deaths: number } }): void {
    runtimeStore.mode = 'level_complete';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    const stats = data.stats;
    const statsText = SCENE_TEXT.levelComplete.statsTemplate
      .replace('{time}', String(stats.timeSec))
      .replace('{coins}', String(stats.coins))
      .replace('{evals}', String(stats.stars))
      .replace('{deaths}', String(stats.deaths));

    this.add.text(170, 120, SCENE_TEXT.levelComplete.heading, { fontSize: '52px', color: '#9be564', fontFamily: 'monospace' });
    this.add.text(220, 220, statsText, { fontSize: '24px', color: '#ffffff' });
    this.add.text(200, 360, SCENE_TEXT.levelComplete.hint, { fontSize: '20px', color: '#ffe082' });

    this.input.keyboard?.once('keydown-ENTER', () => {
      audio.playSfx('menu_confirm');
      const result = completeCurrentLevel(runtimeStore.save);
      runtimeStore.save = result.save;
      persistSave(runtimeStore.save);
      this.scene.start(result.finishedCampaign ? 'FinalVictoryScene' : 'WorldMapScene');
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });
  }
}
