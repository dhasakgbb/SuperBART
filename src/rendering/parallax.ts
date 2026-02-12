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

  if (layout.haze.alpha > 0) {
    const haze = scene.add.graphics().setDepth(-1399).setScrollFactor(0);
    haze.fillStyle(toColor('bloomWarm'), layout.haze.alpha);
    haze.fillEllipse(width * 0.5, layout.haze.y, width * layout.haze.widthFactor, layout.haze.heightPx);
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
  layer: StyleConfig['gameplayLayout']['hills']['far'] | StyleConfig['gameplayLayout']['hills']['near'],
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
