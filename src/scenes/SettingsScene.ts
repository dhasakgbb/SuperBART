import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { persistSave } from '../systems/save';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create(): void {
    runtimeStore.mode = 'settings';

    const redraw = () => {
      this.children.removeAll();
      this.add.text(240, 90, 'SETTINGS', { fontSize: '46px', color: '#ffffff', fontFamily: 'monospace' });
      this.add.text(180, 200, `Volume [Q/E]: ${(runtimeStore.save.settings.masterVolume * 100).toFixed(0)}%`, { fontSize: '24px', color: '#ffe082' });
      this.add.text(180, 245, `Music [M]: ${runtimeStore.save.settings.musicEnabled ? 'ON' : 'OFF'}`, { fontSize: '24px', color: '#ffe082' });
      this.add.text(180, 290, `SFX [X]: ${runtimeStore.save.settings.sfxEnabled ? 'ON' : 'OFF'}`, { fontSize: '24px', color: '#ffe082' });
      this.add.text(180, 335, `Screen Shake [H]: ${runtimeStore.save.settings.screenShakeEnabled ? 'ON' : 'OFF'}`, { fontSize: '24px', color: '#ffe082' });
      this.add.text(180, 410, 'Esc: Back', { fontSize: '20px', color: '#ffffff' });
    };

    redraw();

    this.input.keyboard?.on('keydown-Q', () => {
      runtimeStore.save.settings.masterVolume = Math.max(0, runtimeStore.save.settings.masterVolume - 0.1);
      persistSave(runtimeStore.save);
      redraw();
    });
    this.input.keyboard?.on('keydown-E', () => {
      runtimeStore.save.settings.masterVolume = Math.min(1, runtimeStore.save.settings.masterVolume + 0.1);
      persistSave(runtimeStore.save);
      redraw();
    });
    this.input.keyboard?.on('keydown-M', () => {
      runtimeStore.save.settings.musicEnabled = !runtimeStore.save.settings.musicEnabled;
      persistSave(runtimeStore.save);
      redraw();
    });
    this.input.keyboard?.on('keydown-X', () => {
      runtimeStore.save.settings.sfxEnabled = !runtimeStore.save.settings.sfxEnabled;
      persistSave(runtimeStore.save);
      redraw();
    });
    this.input.keyboard?.on('keydown-H', () => {
      runtimeStore.save.settings.screenShakeEnabled = !runtimeStore.save.settings.screenShakeEnabled;
      persistSave(runtimeStore.save);
      redraw();
    });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
