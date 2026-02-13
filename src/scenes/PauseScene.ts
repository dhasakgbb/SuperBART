import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import { ENEMIES } from '../content/contentManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';

const ENEMY_ICON_BY_ID: Record<string, string> = {
  hallucination: 'enemy_walker',
  legacy_system: 'enemy_shell',
  hot_take: 'enemy_flying',
  analyst: 'enemy_spitter',
  technical_debt: 'enemy_shell_retracted',
};

function hexToInt(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    runtimeStore.mode = 'paused';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.playSfx('pause');

    const typography = styleConfig.typography;
    const hudText = hexToInt(stylePalette.hudText ?? '#F2FDFD');
    const hudAccent = hexToInt(stylePalette.hudAccent ?? '#DED256');

    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.72).setOrigin(0, 0).setDepth(10);
    this.add
      .bitmapText(480, 52, typography.fontKey, 'PAUSED', 28)
      .setOrigin(0.5, 0)
      .setLetterSpacing(2)
      .setTint(hudText)
      .setScrollFactor(0)
      .setDepth(20);

    this.add
      .bitmapText(480, 300, typography.fontKey, 'BESTIARY', 22)
      .setOrigin(0.5, 0)
      .setLetterSpacing(2)
      .setTint(hudAccent)
      .setScrollFactor(0)
      .setDepth(20);

    this.renderBestiary();

    this.add
      .bitmapText(480, 500, typography.fontKey, 'ESC / P: RESUME   L: SERVICE MAP   T: LOGIN SCREEN', 16)
      .setOrigin(0.5, 0)
      .setLetterSpacing(1)
      .setTint(hudText)
      .setScrollFactor(0)
      .setDepth(20);

    this.input.keyboard?.once('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      this.resumePlay();
    });
    this.input.keyboard?.once('keydown-P', () => {
      audio.playSfx('menu_confirm');
      this.resumePlay();
    });
    this.input.keyboard?.once('keydown-L', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'WorldMapScene', undefined, {
        beforeStart: () => {
          this.scene.stop('PlayScene');
          this.scene.stop();
        },
        durationMs: 160,
      });
    });
    this.input.keyboard?.once('keydown-T', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'TitleScene', undefined, {
        beforeStart: () => {
          this.scene.stop('PlayScene');
          this.scene.stop();
        },
        durationMs: 160,
      });
    });
  }

  private renderBestiary(): void {
    const entries = ENEMIES.filter((enemy) => enemy.implemented);
    const panelX = 160;
    const panelY = 102;
    const panelW = 640;
    const panelH = 172;
    const typography = styleConfig.typography;
    const rowGap = 52;
    const textX = panelX + 46;

    this.add
      .rectangle(panelX, panelY, panelW, panelH, 0x111111, 0.8)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x555555)
      .setDepth(12);

    for (let i = 0; i < entries.length; i += 1) {
      const enemy = entries[i]!;
      const y = panelY + 28 + i * rowGap;
      const iconKey = ENEMY_ICON_BY_ID[enemy.id] ?? 'enemy_walker';

      this.add
        .image(panelX + 20, y + 7, iconKey)
        .setOrigin(0.5, 0.5)
        .setScale(2.0)
        .setTint(hexToInt(stylePalette.hudAccent ?? '#DED256'))
        .setDepth(14);

      this.add
        .bitmapText(textX, y, typography.fontKey, enemy.displayName, 20)
        .setLetterSpacing(2)
        .setTint(hexToInt(stylePalette.hudText ?? '#F2FDFD'))
        .setOrigin(0, 0)
        .setDepth(14);
    }
  }

  private resumePlay(): void {
    runtimeStore.mode = 'playing';
    this.scene.stop();
    this.scene.resume('PlayScene');
  }
}
