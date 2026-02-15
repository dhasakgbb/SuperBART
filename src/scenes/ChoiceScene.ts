import Phaser from 'phaser';
import { SCRIPT_CHOICE_PROMPTS } from '../content/scriptNarrative';
import { runtimeStore } from '../core/runtime';
import { persistSave, setRebootChoice, setRecordsDeleteChoice } from '../systems/save';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

type ChoiceType = 'records' | 'reboot';

export class ChoiceScene extends Phaser.Scene {
  private selectedIndex = 0;

  constructor() {
    super('ChoiceScene');
  }

  create(data: { type?: ChoiceType }): void {
    const type: ChoiceType = data.type ?? 'records';
    const prompt = type === 'records' ? SCRIPT_CHOICE_PROMPTS.world5Records : SCRIPT_CHOICE_PROMPTS.endingReboot;
    const typography = styleConfig.typography;
    const leftOption = this.add
      .bitmapText(120, 360, typography.fontKey, prompt.optionA, 18)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1);
    const rightOption = this.add
      .bitmapText(520, 360, typography.fontKey, prompt.optionB, 18)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);

    const refresh = (): void => {
      leftOption.setTint(this.selectedIndex === 0 ? palette('hudAccent') : palette('hudText'));
      rightOption.setTint(this.selectedIndex === 1 ? palette('hudAccent') : palette('hudText'));
    };

    this.cameras.main.setBackgroundColor(palette('skyDeep'));
    this.add
      .bitmapText(88, 84, typography.fontKey, prompt.title, 28)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1);
    this.add
      .bitmapText(88, 160, typography.fontKey, prompt.body, 16)
      .setTint(palette('hudText'))
      .setMaxWidth(804)
      .setLetterSpacing(1);
    this.add
      .bitmapText(88, 468, typography.fontKey, 'LEFT/RIGHT: CHOOSE  ENTER: CONFIRM', 14)
      .setTint(palette('inkSoft'))
      .setLetterSpacing(1);
    refresh();

    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectedIndex = 0;
      refresh();
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectedIndex = 1;
      refresh();
    });
    this.input.keyboard?.once('keydown-ENTER', () => {
      if (type === 'records') {
        runtimeStore.save = setRecordsDeleteChoice(runtimeStore.save, this.selectedIndex === 0 ? 'delete' : 'preserve');
        persistSave(runtimeStore.save);
        transitionToScene(
          this,
          'PlayScene',
          { world: runtimeStore.save.campaign.world, stage: runtimeStore.save.campaign.stage },
          { durationMs: 180, fadeInMs: 120 },
        );
        return;
      }
      runtimeStore.save = setRebootChoice(runtimeStore.save, this.selectedIndex === 0 ? 'reboot' : 'refuse');
      persistSave(runtimeStore.save);
      transitionToScene(this, 'CreditsScene', undefined, { durationMs: 180, fadeInMs: 120 });
    });
  }
}
