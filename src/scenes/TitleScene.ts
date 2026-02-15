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
    this.renderMenu(titleLayout);
    this.animateEntrance(titleLayout);
    this.setSceneReadyMarker();
    this.setupInput(audio);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.promptBlink?.remove(false);
      this.promptBlink = null;
      this.cameraPanTween?.remove();
      this.cameraPanTween = null;
    });
  }

  private setupInput(audio: AudioEngine): void {
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
    const menuConfig = titleLayout.menu as MenuConfig;

    // Stagger menu items in
    const baseDelay = 400;
    for (let i = 0; i < this.menuTexts.length; i += 1) {
      const text = this.menuTexts[i];
      const targetY = text.y;
      text.y = targetY + 20;
      this.tweens.add({
        targets: text,
        alpha: i === this.menuIndex ? 1 : 0.55,
        y: targetY,
        duration: 350,
        ease: 'Back.easeOut',
        delay: baseDelay + i * 100,
      });
    }

    // Cursor appears after menu
    if (this.menuCursor) {
      const cursorDelay = baseDelay + this.menuTexts.length * 100 + 100;
      this.time.delayedCall(cursorDelay, () => {
        if (this.menuCursor) {
          this.menuCursor.setAlpha(1);
          this.menuActive = true;
          this.updateMenuCursor();

          // Cursor bob
          this.tweens.add({
            targets: this.menuCursor,
            x: this.menuCursor.x + 4,
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
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
        }
      },
    });

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

    const block = this.add
      .image(attract.questionBlock.x, attract.questionBlock.y, 'question_block')
      .setScale(attract.questionBlock.scale)
      .setDepth(-100);
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
        .setDepth(-98);
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

    this.tweens.add({
      targets: coinTokens,
      alpha: 0.74,
      duration: attract.coinLine.shimmerMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Vignette darkening overlay for depth
    this.renderVignette(titleLayout.viewport.width, titleLayout.viewport.height);
  }

  private renderVignette(width: number, height: number): void {
    const gfx = this.add.graphics();
    gfx.setScrollFactor(0);
    gfx.setDepth(90);

    // Top gradient
    for (let i = 0; i < 60; i += 1) {
      const alpha = 0.35 * (1 - i / 60);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(0, i, width, 1);
    }

    // Bottom gradient
    for (let i = 0; i < 80; i += 1) {
      const alpha = 0.5 * (1 - i / 80);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(0, height - i, width, 1);
    }

    // Side gradients
    for (let i = 0; i < 40; i += 1) {
      const alpha = 0.2 * (1 - i / 40);
      gfx.fillStyle(0x000000, alpha);
      gfx.fillRect(i, 0, 1, height);
      gfx.fillRect(width - i, 0, 1, height);
    }
  }

  private renderTitleUi(titleLayout: typeof styleConfig.titleLayout): void {
    const wordmark = titleLayout.wordmark;
    const portrait = titleLayout.portrait;
    const wordmarkOrigin = anchorToOrigin(wordmark.anchor);
    const portraitOrigin = anchorToOrigin(portrait.anchor);
    const titleLogoAssetKey = 'title_logo';

    // Title logo with drop-in animation
    const logo = this.add
      .image(wordmark.x, wordmark.y - 30, wordmark.textureKey ?? titleLogoAssetKey)
      .setOrigin(wordmarkOrigin.x, wordmarkOrigin.y)
      .setScrollFactor(0)
      .setDepth(40)
      .setScale(wordmark.scale)
      .setAlpha(0);

    this.tweens.add({
      targets: logo,
      y: wordmark.y,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 100,
    });

    // Portrait with fade-in
    const portraitImg = this.add
      .image(portrait.x, portrait.y, portrait.textureKey)
      .setOrigin(portraitOrigin.x, portraitOrigin.y)
      .setScale(portrait.scale)
      .setScrollFactor(0)
      .setDepth(44)
      .setAlpha(0);

    this.tweens.add({
      targets: portraitImg,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeIn',
      delay: 300,
    });

    // Gentle float on portrait
    this.tweens.add({
      targets: portraitImg,
      y: portrait.y - 4,
      duration: 2400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 800,
    });
  }

  private renderTitleSupplementalText(titleLayout: typeof styleConfig.titleLayout): void {
    if ((titleLayout.titleMode as string) === 'game-name-only') {
      return;
    }

    const typography = styleConfig.typography;
    const subtitleOrigin = anchorToOrigin(titleLayout.subtitle.anchor);
    const promptOrigin = anchorToOrigin(titleLayout.prompt.anchor);

    // Subtitle: "RECLAIM THE NETWORK"
    if (titleLayout.subtitle.text) {
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
        .setDepth(60)
        .setScrollFactor(0)
        .setTint(palette('hudAccent'))
        .setAlpha(0);
      subtitle.setLetterSpacing(titleLayout.subtitle.letterSpacingPx);

      this.tweens.add({
        targets: subtitle,
        alpha: 0.85,
        duration: 800,
        ease: 'Sine.easeIn',
        delay: 250,
      });
    }

    // Bottom prompt (blinking)
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
        .setDepth(60)
        .setScrollFactor(0)
        .setTint(palette('hudText'))
        .setAlpha(0.45);
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
        .setDepth(60)
        .setScrollFactor(0)
        .setTint(palette('hudText'));
      hints.setLetterSpacing(titleLayout.hints.letterSpacingPx);
      hints.setAlpha(0.4);
    }
  }
}
