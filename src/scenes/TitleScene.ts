import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { loadSave, persistSave } from '../systems/save';
import { runtimeStore } from '../core/runtime';
import { transitionToScene } from './sceneFlow';

function hexToInt(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

function palette(name: string): number {
  return hexToInt(stylePalette[name] ?? '#ffffff');
}

type SpriteAnchor = 'top-left' | 'top-center' | 'top-right' | 'center';

function anchorToOrigin(anchor: SpriteAnchor = 'top-left'): { x: number; y: number } {
  switch (anchor) {
    case 'top-center':
      return { x: 0.5, y: 0 };
    case 'top-right':
      return { x: 1, y: 0 };
    case 'center':
      return { x: 0.5, y: 0.5 };
    case 'top-left':
    default:
      return { x: 0, y: 0 };
  }
}

interface MenuConfig {
  x: number;
  startY: number;
  spacingPx: number;
  fontSizePx: number;
  letterSpacingPx: number;
  cursorGlyph: string;
  items: readonly string[];
}

export class TitleScene extends Phaser.Scene {
  private promptBlink: Phaser.Time.TimerEvent | null = null;
  private cameraPanTween: Phaser.Tweens.Tween | null = null;
  private sceneReadyStableFrames = 2;

  private menuIndex = 0;
  private menuTexts: Phaser.GameObjects.BitmapText[] = [];
  private menuCursor: Phaser.GameObjects.BitmapText | null = null;
  private menuActive = false;

  constructor() {
    super('TitleScene');
  }

  private setSceneReadyMarker(): void {
    const root = ((window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ ?? {}) as Record<
      string,
      unknown
    >;
    root.sceneName = this.scene.key;
    root.sceneReady = false;
    root.sceneReadyFrame = -1;
    root.sceneFrame = this.game.loop.frame;
    root.sceneReadyCounter = 0;
    root.sceneReadyVersion = styleConfig.contractVersion;

    const onPostUpdate = (): void => {
      root.sceneName = this.scene.key;
      root.sceneFrame = this.game.loop.frame;
      const stableCounter = Number(root.sceneReadyCounter ?? 0) + 1;
      root.sceneReadyCounter = stableCounter;
      if (stableCounter >= this.sceneReadyStableFrames) {
        root.sceneReady = true;
        if (typeof root.sceneReadyFrame !== 'number' || root.sceneReadyFrame < 0) {
          root.sceneReadyFrame = this.game.loop.frame;
        }
      }
    };

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    });

    (window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ = root;
  }

  create(): void {
    const titleLayout = styleConfig.titleLayout;

    runtimeStore.mode = 'title';
    runtimeStore.save = loadSave();
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    audio.startTitleMusic();

    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor(palette('skyMid'));

    this.menuIndex = 0;
    this.menuTexts = [];
    this.menuCursor = null;
    this.menuActive = false;

    this.renderAttractBackground(titleLayout);
    this.renderScanlineOverlay(titleLayout);
    this.renderTitleUi(titleLayout);
    this.renderTitleSupplementalText(titleLayout);
    if ((titleLayout.titleMode as string) !== 'game-name-only') {
      this.renderMenu(titleLayout);
      this.animateEntrance(titleLayout);
    }
    this.setSceneReadyMarker();
    this.setupInput(audio, titleLayout);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.promptBlink?.remove(false);
      this.promptBlink = null;
      this.cameraPanTween?.remove();
      this.cameraPanTween = null;
    });
  }

  private setupInput(audio: AudioEngine, titleLayout: typeof styleConfig.titleLayout): void {
    if ((titleLayout.titleMode as string) === 'game-name-only') {
      const startContinue = (): void => {
        audio.unlockFromUserGesture();
        audio.playSfx('menu_confirm');
        transitionToScene(this, 'WorldMapScene');
      };

      const startNewRun = (): void => {
        audio.unlockFromUserGesture();
        audio.playSfx('menu_confirm');
        const fresh = loadSave();
        runtimeStore.save = {
          ...fresh,
          progression: {
            score: 0,
            coins: 0,
            stars: 0,
            deaths: 0,
            timeMs: 0,
          },
          campaign: {
            ...fresh.campaign,
            world: 1,
            levelIndex: 1,
            unlockedLevelKeys: ['1-1'],
            completedLevelKeys: [],
          },
        };
        persistSave(runtimeStore.save);
        transitionToScene(this, 'WorldMapScene');
      };

      this.input.keyboard?.on('keydown-ENTER', startContinue);
      this.input.keyboard?.on('keydown-SPACE', startContinue);
      this.input.keyboard?.on('keydown-L', startContinue);
      this.input.keyboard?.on('keydown-N', startNewRun);
      this.input.on('pointerdown', () => startContinue());
      return;
    }

    const menuConfig = styleConfig.titleLayout.menu as MenuConfig;
    const menuItems = menuConfig.items;

    const confirmSelection = (): void => {
      if (!this.menuActive) return;
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');

      const selected = menuItems[this.menuIndex];
      switch (selected) {
        case 'CONTINUE':
          transitionToScene(this, 'WorldMapScene');
          break;
        case 'NEW RUN': {
          const fresh = loadSave();
          runtimeStore.save = {
            ...fresh,
            progression: {
              score: 0,
              coins: 0,
              stars: 0,
              deaths: 0,
              timeMs: 0,
            },
            campaign: {
              ...fresh.campaign,
              world: 1,
              levelIndex: 1,
              unlockedLevelKeys: ['1-1'],
              completedLevelKeys: [],
            },
          };
          persistSave(runtimeStore.save);
          transitionToScene(this, 'WorldMapScene');
          break;
        }
        case 'SETTINGS':
          transitionToScene(this, 'SettingsScene', { backScene: 'TitleScene' }, { durationMs: 160 });
          break;
        case 'BARTS RULES':
          transitionToScene(this, 'BartsRulesScene');
          break;
      }
    };

    const moveUp = (): void => {
      if (!this.menuActive) return;
      audio.unlockFromUserGesture();
      audio.playSfx('menu_move');
      this.menuIndex = (this.menuIndex - 1 + menuItems.length) % menuItems.length;
      this.updateMenuCursor();
    };

    const moveDown = (): void => {
      if (!this.menuActive) return;
      audio.unlockFromUserGesture();
      audio.playSfx('menu_move');
      this.menuIndex = (this.menuIndex + 1) % menuItems.length;
      this.updateMenuCursor();
    };

    // Keyboard
    this.input.keyboard?.on('keydown-UP', moveUp);
    this.input.keyboard?.on('keydown-DOWN', moveDown);
    this.input.keyboard?.on('keydown-W', moveUp);
    this.input.keyboard?.on('keydown-S', moveDown);
    this.input.keyboard?.on('keydown-ENTER', confirmSelection);
    this.input.keyboard?.on('keydown-SPACE', confirmSelection);

    // Legacy shortcuts still work
    this.input.keyboard?.on('keydown-L', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'WorldMapScene');
    });
    this.input.keyboard?.on('keydown-N', () => {
      this.menuIndex = 1; // NEW RUN
      this.updateMenuCursor();
      confirmSelection();
    });

    // Click/tap on menu items
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      if (!this.menuActive) {
        // First click activates menu
        audio.unlockFromUserGesture();
        return;
      }
      confirmSelection();
    });
  }

  private renderMenu(titleLayout: typeof styleConfig.titleLayout): void {
    const menuConfig = titleLayout.menu as MenuConfig;
    const typography = styleConfig.typography;
    const { x, startY, spacingPx, fontSizePx, letterSpacingPx, cursorGlyph, items } = menuConfig;

    // Cursor glyph
    const cursorY = startY + this.menuIndex * spacingPx;
    this.menuCursor = this.add
      .bitmapText(x - 100, cursorY, typography.fontKey, cursorGlyph, fontSizePx)
      .setOrigin(0, 0)
      .setCenterAlign()
      .setDepth(70)
      .setScrollFactor(0)
      .setTint(palette('hudAccent'))
      .setAlpha(0);
    this.menuCursor.setLetterSpacing(letterSpacingPx);

    // Menu items
    for (let i = 0; i < items.length; i += 1) {
      const itemY = startY + i * spacingPx;
      const text = this.add
        .bitmapText(x, itemY, typography.fontKey, items[i], fontSizePx)
        .setOrigin(0.5, 0)
        .setCenterAlign()
        .setDepth(70)
        .setScrollFactor(0)
        .setTint(palette('hudText'))
        .setAlpha(0);
      text.setLetterSpacing(letterSpacingPx);

      // Interactive hit area
      text.setInteractive({ useHandCursor: true });
      text.on('pointerover', () => {
        if (!this.menuActive) return;
        const audio = AudioEngine.shared();
        audio.playSfx('menu_move');
        this.menuIndex = i;
        this.updateMenuCursor();
      });

      this.menuTexts.push(text);
    }
  }

  private updateMenuCursor(): void {
    const menuConfig = styleConfig.titleLayout.menu as MenuConfig;
    const { startY, spacingPx } = menuConfig;

    if (this.menuCursor) {
      this.menuCursor.y = startY + this.menuIndex * spacingPx;
    }

    // Highlight selected, dim others
    for (let i = 0; i < this.menuTexts.length; i += 1) {
      const isSelected = i === this.menuIndex;
      this.menuTexts[i].setTint(isSelected ? palette('hudAccent') : palette('hudText'));
      this.menuTexts[i].setAlpha(isSelected ? 1 : 0.55);
    }
  }

  private renderScanlineOverlay(titleLayout: typeof styleConfig.titleLayout): void {
    const { width, height } = titleLayout.viewport;
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0);
    gfx.setDepth(100);
    gfx.setAlpha(0.06);

    for (let y = 0; y < height; y += 3) {
      gfx.fillStyle(0x000000, 1);
      gfx.fillRect(0, y, width, 1);
    }
  }

  private animateEntrance(titleLayout: typeof styleConfig.titleLayout): void {
    // Stagger menu items in with scale punch
    const baseDelay = 500;
    for (let i = 0; i < this.menuTexts.length; i += 1) {
      const text = this.menuTexts[i];
      const targetY = text.y;
      text.y = targetY + 30;
      text.setScale(0.7);
      this.tweens.add({
        targets: text,
        alpha: i === this.menuIndex ? 1 : 0.55,
        y: targetY,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut',
        delay: baseDelay + i * 80,
      });
    }

    // Cursor slides in from left with punch
    if (this.menuCursor) {
      const cursorDelay = baseDelay + this.menuTexts.length * 80 + 120;
      this.menuCursor.x -= 30;
      const cursorTargetX = this.menuCursor.x + 30;
      this.time.delayedCall(cursorDelay, () => {
        if (this.menuCursor) {
          this.tweens.add({
            targets: this.menuCursor,
            x: cursorTargetX,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.menuActive = true;
              this.updateMenuCursor();

              // Cursor bob
              if (this.menuCursor) {
                this.tweens.add({
                  targets: this.menuCursor,
                  x: cursorTargetX + 5,
                  duration: 350,
                  ease: 'Sine.easeInOut',
                  yoyo: true,
                  repeat: -1,
                });
              }
            },
          });
        }
      });
    }

    // Tint the first menu item gold immediately
    if (this.menuTexts.length > 0) {
      this.menuTexts[0].setTint(palette('hudAccent'));
    }
  }

  private renderAttractBackground(titleLayout: typeof styleConfig.titleLayout): void {
    const tileStep = styleConfig.spriteScale.tilePx;
    const attract = titleLayout.attract;
    const { width, height } = titleLayout.viewport;

    // Multi-plane parallax backdrop (deterministic, no randomness)
    // Keep these fixed to camera, but shift their tile positions based on camera scroll to simulate depth.
    const bgFar = this.add
      .tileSprite(0, 0, width, height, 'title_bg_void')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-1200)
      .setAlpha(0.16);
    bgFar.tileScaleX = 2.2;
    bgFar.tileScaleY = 2.2;

    const bgMid = this.add
      .tileSprite(0, 0, width, height, 'title_bg_city')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-1190)
      .setAlpha(0.22);
    bgMid.tileScaleX = 2.0;
    bgMid.tileScaleY = 2.0;

    this.cameras.main.setBounds(0, 0, attract.worldWidthPx, titleLayout.viewport.height);
    this.cameras.main.setScroll(0, 0);

    this.cameraPanTween = this.tweens.addCounter({
      from: 0,
      to: attract.cameraPanPx,
      duration: attract.cameraPanMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const val = tween.getValue();
        if (typeof val === 'number') {
          this.cameras.main.setScroll(val, 0);

          // Camera-coupled parallax: far moves least, mid slightly more.
          // Using tilePosition keeps this stable and avoids seams during small pans.
          bgFar.tilePositionX = val * 0.18;
          bgMid.tilePositionX = val * 0.32;
        }
      },
    });

    // Hills: foreground depth layers (parallax via scrollFactor)
    // Repeat enough sprites to cover the small camera pan range.
    for (let x = -80; x < attract.worldWidthPx + 160; x += 160) {
      this.add
        .image(x, attract.groundY - tileStep * 2.2, 'hill_far')
        .setOrigin(0.5, 1)
        .setScale(3.4)
        .setAlpha(0.38)
        .setDepth(-980)
        .setScrollFactor(0.16);
    }
    for (let x = -60; x < attract.worldWidthPx + 140; x += 180) {
      this.add
        .image(x, attract.groundY - tileStep * 1.2, 'hill_near')
        .setOrigin(0.5, 1)
        .setScale(3.6)
        .setAlpha(0.5)
        .setDepth(-970)
        .setScrollFactor(0.22);
    }

    for (const cloud of attract.clouds) {
      const cloudOrigin = anchorToOrigin('center');
      const cloudSprite = this.add
        .image(cloud.x, cloud.y, cloud.key)
        .setOrigin(cloudOrigin.x, cloudOrigin.y)
        .setScale(cloud.scale)
        .setAlpha(cloud.alpha)
        .setDepth(-990)
        .setScrollFactor(0.08);
      this.tweens.add({
        targets: cloudSprite,
        x: cloud.x + attract.cloudDriftPx,
        duration: attract.cloudDriftMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    const crop = attract.groundTileCrop;
    for (let row = 0; row < attract.groundRows; row += 1) {
      const y = attract.groundY + row * tileStep;
      for (let x = 0; x < attract.worldWidthPx; x += tileStep) {
        const tile = this.add
          .image(x, y, 'tile_ground')
          .setOrigin(0, 0)
          .setDepth(-120 + row);
        tile.setCrop(crop.x, crop.y, crop.w, crop.h);
      }
    }

    // In full-ui mode, dim the attract elements so they don't fight the menu
    const isFullMenu = (titleLayout.titleMode as string) !== 'game-name-only';
    const attractAlpha = isFullMenu ? 0.15 : 1;

    const block = this.add
      .image(attract.questionBlock.x, attract.questionBlock.y, 'question_block')
      .setScale(attract.questionBlock.scale)
      .setDepth(-100)
      .setAlpha(attractAlpha);
    this.tweens.add({
      targets: block,
      y: attract.questionBlock.y - attract.questionBlock.bobPx,
      duration: attract.questionBlock.bobMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const coinTokens: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < attract.coinLine.count; i += 1) {
      const x = attract.coinLine.startX + i * attract.coinLine.spacingPx;
      const token = this.add
        .image(x, attract.coinLine.y, 'pickup_token')
        .setScale(attract.coinLine.scale)
        .setDepth(-98)
        .setAlpha(attractAlpha);
      coinTokens.push(token);

      this.tweens.add({
        targets: token,
        y: attract.coinLine.y - tileStep / 2,
        duration: attract.coinLine.shimmerMs + i * 80,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    if (!isFullMenu) {
      this.tweens.add({
        targets: coinTokens,
        alpha: 0.74,
        duration: attract.coinLine.shimmerMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // Vignette darkening overlay for depth
    this.renderVignette(titleLayout.viewport.width, titleLayout.viewport.height);
  }

  private renderVignette(width: number, height: number): void {
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0);
    gfx.setDepth(90);

    // Heavy top gradient — push logo into spotlight
    for (let i = 0; i < 100; i += 1) {
      const alpha = 0.6 * (1 - i / 100);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(0, i, width, 1);
    }

    // Heavy bottom gradient — darken the ground area
    for (let i = 0; i < 140; i += 1) {
      const alpha = 0.7 * (1 - i / 140);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(0, height - i, width, 1);
    }

    // Wide side gradients — cinematic letterbox feel
    for (let i = 0; i < 100; i += 1) {
      const alpha = 0.4 * (1 - i / 100);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(i, 0, 1, height);
      gfx.fillRect(width - i, 0, 1, height);
    }
  }

  /** Radial glow backdrop behind the logo — the single most important visual element */
  private renderLogoGlow(cx: number, cy: number): void {
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0);
    gfx.setDepth(38); // Behind logo (40) but above background

    // Draw concentric ellipses to simulate a big, bold radial glow
    const rings = 50;
    const maxW = 560;
    const maxH = 240;
    for (let i = rings; i >= 0; i -= 1) {
      const t = i / rings;
      const alpha = 0.35 * (1 - t) * (1 - t); // Strong quadratic falloff
      const w = maxW * (0.1 + 0.9 * t);
      const h = maxH * (0.1 + 0.9 * t);
      // Hot gold core → dark amber at edge
      const r = Math.round(255 * (1 - t * 0.2));
      const g = Math.round(200 * (1 - t * 0.4));
      const b = Math.round(50 * (1 - t * 0.7));
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), alpha);
      gfx.fillEllipse(cx, cy + 10, w, h);
    }

    // Animate the glow pulsing
    this.tweens.add({
      targets: gfx,
      alpha: 0.65,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** Diagonal light rays for cinematic drama */
  private renderLightRays(width: number, height: number): void {
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0);
    gfx.setDepth(36); // Behind logo glow

    // Three angled light shafts from upper-left
    const rays = [
      { x: 120, w: 80, angle: 15, alpha: 0.04 },
      { x: 360, w: 60, angle: 12, alpha: 0.03 },
      { x: 650, w: 100, angle: 18, alpha: 0.035 },
    ];

    for (const ray of rays) {
      gfx.fillStyle(0xffd700, ray.alpha);
      const skew = Math.tan((ray.angle * Math.PI) / 180) * height;
      gfx.fillTriangle(
        ray.x, 0,
        ray.x + ray.w, 0,
        ray.x + ray.w + skew, height,
      );
      gfx.fillTriangle(
        ray.x, 0,
        ray.x + ray.w + skew, height,
        ray.x + skew, height,
      );
    }

    // Slow drift animation
    this.tweens.add({
      targets: gfx,
      alpha: 0.4,
      duration: 4000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private renderTitleUi(titleLayout: typeof styleConfig.titleLayout): void {
    const wordmark = titleLayout.wordmark;
    const portrait = titleLayout.portrait;
    const wordmarkOrigin = anchorToOrigin(wordmark.anchor);
    const portraitOrigin = anchorToOrigin(portrait.anchor);
    const titleLogoAssetKey = 'title_logo';
    const { width, height } = titleLayout.viewport;

    // === LAYER 1: Light rays behind everything ===
    this.renderLightRays(width, height);

    // === LAYER 2: Radial glow behind the logo — THIS is what makes a title screen ===
    this.renderLogoGlow(wordmark.x, wordmark.y + 60);

    // === LAYER 3: Heavy particle field — rising embers/sparks ===
    if (this.textures.exists('particle_dot')) {
      // Rising embers from the ground — slow, large, atmospheric
      const embers = this.add.particles(0, 0, 'particle_dot', {
        x: { min: 100, max: 860 },
        y: { min: height - 40, max: height },
        lifespan: { min: 3000, max: 6000 },
        speed: { min: 8, max: 25 },
        scale: { start: 1.2, end: 0.2 },
        alpha: { start: 0.6, end: 0 },
        angle: { min: 260, max: 280 },
        tint: [0xffd700, 0xffaa33, 0xff8800, 0xffffff],
        frequency: 120,
        quantity: 1,
        blendMode: 'ADD',
      });
      embers.setDepth(37);
      embers.setScrollFactor(0);

      // Logo-area sparkle dust — concentrated near the title
      const logoDust = this.add.particles(0, 0, 'particle_dot', {
        x: { min: wordmark.x - 200, max: wordmark.x + 200 },
        y: { min: wordmark.y - 20, max: wordmark.y + 100 },
        lifespan: { min: 1500, max: 3000 },
        speed: { min: 3, max: 10 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.7, end: 0 },
        angle: { min: 240, max: 300 },
        tint: [0xffd700, 0xffffff],
        frequency: 80,
        quantity: 1,
        blendMode: 'ADD',
      });
      logoDust.setDepth(39);
      logoDust.setScrollFactor(0);
    }

    // === LAYER 4: Dark panel behind menu zone for readability ===
    const menuPanel = this.add.graphics();
    menuPanel.setScrollFactor(0);
    menuPanel.setDepth(50);
    // Gradient dark strip across the menu area
    const panelTop = 240;
    const panelHeight = 220;
    for (let i = 0; i < panelHeight; i += 1) {
      const distFromCenter = Math.abs(i - panelHeight / 2) / (panelHeight / 2);
      const a = 0.55 * (1 - distFromCenter * distFromCenter);
      menuPanel.fillStyle(0x000000, a);
      menuPanel.fillRect(0, panelTop + i, width, 1);
    }

    // === LAYER 5: Title logo — dramatic slam-in ===
    const logo = this.add
      .image(wordmark.x, wordmark.y - 80, wordmark.textureKey ?? titleLogoAssetKey)
      .setOrigin(wordmarkOrigin.x, wordmarkOrigin.y)
      .setScrollFactor(0)
      .setDepth(55)
      .setScale(wordmark.scale * 1.5)
      .setAlpha(0);

    // Slam in from above — overshoot then settle
    this.tweens.add({
      targets: logo,
      y: wordmark.y,
      alpha: 1,
      scale: wordmark.scale,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 200,
      onComplete: () => {
        // Camera shake on landing
        this.cameras.main.shake(80, 0.003);
        // Breathing pulse
        this.tweens.add({
          targets: logo,
          scale: wordmark.scale * 1.02,
          duration: 2000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // === LAYER 6: Portrait — slides in from right with punch ===
    const portraitImg = this.add
      .image(portrait.x + 60, portrait.y + 10, portrait.textureKey)
      .setOrigin(portraitOrigin.x, portraitOrigin.y)
      .setScale(portrait.scale * 0.8)
      .setScrollFactor(0)
      .setDepth(56)
      .setAlpha(0);

    this.tweens.add({
      targets: portraitImg,
      x: portrait.x,
      y: portrait.y,
      scale: portrait.scale,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 500,
    });

    // Float
    this.tweens.add({
      targets: portraitImg,
      y: portrait.y - 6,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 1000,
    });
  }

  private renderTitleSupplementalText(titleLayout: typeof styleConfig.titleLayout): void {
    if ((titleLayout.titleMode as string) === 'game-name-only') {
      return;
    }

    const typography = styleConfig.typography;
    const subtitleOrigin = anchorToOrigin(titleLayout.subtitle.anchor);
    const promptOrigin = anchorToOrigin(titleLayout.prompt.anchor);

    // Subtitle: "RECLAIM THE NETWORK" — dramatic reveal
    if (titleLayout.subtitle.text) {
      // Underline accent bar behind subtitle
      const barGfx = this.add.graphics();
      barGfx.setScrollFactor(0);
      barGfx.setDepth(57);
      barGfx.fillStyle(0xffd700, 0.15);
      barGfx.fillRect(titleLayout.subtitle.x - 180, titleLayout.subtitle.y + 2, 360, 16);
      barGfx.setAlpha(0);

      const subtitle = this.add
        .bitmapText(
          titleLayout.subtitle.x,
          titleLayout.subtitle.y,
          typography.fontKey,
          titleLayout.subtitle.text,
          titleLayout.subtitle.fontSizePx,
        )
        .setOrigin(subtitleOrigin.x, subtitleOrigin.y)
        .setCenterAlign()
        .setDepth(65)
        .setScrollFactor(0)
        .setTint(palette('hudAccent'))
        .setAlpha(0)
        .setScale(0.5);
      subtitle.setLetterSpacing(titleLayout.subtitle.letterSpacingPx);

      // Fly in with scale punch + bar reveal
      this.tweens.add({
        targets: subtitle,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut',
        delay: 800,
      });
      this.tweens.add({
        targets: barGfx,
        alpha: 1,
        duration: 600,
        ease: 'Sine.easeOut',
        delay: 900,
      });

      // Pulse the subtitle gently
      this.tweens.add({
        targets: subtitle,
        alpha: 0.75,
        duration: 1800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: 1400,
      });
    }

    // Bottom prompt (blinking) — visible above dark areas
    if (titleLayout.prompt.text) {
      const prompt = this.add
        .bitmapText(
          titleLayout.prompt.x,
          titleLayout.prompt.y,
          typography.fontKey,
          titleLayout.prompt.text,
          titleLayout.prompt.fontSizePx,
        )
        .setOrigin(promptOrigin.x, promptOrigin.y)
        .setCenterAlign()
        .setDepth(95)
        .setScrollFactor(0)
        .setTint(palette('hudText'))
        .setAlpha(0.6);
      prompt.setLetterSpacing(titleLayout.prompt.letterSpacingPx);

      this.promptBlink = this.time.addEvent({
        delay: titleLayout.prompt.blinkMs,
        loop: true,
        callback: () => {
          prompt.visible = !prompt.visible;
        },
      });
    }

    // Hints line (if any)
    if (titleLayout.hints.text) {
      const hintsOrigin = anchorToOrigin(titleLayout.hints.anchor);
      const hints = this.add
        .bitmapText(
          titleLayout.hints.x,
          titleLayout.hints.y,
          typography.fontKey,
          titleLayout.hints.text,
          titleLayout.hints.fontSizePx,
        )
        .setOrigin(hintsOrigin.x, hintsOrigin.y)
        .setCenterAlign()
        .setDepth(95)
        .setScrollFactor(0)
        .setTint(palette('hudText'));
      hints.setLetterSpacing(titleLayout.hints.letterSpacingPx);
      hints.setAlpha(0.35);
    }
  }
}
