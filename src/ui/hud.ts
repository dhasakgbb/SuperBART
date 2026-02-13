import Phaser from 'phaser';
import { HUD_CONTRACT } from '../content/contentManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';

export interface HudRefs {
  leftText: Phaser.GameObjects.BitmapText;
  evalIcon: Phaser.GameObjects.Image;
  evalText: Phaser.GameObjects.BitmapText;
  tokenIcon: Phaser.GameObjects.Image;
  tokenText: Phaser.GameObjects.BitmapText;
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

  const portrait = scene.add.image(0, 0, hud.portrait.texture)
    .setOrigin(0, 0)
    .setDepth(2000)
    .setScale(hud.portrait.scale * hudScale);

  const leftText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  leftText.setScale(hudScale);
  leftText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const evalIcon = scene.add
    .image(0, 0, icons.star.texture)
    .setOrigin(0, 0)
    .setDepth(2001)
    .setScale(icons.star.scale);
  setDefaultTint(evalIcon);

  const evalText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  evalText.setScale(hudScale);
  evalText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const tokenIcon = scene.add
    .image(0, 0, icons.coin.texture)
    .setOrigin(0, 0)
    .setDepth(2001)
    .setScale(icons.coin.scale);
  setDefaultTint(tokenIcon);

  const tokenText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.leftGroup.fontSizePx)
    .setOrigin(0, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  tokenText.setScale(hudScale);
  tokenText.setLetterSpacing(hud.leftGroup.letterSpacingPx);

  const rightText = scene.add.bitmapText(0, 0, styleConfig.typography.fontKey, '', hud.rightGroup.fontSizePx)
    .setOrigin(1, 0)
    .setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color)
    .setDepth(2000);
  rightText.setScale(hudScale);
  rightText.setLetterSpacing(hud.rightGroup.letterSpacingPx);

  return { leftText, evalIcon, evalText, tokenIcon, tokenText, rightText, portrait };
}

/** Reposition HUD elements relative to camera worldView each frame. */
export function updateHudPosition(hud: HudRefs, cam: Phaser.Cameras.Scene2D.Camera): void {
  const wv = cam.worldView;
  const hLayout = styleConfig.hudLayout;

  hud.portrait.setPosition(wv.x + hLayout.portrait.x / cam.zoom, wv.y + hLayout.portrait.y / cam.zoom);
  hud.leftText.setPosition(wv.x + hLayout.leftGroup.x / cam.zoom, wv.y + hLayout.leftGroup.y / cam.zoom);
  hud.evalIcon.setPosition(
    wv.x + hLayout.leftGroupIcons.star.x / cam.zoom,
    wv.y + hLayout.leftGroupIcons.star.y / cam.zoom,
  );
  hud.evalText.setPosition(
    wv.x + (hLayout.leftGroupIcons.star.x + 15) / cam.zoom,
    wv.y + hLayout.leftGroupIcons.star.y / cam.zoom,
  );
  hud.tokenIcon.setPosition(
    wv.x + hLayout.leftGroupIcons.coin.x / cam.zoom,
    wv.y + hLayout.leftGroupIcons.coin.y / cam.zoom,
  );
  hud.tokenText.setPosition(
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
  const tokenMultiplier = HUD_CONTRACT.leftBlock.iconMultiplierGlyph || 'x';

  hud.leftText.setText(hudLayout.leftGroup.textFormat.replace('{instances}', instances));
  hud.evalText.setText(evals);
  hud.tokenText.setText(`${tokenMultiplier}${tokens}`);
  hud.rightText.setText(
    hudLayout.rightGroup.textFormat
      .replace('{world}', String(payload.world))
      .replace('{level}', String(payload.level))
      .replace('{time}', time),
  );
  hud.portrait.setTexture(hudLayout.portrait.texture);
}
