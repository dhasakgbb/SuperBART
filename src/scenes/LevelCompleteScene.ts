import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { completeCurrentLevel, persistSave } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

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

    const typography = styleConfig.typography;
    this.add
      .bitmapText(170, 120, typography.fontKey, SCENE_TEXT.levelComplete.heading.toUpperCase(), 52)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(typography.letterSpacingPx);
    this.add
      .bitmapText(220, 220, typography.fontKey, statsText.toUpperCase(), 24)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);
    this.add
      .bitmapText(200, 360, typography.fontKey, SCENE_TEXT.levelComplete.hint.toUpperCase(), 20)
      .setTint(palette('hudText'))
      .setLetterSpacing(typography.letterSpacingPx);

    this.input.keyboard?.once('keydown-ENTER', () => {
      audio.playSfx('menu_confirm');
      const result = completeCurrentLevel(runtimeStore.save);
      runtimeStore.save = result.save;
      persistSave(runtimeStore.save);
      transitionToScene(
        this,
        result.finishedCampaign ? 'FinalVictoryScene' : 'WorldMapScene',
      );
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      persistSave(runtimeStore.save);
      transitionToScene(this, 'WorldMapScene');
    });
  }
}
