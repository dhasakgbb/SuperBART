import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { isCampaignCompleted } from '../systems/save';
import { GAME_TITLE } from '../content/contentManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';
import { getAllVignettes } from '../content/creditsVignettes';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

function endingLine(): string {
  const rebootChoice = runtimeStore.save.choiceFlags.rebootChoice;
  const recordsChoice = runtimeStore.save.choiceFlags.recordsDeleteChoice;
  if (rebootChoice === 'reboot') {
    return recordsChoice === 'delete'
      ? 'The network reboots. The names stay protected.'
      : 'The network reboots. The archive stays open.';
  }
  return recordsChoice === 'delete'
    ? 'The core goes dark. The names remain private.'
    : 'The core goes dark. The record survives.';
}

export class CreditsScene extends Phaser.Scene {
  private scrollOffset = 0;
  private maxScrollOffset = 0;

  private resolveEnterTarget(): string {
    return isCampaignCompleted(runtimeStore.save) ? 'FinalVictoryScene' : 'WorldMapScene';
  }

  constructor() {
    super('CreditsScene');
  }

  create(): void {
    const typography = styleConfig.typography;
    this.cameras.main.setBackgroundColor(palette('inkDark'));

    let yPos = 84;
    const xStart = 90;
    const lineHeight = 20;

    // Title
    this.add
      .bitmapText(xStart, yPos, typography.fontKey, GAME_TITLE, 28)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1);
    yPos += 48;

    // Ending
    this.add
      .bitmapText(xStart, yPos, typography.fontKey, 'ENDING // THE HUMAN COST', 18)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);
    yPos += 32;

    this.add
      .bitmapText(xStart, yPos, typography.fontKey, endingLine(), 16)
      .setTint(palette('hudText'))
      .setMaxWidth(804)
      .setLetterSpacing(1);
    yPos += 40;

    // Personnel files count
    this.add
      .bitmapText(
        xStart,
        yPos,
        typography.fontKey,
        `Personnel Files Recovered: ${runtimeStore.save.personnelFilesCollected.length}/25`,
        16,
      )
      .setTint(palette('hudText'))
      .setLetterSpacing(1);
    yPos += 40;

    // World restoration vignettes
    const vignettes = getAllVignettes();
    for (const vignette of vignettes) {
      // World title
      this.add
        .bitmapText(xStart, yPos, typography.fontKey, vignette.title, 14)
        .setTint(palette('hudAccent'))
        .setLetterSpacing(1);
      yPos += lineHeight + 2;

      // Vignette lines
      for (const line of vignette.lines) {
        this.add
          .bitmapText(xStart + 12, yPos, typography.fontKey, line, 12)
          .setTint(palette('hudText'))
          .setMaxWidth(780)
          .setLetterSpacing(1);
        yPos += lineHeight;
      }

      yPos += 12; // Space between vignettes
    }

    // Final message
    yPos += 20;
    this.add
      .bitmapText(xStart, yPos, typography.fontKey, 'The work continues. The humans return.', 14)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);
    yPos += 20;
    this.add
      .bitmapText(xStart, yPos, typography.fontKey, 'Check the fans. Check the rails.', 14)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);

    this.maxScrollOffset = Math.max(0, yPos - 350);

    // Controls hint
    this.add
      .bitmapText(90, 476, typography.fontKey, 'ENTER: WORLD MAP   ESC: TITLE   ARROW KEYS: SCROLL', 12)
      .setTint(palette('inkSoft'))
      .setLetterSpacing(1);

    // Input handling
    this.input.keyboard?.once('keydown-ENTER', () => {
      transitionToScene(this, this.resolveEnterTarget(), undefined, { durationMs: 140, fadeInMs: 120 });
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      transitionToScene(this, 'TitleScene', undefined, { durationMs: 140, fadeInMs: 120 });
    });

    this.input.keyboard?.on('keydown-UP', () => {
      this.scrollOffset = Math.max(0, this.scrollOffset - 20);
      this.updateScroll();
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.scrollOffset = Math.min(this.maxScrollOffset, this.scrollOffset + 20);
      this.updateScroll();
    });
  }

  private updateScroll(): void {
    // This could be enhanced with actual camera movement if needed
    // For now, the text was rendered statically
  }
}
