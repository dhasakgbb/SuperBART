import Phaser from 'phaser';
import styleConfig, { stylePalette } from '../style/styleConfig';

export class PopupManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawn(x: number, y: number, text: string, color?: number): void {
    const typography = styleConfig.typography;
    const defaultColor = Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#ffffff').color;
    
    const popup = this.scene.add.bitmapText(x, y, typography.fontKey, text, 14)
      .setOrigin(0.5)
      .setTint(color ?? defaultColor)
      .setDepth(100)
      .setScale(0);

    this.scene.tweens.add({
      targets: popup,
      scale: 1.2,
      y: y - 32,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: popup,
          alpha: 0,
          y: y - 48,
          duration: 300,
          delay: 400,
          ease: 'Quad.easeIn',
          onComplete: () => {
            popup.destroy();
          }
        });
      }
    });
  }
}
