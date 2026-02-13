import Phaser from 'phaser';

type SceneTransitionOptions = {
  durationMs?: number;
  color?: number;
  fadeInMs?: number;
  beforeStart?: () => void;
};

export function transitionToScene(
  scene: Phaser.Scene,
  target: string,
  data?: unknown,
  options: SceneTransitionOptions = {},
): void {
  const durationMs = options.durationMs ?? 150;
  const fadeInMs = options.fadeInMs ?? 0;
  const color = options.color ?? 0x000000;
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;

  const fadeInTargetCamera = (): void => {
    if (!scene.scene?.manager || fadeInMs <= 0) {
      return;
    }
    const targetScene = scene.scene.manager.getScene(target);
    const targetCamera = targetScene?.cameras?.main;
    if (!targetCamera) {
      return;
    }
    targetCamera.fadeIn(fadeInMs, red, green, blue);
  };

  if (durationMs <= 0 || !scene.cameras?.main) {
    options.beforeStart?.();
    scene.scene.start(target, data);
    scene.time.delayedCall(0, fadeInTargetCamera);
    return;
  }

  const camera = scene.cameras.main;

  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    options.beforeStart?.();
    scene.scene.start(target, data);
    scene.time.delayedCall(0, fadeInTargetCamera);
  });
  camera.fadeOut(durationMs, red, green, blue);
}
