import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

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
    const typography = styleConfig.typography;
    this.add
      .bitmapText(180, 170, typography.fontKey, SCENE_TEXT.gameOver.heading.toUpperCase(), 42)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(typography.letterSpacingPx);
    this.add
      .bitmapText(250, 290, typography.fontKey, SCENE_TEXT.gameOver.hint.toUpperCase(), 24)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);

    this.input.keyboard?.once('keydown-R', () => {
      audio.playSfx('menu_confirm');
      runtimeStore.save = defaultSave();
      persistSave(runtimeStore.save);
      transitionToScene(this, 'WorldMapScene');
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'TitleScene');
    });
  }
}
