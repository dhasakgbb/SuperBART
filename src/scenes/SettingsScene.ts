import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { persistSave } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

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
    const typography = styleConfig.typography;
    audio.configureFromSettings(runtimeStore.save.settings);

    const redraw = () => {
      this.children.removeAll();
      const addLine = (x: number, y: number, text: string, size = 24, color: 'primary' | 'accent' = 'accent'): void => {
        const textObj = this.add.bitmapText(x, y, typography.fontKey, text.toUpperCase(), size).setLetterSpacing(
          typography.letterSpacingPx,
        );
        if (color === 'primary') {
          textObj.setTint(palette('hudText'));
        } else {
          textObj.setTint(palette('hudAccent'));
        }
      };

      addLine(240, 90, SCENE_TEXT.settings.heading, 46, 'primary');
      addLine(
        120,
        188,
        `${SCENE_TEXT.settings.masterLabel} ${(runtimeStore.save.settings.masterVolume * 100).toFixed(0)}%`,
      );
      addLine(
        120,
        228,
        `${SCENE_TEXT.settings.musicLabel} ${(runtimeStore.save.settings.musicVolume * 100).toFixed(0)}%`,
      );
      addLine(
        120,
        268,
        `${SCENE_TEXT.settings.sfxLabel} ${(runtimeStore.save.settings.sfxVolume * 100).toFixed(0)}%`,
      );
      addLine(
        120,
        308,
        `${SCENE_TEXT.settings.musicMuteLabel} ${runtimeStore.save.settings.musicMuted ? 'ON' : 'OFF'}`,
      );
      addLine(
        120,
        348,
        `${SCENE_TEXT.settings.sfxMuteLabel} ${runtimeStore.save.settings.sfxMuted ? 'ON' : 'OFF'}`,
      );
      addLine(
        120,
        388,
        `${SCENE_TEXT.settings.shakeLabel} ${runtimeStore.save.settings.screenShakeEnabled ? 'ON' : 'OFF'}`,
      );
      addLine(
        180,
        410,
        SCENE_TEXT.settings.backHintTemplate.replace('{scene}', this.backScene),
        20,
        'primary',
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
      transitionToScene(this, this.backScene);
    });
  }
}
