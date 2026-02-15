import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from '../core/constants';
import { ASSET_MANIFEST } from '../core/assetManifest';

export class GalleryScene extends Phaser.Scene {
  private currentPage = 0;
  private pages: string[][] = [];
  private pageSize = 40; // 8x5 grid
  private assets: string[] = [];
  private darkBg = false;

  constructor() {
    super({ key: 'GalleryScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#2d2d2d');
    
    this.renderPage();

    // Input
    this.input.keyboard?.on('keydown-RIGHT', () => this.changePage(1));
    this.input.keyboard?.on('keydown-LEFT', () => this.changePage(-1));
    this.input.keyboard?.on('keydown-SPACE', () => this.toggleBackground());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }

  init() {
    this.pages = [];
    this.assets = [];
    // Collect assets once
    this.assets = Object.keys(this.textures.list).filter(k => 
      !k.startsWith('__') && (k.includes('enemy') || k.includes('tile') || k.includes('bart') || k.includes('pickup'))
    ).sort();

    // Paginate
    for (let i = 0; i < this.assets.length; i += this.pageSize) {
      this.pages.push(this.assets.slice(i, i + this.pageSize));
    }
  }

  changePage(delta: number) {
    const newPage = Phaser.Math.Clamp(this.currentPage + delta, 0, this.pages.length - 1);
    if (newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.renderPage();
    }
  }

  toggleBackground() {
    this.darkBg = !this.darkBg;
    this.renderPage();
  }

  renderPage() {
    this.children.removeAll(); // Clear existing content

    // Header (Re-add because we cleared)
    this.add.text(10, 10, 'VISUAL VERIFICATION GALLERY', { 
      fontFamily: 'monospace', 
      fontSize: '16px', 
      color: '#00ff00' 
    });

    this.add.text(10, 30, 'Arrows: Navigate | Space: Toggle BG', { 
      fontFamily: 'monospace', 
      fontSize: '12px', 
      color: '#aaaaaa' 
    });

    const pageIndex = this.currentPage;
    const page = this.pages[pageIndex] || [];
    let x = 40;
    let y = 60;
    const gap = 64;

    page.forEach((key, idx) => {
      // Label
      this.add.text(x, y + 40, key, { 
        fontSize: '8px', 
        fontFamily: 'monospace',
        color: this.darkBg ? '#ffffff' : '#000000'
      }).setOrigin(0.5);

      // Sprite
      try {
        const img = this.add.image(x, y, key);
        // Scale down if huge
        if (img.width > 50 || img.height > 50) {
            const scale = Math.min(48 / img.width, 48 / img.height);
            img.setScale(scale);
        }
      } catch (e) {
          
      }

      x += gap;
      if (x > VIEW_WIDTH - 40) {
        x = 40;
        y += gap + 20;
      }
    });

    this.add.text(VIEW_WIDTH - 80, 10, `Page ${pageIndex + 1}/${this.pages.length}`, {
        fontFamily: 'monospace',
        color: '#ffff00'
    });
  }
}
