import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { defaultSave, persistSave, setBartsRulesUnlocked } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

export class FinalVictoryScene extends Phaser.Scene {
  constructor() {
    super('FinalVictoryScene');
  }

  create(): void {
    runtimeStore.mode = 'victory';
    // Unlock Bart's Rules (NG+) on campaign completion
    runtimeStore.save = setBartsRulesUnlocked(runtimeStore.save);
    persistSave(runtimeStore.save);
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    audio.playSfx('goal_clear');
    const typography = styleConfig.typography;
    const p = runtimeStore.save.progression;
    const timeSec = Math.floor(p.timeMs / 1000);

    this.add
      .bitmapText(210, 72, typography.fontKey, SCENE_TEXT.finalVictory.heading.toUpperCase(), 56)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);
    this.add
      .bitmapText(216, 140, typography.fontKey, SCENE_TEXT.finalVictory.subheading.toUpperCase(), 16)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(typography.letterSpacingPx);
    const victoryStatsText = SCENE_TEXT.finalVictory.statsTemplate
      .replace('{time}', String(timeSec))
      .replace('{coins}', String(p.coins))
      .replace('{evals}', String(p.stars))
      .replace('{deaths}', String(p.deaths));

    this.add
      .bitmapText(216, 200, typography.fontKey, victoryStatsText.toUpperCase(), 24)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);
    this.add
      .bitmapText(156, 392, typography.fontKey, SCENE_TEXT.finalVictory.hint.toUpperCase(), 20)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);

    this.input.keyboard?.once('keydown-ENTER', () => {
      audio.playSfx('menu_confirm');
      persistSave(runtimeStore.save);
      transitionToScene(this, 'WorldMapScene');
    });
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
