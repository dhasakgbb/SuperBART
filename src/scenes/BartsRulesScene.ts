import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { runtimeStore } from '../core/runtime';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';
import {
  isBartsRulesUnlocked,
  loadBartsRulesState,
  getRulesDisplayState,
  toggleRule,
  isFullBartkowskiCompleted,
  type BartsRule,
} from '../systems/bartsRules';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

/**
 * Bart's Rules (NG+) workbench scene.
 * Presented as handwritten notes on Bart's workbench with toggleable constraints.
 */
export class BartsRulesScene extends Phaser.Scene {
  private selectedIndex = 0;
  private ruleTexts: Phaser.GameObjects.BitmapText[] = [];
  private ruleCheckboxes: Phaser.GameObjects.BitmapText[] = [];
  private noteText?: Phaser.GameObjects.BitmapText;
  private effectText?: Phaser.GameObjects.BitmapText;

  constructor() {
    super('BartsRulesScene');
  }

  create(): void {
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    loadBartsRulesState();

    const font = styleConfig.typography.fontKey;
    const w = 960;

    // Background: dark workbench feel
    this.cameras.main.setBackgroundColor(0x1a1a1a);

    // Workbench title
    this.add
      .bitmapText(w / 2, 40, font, "BART'S RULES", 32)
      .setOrigin(0.5, 0)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(2);

    this.add
      .bitmapText(w / 2, 80, font, 'NEW GAME+ CONSTRAINTS', 14)
      .setOrigin(0.5, 0)
      .setTint(palette('hudText'))
      .setLetterSpacing(1);

    if (!isBartsRulesUnlocked()) {
      this.add
        .bitmapText(w / 2, 260, font, 'COMPLETE THE CAMPAIGN TO UNLOCK', 18)
        .setOrigin(0.5, 0.5)
        .setTint(palette('inkSoft'));
      this.add
        .bitmapText(w / 2, 480, font, 'ESC: BACK', 12)
        .setOrigin(0.5, 0)
        .setTint(palette('inkSoft'));
      this.input.keyboard?.on('keydown-ESC', () => {
        audio.playSfx('menu_confirm');
        transitionToScene(this, 'TitleScene');
      });
      return;
    }

    // Render rule list
    const rules = getRulesDisplayState();
    const startY = 130;
    const lineHeight = 52;

    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i]!;
      const y = startY + i * lineHeight;

      // Checkbox
      const checkbox = this.add
        .bitmapText(180, y, font, rule.active ? '[X]' : '[ ]', 18)
        .setOrigin(0, 0)
        .setTint(rule.active ? palette('hudAccent') : palette('inkSoft'));
      this.ruleCheckboxes.push(checkbox);

      // Rule name
      const nameText = this.add
        .bitmapText(230, y, font, `${rule.id}. ${rule.name.toUpperCase()}`, 18)
        .setOrigin(0, 0)
        .setTint(rule.active ? palette('hudAccent') : palette('hudText'));
      this.ruleTexts.push(nameText);
    }

    // Selection indicator, note, and effect text
    this.noteText = this.add
      .bitmapText(w / 2, 420, font, '', 14)
      .setOrigin(0.5, 0)
      .setTint(0xCCAA66)
      .setLetterSpacing(1);

    this.effectText = this.add
      .bitmapText(w / 2, 450, font, '', 12)
      .setOrigin(0.5, 0)
      .setTint(palette('hudText'));

    // Full Bartkowski completion note
    if (isFullBartkowskiCompleted()) {
      this.add
        .bitmapText(w / 2, 390, font, 'ONE FOR ME. ONE FOR WHOEVER COMES NEXT.', 12)
        .setOrigin(0.5, 0)
        .setTint(0xCCAA66);
    }

    // Hints
    this.add
      .bitmapText(w / 2, 500, font, 'UP/DOWN: SELECT   ENTER: TOGGLE   ESC: BACK', 12)
      .setOrigin(0.5, 0)
      .setTint(palette('inkSoft'));

    this.updateSelection();

    // Input
    this.input.keyboard?.on('keydown-UP', () => {
      this.selectedIndex = (this.selectedIndex - 1 + rules.length) % rules.length;
      audio.playSfx('menu_move');
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectedIndex = (this.selectedIndex + 1) % rules.length;
      audio.playSfx('menu_move');
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      const rule = rules[this.selectedIndex];
      if (rule) {
        toggleRule(rule.id);
        audio.playSfx('menu_confirm');
        this.refreshRuleVisuals();
      }
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'TitleScene');
    });
  }

  private updateSelection(): void {
    const rules = getRulesDisplayState();
    const selected = rules[this.selectedIndex];
    if (!selected) return;

    // Highlight selected row
    for (let i = 0; i < this.ruleTexts.length; i += 1) {
      const isSelected = i === this.selectedIndex;
      const rule = rules[i]!;
      this.ruleTexts[i]!.setTint(
        isSelected ? palette('hudAccent') : rule.active ? palette('hudAccent') : palette('hudText'),
      );
      this.ruleTexts[i]!.setScale(isSelected ? 1.1 : 1.0);
    }

    // Display note and effect
    if (this.noteText) {
      this.noteText.setText(`"${selected.note}"`);
    }
    if (this.effectText) {
      this.effectText.setText(selected.effect.toUpperCase());
    }
  }

  private refreshRuleVisuals(): void {
    const rules = getRulesDisplayState();
    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i]!;
      if (this.ruleCheckboxes[i]) {
        this.ruleCheckboxes[i]!.setText(rule.active ? '[X]' : '[ ]');
        this.ruleCheckboxes[i]!.setTint(rule.active ? palette('hudAccent') : palette('inkSoft'));
      }
      if (this.ruleTexts[i]) {
        const isSelected = i === this.selectedIndex;
        this.ruleTexts[i]!.setTint(
          isSelected || rule.active ? palette('hudAccent') : palette('hudText'),
        );
      }
    }
  }
}
