import Phaser from 'phaser';

type TransitionType = 'fade' | 'wipe' | 'slide';

type SceneTransitionOptions = {
  durationMs?: number;
  color?: number;
  fadeInMs?: number;
  type?: TransitionType;
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
  const type = options.type ?? 'fade';
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
      // Retry after a short delay if target scene isn't ready
      scene.time.delayedCall(50, fadeInTargetCamera);
      return;
    }
    targetCamera.fadeIn(fadeInMs, red, green, blue);
  };

  const startTarget = (): void => {
    options.beforeStart?.();
    scene.scene.start(target, data as object | undefined);
    if (fadeInMs > 0) {
      fadeInTargetCamera();
    }
  };

  if (durationMs <= 0 || !scene.cameras?.main) {
    startTarget();
    return;
  }

  const camera = scene.cameras.main;

  if (type === 'fade') {
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, startTarget);
    camera.fadeOut(durationMs, red, green, blue);
  } else if (type === 'wipe') {
    // Square grid wipe for NES feel
    const { width, height } = scene.cameras.main;
    const size = 64;
    const cols = Math.ceil(width / size);
    const rows = Math.ceil(height / size);
    const total = cols * rows;
    
    const graphics = scene.add.graphics({ fillStyle: { color: color } }).setDepth(9999).setScrollFactor(0);
    const squares: Phaser.GameObjects.Rectangle[] = [];
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const sq = scene.add.rectangle(x * size + size/2, y * size + size/2, size, size, color)
          .setDepth(9999).setScrollFactor(0).setScale(0);
        squares.push(sq);
      }
    }

    scene.tweens.add({
      targets: squares,
      scale: 1.1,
      duration: durationMs,
      ease: 'Quad.easeIn',
      stagger: durationMs / total * 2,
      onComplete: () => {
        squares.forEach(s => s.destroy());
        graphics.destroy();
        startTarget();
      }
    });
  } else if (type === 'slide') {
    const { width, height } = scene.cameras.main;
    camera.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, startTarget);
    camera.pan(width, height / 2, durationMs, 'Power2');
  }
}
