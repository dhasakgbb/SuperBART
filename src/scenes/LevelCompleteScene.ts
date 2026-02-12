import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { completeCurrentLevel, persistSave } from '../systems/save';

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

    this.add.text(250, 120, 'LEVEL CLEAR!', { fontSize: '52px', color: '#9be564', fontFamily: 'monospace' });
    this.add.text(220, 220, `Time: ${stats.timeSec}s\nCoins: ${stats.coins}\nStars: ${stats.stars}\nDeaths: ${stats.deaths}`, {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.add.text(240, 360, 'Enter: Next Level   Esc: World Map', { fontSize: '20px', color: '#ffe082' });

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
