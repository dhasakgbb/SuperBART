import Phaser from 'phaser';
import { ASSET_MANIFEST } from '../game/assetManifest.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.add
      .text(24, 24, 'Loading Super BART...', { fontSize: '24px', color: '#ffffff' })
      .setDepth(10);

    for (const [key, path] of Object.entries(ASSET_MANIFEST.images)) {
      this.load.image(key, path);
    }
    for (const [key, path] of Object.entries(ASSET_MANIFEST.tilemaps)) {
      this.load.tilemapTiledJSON(key, path);
    }
  }

  create() {
    this.scene.start('PlayScene');
  }
}
