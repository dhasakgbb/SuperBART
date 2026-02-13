import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { persistSave } from '../systems/save';
import { SCENE_TEXT } from '../content/contentManifest';

export class SettingsScene extends Phaser.Scene {
  private backScene = 'TitleScene';

  constructor() {
    super('SettingsScene');
  }

  init(data: { backScene?: string }): void {
    this.backScene = data?.backScene ?? 'TitleScene';
  }

  create(): void {
    runtimeStore.mode = 'settings';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);

    const redraw = () => {
      this.children.removeAll();
      this.add.text(240, 90, SCENE_TEXT.settings.heading, { fontSize: '46px', color: '#ffffff', fontFamily: 'monospace' });
      this.add.text(
        120,
        188,
        `${SCENE_TEXT.settings.masterLabel} ${(runtimeStore.save.settings.masterVolume * 100).toFixed(0)}%`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        120,
        228,
        `${SCENE_TEXT.settings.musicLabel} ${(runtimeStore.save.settings.musicVolume * 100).toFixed(0)}%`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        120,
        268,
        `${SCENE_TEXT.settings.sfxLabel} ${(runtimeStore.save.settings.sfxVolume * 100).toFixed(0)}%`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        120,
        308,
        `${SCENE_TEXT.settings.musicMuteLabel} ${runtimeStore.save.settings.musicMuted ? 'ON' : 'OFF'}`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        120,
        348,
        `${SCENE_TEXT.settings.sfxMuteLabel} ${runtimeStore.save.settings.sfxMuted ? 'ON' : 'OFF'}`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        120,
        388,
        `${SCENE_TEXT.settings.shakeLabel} ${runtimeStore.save.settings.screenShakeEnabled ? 'ON' : 'OFF'}`,
        { fontSize: '24px', color: '#ffe082' }
      );
      this.add.text(
        180,
        410,
        SCENE_TEXT.settings.backHintTemplate.replace('{scene}', this.backScene),
        { fontSize: '20px', color: '#ffffff' }
      );
    };

    const persistAndApply = (menuSound: boolean): void => {
      persistSave(runtimeStore.save);
      audio.configureFromSettings(runtimeStore.save.settings);
      if (menuSound) {
        audio.playSfx('menu_move');
      }
      redraw();
    };

    redraw();

    this.input.keyboard?.on('keydown-Q', () => {
      runtimeStore.save.settings.masterVolume = Math.max(0, runtimeStore.save.settings.masterVolume - 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-E', () => {
      runtimeStore.save.settings.masterVolume = Math.min(1, runtimeStore.save.settings.masterVolume + 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-A', () => {
      runtimeStore.save.settings.musicVolume = Math.max(0, runtimeStore.save.settings.musicVolume - 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-D', () => {
      runtimeStore.save.settings.musicVolume = Math.min(1, runtimeStore.save.settings.musicVolume + 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-Z', () => {
      runtimeStore.save.settings.sfxVolume = Math.max(0, runtimeStore.save.settings.sfxVolume - 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-C', () => {
      runtimeStore.save.settings.sfxVolume = Math.min(1, runtimeStore.save.settings.sfxVolume + 0.1);
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-M', () => {
      runtimeStore.save.settings.musicMuted = !runtimeStore.save.settings.musicMuted;
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-X', () => {
      runtimeStore.save.settings.sfxMuted = !runtimeStore.save.settings.sfxMuted;
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-H', () => {
      runtimeStore.save.settings.screenShakeEnabled = !runtimeStore.save.settings.screenShakeEnabled;
      persistAndApply(true);
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      this.scene.start(this.backScene);
    });
  }
}
