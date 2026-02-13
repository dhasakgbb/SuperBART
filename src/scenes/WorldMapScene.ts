import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import { runtimeStore } from '../core/runtime';
import { renderGameplayBackground } from '../rendering/parallax';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { campaignOrdinal, campaignRefFromOrdinal, levelKey } from '../systems/progression';
import { WORLD_NAMES } from '../levelgen/worldRules';
import { isLevelUnlocked, persistSave, setCurrentLevel } from '../systems/save';
import { transitionToScene } from './sceneFlow';

interface MapNode {
  key: string;
  x: number;
  y: number;
}

function color(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

function keyToRef(key: string): { world: number; levelIndex: number } {
  const [worldRaw, levelRaw] = key.split('-');
  return {
    world: Number(worldRaw),
    levelIndex: Number(levelRaw),
  };
}

export class WorldMapScene extends Phaser.Scene {
  private selectedOrdinal = 1;
  private nodeSprites = new Map<string, Phaser.GameObjects.Image>();
  private nodeLabels = new Map<string, Phaser.GameObjects.BitmapText>();
  private selectedBobTween: Phaser.Tweens.Tween | null = null;
  private sceneReadyStableFrames = 2;

  constructor() {
    super('WorldMapScene');
  }

  private orderedNodes(): MapNode[] {
    const byKey = new Map(styleConfig.worldMapLayout.nodes.map((node) => [node.key, node]));
    const ordered: MapNode[] = [];
    for (let world = 1; world <= CAMPAIGN_WORLD_LAYOUT.length; world += 1) {
      const levels = CAMPAIGN_WORLD_LAYOUT[world - 1] ?? 0;
      for (let levelIndex = 1; levelIndex <= levels; levelIndex += 1) {
        const key = levelKey(world, levelIndex);
        const node = byKey.get(key);
        if (node) {
          ordered.push(node);
        }
      }
    }
    return ordered;
  }

  private renderHeaderAndHints(): void {
    const layout = styleConfig.worldMapLayout;
    const font = styleConfig.typography.fontKey;

    const title = this.add
      .bitmapText(layout.title.x, layout.title.y, font, layout.title.text, layout.title.fontSizePx)
      .setOrigin(0.5, 0)
      .setTint(color('hudAccent'))
      .setDepth(70);
    title.setLetterSpacing(layout.title.letterSpacingPx);

    const subtitle = this.add
      .bitmapText(layout.subtitle.x, layout.subtitle.y, font, layout.subtitle.text, layout.subtitle.fontSizePx)
      .setOrigin(0.5, 0)
      .setTint(color('hudText'))
      .setDepth(70);
    subtitle.setLetterSpacing(layout.subtitle.letterSpacingPx);

    const hints = this.add
      .bitmapText(layout.hints.x, layout.hints.y, font, layout.hints.text, layout.hints.fontSizePx)
      .setOrigin(0.5, 0)
      .setTint(color('hudText'))
      .setDepth(70);
    hints.setLetterSpacing(layout.hints.letterSpacingPx);
  }

  private renderWorldLabels(): void {
    const font = styleConfig.typography.fontKey;
    for (const row of styleConfig.worldMapLayout.worldLabels) {
      this.add
        .bitmapText(row.x, row.y, font, WORLD_NAMES[row.world] ?? `WORLD ${row.world}`, 14)
        .setOrigin(0, 0)
        .setTint(color('hudText'))
        .setDepth(55);
    }
  }

  private renderPathDots(): void {
    const layout = styleConfig.worldMapLayout.mapPath;
    const ordered = this.orderedNodes();
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const from = ordered[i]!;
      const to = ordered[i + 1]!;
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.max(2, Math.floor(distance / layout.spacingPx));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = Phaser.Math.Linear(from.x, to.x, t);
        const y = Phaser.Math.Linear(from.y, to.y, t);
        this.add
          .image(x, y, layout.textureKey)
          .setScale(layout.scale)
          .setAlpha(layout.alpha)
          .setDepth(40);
      }
    }
  }

  private renderNodes(): void {
    this.nodeSprites.clear();
    this.nodeLabels.clear();

    const layout = styleConfig.worldMapLayout;
    const font = styleConfig.typography.fontKey;
    for (const node of layout.nodes) {
      const sprite = this.add
        .image(node.x, node.y, layout.nodeSpriteKeys.locked)
        .setScale(layout.nodeScale.base)
        .setDepth(64);
      sprite.setData('baseY', node.y);
      this.nodeSprites.set(node.key, sprite);

      const label = this.add
        .bitmapText(node.x, node.y + 14, font, node.key, 10)
        .setOrigin(0.5, 0)
        .setDepth(65);
      this.nodeLabels.set(node.key, label);
    }
  }

  private updateSelectionVisuals(): void {
    const layout = styleConfig.worldMapLayout;
    const completed = new Set(runtimeStore.save.campaign.completedLevelKeys);
    let selectedSprite: Phaser.GameObjects.Image | null = null;

    for (const node of layout.nodes) {
      const ref = keyToRef(node.key);
      const ordinal = campaignOrdinal(ref.world, ref.levelIndex);
      const selected = ordinal === this.selectedOrdinal;
      const unlocked = isLevelUnlocked(runtimeStore.save, ref.world, ref.levelIndex);
      const done = completed.has(node.key);

      const sprite = this.nodeSprites.get(node.key);
      const label = this.nodeLabels.get(node.key);
      if (!sprite || !label) {
        continue;
      }

      const textureKey = selected
        ? layout.nodeSpriteKeys.selected
        : done
          ? layout.nodeSpriteKeys.done
          : unlocked
            ? layout.nodeSpriteKeys.open
            : layout.nodeSpriteKeys.locked;
      sprite.setTexture(textureKey);
      sprite.setScale(selected ? layout.nodeScale.selected : layout.nodeScale.base);
      sprite.y = Number(sprite.getData('baseY'));

      const labelTint = selected
        ? color('hudAccent')
        : done
          ? color('grassTop')
          : unlocked
            ? color('hudText')
            : color('inkSoft');
      label.setTint(labelTint);

      if (selected) {
        selectedSprite = sprite;
      }
    }

    this.selectedBobTween?.remove();
    this.selectedBobTween = null;
    if (selectedSprite) {
      this.selectedBobTween = this.tweens.add({
        targets: selectedSprite,
        y: Number(selectedSprite.getData('baseY')) - layout.selectionBob.distancePx,
        duration: layout.selectionBob.durationMs,
        ease: 'Sine.easeInOut',
        repeat: -1,
        yoyo: true,
      });
    }
  }

  private moveSelection(delta: number): void {
    this.selectedOrdinal = Math.min(TOTAL_CAMPAIGN_LEVELS, Math.max(1, this.selectedOrdinal + delta));
    this.updateSelectionVisuals();
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
    runtimeStore.mode = 'level_select';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();

    const { world, levelIndex } = runtimeStore.save.campaign;
    this.selectedOrdinal = campaignOrdinal(world, levelIndex);

    this.cameras.main.setBackgroundColor(color('skyDeep'));
    this.cameras.main.setBounds(0, 0, styleConfig.worldMapLayout.viewport.width, styleConfig.worldMapLayout.viewport.height);
    renderGameplayBackground(
      this,
      styleConfig.worldMapLayout.viewport.width,
      styleConfig.worldMapLayout.viewport.height,
      styleConfig.gameplayLayout,
    );
    this.renderHeaderAndHints();
    this.renderWorldLabels();
    this.renderPathDots();
    this.renderNodes();
    this.updateSelectionVisuals();
    this.setSceneReadyMarker();

    this.input.keyboard?.on('keydown-UP', () => {
      this.moveSelection(-1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.moveSelection(1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.moveSelection(-1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.moveSelection(1);
      audio.playSfx('menu_move');
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'TitleScene');
    });
    this.input.keyboard?.on('keydown-S', () => {
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'SettingsScene', { backScene: 'WorldMapScene' }, { durationMs: 160 });
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      const selected = campaignRefFromOrdinal(this.selectedOrdinal);
      if (!isLevelUnlocked(runtimeStore.save, selected.world, selected.levelIndex)) {
        audio.playSfx('menu_move');
        return;
      }
      audio.playSfx('menu_confirm');
      runtimeStore.save = setCurrentLevel(runtimeStore.save, selected.world, selected.levelIndex);
      persistSave(runtimeStore.save);
      transitionToScene(this, 'PlayScene', { bonus: false });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.selectedBobTween?.remove();
      this.selectedBobTween = null;
    });
  }
}
