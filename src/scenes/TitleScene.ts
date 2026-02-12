import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { loadSave, persistSave } from '../systems/save';
import { runtimeStore } from '../core/runtime';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    runtimeStore.mode = 'title';
    runtimeStore.save = loadSave();
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();

    this.add.text(242, 98, 'SUPER BART', { fontSize: '56px', color: '#ffd54f', fontFamily: 'monospace' });
    this.add.text(184, 192, '4 WORLDS x 6 LEVELS + FINAL CASTLE', {
      fontSize: '20px',
      color: '#f2fdfd',
      fontFamily: 'monospace'
    });

    this.add.text(244, 242, 'Enter: Level Select\nN: New Game\nS: Settings', {
      fontSize: '22px',
      color: '#ffffff',
      align: 'center'
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      this.scene.start('WorldMapScene');
    });

    this.input.keyboard?.on('keydown-N', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      const fresh = loadSave();
      runtimeStore.save = {
        ...fresh,
        progression: { score: 0, coins: 0, stars: 0, deaths: 0, timeMs: 0 },
        campaign: {
          ...fresh.campaign,
          world: 1,
          levelIndex: 1,
          unlockedLevelKeys: ['1-1'],
          completedLevelKeys: []
        }
      };
      persistSave(runtimeStore.save);
      this.scene.start('WorldMapScene');
    });

    this.input.keyboard?.on('keydown-S', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_move');
      this.scene.start('SettingsScene', { backScene: 'TitleScene' });
    });
  }
}
