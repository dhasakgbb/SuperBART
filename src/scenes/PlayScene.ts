import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { DISPLAY_NAMES, PLAYER_CONSTANTS, SCORE_VALUES, TILE_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from '../core/constants';
import { buildRuntimeState, runtimeStore } from '../core/runtime';
import { spawnEnemy } from '../enemies/registry';
import type { EnemyHandle, EnemyContext } from '../enemies/types';
import { updateMovingPlatforms, updateThwomps } from '../hazards/systems';
import { generateLevel, validateGeneratedLevel } from '../levelgen/generator';
import { getWorldRules } from '../levelgen/worldRules';
import { resolvePlayerDamage } from '../player/powerup';
import {
  createFeelState,
  DEFAULT_WORLD_MODIFIERS,
  stepMovement,
  type MotionHint,
  type WorldModifiers,
  type FeelState,
} from '../player/movement';
import { PlayerAnimator } from '../player/PlayerAnimator';
import { EffectManager } from '../systems/EffectManager';
import { PopupManager } from '../systems/PopupManager';
import { createDustPuff, DustPuffEmitter } from '../player/dustPuff';
import { createPlayerAnimations } from '../anim/playerAnims';
import { renderGameplayBackground } from '../rendering/parallax';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { computeSeed, setLevelCollectibleStatus, setLevelEvalStatus } from '../systems/progression';
import { persistSave } from '../systems/save';
import type { PlayerForm, SuperBartRuntimeState } from '../types/game';
import { createHud, renderHud, updateHudPosition, type HudRefs } from '../ui/hud';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';

type StompHitstopTelemetry = {
  lastAppliedStompAtFrame: number;
  lastAppliedMs: number;
  currentlyPaused: boolean;
  history: Array<{ frame: number; appliedMs: number; paused: boolean; resumed: boolean }>;
};

type MovementDebugState = {
  vx: number;
  vy: number;
  onGround: boolean;
  desiredState: 'walk' | 'run';
  runChargeMs: number;
  jumpCutApplied: boolean;
  jumpCutWindowMsLeft: number;
  prevJumpHeld: boolean;
  skidMsLeft: number;
};

type CollectibleGlowHandle =
  | { kind: 'postfx'; fx: Phaser.FX.Glow }
  | { kind: 'fallback'; image: Phaser.GameObjects.Image };

export class PlayScene extends Phaser.Scene {
  private levelBonus = false;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneWay!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.Physics.Arcade.Group;
  private player!: Phaser.Physics.Arcade.Sprite;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private stars!: Phaser.Physics.Arcade.StaticGroup;
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private springs!: Phaser.Physics.Arcade.StaticGroup;
  private checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  private questionBlocks!: Phaser.Physics.Arcade.StaticGroup;
  private goal!: Phaser.Physics.Arcade.Sprite;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private thwomps!: Phaser.Physics.Arcade.Group;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private damageZones!: Phaser.Physics.Arcade.StaticGroup;
  private enemyHandles: EnemyHandle[] = [];
  private collectibleGlows = new Map<number, CollectibleGlowHandle>();
  private glowIdCounter = 1;
  private cameraBloom?: Phaser.FX.Bloom;
  private canUsePostFx = false;
  private hud!: HudRefs;
  private readonly audio = AudioEngine.shared();
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private playerForm: PlayerForm = 'small';
  private lives = 3;
  private invulnMsRemaining = 0;
  private checkpointId = 'spawn';
  private checkpointXY = { x: 48, y: 48 };
  private feel = createFeelState();
  private levelTimeMs = 0;
  private jumpHeldLast = false;
  private runHeld = false;
  private stompHitstop?: Phaser.Time.TimerEvent;
  private stompHitstopHistory: Array<{ frame: number; appliedMs: number; paused: boolean; resumed: boolean }> = [];
  private lastAppliedStompAtFrame = -1;
  private readonly maxStompHitstopHistory = 12;
  private lastStompFrame = -1;
  private lastStompHitMs = -Number.MAX_SAFE_INTEGER;

  private playerHead!: Phaser.GameObjects.Sprite;
  private animator!: PlayerAnimator;
  private effects!: EffectManager;
  private popups!: PopupManager;
  private dustPuff!: DustPuffEmitter;
  private wasOnGround = true;

  private completed = false;
  private world = 1;
  private levelIndex = 1;
  private worldModifiers: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS };

  /** Auto-scroll segment definitions from level metadata. */
  private autoScrollSegments: Array<{
    startX: number;
    speedPxPerSec: number;
    durationMs: number;
  }> = [];
  /** Index of current active auto-scroll segment (-1 = none). */
  private autoScrollActiveIndex = -1;
  /** Elapsed ms within current auto-scroll segment. */
  private autoScrollElapsedMs = 0;
  /** Camera X position at start of auto-scroll. */
  private autoScrollCameraStartX = 0;

  constructor() {
    super('PlayScene');
  }

  init(data: { bonus?: boolean }): void {
    this.levelBonus = Boolean(data?.bonus);
  }

  create(): void {
    runtimeStore.mode = 'playing';
    const actorScale = styleConfig.gameplayLayout.actorScale;
    this.canUsePostFx = this.canUsePostFxRender();

    this.world = runtimeStore.save.campaign.world;
    this.levelIndex = runtimeStore.save.campaign.levelIndex;

    const seed = computeSeed(this.world, this.levelIndex + (this.levelBonus ? 100 : 0));
    const level = generateLevel({
      world: this.world,
      levelIndex: this.levelIndex,
      seed,
      bonus: this.levelBonus
    });
    const validation = validateGeneratedLevel(level);
    if (!validation.ok) {
      throw new Error(`Generated invalid level: ${validation.errors.join(', ')}`);
    }

    const rules = getWorldRules(this.world);
    this.worldModifiers = { ...DEFAULT_WORLD_MODIFIERS, ...rules.modifiers };

    // Store auto-scroll segments from level metadata (World 5 benchmark)
    this.autoScrollSegments = level.metadata.benchmarkAutoScroll ?? [];
    this.autoScrollActiveIndex = -1;
    this.autoScrollElapsedMs = 0;

    runtimeStore.levelSeed = seed;
    runtimeStore.levelTheme = level.metadata.theme;
    runtimeStore.difficultyTier = level.metadata.difficultyTier;
    runtimeStore.chunksUsed = [...level.metadata.chunksUsed];

    renderGameplayBackground(this, level.width * TILE_SIZE, VIEW_HEIGHT, styleConfig.gameplayLayout);

    this.physics.world.setBounds(0, 0, level.width * TILE_SIZE, level.height * TILE_SIZE);

    this.solids = this.physics.add.staticGroup();
    this.oneWay = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ immovable: true, allowGravity: false });
    this.coins = this.physics.add.staticGroup();
    this.stars = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.springs = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.questionBlocks = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.thwomps = this.physics.add.group({ immovable: true, allowGravity: false });
    this.enemiesGroup = this.physics.add.group();
    this.damageZones = this.physics.add.staticGroup();

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const tile = level.tileGrid[y]![x]!;
        if (tile === 1) {
          const block = this.solids.create(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'tile_ground') as Phaser.Physics.Arcade.Sprite;
          block.refreshBody();
        }
        if (tile === 2) {
          const block = this.oneWay.create(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'tile_oneway') as Phaser.Physics.Arcade.Sprite;
          block.refreshBody();
        }
      }
    }

    for (const mp of level.movingPlatforms) {
      const platform = this.movingPlatforms.create(mp.x, mp.y, 'moving_platform') as Phaser.Physics.Arcade.Sprite;
      platform.setData('minX', mp.minX);
      platform.setData('maxX', mp.maxX);
      platform.setData('speed', mp.speed);
      if (platform.body) {
        (platform.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      }
      platform.setImmovable(true);
    }

    let spawn = { x: 48, y: 48 };
    for (const e of level.entities) {
      if (e.type === 'spawn') {
        spawn = { x: e.x, y: e.y };
      } else if (e.type === 'coin') {
        const coin = this.coins.create(e.x, e.y, 'pickup_token') as Phaser.Physics.Arcade.Sprite;
        coin.setData('collectibleId', e.id);
        coin.setScale(actorScale.coin).setDepth(28);
        coin.refreshBody();
        this.attachCollectibleGlow(coin, 'pickup_token');
        this.startCoinSpin(coin);
      } else if (e.type === 'star') {
        const star = this.stars.create(e.x, e.y, 'pickup_eval') as Phaser.Physics.Arcade.Sprite;
        star.setData('collectibleId', e.id);
        star.setScale(actorScale.star).setDepth(28);
        star.refreshBody();
        this.attachCollectibleGlow(star, 'pickup_eval');
      } else if (e.type === 'question_block') {
        const qb = this.questionBlocks.create(e.x, e.y, 'question_block') as Phaser.Physics.Arcade.Sprite;
        qb.setData('collectibleId', e.id);
        qb.setScale(actorScale.questionBlock).setDepth(26);
        qb.setData('state', 'active');
        qb.refreshBody();
        this.attachCollectibleGlow(qb, 'question_block');
      } else if (e.type === 'checkpoint') {
        const cp = this.checkpoints.create(e.x, e.y, 'checkpoint') as Phaser.Physics.Arcade.Sprite;
        cp.setData('checkpointId', String(e.data?.checkpointId ?? e.id));
        cp.refreshBody();
      } else if (e.type === 'goal') {
        this.goal = this.physics.add.staticSprite(e.x, e.y, 'flag');
      } else if (e.type === 'spike') {
        this.spikes.create(e.x, e.y, 'spike').refreshBody();
      } else if (e.type === 'spring') {
        this.springs.create(e.x, e.y, 'spring').refreshBody();
      } else if (e.type === 'thwomp') {
        const thwomp = this.thwomps.create(e.x, e.y, 'thwomp') as Phaser.Physics.Arcade.Sprite;
        thwomp.setData('topY', Number(e.data?.topY ?? e.y - 60));
        thwomp.setData('bottomY', Number(e.data?.bottomY ?? e.y + 30));
        thwomp.setData('state', 'idle');
      } else if (e.type === 'token') {
        // Generator uses 'token' as canonical collectible ID for coins
        const coin = this.coins.create(e.x, e.y, 'pickup_token') as Phaser.Physics.Arcade.Sprite;
        coin.setData('collectibleId', e.id);
        coin.setScale(actorScale.coin).setDepth(28);
        coin.refreshBody();
        this.attachCollectibleGlow(coin, 'pickup_token');
        this.startCoinSpin(coin);
      } else if (e.type === 'eval') {
        // Generator uses 'eval' as canonical collectible ID for stars
        const star = this.stars.create(e.x, e.y, 'pickup_eval') as Phaser.Physics.Arcade.Sprite;
        star.setData('collectibleId', e.id);
        star.setScale(actorScale.star).setDepth(28);
        star.refreshBody();
        this.attachCollectibleGlow(star, 'pickup_eval');
      } else if (
        e.type === 'walker' || e.type === 'shell' || e.type === 'flying' || e.type === 'spitter'
        || e.type === 'compliance_officer' || e.type === 'technical_debt'
        || e.type === 'hallucination' || e.type === 'legacy_system' || e.type === 'hot_take' || e.type === 'analyst'
      ) {
        const handle = spawnEnemy(e.type as import('../enemies/types').EnemyKind, this, e.x, e.y, this.buildEnemyContext(), e.data);
        this.enemyHandles.push(handle);
        this.enemiesGroup.add(handle.sprite);
      }
    }

    this.spawnShowcaseSetPiece(spawn);

    // Body sprite (physics-enabled, uses spritesheet)
    const bodyKey = this.playerForm === 'big' ? 'bart_body_big' : 'bart_body_small';
    this.player = this.physics.add.sprite(spawn.x, spawn.y, bodyKey, 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(actorScale.player).setDepth(36);
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocity(PLAYER_CONSTANTS.maxSpeed * 3, PLAYER_CONSTANTS.maxFallSpeed);
    }
    const bodyH = this.playerForm === 'big' ? 30 : 22;
    this.player.body?.setSize(12, bodyH).setOffset(2, 1);

    // Head sprite (visual overlay, no physics)
    const headKey = this.playerForm === 'big' ? 'bart_head_64' : 'bart_head_48';
    const headScale = this.playerForm === 'big'
      ? styleConfig.playerAnimation.headScaleBig
      : styleConfig.playerAnimation.headScaleSmall;
    this.playerHead = this.add.sprite(spawn.x, spawn.y, headKey);
    this.playerHead.setScale(headScale);
    this.playerHead.setDepth(this.player.depth + 1);

    // Animation system
    createPlayerAnimations(this);
    this.animator = new PlayerAnimator(this, this.player, this.playerForm);
    this.effects = new EffectManager({ scene: this });
    this.popups = new PopupManager(this);
    this.dustPuff = createDustPuff(this);
    this.wasOnGround = true;

    this.checkpointXY = { ...spawn };

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.enemiesGroup, this.solids);
    this.physics.add.collider(this.enemiesGroup, this.movingPlatforms);
    this.physics.add.collider(this.projectiles, this.solids, (proj) => {
      const p = proj as Phaser.Physics.Arcade.Sprite;
      const zone = this.damageZones.create(p.x, p.y, 'projectile') as Phaser.Physics.Arcade.Sprite;
      zone.setAlpha(0.4).setTint(0xff5252).setScale(1.5);
      zone.refreshBody();
      this.time.delayedCall(1000, () => { zone.disableBody(true, true); zone.destroy(); });
      p.destroy();
    });

    this.physics.add.collider(this.player, this.oneWay, undefined, (_player, platform) => {
      const p = _player as Phaser.Physics.Arcade.Sprite;
      const f = platform as Phaser.Physics.Arcade.Sprite;
      if (!p.body || !f.body) return false;
      return p.body.velocity.y >= 0 && p.y + (p.height * p.scaleY) / 2 <= f.y - (f.height * f.scaleY) / 2 + 4;
    });

    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      const token = coin as Phaser.Physics.Arcade.Sprite;
      const pickup = coin as Phaser.Physics.Arcade.Sprite;
      const collectibleId = String(pickup.getData('collectibleId') ?? '');
      if (collectibleId) {
        runtimeStore.save = setLevelCollectibleStatus(runtimeStore.save, this.world, this.levelIndex, collectibleId);
      }
      const amount = SCORE_VALUES.coin;
      runtimeStore.save.progression.coins += 1;
      runtimeStore.save.progression.score += amount;
      this.renderHud();
      this.popups.spawn(pickup.x, pickup.y, `+${amount} ${DISPLAY_NAMES.coin}`);
      this.collectItem(pickup);
      this.dustPuff.emitAt(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2, 6);
      // Sparkle effect
      this.effects.emitSparkle(pickup.x, pickup.y, 0xffd700, 5); // Gold sparkles
      this.playSfx('coin');
    });

    this.physics.add.overlap(this.player, this.stars, (_p, star) => {
      const pickup = star as Phaser.Physics.Arcade.Sprite;
      const evalId = String(pickup.getData('collectibleId') ?? '');
      if (evalId) {
        runtimeStore.save = setLevelEvalStatus(runtimeStore.save, this.world, this.levelIndex, evalId);
      }
      const amount = SCORE_VALUES.star;
      runtimeStore.save.progression.stars += 1;
      runtimeStore.save.progression.score += amount;
      this.renderHud();
      this.popups.spawn(pickup.x, pickup.y, `+${amount} ${DISPLAY_NAMES.star}`, 0xffd700);
      this.collectItem(pickup);
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2, 10);
      this.playSfx('power');
    });

    this.physics.add.overlap(this.player, this.checkpoints, (_p, cpObj) => {
      const point = cpObj as Phaser.Physics.Arcade.Sprite;
      const prevId = this.checkpointId;
      this.checkpointId = String(point.getData('checkpointId'));
      this.checkpointXY = { x: point.x, y: point.y - 20 };
      point.setTint(0x76ff03);
      if (prevId !== this.checkpointId) {
        this.popups.spawn(point.x, point.y, SCENE_TEXT.gameplay.checkpointSaved);
        this.effects.flash(150, 0x5cb85c);
      }
    });

    this.physics.add.overlap(this.player, this.goal, () => this.onGoalReached());
    this.physics.add.overlap(this.player, this.spikes, () => this.damagePlayer('spike'));
    this.physics.add.overlap(this.player, this.damageZones, () => this.damagePlayer('zone'));
    this.physics.add.overlap(this.player, this.thwomps, () => this.damagePlayer('thwomp'));
    this.physics.add.overlap(this.player, this.projectiles, (_p, proj) => {
      proj.destroy();
      this.damagePlayer('projectile');
    });
    this.physics.add.overlap(this.player, this.springs, () => {
      this.player.setVelocityY(-460);
      this.playSfx('jump');
    });

    this.physics.add.collider(this.player, this.solids, (_p, obj) => {
      const platform = obj as Phaser.Physics.Arcade.Sprite;
      if (platform.body && (platform.body as Phaser.Physics.Arcade.Body).touching.up && this.player.body?.touching.down) {
        if (this.player.body instanceof Phaser.Physics.Arcade.Body) {
          this.player.body.setAllowGravity(false);
        }
      }
    });

    this.physics.add.collider(this.player, this.enemiesGroup, (pObj, eObj) => {
      const p = pObj as Phaser.Physics.Arcade.Sprite;
      const target = this.enemyHandles.find((h) => h.sprite === eObj);
      if (!target) return;
      const result = target.onPlayerCollision(p);
      if (result === 'stomp') {
        const stompFrame = this.game.loop.frame;
        const shouldProcessStomp = this.lastStompFrame !== stompFrame;
        if (shouldProcessStomp) {
          this.lastStompFrame = stompFrame;
          const canProcessStomp = this.time.now - this.lastStompHitMs >= PLAYER_CONSTANTS.stompCooldownMs;
          const shouldBouncePlayer = p.body!.velocity.y > 0;
          const targetBody = target.sprite.body as Phaser.Physics.Arcade.Body;

          if (p.body!.velocity.y > 0) {
            p.setVelocityY(-220);
          }

          this.effects.emitSparkle(target.sprite.x, target.sprite.y, 0xffffff, 6);
          const isShell = target.kind === 'shell';
          const shellIsMoving = isShell && Math.abs(targetBody.velocity.x) >= 150;
          if (shouldProcessStomp && (!isShell || targetBody.velocity.x === 0)) {
            if (target.kind !== 'shell' || target.sprite.texture.key !== 'enemy_shell_retracted') {
              this.squashAndDisableSprite(target.sprite);
            }
          }

          if (canProcessStomp) {
            runtimeStore.save.progression.score += SCORE_VALUES.stomp;
            this.playSfx('stomp');
            this.triggerStompHitstop();
            if (shouldBouncePlayer && runtimeStore.save.settings.screenShakeEnabled) {
              this.effects.shake('light');
            }
            this.lastStompHitMs = this.time.now;
            if (shellIsMoving) {
              this.playSfx('shell');
            }
          }
        }
      } else {
        this.damagePlayer('enemy');
      }
    });

    this.cameras.main.setBounds(0, 0, level.width * TILE_SIZE, level.height * TILE_SIZE);
    this.cameras.main.setZoom(styleConfig.gameplayLayout.cameraZoom);
    this.cameras.main.startFollow(this.player, false);
    this.cameras.main.setLerp(0.16, 0.1);
    this.cameras.main.setDeadzone(80, 50);
    this.applyCameraBloom();

    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      p: Phaser.Input.Keyboard.KeyCodes.P
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.hud = createHud(this);
    this.lives = 3;

    this.audio.configureFromSettings(runtimeStore.save.settings);
    this.audio.stopMusic();
    this.audio.startWorldMusic(this.world);

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      runtimeStore.mode = 'playing';
    });

    this.registerDebugHooks();
  }

  private registerDebugHooks(): void {
    const root = (window as any).__SUPER_BART__ ?? {};
    root.getState = () => this.getRuntimeState();
    root.getStateWithDebug = () => this.getRuntimeStateWithDebug();
    root.stompHitstopTelemetry = this.getStompHitstopTelemetry();
    root.scene = this;
    root.sceneName = this.scene.key;
    root.sceneReady = false;
    root.sceneReadyFrame = -1;
    root.sceneFrame = this.game.loop.frame;
    root.sceneReadyCounter = 0;
    root.sceneReadyVersion = styleConfig.contractVersion;
    (window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ = root;

    (window as Window & { render_game_to_text?: () => string }).render_game_to_text = () => JSON.stringify(this.getRuntimeState());
    (window as Window & { capture_perf_snapshot?: () => Record<string, number> }).capture_perf_snapshot = () => {
      const renderer = this.game.renderer as unknown as { info?: { render?: { drawCalls?: number } } };
      return {
        fps: Math.round(this.game.loop.actualFps),
        drawCalls: renderer.info?.render?.drawCalls ?? 0,
        entities: this.enemyHandles.filter((h) => h.sprite.active).length + this.projectiles.countActive(true)
      };
    };
    (window as Window & { advanceTime?: (ms: number) => void }).advanceTime = (ms: number) => {
      const step = 16;
      const steps = Math.max(1, Math.floor(ms / step));
      for (let i = 0; i < steps; i += 1) {
        this.simulateStep(step);
      }
    };

    const onPostUpdate = (): void => {
      root.sceneName = this.scene.key;
      root.sceneFrame = this.game.loop.frame;
      root.stompHitstopTelemetry = this.getStompHitstopTelemetry();
      const stableCounter = Number(root.sceneReadyCounter ?? 0) + 1;
      root.sceneReadyCounter = stableCounter;
      if (stableCounter >= 2 && !root.sceneReady) {
        root.sceneReady = true;
        if (typeof root.sceneReadyFrame !== 'number' || root.sceneReadyFrame < 0) {
          root.sceneReadyFrame = this.game.loop.frame;
        }
      }
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, onPostUpdate);
      this.stompHitstop?.remove();
      this.cameraBloom?.destroy();
      this.cameraBloom = undefined;
      this.collectibleGlows.forEach((glow) => {
        if (glow.kind === 'postfx') {
          glow.fx.destroy();
        } else {
          glow.image.destroy();
        }
      });
      this.collectibleGlows.clear();
      if (this.physics?.world?.isPaused) {
        this.physics.world.resume();
      }
    });
  }

  private spawnShowcaseSetPiece(spawn: { x: number; y: number }): void {
    const showcase = styleConfig.gameplayLayout.showcase;
    if (this.world !== showcase.world || this.levelIndex !== showcase.level) {
      return;
    }

    const actorScale = styleConfig.gameplayLayout.actorScale;
    const blockX = spawn.x + showcase.questionBlockOffset.x;
    const blockY = spawn.y + showcase.questionBlockOffset.y;
    const block = this.questionBlocks.create(blockX, blockY, 'question_block') as Phaser.Physics.Arcade.Sprite;
    block.setScale(actorScale.questionBlock).setDepth(26);
    block.setData('collectibleId', `showcase-${this.world}-${this.levelIndex}-qb`);
    block.setData('state', 'active');
    block.refreshBody();
    this.attachCollectibleGlow(block, 'question_block');

    for (let i = 0; i < showcase.coinLine.count; i += 1) {
      const coinX = spawn.x + showcase.coinLine.startX + i * showcase.coinLine.spacingPx;
      const coinY = spawn.y + showcase.coinLine.yOffset;
      const coin = this.coins.create(coinX, coinY, 'pickup_token') as Phaser.Physics.Arcade.Sprite;
      coin.setScale(actorScale.coin).setDepth(28);
      coin.setData('collectibleId', `showcase-${this.world}-${this.levelIndex}-coin-${i}`);
      coin.refreshBody();
      this.attachCollectibleGlow(coin, 'pickup_token');
      this.startCoinSpin(coin);
    }

    const walker = spawnEnemy(
      'walker',
      this,
      spawn.x + showcase.extraWalkerOffsetX,
      spawn.y - 2,
      this.buildEnemyContext(),
      {},
    );
    this.enemyHandles.push(walker);
    this.enemiesGroup.add(walker.sprite);
  }

  private buildEnemyContext(): EnemyContext {
    return {
      scene: this,
      projectiles: this.projectiles,
      getPlayerPosition: () => {
        if (!this.player || !this.player.active) return null;
        return { x: this.player.x, y: this.player.y };
      },
      nowMs: () => this.time.now,
      onSpawnEnemy: (handle) => {
        this.enemyHandles.push(handle);
        this.enemiesGroup.add(handle.sprite);
      },
    };
  }

  private hitQuestionBlock(block: Phaser.Physics.Arcade.Sprite): void {
    const state = String(block.getData('state'));
    if (state === 'used') return;

    block.setData('state', 'used');
    this.detachCollectibleGlow(block);
    block.setTexture('question_block_used');
    block.refreshBody();
    const collectibleId = String(block.getData('collectibleId') ?? '');
    if (collectibleId) {
      runtimeStore.save = setLevelCollectibleStatus(runtimeStore.save, this.world, this.levelIndex, collectibleId);
    }

    // Bump animation
    const origY = block.y;
    this.tweens.add({
      targets: block,
      y: origY - 8,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Spawn coin reward that pops out the top
    const rewardCoin = this.add.image(block.x, block.y - 20, 'pickup_token')
      .setScale(styleConfig.gameplayLayout.actorScale.coin)
      .setDepth(30);
    this.tweens.add({
      targets: rewardCoin,
      y: block.y - 56,
      alpha: 0,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => rewardCoin.destroy(),
    });

    runtimeStore.save.progression.coins += 1;
    runtimeStore.save.progression.score += SCORE_VALUES.questionBlock;
    this.playSfx('block_hit');
  }

  private attachCollectibleGlow(sprite: Phaser.Physics.Arcade.Sprite, textureKey: string): void {
    if (!styleConfig.bloom.enabled) {
      return;
    }

    this.startCollectibleFloatTween(sprite);
    const id = this.glowIdCounter++;
    const tintColor = Phaser.Display.Color.HexStringToColor(styleConfig.bloom.tint).color;

    const createFallbackGlow = (): CollectibleGlowHandle => ({
      kind: 'fallback',
      image: this.add.image(sprite.x, sprite.y, textureKey)
        .setDepth(sprite.depth - 1)
        .setAlpha(Math.min(0.8, Math.max(0.22, styleConfig.bloom.strength)))
        .setTint(tintColor)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1 + styleConfig.bloom.radius * 0.09),
    });

    let glow: CollectibleGlowHandle = createFallbackGlow();
    if (this.canUsePostFx) {
      const postFx = (sprite as Phaser.GameObjects.Sprite & { postFX?: { addGlow: (...args: unknown[]) => Phaser.FX.Glow } }).postFX;
      if (postFx) {
        try {
          const fx = postFx.addGlow(
            tintColor,
            Math.max(2, 8 * styleConfig.bloom.strength),
            0,
            false,
            0.15,
            Math.max(1, styleConfig.bloom.radius * 1.5),
          );
          if (fx) {
            glow = {
              kind: 'postfx',
              fx,
            };
          } else {
            this.canUsePostFx = false;
            glow = createFallbackGlow();
          }
        } catch {
          this.canUsePostFx = false;
          glow = createFallbackGlow();
          // If post-FX failed, keep fallback mode active for remaining collectibles too.
        }
      }
    }
    sprite.setData('collectibleGlowId', id);
    sprite.setData('collectibleBaseY', sprite.y);
    this.collectibleGlows.set(id, glow);
  }

  private startCollectibleFloatTween(sprite: Phaser.Physics.Arcade.Sprite): void {
    const existing = sprite.getData('collectibleFloatTween');
    if (existing instanceof Phaser.Tweens.Tween) {
      existing.stop();
      existing.remove();
    }
    const baseY = Number(sprite.getData('collectibleBaseY') ?? sprite.y);
    const bounce = this.tweens.add({
      targets: sprite,
      y: { from: baseY, to: baseY - 4 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    sprite.setData('collectibleBaseY', baseY);
    sprite.setData('collectibleFloatTween', bounce);
  }

  private stopCollectibleFloat(sprite: Phaser.Physics.Arcade.Sprite): void {
    const floatTween = sprite.getData('collectibleFloatTween');
    if (floatTween instanceof Phaser.Tweens.Tween) {
      floatTween.stop();
      floatTween.remove();
    }
    const baseY = sprite.getData('collectibleBaseY');
    if (Number.isFinite(Number(baseY))) {
      sprite.setY(Number(baseY));
    }
    sprite.setData('collectibleFloatTween', undefined);
    sprite.setData('collectibleBaseY', undefined);
  }

  /** NES-style coin spin: scale X oscillates 1 → 0.15 → 1 to fake rotation. */
  private startCoinSpin(coin: Phaser.Physics.Arcade.Sprite): void {
    const baseScaleX = coin.scaleX;
    // Stagger start time per coin so they don't all sync
    const delay = Math.floor(Math.random() * 500);
    const spinTween = this.tweens.add({
      targets: coin,
      scaleX: { from: baseScaleX, to: baseScaleX * 0.15 },
      duration: 250,
      yoyo: true,
      repeat: -1,
      delay,
      ease: 'Sine.easeInOut',
    });
    coin.setData('coinSpinTween', spinTween);
  }

  private flashCollectiblePickup(color = 0xffffff): void {
    this.effects.flash(120, color);
  }

  private collectItem(pickup: Phaser.Physics.Arcade.Sprite): void {
    this.detachCollectibleGlow(pickup);
    pickup.destroy();
  }

  private renderHud(): void {
    renderHud(this.hud, {
      world: this.world,
      level: this.levelIndex,
      score: runtimeStore.save.progression.score,
      coins: runtimeStore.save.progression.coins,
      stars: runtimeStore.save.progression.stars,
      lives: this.lives,
      form: this.playerForm,
      timeSec: Math.floor(this.levelTimeMs / 1000)
    });
  }

  private canUsePostFxRender(): boolean {
    return this.game.renderer?.type === Phaser.WEBGL && styleConfig.bloom.enabled;
  }

  private applyCameraBloom(): void {
    this.cameraBloom?.destroy();
    this.cameraBloom = undefined;
    if (!this.canUsePostFx) {
      return;
    }

    if (!this.cameras.main.postFX) {
      this.canUsePostFx = false;
      return;
    }

    const color = Phaser.Display.Color.HexStringToColor(styleConfig.bloom.tint).color;
    const thresholdScale = Phaser.Math.Clamp(1 - styleConfig.bloom.threshold, 0, 1);
    const blurStrength = Math.max(1, Number(styleConfig.bloom.radius) || 1);
    const strength = Math.max(0.1, Number(styleConfig.bloom.strength) * (1 + thresholdScale));
    const steps = Math.max(1, Math.round(Number(styleConfig.bloom.downsample) || 1));

    try {
      const bloom = this.cameras.main.postFX.addBloom(
        color,
        1,
        1,
        blurStrength,
        strength,
        steps,
      );
      this.cameraBloom = bloom;
    } catch {
      this.canUsePostFx = false;
      this.cameraBloom = undefined;
    }
  }

  private detachCollectibleGlow(sprite: Phaser.Physics.Arcade.Sprite): void {
    this.stopCollectibleFloat(sprite);
    const id = Number(sprite.getData('collectibleGlowId'));
    if (!Number.isFinite(id)) {
      return;
    }
    const glow = this.collectibleGlows.get(id);
    if (glow) {
      if (glow.kind === 'postfx') {
        glow.fx.destroy();
      } else {
        glow.image.destroy();
      }
      this.collectibleGlows.delete(id);
    }
    sprite.setData('collectibleGlowId', undefined);
    sprite.setData('collectibleBaseY', undefined);
  }

  private squashAndDisableSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite.active) {
      return;
    }
    const scaleX = sprite.scaleX;
    const scaleY = sprite.scaleY;
    const baselineY = sprite.y;
    const baselineX = sprite.x;
    this.tweens.add({
      targets: sprite,
      scaleX: scaleX * 1.05,
      scaleY: Math.max(0.18, scaleY * 0.2),
      duration: 80,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (sprite.active) {
          sprite.setPosition(baselineX, baselineY);
          sprite.disableBody(true, true);
        }
      },
    });
  }

  private getRuntimeState(): SuperBartRuntimeState {
    return buildRuntimeState({
      playerForm: this.playerForm,
      lives: this.lives,
      invulnMsRemaining: this.invulnMsRemaining,
      checkpointId: this.checkpointId
    });
  }

  private getRuntimeStateWithDebug(): SuperBartRuntimeState & {
    stompHitstopTelemetry: StompHitstopTelemetry;
    movement: MovementDebugState;
    animState: string;
    sceneFrame: number;
    feel: FeelState;
  } {
    const onGround = this.player?.body?.blocked.down || this.player?.body?.touching.down || false;
    const movement: MovementDebugState = {
      vx: this.player?.body?.velocity.x ?? 0,
      vy: this.player?.body?.velocity.y ?? 0,
      onGround,
      desiredState: this.feel.desiredState,
      runChargeMs: this.feel.runChargeMs,
      jumpCutApplied: this.feel.jumpCutApplied,
      jumpCutWindowMsLeft: this.feel.jumpCutWindowMsLeft,
      prevJumpHeld: this.feel.prevJumpHeld,
      skidMsLeft: this.feel.skidMsLeft,
    };

    return {
      ...this.getRuntimeState(),
      stompHitstopTelemetry: this.getStompHitstopTelemetry(),
      movement,
      animState: this.animator.getState(),
      sceneFrame: this.game.loop.frame,
      // Non-serialized feel contract state for deterministic feel telemetry in QA harnesses.
      feel: this.feel,
    };
  }

  private updateEntityCounts(): void {
    const enemies = this.enemyHandles.filter((e) => e.sprite.active);
    runtimeStore.entityCounts.walkers = enemies.filter((e) => e.kind === 'walker').length;
    runtimeStore.entityCounts.shells = enemies.filter((e) => e.kind === 'shell').length;
    runtimeStore.entityCounts.fliers = enemies.filter((e) => e.kind === 'flying').length;
    runtimeStore.entityCounts.spitters = enemies.filter((e) => e.kind === 'spitter').length;
    runtimeStore.entityCounts.projectiles = this.projectiles.countActive(true);
    runtimeStore.entityCounts.spikes = this.spikes.countActive(true);
    runtimeStore.entityCounts.thwomps = this.thwomps.countActive(true);
    runtimeStore.entityCounts.movingPlatforms = this.movingPlatforms.countActive(true);
  }

  private playSfx(kind: 'jump' | 'coin' | 'stomp' | 'hurt' | 'power' | 'shell' | 'flag' | 'block_hit' | 'land' | 'skid' | 'death_jingle' | 'victory_fanfare'): void {
    const keyMap = {
      jump: 'jump',
      coin: 'coin',
      stomp: 'stomp',
      hurt: 'hurt',
      power: 'power_up',
      shell: 'shell_kick',
      flag: 'goal_clear',
      block_hit: 'block_hit',
      land: 'land',
      skid: 'skid',
      death_jingle: 'death_jingle',
      victory_fanfare: 'victory_fanfare'
    } as const;
    this.audio.playSfx(keyMap[kind]);
  }

  private triggerStompHitstop(): void {
    if (!this.physics?.world || this.physics?.world?.isPaused) {
      return;
    }
    const record = {
      frame: this.game.loop.frame,
      appliedMs: PLAYER_CONSTANTS.stompHitstopMs,
      paused: true,
      resumed: false,
    };
    this.lastAppliedStompAtFrame = record.frame;
    this.stompHitstopHistory.push(record);
    if (this.stompHitstopHistory.length > this.maxStompHitstopHistory) {
      this.stompHitstopHistory.shift();
    }

    const amount = SCORE_VALUES.stomp;
    this.popups.spawn(this.player.x, this.player.y - 12, `+${amount} ${DISPLAY_NAMES.stomp}`);
    this.effects.hitStop(PLAYER_CONSTANTS.stompHitstopMs);
    // Note: Record resume status is now decoupled from the actual resume in EffectManager
    // but we can still track it for telemetry if needed by passing a callback.
    this.time.delayedCall(PLAYER_CONSTANTS.stompHitstopMs, () => {
      record.resumed = true;
    });
  }

  private getStompHitstopTelemetry(): StompHitstopTelemetry {
    const isWorldPaused = Boolean(this.physics?.world?.isPaused);
    return {
      lastAppliedStompAtFrame: this.lastAppliedStompAtFrame,
      lastAppliedMs: PLAYER_CONSTANTS.stompHitstopMs,
      currentlyPaused: isWorldPaused && this.stompHitstop != null,
      history: [...this.stompHitstopHistory],
    };
  }

  private showHudToast(message: string): void {
    const uiScale = 1 / Math.max(1, this.cameras.main.zoom);
    const popup = this.add.bitmapText(
      this.cameras.main.width / 2,
      38 * uiScale,
      styleConfig.typography.fontKey,
      message,
      styleConfig.hudLayout.leftGroup.fontSizePx,
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90);
    popup.setTint(Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#F2FDFD').color);
    popup.setScale(uiScale);
    popup.setLetterSpacing(styleConfig.hudLayout.leftGroup.letterSpacingPx);
    this.tweens.add({
      targets: popup,
      y: popup.y - 40 * uiScale,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private pulseHudCounter(text: Phaser.GameObjects.BitmapText): void {
    const existing = text.getData('counterPulse');
    if (existing instanceof Phaser.Tweens.Tween) {
      existing.stop();
      existing.remove();
    }
    const baseScaleX = text.scaleX;
    const baseScaleY = text.scaleY;
    const pulse = this.tweens.add({
      targets: text,
      scaleX: baseScaleX * 1.12,
      scaleY: baseScaleY * 1.12,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        text.setScale(baseScaleX, baseScaleY);
        text.setData('counterPulse', undefined);
      },
    });
    text.setData('counterPulse', pulse);
  }

  /** Whether a death animation is currently playing. Blocks input during sequence. */
  private deathAnimPlaying = false;

  private damagePlayer(reason: string): void {
    if (this.invulnMsRemaining > 0 || this.completed || this.deathAnimPlaying) {
      return;
    }

    const result = resolvePlayerDamage(this.playerForm);
    if (!result.dead) {
      this.playerForm = result.nextForm;
      this.switchPlayerForm(result.nextForm);
      this.animator.triggerHurt();
      this.invulnMsRemaining = PLAYER_CONSTANTS.invulnMs;
      this.player.setVelocity(this.player.flipX ? PLAYER_CONSTANTS.knockbackX : -PLAYER_CONSTANTS.knockbackX, PLAYER_CONSTANTS.knockbackY);
      this.playSfx('hurt');
      if (runtimeStore.save.settings.screenShakeEnabled) {
        this.effects.shake('medium');
      }
      return;
    }

    // -- Iconic death animation: freeze, jump up, fall off screen --
    runtimeStore.save.progression.deaths += 1;
    this.lives -= 1;
    this.deathAnimPlaying = true;

    this.audio.stopMusic();
    this.playSfx('death_jingle');
    this.animator.triggerDead();

    // Disable physics so the player floats during the animation
    if (this.player.body && 'setAllowGravity' in this.player.body) { (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); }
    this.player.setVelocity(0, 0);
    // Disable collisions by removing from physics
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    }

    // Phase 1: Brief freeze (400ms) then jump upward
    this.time.delayedCall(400, () => {
      if (!this.player.active) return;
      if (this.player.body && 'setAllowGravity' in this.player.body) { (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true); }
      if (this.player.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
        // Disable ALL collisions during death fall
        (this.player.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
      }
      this.player.setVelocityY(-350); // Jump upward
    });

    // Phase 2: After enough time for the arc + fall off screen, transition
    this.time.delayedCall(2200, () => {
      this.deathAnimPlaying = false;
      persistSave(runtimeStore.save);

      if (this.lives <= 0) {
        runtimeStore.mode = 'game_over';
        transitionToScene(this, 'GameOverScene');
      } else {
        // Respawn at checkpoint
        this.playerForm = 'small';
        this.switchPlayerForm('small');
        if (this.player.body) {
          (this.player.body as Phaser.Physics.Arcade.Body).checkCollision.none = false;
          (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
        }
        if (this.player.body && 'setAllowGravity' in this.player.body) { (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true); }
        this.player.setPosition(this.checkpointXY.x, this.checkpointXY.y);
        this.player.setVelocity(0, 0);
        this.player.setAlpha(1);
        this.player.clearTint();
        this.playerHead.setAlpha(1);
        this.invulnMsRemaining = PLAYER_CONSTANTS.invulnMs;
        this.audio.startWorldMusic(this.world);
      }

      if (reason === 'pit' && runtimeStore.save.settings.screenShakeEnabled) {
        this.effects.shake('heavy');
      }
    });
  }

  /** Tracks if a form-switch animation is active (blocks additional form switches). */
  private formTransitioning = false;

  private switchPlayerForm(form: PlayerForm): void {
    const oldForm = this.animator.getForm();
    const bodyKey = form === 'big' ? 'bart_body_big' : 'bart_body_small';
    const headKey = form === 'big' ? 'bart_head_64' : 'bart_head_48';
    const headScale = form === 'big'
      ? styleConfig.playerAnimation.headScaleBig
      : styleConfig.playerAnimation.headScaleSmall;
    const bodyH = form === 'big' ? 30 : 22;

    const isGrowing = (oldForm === 'small' && (form === 'big' || form === 'gpu'));
    const isShrinking = ((oldForm === 'big' || oldForm === 'gpu') && form === 'small');

    if ((isGrowing || isShrinking) && !this.formTransitioning && !this.deathAnimPlaying) {
      this.formTransitioning = true;

      // Brief invulnerability during transformation
      this.invulnMsRemaining = Math.max(this.invulnMsRemaining, 800);

      // Flicker effect: rapidly toggle scaleY between small/big sizes (NES-style)
      const flickerCount = 6;
      const flickerDuration = 100; // ms per flicker
      const smallScaleY = this.player.scaleY;
      const targetScaleY = isGrowing ? smallScaleY * 1.35 : smallScaleY * 0.7;

      const baseScaleX = this.player.scaleX;
      let flick = 0;
      const flickerEvent = this.time.addEvent({
        delay: flickerDuration,
        repeat: flickerCount - 1,
        callback: () => {
          flick++;
          if (flick % 2 === 1) {
            this.player.setScale(baseScaleX, targetScaleY);
            this.playerHead.setScale(headScale);
          } else {
            this.player.setScale(baseScaleX, smallScaleY);
            this.playerHead.setScale(
              oldForm === 'big' ? styleConfig.playerAnimation.headScaleBig : styleConfig.playerAnimation.headScaleSmall
            );
          }
        },
      });

      // After flicker, apply the real form change
      this.time.delayedCall(flickerCount * flickerDuration + 50, () => {
        this.player.setTexture(bodyKey, 0);
        this.player.body?.setSize(12, bodyH).setOffset(2, 1);
        this.player.setScale(styleConfig.gameplayLayout.actorScale.player);
        this.playerHead.setTexture(headKey);
        this.playerHead.setScale(headScale);
        this.animator.setForm(form);
        this.formTransitioning = false;

        // Small dust burst on transformation complete
        this.effects.emitDust(this.player.x, this.player.y, 6);
      });
    } else {
      // Instant switch (no animation) for non-grow/shrink or during death
      this.player.setTexture(bodyKey, 0);
      this.player.body?.setSize(12, bodyH).setOffset(2, 1);
      this.playerHead.setTexture(headKey);
      this.playerHead.setScale(headScale);
      this.animator.setForm(form);
    }
  }

  private onGoalReached(): void {
    if (this.completed) return;
    this.completed = true;
    this.animator.triggerWin();
    this.audio.stopMusic();
    this.playSfx('victory_fanfare');

    // Stop player movement for the celebration
    this.player.setVelocityX(0);

    runtimeStore.save.progression.score += SCORE_VALUES.completeBonus;
    runtimeStore.save.progression.timeMs += this.levelTimeMs;
    persistSave(runtimeStore.save);

    // Celebration effects: sparkle burst around goal
    if (this.goal) {
      for (let i = 0; i < 3; i++) {
        this.time.delayedCall(i * 300, () => {
          this.effects.emitSparkle(
            this.goal.x + (Math.random() - 0.5) * 40,
            this.goal.y - 10 + (Math.random() - 0.5) * 30,
            0xffd700,
            8,
          );
        });
      }
    }

    // Delay transition so the fanfare plays out (~2.5s)
    this.time.delayedCall(2600, () => {
      transitionToScene(this, 'LevelCompleteScene', {
        stats: {
          timeSec: Math.floor(this.levelTimeMs / 1000),
          coins: runtimeStore.save.progression.coins,
          stars: runtimeStore.save.progression.stars,
          deaths: runtimeStore.save.progression.deaths
        }
      }, { durationMs: 150, fadeInMs: 180 });
    });
  }

  /**
   * Auto-scroll system for World 5 benchmark segments.
   * When active, the camera scrolls rightward at a fixed speed.
   * The player must keep up or die (pushed off left edge of screen).
   */
  private updateAutoScroll(dtMs: number): void {
    if (this.autoScrollSegments.length === 0 || this.deathAnimPlaying) return;

    const cam = this.cameras.main;
    const playerX = this.player.x;

    // Check if we should START a new auto-scroll segment
    if (this.autoScrollActiveIndex === -1) {
      for (let i = 0; i < this.autoScrollSegments.length; i++) {
        const seg = this.autoScrollSegments[i]!;
        if (playerX >= seg.startX && playerX < seg.startX + seg.speedPxPerSec * (seg.durationMs / 1000)) {
          this.autoScrollActiveIndex = i;
          this.autoScrollElapsedMs = 0;
          this.autoScrollCameraStartX = cam.scrollX;
          // Detach camera from player follow
          cam.stopFollow();
          break;
        }
      }
    }

    // Update active auto-scroll
    if (this.autoScrollActiveIndex >= 0) {
      const seg = this.autoScrollSegments[this.autoScrollActiveIndex]!;
      this.autoScrollElapsedMs += dtMs;

      if (this.autoScrollElapsedMs >= seg.durationMs) {
        // Segment complete, return to normal camera follow
        this.autoScrollActiveIndex = -1;
        this.autoScrollElapsedMs = 0;
        cam.startFollow(this.player, false);
        cam.setLerp(0.16, 0.1);
        cam.setDeadzone(80, 50);
        return;
      }

      // Scroll camera rightward at fixed speed
      const scrollDelta = seg.speedPxPerSec * (dtMs / 1000);
      cam.scrollX += scrollDelta;

      // Kill player if they fall behind the left edge of the camera viewport
      const cameraLeftEdge = cam.scrollX;
      if (playerX < cameraLeftEdge - 8) {
        this.damagePlayer('autoscroll');
      }

      // Prevent player from moving past the right edge of camera
      const cameraRightEdge = cam.scrollX + cam.width / cam.zoom;
      if (playerX > cameraRightEdge - 16) {
        this.player.setX(cameraRightEdge - 16);
      }
    }
  }

  private simulateStep(dtMs: number): void {
    if (this.completed) return;
    this.levelTimeMs += dtMs * this.worldModifiers.tokenBurnRate;
    if (this.invulnMsRemaining > 0) {
      this.invulnMsRemaining = Math.max(0, this.invulnMsRemaining - dtMs);
      const alpha = this.invulnMsRemaining % 120 < 60 ? 0.6 : 1;
      this.player.setAlpha(alpha);
      this.playerHead.setAlpha(alpha);
    } else {
      this.player.setAlpha(1);
      this.playerHead.setAlpha(1);
    }

    // -- Auto-scroll logic (World 5 benchmark segments) --
    this.updateAutoScroll(dtMs);

    updateMovingPlatforms(this.movingPlatforms);
    updateThwomps(this.thwomps, this.player.x);

    for (const handle of this.enemyHandles) {
      if (handle.sprite.active) handle.update(dtMs);
    }

    const projectiles = this.projectiles.getChildren();
    for (const c of projectiles) {
      const p = c as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < 0 || p.x > this.physics.world.bounds.width + 30)) {
        p.destroy();
      }
    }

    this.enemyHandles.forEach((shell) => {
      if (shell.kind !== 'shell' || !shell.sprite.active) return;
      if (!shell.sprite.body || Math.abs(shell.sprite.body.velocity.x) < 150) return;
      this.enemyHandles.forEach((other) => {
        if (other === shell || !other.sprite.active) return;
        if (Phaser.Math.Distance.Between(shell.sprite.x, shell.sprite.y, other.sprite.x, other.sprite.y) < 20) {
          other.sprite.disableBody(true, true);
        }
      });
    });

    if (this.player.y > this.physics.world.bounds.height + 40) {
      this.damagePlayer('pit');
    }

    runtimeStore.save.progression.timeMs += dtMs;
    this.updateEntityCounts();
    renderHud(this.hud, {
      world: this.world,
      level: this.levelIndex,
      score: runtimeStore.save.progression.score,
      coins: runtimeStore.save.progression.coins,
      stars: runtimeStore.save.progression.stars,
      lives: this.lives,
      form: this.playerForm,
      modifiers: this.worldModifiers,
      timeSec: Math.floor(this.levelTimeMs / 1000)
    });
    updateHudPosition(this.hud, this.cameras.main);
  }

  update(_time: number, delta: number): void {
    // During death animation, only tick physics (for the fall arc) - no input
    if (this.deathAnimPlaying) {
      this.simulateStep(Math.min(40, delta));
      // Keep head synced during death fall
      const headOffset = this.animator.getCurrentHeadOffset();
      const flipSign = this.player.flipX ? -1 : 1;
      this.playerHead.setPosition(
        this.player.x + headOffset.dx * flipSign,
        this.player.y + headOffset.dy,
      );
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.scene.restart({ bonus: this.levelBonus });
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p)) {
      this.scene.launch('PauseScene');
      runtimeStore.mode = 'paused';
      this.scene.pause();
      return;
    }

    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const jumpHeld = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const jumpPressed = jumpHeld && !this.jumpHeldLast;
    this.runHeld = this.keys.shift.isDown;

    const step = stepMovement({
      dtMs: Math.min(40, delta),
      vx: this.player.body?.velocity.x ?? 0,
      vy: this.player.body?.velocity.y ?? 0,
      inputX: left === right ? 0 : left ? -1 : 1,
      jumpPressed,
      jumpHeld,
      runHeld: this.runHeld,
      onGround: this.player.body?.blocked.down || this.player.body?.touching.down || false,
      feel: this.feel
    }, this.worldModifiers);
    this.feel = step.feel;

    this.player.setVelocityX(step.vx);
    this.player.setVelocityY(step.vy);
    if (step.jumped) this.playSfx('jump');

    if ((this.player.body?.velocity.x ?? 0) > 0) this.player.setFlipX(false);
    if ((this.player.body?.velocity.x ?? 0) < 0) this.player.setFlipX(true);

    // Update animation state machine
    const onGround = this.player.body?.blocked.down || this.player.body?.touching.down || false;
    const inputX: -1 | 0 | 1 = left === right ? 0 : left ? -1 : 1;
    this.animator.update({
      vx: this.player.body?.velocity.x ?? 0,
      vy: this.player.body?.velocity.y ?? 0,
      inputX,
      onGround,
      wasOnGround: this.wasOnGround,
      jumped: step.jumped,
      motionState: step.motionHint,
      form: this.playerForm,
    }, Math.min(40, delta));
    this.wasOnGround = onGround;

    // Sync head position to body + per-frame offset
    const headOffset = this.animator.getCurrentHeadOffset();
    const flipSign = this.player.flipX ? -1 : 1;
    this.playerHead.setPosition(
      this.player.x + headOffset.dx * flipSign,
      this.player.y + headOffset.dy,
    );
    this.playerHead.setFlipX(this.player.flipX);

    // Dust puff + SFX on skid/land
    if (this.animator.justEntered('land')) {
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2);
      this.playSfx('land');
    }
    if (this.animator.justEntered('skid')) {
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2);
      this.playSfx('skid');
    }

    const lookAhead = Phaser.Math.Clamp((this.player.body?.velocity.x ?? 0) * 0.18, -90, 90);
    this.cameras.main.followOffset.x = lookAhead;

    this.jumpHeldLast = jumpHeld;
    this.simulateStep(Math.min(40, delta));
  }
}
