import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../core/assetManifest';
import type { AssetImageSource } from '../core/assetManifest';
import { SCENE_TEXT } from '../content/contentManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const hints = SCENE_TEXT.boot.loadingHints;
    const loadText = this.add.text(28, 22, hints[0], { color: '#ffffff', fontSize: '20px' });
    let hintIdx = 0;
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        hintIdx = (hintIdx + 1) % hints.length;
        loadText.setText(hints[hintIdx]);
      },
    });
    for (const [key, entry] of Object.entries(ASSET_MANIFEST.images) as Array<[string, AssetImageSource]>) {
      const image = typeof entry === 'string' ? { path: entry } : entry;
      this.load.image(key, image.path);
    }
    for (const [key, sheet] of Object.entries(ASSET_MANIFEST.spritesheets)) {
      this.load.spritesheet(key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    for (const [key, font] of Object.entries(ASSET_MANIFEST.bitmapFonts)) {
      this.load.bitmapFont(key, font.texture, font.data);
    }
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
