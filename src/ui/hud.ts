import Phaser from 'phaser';
import styleConfig, { stylePalette } from '../style/styleConfig';

export interface HudRefs {
  leftText: Phaser.GameObjects.BitmapText;
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

  const leftText = scene.add.bitmapText(hud.leftGroup.x, hud.leftGroup.y, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setScrollFactor(0)
    .setDepth(2000);
  leftText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const rightText = scene.add.bitmapText(hud.rightGroup.x, hud.rightGroup.y, styleConfig.typography.fontKey, '', hud.rightGroup.fontSizePx)
    .setOrigin(1, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudAccent ?? '#DED256').color)
    .setScrollFactor(0)
    .setDepth(2000);
  rightText.setLetterSpacing(hud.rightGroup.letterSpacingPx);

  return { leftText, rightText, portrait };
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
  const hudLayout = styleConfig.hudLayout;
  const lives = String(payload.lives).padStart(2, '0');
  const stars = String(payload.stars).padStart(3, '0');
  const coins = String(payload.coins).padStart(3, '0');
  const time = String(payload.timeSec).padStart(hudLayout.timeDigits, '0');

  const leftText = hudLayout.leftGroup.textFormat
    .replace('{lives}', lives)
    .replace('{stars}', stars)
    .replace('{coins}', coins);
  const rightText = hudLayout.rightGroup.textFormat
    .replace('{world}', String(payload.world))
    .replace('{level}', String(payload.level))
    .replace('{time}', time);

  hud.leftText.setText(leftText);
  hud.rightText.setText(rightText);
  hud.portrait.setTexture('bart_portrait_96');
}
