import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../core/assetManifest';
import type { AssetImageSource } from '../core/assetManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
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
    const hints = SCENE_TEXT.boot.loadingHints;
    const loadText = this.add.bitmapText(
      28,
      22,
      styleConfig.typography.fontKey,
      hints[0],
      styleConfig.typography.lineHeightPx,
    );
    loadText.setTint(palette('hudText'));
    loadText.setLetterSpacing(styleConfig.typography.letterSpacingPx);
    let hintIdx = 0;
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        hintIdx = (hintIdx + 1) % hints.length;
        loadText.setText(hints[hintIdx]);
      },
    });

    transitionToScene(this, 'TitleScene', undefined, { durationMs: 0 });
  }
}
