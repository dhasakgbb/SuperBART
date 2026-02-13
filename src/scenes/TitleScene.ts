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

export class TitleScene extends Phaser.Scene {
  private promptBlink: Phaser.Time.TimerEvent | null = null;
  private cameraPanTween: Phaser.Tweens.Tween | null = null;
  private sceneReadyStableFrames = 2;

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
    const typography = styleConfig.typography;

    runtimeStore.mode = 'title';
    runtimeStore.save = loadSave();
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();

    this.cameras.main.setBackgroundColor(palette('skyDeep'));
    this.renderAttractBackground();
    this.renderTitleUi();
    this.setSceneReadyMarker();

    this.promptBlink = this.time.addEvent({
      delay: titleLayout.prompt.blinkMs,
      loop: true,
      callback: () => {
        const prompt = this.children.getByName('titlePrompt') as Phaser.GameObjects.BitmapText | null;
        if (prompt) {
          prompt.visible = !prompt.visible;
        }
      }
    });

    const subtitle = this.add
      .bitmapText(
        titleLayout.subtitle.x,
        titleLayout.subtitle.y,
        typography.fontKey,
        titleLayout.subtitle.text,
        titleLayout.subtitle.fontSizePx
      )
      .setOrigin(0.5, 0)
      .setTint(palette('hudText'))
      .setScrollFactor(0)
      .setDepth(45);
    subtitle.setLetterSpacing(titleLayout.subtitle.letterSpacingPx);

    const prompt = this.add
      .bitmapText(
        titleLayout.prompt.x,
        titleLayout.prompt.y,
        typography.fontKey,
        titleLayout.prompt.text,
        titleLayout.prompt.fontSizePx
      )
      .setOrigin(0.5, 0)
      .setTint(palette('hudAccent'))
      .setScrollFactor(0)
      .setDepth(45);
    prompt.setLetterSpacing(titleLayout.prompt.letterSpacingPx);
    prompt.setName('titlePrompt');

    const hints = this.add
      .bitmapText(
        titleLayout.hints.x,
        titleLayout.hints.y,
        typography.fontKey,
        titleLayout.hints.text,
        titleLayout.hints.fontSizePx
      )
      .setOrigin(0.5, 0)
      .setTint(palette('hudText'))
      .setScrollFactor(0)
      .setDepth(45);
    hints.setLetterSpacing(titleLayout.hints.letterSpacingPx);

    const goLevelSelect = (): void => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'WorldMapScene');
    };

    this.input.keyboard?.on('keydown-ENTER', () => {
      goLevelSelect();
    });

    this.input.keyboard?.on('keydown-L', () => {
      goLevelSelect();
    });

    this.input.keyboard?.on('keydown-N', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_confirm');
      const fresh = loadSave();
      runtimeStore.save = {
        ...fresh,
        progression: { score: 0, coins: 0, stars: 0, deaths: 0, timeMs: 0 },
        campaign: {
          ...fresh.campaign,
          world: 1,
          levelIndex: 1,
          unlockedLevelKeys: ['1-1'],
          completedLevelKeys: []
        }
      };
      persistSave(runtimeStore.save);
      transitionToScene(this, 'WorldMapScene');
    });

    this.input.keyboard?.on('keydown-S', () => {
      audio.unlockFromUserGesture();
      audio.playSfx('menu_move');
      transitionToScene(this, 'SettingsScene', { backScene: 'TitleScene' }, { durationMs: 160 });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.promptBlink?.remove(false);
      this.promptBlink = null;
      this.cameraPanTween?.remove();
      this.cameraPanTween = null;
    });
  }

  private renderTitleUi(): void {
    const titleLayout = styleConfig.titleLayout;
    const logoGlow = this.add
      .image(titleLayout.wordmark.x, titleLayout.wordmark.y + 4, 'title_logo')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setTint(palette('bloomWarm'))
      .setAlpha(styleConfig.bloom.strength * 0.46)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(39);
    logoGlow.setScale(titleLayout.wordmark.scale + 0.04);

    const logo = this.add
      .image(titleLayout.wordmark.x, titleLayout.wordmark.y, 'title_logo')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(40);
    logo.setScale(titleLayout.wordmark.scale);

    this.add
      .image(titleLayout.portrait.x, titleLayout.portrait.y, titleLayout.portrait.textureKey)
      .setOrigin(0, 0)
      .setScale(titleLayout.portrait.scale)
      .setScrollFactor(0)
      .setDepth(44);
  }

  private renderAttractBackground(): void {
    const titleLayout = styleConfig.titleLayout;
    const tileStep = styleConfig.spriteScale.tilePx;

    this.cameras.main.setBounds(0, 0, titleLayout.attract.worldWidthPx, titleLayout.viewport.height);
    this.cameras.main.setScroll(0, 0);
    this.cameraPanTween = this.tweens.addCounter({
      from: 0,
      to: titleLayout.attract.cameraPanPx,
      duration: titleLayout.attract.cameraPanMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        this.cameras.main.setScroll(tween.getValue(), 0);
      }
    });

    for (const cloud of titleLayout.attract.clouds) {
      const cloudSprite = this.add
        .image(cloud.x, cloud.y, cloud.key)
        .setScale(cloud.scale)
        .setAlpha(cloud.alpha)
        .setDepth(-990);
      const cloudGlow = this.add
        .image(cloud.x + tileStep / 2, cloud.y + tileStep / 2, cloud.key)
        .setScale(cloud.scale + 0.12)
        .setAlpha(cloud.alpha * 0.25)
        .setTint(palette('bloomWarm'))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-991);
      this.tweens.add({
        targets: [cloudSprite, cloudGlow],
        x: cloud.x + titleLayout.attract.cloudDriftPx,
        duration: titleLayout.attract.cloudDriftMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    const crop = titleLayout.attract.groundTileCrop;
    for (let row = 0; row < titleLayout.attract.groundRows; row += 1) {
      const y = titleLayout.attract.groundY + row * tileStep;
      for (let x = 0; x < titleLayout.attract.worldWidthPx; x += tileStep) {
        const tile = this.add.image(x, y, 'tileset').setOrigin(0, 0).setDepth(-120 + row);
        tile.setCrop(crop.x, crop.y, crop.w, crop.h);
      }
    }

    const block = this.add
      .image(titleLayout.attract.questionBlock.x, titleLayout.attract.questionBlock.y, 'question_block')
      .setScale(titleLayout.attract.questionBlock.scale)
      .setDepth(-100);
    const blockGlow = this.add
      .image(titleLayout.attract.questionBlock.x, titleLayout.attract.questionBlock.y, 'question_block')
      .setScale(titleLayout.attract.questionBlock.scale + 0.28)
      .setTint(palette('bloomWarm'))
      .setAlpha(styleConfig.bloom.strength * 0.36)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-101);
    this.tweens.add({
      targets: [block, blockGlow],
      y: titleLayout.attract.questionBlock.y - titleLayout.attract.questionBlock.bobPx,
      duration: titleLayout.attract.questionBlock.bobMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    const coinGlows = [];
    for (let i = 0; i < titleLayout.attract.coinLine.count; i += 1) {
      const x = titleLayout.attract.coinLine.startX + i * titleLayout.attract.coinLine.spacingPx;
      const token = this.add
        .image(x, titleLayout.attract.coinLine.y, 'pickup_token')
        .setScale(titleLayout.attract.coinLine.scale)
        .setDepth(-98);
      const glow = this.add
        .image(x, titleLayout.attract.coinLine.y, 'pickup_token')
        .setScale(titleLayout.attract.coinLine.scale + 0.25)
        .setTint(palette('bloomWarm'))
        .setAlpha(styleConfig.bloom.strength * 0.42)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(-99);
      coinGlows.push(glow);

      this.tweens.add({
        targets: [token, glow],
        y: titleLayout.attract.coinLine.y - tileStep / 2,
        duration: titleLayout.attract.coinLine.shimmerMs + i * 80,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    this.tweens.add({
      targets: coinGlows,
      alpha: styleConfig.bloom.strength * 0.2,
      duration: titleLayout.attract.coinLine.shimmerMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
}
