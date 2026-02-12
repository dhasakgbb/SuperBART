import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import { runtimeStore } from '../core/runtime';
import { campaignOrdinal, campaignRefFromOrdinal, levelKey } from '../systems/progression';
import { isLevelUnlocked, persistSave, setCurrentLevel } from '../systems/save';

export class WorldMapScene extends Phaser.Scene {
  private selectedOrdinal = 1;
  private levelTextByKey = new Map<string, Phaser.GameObjects.Text>();

  constructor() {
    super('WorldMapScene');
  }

  private drawLevelGrid(): void {
    this.levelTextByKey.clear();
    const completed = new Set(runtimeStore.save.campaign.completedLevelKeys);

    let y = 108;
    for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
      const levels = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
      this.add.text(96, y, `WORLD ${world}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#f2fdfd'
      });

      for (let levelIndex = 1; levelIndex <= levels; levelIndex += 1) {
        const key = levelKey(world, levelIndex);
        const unlocked = isLevelUnlocked(runtimeStore.save, world, levelIndex);
        const done = completed.has(key);
        const ordinal = campaignOrdinal(world, levelIndex);
        const selected = ordinal === this.selectedOrdinal;

        const color = selected
          ? '#ffe082'
          : done
            ? '#9be564'
            : unlocked
              ? '#ffffff'
              : '#5b6473';
        const marker = selected ? '>' : ' ';
        const label = `${marker} ${key.padEnd(4, ' ')} ${done ? '[DONE]' : unlocked ? '[OPEN]' : '[LOCK]'}`;
        const row = this.add.text(252 + ((levelIndex - 1) % 3) * 220, y + Math.floor((levelIndex - 1) / 3) * 28, label, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color
        });
        this.levelTextByKey.set(key, row);
      }

      y += 84;
    }
  }

  private rerender(): void {
    this.children.removeAll();

    this.add.text(252, 26, 'LEVEL SELECT', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffd54f'
    });

    this.add.text(
      92,
      492,
      'UP/DOWN: SELECT LEVEL   ENTER: PLAY   ESC: TITLE   S: SETTINGS',
      { fontFamily: 'monospace', fontSize: '16px', color: '#f2fdfd' }
    );

    this.drawLevelGrid();
  }

  private moveSelection(delta: number): void {
    this.selectedOrdinal = Math.min(TOTAL_CAMPAIGN_LEVELS, Math.max(1, this.selectedOrdinal + delta));
    this.rerender();
  }

  create(): void {
    runtimeStore.mode = 'level_select';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();

    const { world, levelIndex } = runtimeStore.save.campaign;
    this.selectedOrdinal = campaignOrdinal(world, levelIndex);
    this.rerender();

    this.input.keyboard?.on('keydown-UP', () => {
      this.moveSelection(-1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.moveSelection(1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.moveSelection(-1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.moveSelection(1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      this.scene.start('TitleScene');
    });
    this.input.keyboard?.on('keydown-S', () => {
      audio.playSfx('menu_confirm');
      this.scene.start('SettingsScene', { backScene: 'WorldMapScene' });
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      const selected = campaignRefFromOrdinal(this.selectedOrdinal);
      if (!isLevelUnlocked(runtimeStore.save, selected.world, selected.levelIndex)) {
        audio.playSfx('menu_move');
        return;
      }
      audio.playSfx('menu_confirm');
      runtimeStore.save = setCurrentLevel(runtimeStore.save, selected.world, selected.levelIndex);
      persistSave(runtimeStore.save);
      this.scene.start('PlayScene', { bonus: false });
    });
  }
}
