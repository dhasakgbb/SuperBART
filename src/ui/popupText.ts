import Phaser from 'phaser';
import styleConfig from '../style/styleConfig';

export type PopupStyle = 'score' | 'combo' | 'pickup' | 'damage' | 'bonus';

const POPUP_DEPTH = 2001;

const STYLE_CONFIG: Record<PopupStyle, {
  color: number;
  fontSize: number;
  duration: number;
  riseDistance: number;
  scale: number;
  delay: number;
}> = {
  score: {
    color: 0xffffff,
    fontSize: 12,
    duration: 600,
    riseDistance: 24,
    scale: 1,
    delay: 0,
  },
  combo: {
    color: 0xffd700,
    fontSize: 16,
    duration: 800,
    riseDistance: 32,
    scale: 1.3,
    delay: 0,
  },
  pickup: {
    color: 0x7fff7f,
    fontSize: 14,
    duration: 700,
    riseDistance: 28,
    scale: 1.1,
    delay: 0,
  },
  damage: {
    color: 0xff4444,
    fontSize: 14,
    duration: 500,
    riseDistance: 20,
    scale: 1.0,
    delay: 0,
  },
  bonus: {
    color: 0xffef9c,
    fontSize: 18,
    duration: 1000,
    riseDistance: 40,
    scale: 1.4,
    delay: 0,
  },
};

/** Show floating popup text at a world position (not HUD-fixed). */
export function showPopupText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: PopupStyle = 'score',
): void {
  const cfg = STYLE_CONFIG[style];
  const typography = styleConfig.typography;

  const popup = scene.add
    .bitmapText(x, y, typography.fontKey, text, cfg.fontSize)
    .setOrigin(0.5, 1)
    .setTint(cfg.color)
    .setDepth(POPUP_DEPTH)
    .setScale(cfg.scale);

  // Entry: quick scale pop
  scene.tweens.add({
    targets: popup,
    scaleX: cfg.scale * 1.2,
    scaleY: cfg.scale * 1.2,
    duration: 60,
    yoyo: true,
    ease: 'Quad.easeOut',
  });

  // Rise + fade
  scene.tweens.add({
    targets: popup,
    y: y - cfg.riseDistance,
    alpha: 0,
    duration: cfg.duration,
    delay: cfg.delay + 80,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      popup.destroy();
    },
  });
}

/** Show a score popup with the "+N" format. */
export function showScorePopup(scene: Phaser.Scene, x: number, y: number, amount: number): void {
  showPopupText(scene, x, y - 8, `+${amount}`, 'score');
}

/** Show a combo popup ("xN COMBO!") with escalating size. */
export function showComboPopup(scene: Phaser.Scene, x: number, y: number, comboCount: number): void {
  if (comboCount < 2) return;
  const label = comboCount >= 5 ? `x${comboCount} EPIC!` : `x${comboCount} COMBO`;
  showPopupText(scene, x, y - 16, label, 'combo');
}

/** Show a pickup label popup. */
export function showPickupPopup(scene: Phaser.Scene, x: number, y: number, label: string): void {
  showPopupText(scene, x, y - 8, label, 'pickup');
}
