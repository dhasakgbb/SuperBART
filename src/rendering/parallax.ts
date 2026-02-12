import Phaser from 'phaser';
import { stylePalette, type StyleConfig } from '../style/styleConfig';

function toColor(swatch: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[swatch] ?? '#ffffff').color;
}

function renderSky(
  scene: Phaser.Scene,
  width: number,
  height: number,
  layout: StyleConfig['gameplayLayout'],
): void {
  const sky = scene.add.graphics().setDepth(-1400).setScrollFactor(0);
  sky.fillGradientStyle(
    toColor(layout.sky.topSwatch),
    toColor(layout.sky.topSwatch),
    toColor(layout.sky.bottomSwatch),
    toColor(layout.sky.bottomSwatch),
    1,
  );
  sky.fillRect(0, 0, width, height);

  const haze = scene.add.graphics().setDepth(-1399).setScrollFactor(0);
  haze.fillStyle(toColor('bloomWarm'), layout.haze.alpha);
  haze.fillEllipse(width * 0.5, layout.haze.y, width * layout.haze.widthFactor, layout.haze.heightPx);

  const hazeOrbs: Array<{ xFactor: number; y: number; r: number; color: string; alpha: number }> = [
    { xFactor: 0.34, y: 206, r: 64, color: 'grassMid', alpha: 0.06 },
    { xFactor: 0.52, y: 186, r: 86, color: 'bloomWarm', alpha: 0.05 },
    { xFactor: 0.68, y: 214, r: 72, color: 'grassTop', alpha: 0.045 },
  ];
  for (const orb of hazeOrbs) {
    const layer = scene.add.graphics().setDepth(-1398).setScrollFactor(0);
    layer.fillStyle(toColor(orb.color), orb.alpha);
    layer.fillCircle(width * orb.xFactor, orb.y, orb.r);
  }
}

function renderClouds(
  scene: Phaser.Scene,
  width: number,
  layout: StyleConfig['gameplayLayout'],
): void {
  for (const cloudDef of layout.clouds) {
    for (let x = cloudDef.x; x < width + cloudDef.spacingPx; x += cloudDef.spacingPx) {
      const cloud = scene.add
        .image(x, cloudDef.y, cloudDef.key)
        .setScale(cloudDef.scale)
        .setAlpha(cloudDef.alpha)
        .setDepth(-1388)
        .setScrollFactor(cloudDef.scrollFactor);

      const glow = scene.add
        .image(x + 4, cloudDef.y + 4, cloudDef.key)
        .setScale(cloudDef.scale + 0.12)
        .setAlpha(cloudDef.alpha * 0.22)
        .setTint(toColor('bloomWarm'))
        .setDepth(-1389)
        .setScrollFactor(Math.max(0.02, cloudDef.scrollFactor - 0.02))
        .setBlendMode(Phaser.BlendModes.ADD);

      scene.tweens.add({
        targets: [cloud, glow],
        x: x + cloudDef.driftPx,
        duration: cloudDef.driftMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }
}

function renderHillLayer(
  scene: Phaser.Scene,
  width: number,
  layer: StyleConfig['gameplayLayout']['hills']['far'],
  depth: number,
): void {
  for (let x = layer.startX; x < width + layer.spacingPx; x += layer.spacingPx) {
    scene.add
      .image(x, layer.y, layer.key)
      .setDepth(depth)
      .setAlpha(layer.alpha)
      .setScale(layer.scale)
      .setScrollFactor(layer.scrollFactor);
  }
}

export function renderGameplayBackground(
  scene: Phaser.Scene,
  width: number,
  height: number,
  layout: StyleConfig['gameplayLayout'],
): void {
  renderSky(scene, width, height, layout);
  renderClouds(scene, width, layout);
  renderHillLayer(scene, width, layout.hills.far, -1376);
  renderHillLayer(scene, width, layout.hills.near, -1372);
}
