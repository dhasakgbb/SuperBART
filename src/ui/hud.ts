import Phaser from 'phaser';
import { HUD_CONTRACT } from '../content/contentManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';

export interface HudRefs {
  leftText: Phaser.GameObjects.BitmapText;
  starIcon: Phaser.GameObjects.Image;
  starText: Phaser.GameObjects.BitmapText;
  coinIcon: Phaser.GameObjects.Image;
  coinText: Phaser.GameObjects.BitmapText;
  rightText: Phaser.GameObjects.BitmapText;
  portrait: Phaser.GameObjects.Image;
}

function setDefaultTint(gameObj: Phaser.GameObjects.Components.Tint): void {
  gameObj.setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color);
}

export function createHud(scene: Phaser.Scene): HudRefs {
  const hud = styleConfig.hudLayout;
  const hudScale = 1 / Math.max(1, scene.cameras.main.zoom);
  const icons = hud.leftGroupIcons;

  const portrait = scene.add.image(0, 0, 'bart_portrait_96')
    .setOrigin(0, 0)
    .setDepth(2000)
    .setScale(hud.portrait.scale * hudScale);

  const leftText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  leftText.setScale(hudScale);
  leftText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const starIcon = scene.add
    .image(0, 0, 'star')
    .setOrigin(0, 0)
    .setDepth(2001)
    .setScale(icons.star.scale);
  setDefaultTint(starIcon);

  const starText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  starText.setScale(hudScale);
  starText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const coinIcon = scene.add
    .image(0, 0, 'coin')
    .setOrigin(0, 0)
    .setDepth(2001)
    .setScale(icons.coin.scale);
  setDefaultTint(coinIcon);

  const coinText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  coinText.setScale(hudScale);
  coinText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const rightText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.rightGroup.fontSizePx)
    .setOrigin(1, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  rightText.setScale(hudScale);
  rightText.setLetterSpacing(hud.rightGroup.letterSpacingPx);

  return { leftText, starIcon, starText, coinIcon, coinText, rightText, portrait };
}

/** Reposition HUD elements relative to camera worldView each frame. */
export function updateHudPosition(hud: HudRefs, cam: Phaser.Cameras.Scene2D.Camera): void {
  const wv = cam.worldView;
  const hLayout = styleConfig.hudLayout;

  hud.portrait.setPosition(wv.x + hLayout.portrait.x / cam.zoom, wv.y + hLayout.portrait.y / cam.zoom);
  hud.leftText.setPosition(wv.x + hLayout.leftGroup.x / cam.zoom, wv.y + hLayout.leftGroup.y / cam.zoom);
  hud.starIcon.setPosition(
    wv.x + hLayout.leftGroupIcons.star.x / cam.zoom,
    wv.y + hLayout.leftGroupIcons.star.y / cam.zoom,
  );
  hud.starText.setPosition(
    wv.x + (hLayout.leftGroupIcons.star.x + 15) / cam.zoom,
    wv.y + hLayout.leftGroupIcons.star.y / cam.zoom,
  );
  hud.coinIcon.setPosition(
    wv.x + hLayout.leftGroupIcons.coin.x / cam.zoom,
    wv.y + hLayout.leftGroupIcons.coin.y / cam.zoom,
  );
  hud.coinText.setPosition(
    wv.x + (hLayout.leftGroupIcons.coin.x + 15) / cam.zoom,
    wv.y + hLayout.leftGroupIcons.coin.y / cam.zoom,
  );
  hud.rightText.setPosition(wv.x + hLayout.rightGroup.x / cam.zoom, wv.y + hLayout.rightGroup.y / cam.zoom);
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
  const instances = String(payload.lives).padStart(HUD_CONTRACT.leftBlock.widthDigits, '0');
  const evals = String(payload.stars).padStart(3, '0');
  const tokens = String(payload.coins).padStart(3, '0');
  const time = String(payload.timeSec).padStart(hudLayout.timeDigits, '0');

  hud.leftText.setText(hudLayout.leftGroup.textFormat.replace('{instances}', instances));
  hud.starText.setText(evals);
  hud.coinText.setText(`x${tokens}`);
  hud.rightText.setText(
    hudLayout.rightGroup.textFormat
      .replace('{world}', String(payload.world))
      .replace('{level}', String(payload.level))
      .replace('{time}', time),
  );
  hud.portrait.setTexture('bart_portrait_96');
}
