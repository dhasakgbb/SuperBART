import Phaser from 'phaser';

export function renderThemedBackground(scene: Phaser.Scene, width: number, height: number, skyTop: number, skyBottom: number): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
  g.fillRect(0, 0, width, height);

  for (let i = 0; i < 7; i += 1) {
    const x = 120 + i * 220;
    const y = 80 + (i % 2) * 35;
    g.fillStyle(0xffffff, 0.24);
    g.fillEllipse(x, y, 90, 30);
  }

  for (let i = 0; i < 10; i += 1) {
    g.fillStyle(0x000000, 0.13);
    g.fillRect(i * 180, height - 130 - (i % 3) * 20, 90, 130);
  }
  g.setDepth(-1000);
}
