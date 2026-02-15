import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { CAMPAIGN_WORLD_LAYOUT, TOTAL_CAMPAIGN_LEVELS } from '../core/constants';
import { runtimeStore } from '../core/runtime';
import { renderGameplayBackground } from '../rendering/parallax';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { campaignOrdinal, campaignRefFromOrdinal, isLevelEvalComplete, levelKey, resolveBonusRouteByLevel } from '../systems/progression';
import { WORLD_NAMES } from '../levelgen/worldRules';
import { isLevelUnlocked, persistSave, setCurrentLevel } from '../systems/save';
import { transitionToScene } from './sceneFlow';

interface MapNode {
  key: string;
  x: number;
  y: number;
}

type WorldMapData = {
  revealWorld?: number;
  revealFromWorld?: number;
};

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
  private maintenanceAccess = false;
  private nodeSprites = new Map<string, Phaser.GameObjects.Image>();
  private nodeLabels = new Map<string, Phaser.GameObjects.BitmapText>();
  private nodeGlows = new Map<string, Phaser.GameObjects.Image>();
  private hintsText?: Phaser.GameObjects.BitmapText;
  private maintenanceText?: Phaser.GameObjects.BitmapText;
  private reclaimedFigureTweens: Phaser.Tweens.Tween[] = [];
  private selectedBobTween: Phaser.Tweens.Tween | null = null;
  private mapBart?: Phaser.GameObjects.Sprite;
  private fogByWorld = new Map<number, Phaser.GameObjects.Rectangle[]>();
  private fogRevealAccents = new Map<number, Phaser.GameObjects.GameObject[]>();
  private mapRevealPendingWorld?: number;
  private readonly fogRevealMs = 2000;
  private readonly fogColor = 0x000000;
  private readonly fogAlpha = 0.72;
  private readonly fogRevealAccentColor = color('hudAccent');
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
        const node = byKey.get(key as any);
        if (node) {
          ordered.push(node);
        }
      }
    }
    return ordered;
  }

  private nodesForWorld(world: number): MapNode[] {
    return this.orderedNodes().filter((node) => {
      const ref = keyToRef(node.key);
      return ref.world === world;
    });
  }

  private getCurrentCampaignOrdinal(): number {
    const { world, stage, levelIndex } = runtimeStore.save.campaign;
    return campaignOrdinal(world, stage ?? levelIndex);
  }

  getSelectableOrdinals(): number[] {
    return this.orderedNodes().map((node) => {
      const ref = keyToRef(node.key);
      return campaignOrdinal(ref.world, ref.levelIndex);
    });
  }

  getSelectedOrdinal(): number {
    return this.selectedOrdinal;
  }

  requestSelection(ordinal: number): boolean {
    const clampedOrdinal = Math.min(
      Math.max(1, Math.floor(Number(ordinal) || 0)),
      TOTAL_CAMPAIGN_LEVELS,
    );
    if (clampedOrdinal === this.selectedOrdinal && this.maintenanceAccess === false && clampedOrdinal !== this.getCurrentCampaignOrdinal()) {
      return false;
    }

    if (!this.maintenanceAccess && clampedOrdinal !== this.getCurrentCampaignOrdinal()) {
      return false;
    }

    if (this.maintenanceAccess && !this.canSelectOrdinal(clampedOrdinal)) {
      return false;
    }

    if (this.selectedOrdinal === clampedOrdinal) {
      return false;
    }

    this.selectedOrdinal = clampedOrdinal;
    this.updateSelectionVisuals();
    return true;
  }

  refreshSelectionVisuals(): void {
    this.updateSelectionVisuals();
  }

  private hasMaintenanceAccessAvailable(): boolean {
    return Object.values(runtimeStore.save.worldStates).some((state) => state === 'reclaimed');
  }

  private isMaintenanceTarget(world: number, levelIndex: number): boolean {
    if (runtimeStore.save.worldStates[world] !== 'reclaimed') {
      return false;
    }
    return runtimeStore.save.campaign.completedLevelKeys.includes(levelKey(world, levelIndex));
  }

  private canSelectOrdinal(ordinal: number): boolean {
    const ref = campaignRefFromOrdinal(ordinal);
    if (this.maintenanceAccess) {
      return this.isMaintenanceTarget(ref.world, ref.levelIndex);
    }
    return ordinal === this.getCurrentCampaignOrdinal();
  }

  private pickDefaultMaintenanceOrdinal(): number {
    const ordered = this.orderedNodes();
    for (const node of ordered) {
      const ref = keyToRef(node.key);
      const ordinal = campaignOrdinal(ref.world, ref.levelIndex);
      if (this.isMaintenanceTarget(ref.world, ref.levelIndex)) {
        return ordinal;
      }
    }
    return this.getCurrentCampaignOrdinal();
  }

  private resolveMapHintText(): string {
    if (this.maintenanceAccess) {
      return 'ARROWS: SELECT STAGE   ENTER: DEPLOY   M: MAINT ACCESS OFF   ESC: TITLE   S: SETTINGS';
    }
    return 'ENTER: DEPLOY NEXT NODE   M: MAINT ACCESS   ESC: TITLE   S: SETTINGS';
  }

  private resolveMaintenanceStatusText(): string {
    if (this.maintenanceAccess) {
      return 'MAINTENANCE ACCESS: ENABLED';
    }
    if (this.hasMaintenanceAccessAvailable()) {
      return 'MAINTENANCE ACCESS: AVAILABLE';
    }
    return 'MAINTENANCE ACCESS: LOCKED';
  }

  private refreshMapModeUi(): void {
    this.hintsText?.setText(this.resolveMapHintText());
    this.maintenanceText?.setText(this.resolveMaintenanceStatusText());
  }

  private toggleMaintenanceAccess(): void {
    if (!this.hasMaintenanceAccessAvailable()) {
      return;
    }
    this.maintenanceAccess = !this.maintenanceAccess;
    if (this.maintenanceAccess) {
      this.selectedOrdinal = this.pickDefaultMaintenanceOrdinal();
    } else {
      this.selectedOrdinal = this.getCurrentCampaignOrdinal();
    }
    this.refreshMapModeUi();
    this.updateSelectionVisuals();
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

    this.hintsText = this.add
      .bitmapText(layout.hints.x, layout.hints.y, font, this.resolveMapHintText(), layout.hints.fontSizePx)
      .setOrigin(0.5, 0)
      .setTint(color('hudText'))
      .setDepth(70);
    this.hintsText.setLetterSpacing(layout.hints.letterSpacingPx);

    this.maintenanceText = this.add
      .bitmapText(layout.hints.x, layout.hints.y - 24, font, this.resolveMaintenanceStatusText(), 12)
      .setOrigin(0.5, 0)
      .setTint(color('inkSoft'))
      .setDepth(70);
    this.maintenanceText.setLetterSpacing(1);
  }

  private renderWorldLabels(): void {
    const font = styleConfig.typography.fontKey;
    for (const row of styleConfig.worldMapLayout.worldLabels) {
      const worldState = runtimeStore.save.worldStates[row.world];
      const tint = worldState === 'reclaimed'
        ? color('grassTop')
        : worldState === 'next'
          ? color('hudAccent')
          : color('inkSoft');
      this.add
        .bitmapText(row.x, row.y, font, WORLD_NAMES[row.world] ?? `WORLD ${row.world}`, 14)
        .setOrigin(0, 0)
        .setTint(tint)
        .setDepth(55);
    }
  }

  private renderLivingMapFigures(): void {
    this.reclaimedFigureTweens.forEach((tween) => tween.remove());
    this.reclaimedFigureTweens = [];
    const font = styleConfig.typography.fontKey;
    for (const row of styleConfig.worldMapLayout.worldLabels) {
      if (runtimeStore.save.worldStates[row.world] !== 'reclaimed') {
        continue;
      }
      const marker = this.add
        .bitmapText(row.x + 272, row.y + 2, font, '•', 10)
        .setTint(color('hudText'))
        .setDepth(56)
        .setAlpha(0);
      const wakeDelay = 2000 + row.world * 110;
      this.tweens.add({
        targets: marker,
        alpha: 0.72,
        duration: 360,
        delay: wakeDelay,
        onComplete: () => {
          const tween = this.tweens.add({
            targets: marker,
            y: marker.y - 3,
            duration: 820,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true,
          });
          this.reclaimedFigureTweens.push(tween);
        },
      });
    }
  }

  private buildWorldFogOverlays(world: number, nodes: MapNode[]): Phaser.GameObjects.Rectangle[] {
    this.destroyFogRevealLayer(world);

    const worldFigures: Phaser.GameObjects.Rectangle[] = [];
    const worldAccents: Phaser.GameObjects.GameObject[] = [];
    this.fogByWorld.set(world, worldFigures);
    this.fogRevealAccents.set(world, worldAccents);

    for (const node of nodes) {
      const index = Number(node.key.replace('-', '')) || 0;
      const rect = this.add
        .rectangle(node.x - 24, node.y - 12, 64, 42, this.fogColor, this.fogAlpha)
        .setOrigin(0, 0)
        .setDepth(69);
      worldFigures.push(rect);

      const accent = this.add
        .graphics()
        .lineStyle(2, this.fogRevealAccentColor, 0.5)
        .strokeRect(node.x - 28, node.y - 16, 72, 50)
        .setDepth(69.5)
        .setVisible(false);
      worldAccents.push(accent);

      const crack = this.add
        .graphics()
        .setDepth(70)
        .setVisible(false);
      const originX = node.x - 20;
      const originY = node.y - 4;
      crack.lineStyle(2, this.fogRevealAccentColor, 0.8);
      for (let i = 0; i < 6; i += 1) {
        const segmentSeed = index + i * 7;
        const x1 = originX + (segmentSeed * 13) % 40;
        const y1 = originY + (segmentSeed * 9) % 22;
        const x2 = originX + 32 + ((segmentSeed * 17) % 40);
        const y2 = originY + 8 + ((segmentSeed * 19) % 20);
        crack.beginPath();
        crack.moveTo(x1, y1);
        crack.lineTo(x2, y2);
        crack.strokePath();
      }
      worldAccents.push(crack);
    }
    return worldFigures;
  }

  private destroyFogRevealLayer(world: number): void {
    const existingFog = this.fogByWorld.get(world);
    if (existingFog) {
      existingFog.forEach((overlay) => overlay.destroy());
      this.fogByWorld.delete(world);
    }

    const existingAccents = this.fogRevealAccents.get(world);
    if (existingAccents) {
      existingAccents.forEach((accent) => accent.destroy());
      this.fogRevealAccents.delete(world);
    }
  }

  private destroyFogRevealAccents(world: number): void {
    const accents = this.fogRevealAccents.get(world);
    if (!accents) {
      return;
    }
    accents.forEach((accent) => accent.destroy());
    this.fogRevealAccents.delete(world);
  }

  private revealFogForWorld(world: number): void {
    const overlays = this.fogByWorld.get(world);
    if (!overlays || overlays.length === 0) {
      this.destroyFogRevealAccents(world);
      return;
    }

    AudioEngine.shared().playSfx('fog_crack');
    overlays.forEach((overlay, index) => {
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        delay: index * 24,
        duration: this.fogRevealMs,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          overlay.destroy();
        },
      });

      this.tweens.add({
        targets: overlay,
        y: overlay.y - 1,
        duration: this.fogRevealMs,
        ease: 'Sine.easeOut',
      });
      this.tweens.add({
        targets: overlay,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 280,
        delay: index * 24,
        ease: 'Sine.easeInOut',
      });
    });

    const accents = this.fogRevealAccents.get(world) ?? [];
    accents.forEach((accent, index) => {
      accent.setVisible(true);
      accent.setAlpha(0);
      this.tweens.add({
        targets: accent,
        alpha: 1,
        duration: 160,
        ease: 'Sine.easeOut',
        delay: Math.min(320, index * 28),
        onComplete: () => {
          this.tweens.add({
            targets: accent,
            alpha: 0,
            duration: 260,
            ease: 'Sine.easeIn',
          });
        },
      });
    });

    this.time.delayedCall(this.fogRevealMs + 320, () => {
      this.destroyFogRevealAccents(world);
    });

    this.fogByWorld.delete(world);
  }

  private renderFogStateFromWorldStates(): void {
    [...new Set([...this.fogByWorld.keys(), ...this.fogRevealAccents.keys()])].forEach((world) => {
      this.destroyFogRevealLayer(world);
    });

    for (const [worldKey, state] of Object.entries(runtimeStore.save.worldStates)) {
      const world = Number(worldKey);
      if (!Number.isFinite(world)) {
        continue;
      }
      if (this.fogByWorld.has(world) || this.fogRevealAccents.has(world)) {
        this.destroyFogRevealLayer(world);
      }
      if (state === 'unclaimed' || state === 'next') {
        this.buildWorldFogOverlays(world, this.nodesForWorld(world));
      }
    }
  }

  private renderPathDots(): void {
    const layout = styleConfig.worldMapLayout.mapPath;
    const ordered = this.orderedNodes();
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const from = ordered[i]!;
      const to = ordered[i + 1]!;
      const fromRef = keyToRef(from.key);
      const toRef = keyToRef(to.key);
      const fromState = runtimeStore.save.worldStates[fromRef.world];
      const toState = runtimeStore.save.worldStates[toRef.world];
      const pathTint = fromState === 'reclaimed' && toState === 'reclaimed'
        ? color('grassTop')
        : fromState === 'reclaimed'
          ? color('hudAccent')
          : color('groundWarm');
      const pathAlpha = fromState === 'reclaimed' ? layout.alpha : layout.alpha * 0.7;
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.max(2, Math.floor(distance / layout.spacingPx));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = Phaser.Math.Linear(from.x, to.x, t);
        const y = Phaser.Math.Linear(from.y, to.y, t);
        this.add
          .image(x, y, layout.textureKey)
          .setScale(layout.scale)
          .setTint(pathTint)
          .setAlpha(pathAlpha)
          .setDepth(40);
      }
    }
  }

  private renderNodes(): void {
    this.nodeSprites.clear();
    this.nodeLabels.clear();
    this.nodeGlows.clear();

    const layout = styleConfig.worldMapLayout;
    const font = styleConfig.typography.fontKey;
    for (const node of layout.nodes) {
      const sprite = this.add
        .image(node.x, node.y, layout.nodeSpriteKeys.locked)
        .setScale(layout.nodeScale.base)
        .setDepth(64);
      sprite.setData('baseY', node.y);
      this.nodeSprites.set(node.key, sprite);
      const glow = this.add
        .image(node.x, node.y, layout.nodeSpriteKeys.done)
        .setScale(layout.nodeScale.base)
        .setAlpha(0)
        .setTint(color('hudAccent'))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(63);
      this.nodeGlows.set(node.key, glow);

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
      const evalComplete = isLevelEvalComplete(runtimeStore.save, ref.world, ref.levelIndex);
      const worldState = runtimeStore.save.worldStates[ref.world];
      const glow = this.nodeGlows.get(node.key);

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
      sprite.setData('worldState', worldState ?? 'unclaimed');

      if (worldState === 'reclaimed') {
        sprite.setTint(done ? color('grassTop') : color('hudAccent'));
      } else if (worldState === 'next') {
        sprite.setTint(color('hudAccent'));
      } else {
        sprite.setTint(color('groundWarm'));
      }

      const labelTint = selected
        ? color('hudAccent')
        : evalComplete
          ? color('hudAccent')
          : done
          ? color('grassTop')
          : unlocked
            ? color('hudText')
            : color('inkSoft');
      label.setTint(labelTint);

      if (worldState === 'unclaimed') {
        // Unclaimed nodes have pulsing alpha and red tint
        const pulse = 0.74 + (Math.sin((this.time.now + ordinal * 130) / 260) + 1) * 0.12;
        sprite.setAlpha(pulse);
        sprite.setTint(0xff4444); // Red tint for encrypted/locked nodes
      } else if (worldState === 'next') {
        // Next nodes get a reveal animation when first unlocked
        sprite.setAlpha(1);
      } else {
        sprite.setAlpha(1);
      }

      if (glow) {
        if (evalComplete) {
          glow.setVisible(true);
          glow.setScale(selected ? layout.nodeScale.selected * 1.06 : layout.nodeScale.base * 1.01);
          glow.setAlpha(selected ? 0.62 : 0.38);
        } else {
          glow.setVisible(false);
          glow.setAlpha(0);
        }
      }

      if (selected) {
        selectedSprite = sprite;
      }
    }

    this.refreshMapModeUi();

    // Map Bart Movement
    if (selectedSprite && this.mapBart) {
       this.tweens.add({
           targets: this.mapBart,
           x: selectedSprite.x - 2,
           y: selectedSprite.y - 32, // Stand above the node
           duration: 300,
           ease: 'Sine.easeOut'
       });
       
       // Ensure he is facing the right way if we move
       // (Simplified: always face right or flip based on x delta?)
       // For now, just play idle.
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

  private moveSelection(delta: number): boolean {
    if (!this.maintenanceAccess) {
      const current = this.getCurrentCampaignOrdinal();
      const changed = this.selectedOrdinal !== current;
      this.selectedOrdinal = current;
      this.updateSelectionVisuals();
      return changed;
    }

    const direction = delta >= 0 ? 1 : -1;
    let probe = this.selectedOrdinal;
    for (let step = 0; step < TOTAL_CAMPAIGN_LEVELS; step += 1) {
      probe += direction;
      if (probe > TOTAL_CAMPAIGN_LEVELS) {
        probe = 1;
      } else if (probe < 1) {
        probe = TOTAL_CAMPAIGN_LEVELS;
      }
      if (this.canSelectOrdinal(probe)) {
        const changed = this.selectedOrdinal !== probe;
        this.selectedOrdinal = probe;
        this.updateSelectionVisuals();
        return changed;
      }
    }

    this.updateSelectionVisuals();
    return false;
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

  create(data: WorldMapData = {}): void {
    runtimeStore.mode = 'world_map';
    const audio = AudioEngine.shared();
    audio.configureFromSettings(runtimeStore.save.settings);
    audio.stopMusic();
    audio.startWorldMapMusic();

    const { world, stage, levelIndex } = runtimeStore.save.campaign;
    this.selectedOrdinal = campaignOrdinal(world, stage ?? levelIndex);
    this.maintenanceAccess = false;
    this.mapRevealPendingWorld = data.revealWorld;
    

    this.cameras.main.setBackgroundColor(color('skyBlue'));
    this.cameras.main.setBounds(0, 0, styleConfig.worldMapLayout.viewport.width, styleConfig.worldMapLayout.viewport.height);
    
    // NEW: Premium World Map Background
    const mapBg = this.add.image(0, 0, 'world_map_premium')
        .setOrigin(0, 0)
        .setDisplaySize(styleConfig.worldMapLayout.viewport.width, styleConfig.worldMapLayout.viewport.height)
        .setDepth(0);

    // Create Animations for Map Bart
    if (!this.anims.exists('map_bart_idle')) {
        this.anims.create({
            key: 'map_bart_idle',
            frames: this.anims.generateFrameNumbers('bart_map_animated', { start: 0, end: 3 }), // Assuming 4 frame idle, adjust if needed
            frameRate: 6,
            repeat: -1
        });
    }

    this.renderHeaderAndHints();
    this.renderWorldLabels();
    this.renderPathDots();
    this.renderNodes();
    this.renderLivingMapFigures();
    this.renderFogStateFromWorldStates();
    if (this.mapRevealPendingWorld != null) {
      const revealWorld = this.mapRevealPendingWorld;
      const targetNodes = this.nodesForWorld(revealWorld);
      if (!this.fogByWorld.has(this.mapRevealPendingWorld) && targetNodes.length > 0) {
        this.buildWorldFogOverlays(this.mapRevealPendingWorld, targetNodes);
      }
      this.revealFogForWorld(revealWorld);
      this.mapRevealPendingWorld = undefined;
    }
    
    // NEW: Bart Cursor Sprite
    // We create it here, but position it in updateSelectionVisuals
    this.mapBart = this.add.sprite(0, 0, 'bart_map_animated')
        .setScale(2.0)
        .setDepth(100)
        .play('map_bart_idle');

    this.updateSelectionVisuals();
    this.setSceneReadyMarker();

    this.input.keyboard?.on('keydown-UP', () => {
      if (this.moveSelection(-1)) {
        audio.playSfx('menu_move');
      }
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      if (this.moveSelection(1)) {
        audio.playSfx('menu_move');
      }
    });
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.moveSelection(-1)) {
        audio.playSfx('menu_move');
      }
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.moveSelection(1)) {
        audio.playSfx('menu_move');
      }
    });
    this.input.keyboard?.on('keydown-M', () => {
      const before = this.maintenanceAccess;
      this.toggleMaintenanceAccess();
      if (before !== this.maintenanceAccess) {
        audio.playSfx('menu_confirm');
      }
    });
    this.input.keyboard?.on('keydown-L', () => {
      const before = this.maintenanceAccess;
      this.toggleMaintenanceAccess();
      if (before !== this.maintenanceAccess) {
        audio.playSfx('menu_confirm');
      }
    });
    this.input.keyboard?.on('keydown-N', () => {
      this.maintenanceAccess = false;
      this.selectedOrdinal = this.getCurrentCampaignOrdinal();
      this.updateSelectionVisuals();
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
      const bonusRouteId = resolveBonusRouteByLevel(selected.world, selected.levelIndex);
      if (!this.maintenanceAccess) {
        runtimeStore.save = setCurrentLevel(runtimeStore.save, selected.world, selected.levelIndex, false, bonusRouteId);
        persistSave(runtimeStore.save);
        audio.playSfx('menu_confirm');
        transitionToScene(this, 'PlayScene', {
          bonus: false,
          bonusRouteId,
          maintenance: false,
        });
        return;
      }
      if (!this.canSelectOrdinal(this.selectedOrdinal) || !isLevelUnlocked(runtimeStore.save, selected.world, selected.levelIndex)) {
        audio.playSfx('menu_move');
        return;
      }
      runtimeStore.save = setCurrentLevel(runtimeStore.save, selected.world, selected.levelIndex, true, bonusRouteId);
      persistSave(runtimeStore.save);
      audio.playSfx('menu_confirm');
      transitionToScene(this, 'PlayScene', { bonus: false, bonusRouteId, maintenance: true });
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.selectedBobTween?.remove();
      this.selectedBobTween = null;
      this.reclaimedFigureTweens.forEach((tween) => tween.remove());
      this.reclaimedFigureTweens = [];
      this.fogByWorld.forEach((overlays) => {
        for (const overlay of overlays) {
          overlay.destroy();
        }
      });
      this.fogByWorld.clear();
    });
  }
}
