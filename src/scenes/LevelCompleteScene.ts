import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { advanceCampaign, persistSave } from '../systems/save';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  create(data: { stats: { timeSec: number; coins: number; stars: number; deaths: number } }): void {
    runtimeStore.mode = 'level_complete';
    const stats = data.stats;

    this.add.text(250, 120, 'LEVEL CLEAR!', { fontSize: '52px', color: '#9be564', fontFamily: 'monospace' });
    this.add.text(220, 220, `Time: ${stats.timeSec}s\nCoins: ${stats.coins}\nStars: ${stats.stars}\nDeaths: ${stats.deaths}`, {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.add.text(240, 360, 'Enter: Next Level   Esc: World Map', { fontSize: '20px', color: '#ffe082' });

    this.input.keyboard?.once('keydown-ENTER', () => {
      runtimeStore.save = advanceCampaign(runtimeStore.save);
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });
  }
}
