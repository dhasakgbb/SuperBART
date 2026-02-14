# Platform Support Declaration

## Supported Platforms

- **Desktop Chrome/Edge/Safari** with **WebGL 2.0** enabled.
- High-end mobile devices with robust WebGL support (aiming for iPhone 12+ / Pixel 6+).

## Not Guaranteed

- **iOS Safari** on older devices.
- **Low-end GPUs** or environments without hardware acceleration.
- **Canvas Fallback**: We are strictly using `Phaser.WEBGL` to enable advanced post-processing and lighting effects. The game may fail to load or render correctly if WebGL is unavailable.

## CI Visual Regression Strategy

Visual capture and regression testing (`lint:visual`, `visual:capture`) run on:

- Local developer machines with GPU access.
- Configured CI runners with GPU/WebGL capabilities.

In general CI environments (e.g., standard GitHub Actions runners without GPU), visual tests may be skipped or run in a headless software-rendering mode if supported, but results may vary.
