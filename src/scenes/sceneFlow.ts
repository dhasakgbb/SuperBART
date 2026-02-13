import Phaser from 'phaser';

type SceneTransitionOptions = {
  durationMs?: number;
  color?: number;
  beforeStart?: () => void;
};

export function transitionToScene(
  scene: Phaser.Scene,
  target: string,
  data?: unknown,
  options: SceneTransitionOptions = {},
): void {
  const durationMs = options.durationMs ?? 150;
  if (durationMs <= 0 || !scene.cameras?.main) {
    options.beforeStart?.();
    scene.scene.start(target, data);
    return;
  }

  const color = options.color ?? 0x000000;
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  const camera = scene.cameras.main;

  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    options.beforeStart?.();
    scene.scene.start(target, data);
  });
  camera.fadeOut(durationMs, red, green, blue);
}

