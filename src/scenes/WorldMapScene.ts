import Phaser from 'phaser';
import { runtimeStore } from '../core/runtime';
import { isBonusUnlocked } from '../systems/progression';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create(): void {
    runtimeStore.mode = 'world_map';
    const { world, levelIndex } = runtimeStore.save.campaign;
    const unlocked = isBonusUnlocked(world, runtimeStore.save.progression.stars);

    this.add.text(190, 120, `WORLD ${world}  LEVEL ${levelIndex}`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#ffffff'
    });
    this.add.text(180, 220, `Stars: ${runtimeStore.save.progression.stars}  Bonus ${unlocked ? 'Unlocked' : 'Locked'}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffe082'
    });
    this.add.text(200, 300, 'Enter: Play Campaign\nB: Bonus Level\nEsc: Title', {
      fontSize: '22px',
      color: '#ffffff'
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('PlayScene', { bonus: false });
    });

    this.input.keyboard?.on('keydown-B', () => {
      if (unlocked) {
        this.scene.start('PlayScene', { bonus: true });
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
