import Phaser from 'phaser';

export function renderThemedBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  skyTop: number,
  skyBottom: number
): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
  g.fillRect(0, 0, width, height);

  const haze = scene.add.graphics().setDepth(-998);
  haze.fillStyle(0xf6d58b, 0.08);
  haze.fillEllipse(width * 0.5, 40, width * 0.95, 120);

  for (let i = 0; i < Math.ceil(width / 260); i += 1) {
    const x = 70 + i * 260;
    const y = 70 + (i % 2) * 24;
    const cloudKey = i % 2 === 0 ? 'cloud_1' : 'cloud_2';
    const cloud = scene.add.image(x, y, cloudKey).setDepth(-997).setAlpha(0.42).setScale(1.7);
    const cloudGlow = scene.add.image(x + 2, y + 2, cloudKey).setDepth(-998).setAlpha(0.1).setScale(1.95);
    cloudGlow.setBlendMode(Phaser.BlendModes.ADD);
    cloud.setScrollFactor(0.06);
    cloudGlow.setScrollFactor(0.04);
  }

  const mountain = scene.add.graphics().setDepth(-996);
  for (let i = 0; i < Math.ceil(width / 140); i += 1) {
    mountain.fillStyle(0x000000, 0.12 + (i % 3) * 0.03);
    mountain.fillTriangle(
      i * 140 - 20,
      height - 24,
      i * 140 + 72,
      height - 156 - (i % 2) * 22,
      i * 140 + 164,
      height - 24
    );
  }

  g.setDepth(-999);
  g.setScrollFactor(0);
}
