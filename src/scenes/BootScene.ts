import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../core/assetManifest';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.add.text(28, 22, 'Loading Super BART V2', { color: '#ffffff', fontSize: '20px' });
    for (const [key, path] of Object.entries(ASSET_MANIFEST.images)) {
      this.load.image(key, path);
    }
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
