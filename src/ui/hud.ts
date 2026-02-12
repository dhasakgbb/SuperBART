import Phaser from 'phaser';
import styleConfig, { stylePalette } from '../style/styleConfig';

export interface HudRefs {
  topText: Phaser.GameObjects.Text;
  rightText: Phaser.GameObjects.Text;
  portrait: Phaser.GameObjects.Image;
}

export function createHud(scene: Phaser.Scene): HudRefs {
  const hud = styleConfig.hudLayout;
  const panelColor = `${stylePalette.hudPanel ?? '#1F1F20'}C0`;

  const portrait = scene.add.image(hud.portrait.x, hud.portrait.y, 'bart_portrait_96')
    .setScrollFactor(0)
    .setDepth(2000)
    .setScale(hud.portrait.scale);

  const topText = scene.add.text(hud.topText.x, hud.topText.y, '', {
    fontFamily: styleConfig.typography.fallbackFamily,
    fontSize: `${hud.topText.fontSizePx}px`,
    color: stylePalette.hudText ?? '#f2fdfd',
    backgroundColor: panelColor
  }).setScrollFactor(0).setDepth(2000);

  const rightText = scene.add.text(hud.rightText.x, hud.rightText.y, '', {
    fontFamily: styleConfig.typography.fallbackFamily,
    fontSize: `${hud.rightText.fontSizePx}px`,
    color: stylePalette.hudAccent ?? '#ded256',
    backgroundColor: panelColor
  }).setScrollFactor(0).setDepth(2000);

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
  hud.topText.setText(`W${payload.world}-${payload.level}  SCORE ${payload.score}  COINS ${payload.coins}  STARS ${payload.stars}  LIVES ${payload.lives}  FORM ${payload.form}`);
  hud.rightText.setText(`TIME ${payload.timeSec}`);
  hud.portrait.setTexture('bart_portrait_96');
}
