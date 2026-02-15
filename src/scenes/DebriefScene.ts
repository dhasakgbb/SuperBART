import Phaser from 'phaser';
import { getDebriefDocument } from '../content/scriptNarrative';
import { WORLD_NAMES } from '../content/contentManifest';
import { runtimeStore } from '../core/runtime';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { transitionToScene } from './sceneFlow';

function palette(name: string): number {
  return Phaser.Display.Color.HexStringToColor(stylePalette[name] ?? '#ffffff').color;
}

function parseWorldFromNodeKey(key: string): number {
  const [worldRaw] = key.split('-');
  const parsed = Number(worldRaw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class DebriefScene extends Phaser.Scene {
  private canSkipIntercept = false;
  private movedToMapPart = false;
  private canAdvanceToMapPart = false;
  private completionInProgress = false;

  private world = 1;
  private revealWorld?: number;
  private revealFromWorld?: number;
  private beat = 1;
  private beatLayers: Phaser.GameObjects.GameObject[] = [];
  private beatPulse?: Phaser.Tweens.Tween;

  constructor() {
    super('DebriefScene');
  }

  private clearBeatLayers(): void {
    this.beatPulse?.remove();
    this.beatPulse = undefined;
    this.beatLayers.forEach((obj) => {
      if (obj.active) {
        obj.destroy();
      }
    });
    this.beatLayers = [];
  }

  private registerBeatLayers(...objects: Phaser.GameObjects.GameObject[]): void {
    this.beatLayers.push(...objects);
  }

  create(data: { world?: number; revealWorld?: number; revealFromWorld?: number }): void {
    this.world = data.world ?? 1;
    this.revealWorld = data.revealWorld;
    this.revealFromWorld = data.revealFromWorld;
    this.canSkipIntercept = false;
    this.canAdvanceToMapPart = false;
    this.movedToMapPart = false;
    this.completionInProgress = false;
    this.beat = 1;
    this.clearBeatLayers();

    const document = getDebriefDocument(this.world);
    const typography = styleConfig.typography;
    this.cameras.main.setBackgroundColor(palette('inkDark'));

    const title = this.add
      .bitmapText(72, 70, typography.fontKey, '', 24)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1);

    const body = this.add
      .bitmapText(72, 136, typography.fontKey, '', 16)
      .setTint(palette('hudText'))
      .setMaxWidth(820)
      .setLetterSpacing(1);

    const hint = this.add
      .bitmapText(72, 490, typography.fontKey, '', 14)
      .setTint(palette('inkSoft'))
      .setLetterSpacing(1);

    this.playExitBeat(title, body, hint, document);
  }

  private playExitBeat(
    title: Phaser.GameObjects.BitmapText,
    body: Phaser.GameObjects.BitmapText,
    hint: Phaser.GameObjects.BitmapText,
    _document: ReturnType<typeof getDebriefDocument>,
  ): void {
    this.beat = 1;
    this.clearBeatLayers();
    title.setText(`DEBRIEF // WORLD ${this.world}`);
    body.setText('PART 1: BART EXITS THE FACILITY. INTERCEPT LINES DIM.');
    hint.setText('');

    const exitGlow = this.add
      .rectangle(480, 300, 840, 275, palette('skyDeep'), 0.35)
      .setDepth(10)
      .setOrigin(0.5, 0.5);
    exitGlow.setStrokeStyle(2, palette('hudAccent'), 0.8);
    const exitLine = this.add
      .rectangle(480, 440, 840, 10, palette('groundWarm'), 0.12)
      .setDepth(11)
      .setOrigin(0.5, 0.5);
    exitLine.setScale(1);
    this.beatPulse = this.tweens.add({
      targets: exitGlow,
      alpha: { from: 0.22, to: 0.44 },
      duration: 860,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.registerBeatLayers(exitGlow, exitLine);

    this.time.delayedCall(3200, () => {
      this.playInterceptBeat(title, body, hint, _document);
    });
  }

  private playInterceptBeat(
    title: Phaser.GameObjects.BitmapText,
    body: Phaser.GameObjects.BitmapText,
    hint: Phaser.GameObjects.BitmapText,
    document: ReturnType<typeof getDebriefDocument>,
  ): void {
    this.beat = 2;
    this.clearBeatLayers();

    title.setText(document?.title ?? 'INTERCEPT PROJECTION');
    body.setText(document?.text ?? 'NO INTERCEPT AVAILABLE.');
    hint.setText('');

    const panel = this.add
      .rectangle(480, 300, 860, 285, 0x020611, 0.74)
      .setDepth(14)
      .setOrigin(0.5, 0.5);
    panel.setStrokeStyle(2, palette('hudAccent'), 0.85);
    const scanline = this.add
      .rectangle(480, 300, 840, 2, palette('hudAccent'), 0.26)
      .setDepth(15)
      .setOrigin(0.5, 0.5);

    this.beatPulse = this.tweens.add({
      targets: scanline,
      y: scanline.y + 8,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const titleBubble = this.add
      .bitmapText(72, 170, styleConfig.typography.fontKey, 'INTERCEPT PROJECTION', 18)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1)
      .setDepth(16);

    const projectionText = this.add
      .bitmapText(72, 214, styleConfig.typography.fontKey, body.text, 14)
      .setTint(palette('hudText'))
      .setMaxWidth(820)
      .setLetterSpacing(1)
      .setDepth(16);

    this.registerBeatLayers(panel, scanline, titleBubble, projectionText);

    this.time.delayedCall(2000, () => {
      if (this.beat !== 2 || this.movedToMapPart) {
        return;
      }
      this.canSkipIntercept = true;
      this.canAdvanceToMapPart = true;
      hint.setText('PRESS ANY KEY TO SKIP');
    });

    const skipToMap = (): void => {
      if (!this.canAdvanceToMapPart || this.movedToMapPart) {
        return;
      }
      this.moveToMapPart(title, body, hint);
    };

    this.input.keyboard?.once('keydown', skipToMap);
    this.time.delayedCall(8000, () => {
      if (!this.movedToMapPart) {
        this.moveToMapPart(title, body, hint);
      }
    });
  }

  private moveToMapPart(
    title: Phaser.GameObjects.BitmapText,
    body: Phaser.GameObjects.BitmapText,
    hint: Phaser.GameObjects.BitmapText,
  ): void {
    if (this.completionInProgress) {
      return;
    }
    if (!this.scene.isActive() || this.movedToMapPart) {
      return;
    }

    this.completionInProgress = true;
    this.movedToMapPart = true;
    this.beat = 3;
    this.clearBeatLayers();

    title.setText('PART 3: WORLD MAP REVEAL');
    const nextWorld = runtimeStore.save.campaign.world;
    const fromLine = this.revealFromWorld
      ? `WORLD ${this.revealFromWorld} RECLAIM COMPLETE.`
      : `WORLD ${Math.max(1, nextWorld - 1)} RECLAIM COMPLETE.`;
    const mapLine = this.revealWorld
      ? `WORLD ${this.revealWorld} DECRYPTION COMPLETE.`
      : `WORLD ${nextWorld} MARKED FOR SURVEY.`;
    body.setText(`${fromLine}\n${mapLine}\nThe map opens and reveals the next objective.`);
    hint.setText('');

    this.renderMapRevealBeat();

    this.time.delayedCall(5000, () => {
      const payload = (this.revealWorld || this.revealFromWorld)
        ? {
          revealWorld: this.revealWorld,
          revealFromWorld: this.revealFromWorld,
        }
        : undefined;
      transitionToScene(this, 'WorldMapScene', payload, { durationMs: 180, fadeInMs: 120 });
      this.completionInProgress = false;
    });
  }

  private renderMapRevealBeat(): void {
    const mapScale = 0.45;
    const mapOffsetX = 273;
    const mapOffsetY = 122;
    const mapNodes = styleConfig.worldMapLayout.nodes;

    const panel = this.add
      .rectangle(480, 300, 860, 286, 0x030f1d, 0.52)
      .setDepth(18)
      .setOrigin(0.5, 0.5);
    panel.setStrokeStyle(2, palette('hudAccent'), 0.8);
    const panelLabel = this.add
      .bitmapText(74, 156, styleConfig.typography.fontKey, 'GLOBAL CLOUD NETWORK', 18)
      .setTint(palette('hudAccent'))
      .setLetterSpacing(1)
      .setDepth(19);
    const panelSub = this.add
      .bitmapText(74, 182, styleConfig.typography.fontKey, 'WORLD RECONSTRUCTION PRIORITY LAYER', 12)
      .setTint(palette('hudText'))
      .setLetterSpacing(1)
      .setDepth(19);

    const line = this.add.graphics().setDepth(19);
    for (let i = 0; i < mapNodes.length - 1; i += 1) {
      const from = mapNodes[i]!;
      const to = mapNodes[i + 1]!;
      const fromRef = parseWorldFromNodeKey(from.key);
      const toRef = parseWorldFromNodeKey(to.key);
      const fromState = runtimeStore.save.worldStates[fromRef];
      const toState = runtimeStore.save.worldStates[toRef];
      const pathTint = fromState === 'reclaimed' && toState === 'reclaimed'
        ? palette('grassTop')
        : fromState === 'reclaimed'
          ? palette('hudAccent')
          : palette('groundWarm');
      const pathAlpha = fromState === 'reclaimed' ? 0.62 : 0.4;
      line
        .lineStyle(2, pathTint, pathAlpha)
        .beginPath()
        .moveTo(mapOffsetX + from.x * mapScale, mapOffsetY + from.y * mapScale)
        .lineTo(mapOffsetX + to.x * mapScale, mapOffsetY + to.y * mapScale)
        .strokePath();
    }

    for (const node of mapNodes) {
      const world = parseWorldFromNodeKey(node.key);
      const state = runtimeStore.save.worldStates[world] ?? 'unclaimed';
      const tint = state === 'reclaimed'
        ? palette('grassTop')
        : state === 'next'
          ? palette('hudAccent')
          : palette('inkSoft');
      const worldX = mapOffsetX + node.x * mapScale;
      const worldY = mapOffsetY + node.y * mapScale;
      const nodeBox = this.add
        .rectangle(worldX, worldY, state === 'reclaimed' ? 11 : 10, 7, tint, state === 'unclaimed' ? 0.36 : 0.95)
        .setDepth(20);
      nodeBox.setAngle(state === 'next' ? 2 : 0);
      if (state === 'next') {
        this.tweens.add({
          targets: nodeBox,
          scaleX: 1.1,
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
      this.registerBeatLayers(nodeBox);
    }

    const worldLabels = styleConfig.worldMapLayout.worldLabels;
    for (const worldLabel of worldLabels) {
      const worldColor = runtimeStore.save.worldStates[worldLabel.world] === 'reclaimed'
        ? palette('grassTop')
        : runtimeStore.save.worldStates[worldLabel.world] === 'next'
          ? palette('hudAccent')
          : palette('inkSoft');
      const worldLabelText = this.add
        .bitmapText(
          mapOffsetX + worldLabel.x * mapScale - 4,
          mapOffsetY + worldLabel.y * mapScale - 14,
          styleConfig.typography.fontKey,
          WORLD_NAMES[worldLabel.world] ?? `WORLD ${worldLabel.world}`,
          8,
        )
        .setTint(worldColor)
        .setLetterSpacing(1)
        .setDepth(21);
      this.registerBeatLayers(worldLabelText);
    }

    if (this.revealWorld) {
      const revealNodes = mapNodes.filter((node) => parseWorldFromNodeKey(node.key) === this.revealWorld);
      revealNodes.forEach((node, index) => {
        const fog = this.add
          .rectangle(
            mapOffsetX + node.x * mapScale,
            mapOffsetY + node.y * mapScale,
            24,
            18,
            0x050608,
            0.87,
          )
          .setDepth(22);
        fog.setStrokeStyle(1, palette('hudAccent'), 0.7);
        this.tweens.add({
          targets: fog,
          alpha: 0,
          duration: 1800,
          delay: 100 + index * 45,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            fog.destroy();
          },
        });
        this.registerBeatLayers(fog);
      });
    }

    const cue = this.add
      .rectangle(480, 445, 760, 30, 0x000000, 0.0)
      .setDepth(23)
      .setOrigin(0.5, 0.5);
    const cueGlow = this.add
      .rectangle(480, 445, 760, 1, palette('hudAccent'), 0.18)
      .setDepth(24)
      .setOrigin(0.5, 0.5);
    this.beatPulse = this.tweens.add({
      targets: cueGlow,
      alpha: { from: 0.1, to: 0.9 },
      yoyo: true,
      duration: 280,
      repeat: -1,
    });

    this.registerBeatLayers(panel, panelLabel, panelSub, line, cue, cueGlow);
  }
}
