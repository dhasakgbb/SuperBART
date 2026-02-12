import Phaser from 'phaser';
import styleConfig, { stylePalette } from '../style/styleConfig';

export interface HudRefs {
  topText: Phaser.GameObjects.BitmapText;
  rightText: Phaser.GameObjects.BitmapText;
  portrait: Phaser.GameObjects.Image;
}

export function createHud(scene: Phaser.Scene): HudRefs {
  const hud = styleConfig.hudLayout;

  const portrait = scene.add.image(hud.portrait.x, hud.portrait.y, 'bart_portrait_96')
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(2000)
    .setScale(hud.portrait.scale);

  const topText = scene.add.bitmapText(hud.topText.x, hud.topText.y, styleConfig.typography.fontKey, '', hud.topText.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setScrollFactor(0)
    .setDepth(2000);

  const rightText = scene.add.bitmapText(hud.rightText.x, hud.rightText.y, styleConfig.typography.fontKey, '', hud.rightText.fontSizePx)
    .setOrigin(1, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudAccent ?? '#DED256').color)
    .setScrollFactor(0)
    .setDepth(2000);

  return { topText, rightText, portrait };
}

export function renderHud(hud: HudRefs, payload: {
  world: number;
  level: number;
  score: number;
  coins: number;
  stars: number;
  lives: number;
  form: string;
  timeSec: number;
}): void {
  const lives = String(payload.lives).padStart(2, '0');
  const stars = String(payload.stars).padStart(3, '0');
  const coins = String(payload.coins).padStart(3, '0');

  hud.topText.setText(`BART  LIVES ${lives}  STAR ${stars}  PTU ${coins}`);
  hud.rightText.setText(`WORLD ${payload.world}-${payload.level}  TIME ${payload.timeSec}`);
  hud.portrait.setTexture('bart_portrait_96');
}
