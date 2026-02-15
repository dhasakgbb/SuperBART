import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { ASSET_MANIFEST } from '../core/assetManifest';
import { CAMPAIGN_WORLD_LAYOUT, DISPLAY_NAMES, PLAYER_CONSTANTS, SCORE_VALUES, TILE_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from '../core/constants';
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
import { PingCompanion } from '../player/Ping';
import { EffectManager } from '../systems/EffectManager';
import { createDustPuff, DustPuffEmitter } from '../player/dustPuff';
import { createPlayerAnimations } from '../anim/playerAnims';
import { renderGameplayBackground, type WorldPaletteOverride } from '../rendering/parallax';
import { CONTENT_WORLD_MAP } from '../content/contentManifest';
import styleConfig, { stylePalette } from '../style/styleConfig';
import { computeSeed, setLevelCollectibleStatus, setLevelEvalStatus } from '../systems/progression';
import { clearActiveBonusRouteId, collectPersonnelFile, persistSave, setActiveBonusRouteId } from '../systems/save';
import { collectShellChainKillPairs } from '../systems/shellChain';
import type { BonusRouteId, PlayerForm, SuperBartRuntimeState } from '../types/game';
import { createHud, renderHud, updateHudPosition, type HudRefs } from '../ui/hud';
import { isBossStage } from '../content/scriptCampaign';
import { SCENE_TEXT } from '../content/contentManifest';
import { transitionToScene } from './sceneFlow';
import {
  createStorytellingState,
  getWorldMonitorMessage,
  shouldShowMonitorMessage,
  updateMonitorDisplayTime,
  type StorytellingState,
} from '../systems/storytelling';
import {
  applyMaintenanceDensity,
  getMaintenanceFileCounterText,
} from '../systems/maintenanceAccess';
import { arePowerUpsDisabled, areCheckpointsDisabled } from '../systems/bartsRules';
import type { EntityType, SetPieceMode } from '../types/levelgen';

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
  lastMotionHint: MotionHint;
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
  private diagnosticNodes!: Phaser.Physics.Arcade.StaticGroup;
  private monitors!: Phaser.Physics.Arcade.StaticGroup;
  private posters!: Phaser.Physics.Arcade.StaticGroup;
  private personalEffects!: Phaser.Physics.Arcade.StaticGroup;
  private personnelFiles!: Phaser.Physics.Arcade.StaticGroup;
  private checkpoints!: Phaser.Physics.Arcade.StaticGroup;
  private questionBlocks!: Phaser.Physics.Arcade.StaticGroup;
  private goal!: Phaser.Physics.Arcade.Sprite;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private thwomps!: Phaser.Physics.Arcade.Group;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private damageZones!: Phaser.Physics.Arcade.StaticGroup;
  private enemyHandles: EnemyHandle[] = [];
  private enemyHandleMap: Map<Phaser.Physics.Arcade.Sprite, EnemyHandle> = new Map();
  private collectibleGlows = new Map<number, CollectibleGlowHandle>();
  private glowIdCounter = 1;
  private cameraBloom?: Phaser.FX.Bloom;
  private canUsePostFx = false;
  private hud!: HudRefs;
  private readonly audio = AudioEngine.shared();
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private startStageMusic(): void {
    if (isBossStage(this.world, this.levelIndex)) {
      this.audio.startBossMusic(this.world);
      return;
    }

    this.audio.startWorldMusic(this.world);
  }

  private playerForm: PlayerForm = 'small';
  private lives = 3;
  private invulnMsRemaining = 0;
  private checkpointId = 'spawn';
  private checkpointXY = { x: 48, y: 48 };
  private feel = createFeelState();
  private levelTimeMs = 0;
  private jumpHeldLast = false;
  private lastMotionHint: MotionHint = 'air';
  private runHeld = false;
  private pulseChargeMs = 0;
  private manualCheckHoldMs = 0;
  private airJumpsUsed = 0;
  private isGroundPounding = false;
  private stompHitstop?: Phaser.Time.TimerEvent;
  private stompHitstopHistory: Array<{ frame: number; appliedMs: number; paused: boolean; resumed: boolean }> = [];
  private lastAppliedStompAtFrame = -1;
  private readonly maxStompHitstopHistory = 12;
  private lastStompFrame = -1;
  private lastStompHitMs = -Number.MAX_SAFE_INTEGER;

  private playerHead!: Phaser.GameObjects.Sprite;
  private animator!: PlayerAnimator;
  private effects!: EffectManager;
  private dustPuff!: DustPuffEmitter;
  private wasOnGround = true;
  private ping: PingCompanion | null = null;

  private completed = false;
  private world = 1;
  private levelIndex = 1;
  private setPieceMode: SetPieceMode | null = null;
  private setPieceModeMessageShown = false;
  private setPieceCollapseHazards: Phaser.Physics.Arcade.Sprite[] = [];
  private setPieceCollapseHazardIndex = 0;
  private setPieceCollapseHazardTimerMs = 0;
  private maintenanceAccess = false;
  private bonusRouteId: BonusRouteId | null = null;
  private worldModifiers: WorldModifiers = { ...DEFAULT_WORLD_MODIFIERS };
  private storytelling!: StorytellingState;
  private monitorNearby = false;

  /** Time warning threshold (seconds). Music speeds up when below this. */
  private static readonly TIME_WARNING_SEC = 60;
  private timeWarningActive = false;

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

  constructor() {
    super('PlayScene');
  }

  init(data: {
    world?: number;
    level?: number;
    stage?: number;
    bonus?: boolean;
    bonusRouteId?: BonusRouteId | null;
    maintenance?: boolean;
  }): void {
    this.levelBonus = Boolean(data?.bonus);
    this.maintenanceAccess = Boolean(data?.maintenance);
    this.bonusRouteId = data?.bonusRouteId ?? runtimeStore.save.campaign.activeBonusRouteId ?? null;
    runtimeStore.save = setActiveBonusRouteId(runtimeStore.save, this.bonusRouteId);
    if (data?.world != null) {
      runtimeStore.save.campaign.world = data.world;
    }
    const requestedStage = data?.stage ?? data?.level;
    if (requestedStage != null) {
      runtimeStore.save.campaign.stage = requestedStage;
      runtimeStore.save.campaign.levelIndex = requestedStage;
    }
  }

  create(): void {
    runtimeStore.mode = 'playing';
    const actorScale = styleConfig.gameplayLayout.actorScale;
    this.canUsePostFx = this.canUsePostFxRender();

    this.world = runtimeStore.save.campaign.world;
    this.levelIndex = runtimeStore.save.campaign.stage ?? runtimeStore.save.campaign.levelIndex;

    const forcedSeed = (window as any).__SUPER_BART__?.forceSeed;
    const seed = typeof forcedSeed === 'number'
      ? forcedSeed
      : computeSeed(this.world, this.levelIndex + (this.levelBonus ? 100 : 0), this.bonusRouteId);
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
    this.setPieceMode = level.metadata.setPiece?.mode ?? null;
    this.setPieceModeMessageShown = false;
    this.setPieceCollapseHazards = [];
    this.setPieceCollapseHazardIndex = 0;
    this.setPieceCollapseHazardTimerMs = 0;
    this.worldModifiers = { ...DEFAULT_WORLD_MODIFIERS, ...rules.modifiers };
    if (this.setPieceMode === 'collapse') {
      this.worldModifiers.gravityMultiplier = this.worldModifiers.gravityMultiplier * 1.12;
    } else if (this.setPieceMode === 'approach') {
      this.worldModifiers.speedMultiplier = this.worldModifiers.speedMultiplier * 0.94;
    }
    if (this.setPieceMode && level.metadata.setPiece?.description) {
      this.showHudToast(level.metadata.setPiece.description.toUpperCase());
    }

    // Store auto-scroll segments from level metadata (World 5 benchmark)
    this.autoScrollSegments = level.metadata.benchmarkAutoScroll ?? [];
    this.autoScrollActiveIndex = -1;
    this.autoScrollElapsedMs = 0;

    runtimeStore.levelSeed = seed;
    runtimeStore.levelTheme = level.metadata.theme;
    runtimeStore.difficultyTier = level.metadata.difficultyTier;
    runtimeStore.chunksUsed = [...level.metadata.chunksUsed];

    // Per-world sky palette from content manifest
    const worldDef = CONTENT_WORLD_MAP.find((w) => w.index === this.world);
    const worldPalette: WorldPaletteOverride | undefined = worldDef
      ? { skyTop: worldDef.generation.palette.skyTop, skyBottom: worldDef.generation.palette.skyBottom, accent: worldDef.generation.palette.accent }
      : undefined;

    // Override background for World 1
    const layout = { ...styleConfig.gameplayLayout };
    
    // Helper to patch parallax layers
    const patchLayers = (farKey: string, nearKey: string) => {
      if (layout.parallaxProfile?.layers) {
        layout.parallaxProfile = {
          ...layout.parallaxProfile,
          layers: layout.parallaxProfile.layers.map(layer => {
            if (layer.key === 'hill_far') return { ...layer, key: farKey };
            if (layer.key === 'hill_near') return { ...layer, key: nearKey };
            return layer;
          }) as unknown as typeof layout.parallaxProfile.layers
        };
      }
    };

    const worldKey = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, this.world));
    const farKey = `hill_far_w${worldKey}`;
    const nearKey = `hill_near_w${worldKey}`;
    layout.hills = {
      far: { ...layout.hills.far, key: farKey as any },
      near: { ...layout.hills.near, key: nearKey as any },
    };
    patchLayers(farKey, nearKey);

    const skyByWorld: Record<number, { top: string; bottom: string; bg: string }> = {
      1: { top: 'skyBlue', bottom: 'hudText', bg: 'skyBlue' },
      2: { top: 'skyDeep', bottom: 'skyMid', bg: 'skyDeep' },
      3: { top: 'skyDeep', bottom: 'grassMid', bg: 'skyDeep' },
      4: { top: 'inkDark', bottom: 'groundWarm', bg: 'inkDark' },
      5: { top: 'inkDark', bottom: 'inkSoft', bg: 'inkDark' },
      6: { top: 'inkDark', bottom: 'skyMid', bg: 'inkDark' },
      7: { top: 'skyDeep', bottom: 'inkSoft', bg: 'skyDeep' },
    };
    const skyConfig = skyByWorld[worldKey] ?? skyByWorld[1];
    layout.sky = {
      topSwatch: skyConfig.top as any,
      bottomSwatch: skyConfig.bottom as any,
    };
    this.cameras.main.setBackgroundColor(styleConfig.palette.swatches.find((swatch) => swatch.name === skyConfig.bg)?.hex);
    
    renderGameplayBackground(this, VIEW_WIDTH, VIEW_HEIGHT, layout, worldPalette);

    this.physics.world.setBounds(0, 0, level.width * TILE_SIZE, level.height * TILE_SIZE);

    this.solids = this.physics.add.staticGroup();
    this.oneWay = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ immovable: true, allowGravity: false });
    this.coins = this.physics.add.staticGroup();
    this.stars = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.springs = this.physics.add.staticGroup();
    this.diagnosticNodes = this.physics.add.staticGroup();
    this.monitors = this.physics.add.staticGroup();
    this.posters = this.physics.add.staticGroup();
    this.personalEffects = this.physics.add.staticGroup();
    this.personnelFiles = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();
    this.questionBlocks = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.thwomps = this.physics.add.group({ immovable: true, allowGravity: false });
    this.enemiesGroup = this.physics.add.group();
    this.damageZones = this.physics.add.staticGroup();

    // Determine world-specific tile keys
    const w = this.world;
    const groundTop = ASSET_MANIFEST.images[`tile_ground_w${w}_top`] ? `tile_ground_w${w}_top` : 'tile_ground';
    const groundMid = ASSET_MANIFEST.images[`tile_ground_w${w}_mid`] ? `tile_ground_w${w}_mid` : 'tile_ground';
    const onewayKey = ASSET_MANIFEST.images[`tile_oneway_w${w}`] ? `tile_oneway_w${w}` : 'tile_oneway';
    
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const tile = level.tileGrid[y]![x]!;
        if (tile === 1) {
          // Check top neighbor for autotiling
          const isTop = y === 0 || (level.tileGrid[y - 1] && level.tileGrid[y - 1]![x] !== 1);
          const key = isTop ? groundTop : groundMid;
          
          const block = this.solids.create(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, key) as Phaser.Physics.Arcade.Sprite;
          block.refreshBody();
        }
        if (tile === 2) {
          const block = this.oneWay.create(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, onewayKey) as Phaser.Physics.Arcade.Sprite;
          if (this.setPieceMode === 'collapse') {
            this.setPieceCollapseHazards.push(block);
          }
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

    if (this.setPieceMode === 'collapse' && this.setPieceCollapseHazards.length > 1) {
      this.setPieceCollapseHazards.sort((a, b) => b.x - a.x);
    }

    let spawn = { x: 48, y: 48 };
    for (const e of level.entities) {
      if (this.shouldSuppressScorePickup(e.type)) {
        continue;
      }
      if (this.shouldSuppressEntityInSetPieceMode(e.type)) {
        continue;
      }
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
      } else if (e.type === 'diagnostic_node') {
        const node = this.diagnosticNodes.create(e.x, e.y, 'checkpoint') as Phaser.Physics.Arcade.Sprite;
        node.setData('nodeId', e.id);
        node.setTint(0x6ce0d8);
        node.setAlpha(0.88);
        node.refreshBody();
      } else if (e.type === 'monitor') {
        const monitor = this.monitors.create(e.x, e.y, 'question_block_used') as Phaser.Physics.Arcade.Sprite;
        monitor.setScale(1.35);
        monitor.setTint(0x7ee6ff);
        monitor.setAlpha(0.9);
        monitor.setData('monitorId', e.id);
        monitor.refreshBody();
      } else if (e.type === 'poster') {
        const poster = this.posters.create(e.x, e.y, 'question_block_used') as Phaser.Physics.Arcade.Sprite;
        poster.setScale(1.8);
        poster.setTint(0xc8c8a4);
        poster.refreshBody();
      } else if (e.type === 'personal_effect') {
        const effect = this.personalEffects.create(e.x, e.y, 'pickup_token') as Phaser.Physics.Arcade.Sprite;
        effect.setScale(1.2);
        effect.setTint(0xe4d6c2);
        effect.refreshBody();
      } else if (e.type === 'personnel_file') {
        const fileId = String(e.data?.fileId ?? e.id);
        if (runtimeStore.save.personnelFilesCollected.includes(fileId)) {
          continue;
        }
        const file = this.personnelFiles.create(e.x, e.y, 'pickup_eval') as Phaser.Physics.Arcade.Sprite;
        file.setData('fileId', fileId);
        file.setData('fileWorld', Number(e.data?.world ?? this.world));
        file.setScale(actorScale.star);
        file.setTint(0xfff4aa);
        file.refreshBody();
        this.attachCollectibleGlow(file, 'pickup_eval');
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
        e.type === 'gpu_allocation' || e.type === 'copilot_mode'
        || e.type === 'semantic_kernel' || e.type === 'deploy_to_prod'
        || e.type === 'works_on_my_machine'
      ) {
        // Canonical powerup entities - render as collectible stars with powerup texture
        const textureKey = `pickup_${e.type}`;
        const powerup = this.stars.create(e.x, e.y, textureKey) as Phaser.Physics.Arcade.Sprite;
        powerup.setData('collectibleId', e.id);
        powerup.setData('powerupType', e.type);
        powerup.setScale(actorScale.star).setDepth(28);
        powerup.refreshBody();
        this.attachCollectibleGlow(powerup, textureKey);
      } else if (
        e.type === 'fire_flower' || e.type === 'power_up' || e.type === 'assist_bot'
        || e.type === 'green_button' || e.type === 'woom'
      ) {
        // Legacy powerup aliases - treat as question block rewards (coins)
        const coin = this.coins.create(e.x, e.y, 'pickup_token') as Phaser.Physics.Arcade.Sprite;
        coin.setData('collectibleId', e.id);
        coin.setScale(actorScale.coin).setDepth(28);
        coin.refreshBody();
        this.attachCollectibleGlow(coin, 'pickup_token');
        this.startCoinSpin(coin);
      } else if (
        e.type === 'walker' || e.type === 'shell' || e.type === 'flying' || e.type === 'spitter'
        || e.type === 'boss'
        || e.type === 'compliance_officer' || e.type === 'technical_debt'
        || e.type === 'hallucination' || e.type === 'legacy_system' || e.type === 'hot_take' || e.type === 'analyst'
        || e.type === 'snowman_sentry' || e.type === 'cryo_drone' || e.type === 'qubit_swarm'
        || e.type === 'crawler' || e.type === 'glitch_phantom' || e.type === 'fungal_node'
        || e.type === 'ghost_process' || e.type === 'tape_wraith' || e.type === 'resume_bot'
      ) {
        if (!this.shouldSpawnEnemyInMaintenance(e.id, e.type)) {
          continue;
        }
        const handle = spawnEnemy(e.type as import('../enemies/types').EnemyKind, this, e.x, e.y, this.buildEnemyContext(), e.data);
        this.enemyHandles.push(handle);
        this.enemyHandleMap.set(handle.sprite, handle);
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
    this.player.body?.setSize(12, bodyH).setOffset(10, 1);

    // Head sprite (visual overlay, no physics)
    const headKey = this.playerForm === 'big' ? 'bart_head_64' : 'bart_head_48';
    const headScale = this.playerForm === 'big'
      ? styleConfig.playerAnimation.headScaleBig
      : styleConfig.playerAnimation.headScaleSmall;
    this.playerHead = this.add.sprite(spawn.x, spawn.y, headKey);
    this.playerHead.setScale(headScale);
    this.playerHead.setDepth(this.player.depth + 1);
    this.playerHead.setVisible(false);

    // Animation system
    createPlayerAnimations(this);
    this.animator = new PlayerAnimator(this, this.player, this.playerForm);
    this.effects = new EffectManager({ scene: this });
    this.dustPuff = createDustPuff(this);
    this.wasOnGround = true;

    // Initialize Ping companion (active from World 4 onward)
    this.ping = new PingCompanion(this);
    if (this.world >= 4) {
      this.ping.activate(spawn.x + 20, spawn.y - 16);
    }

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
      const pickup = coin as Phaser.Physics.Arcade.Sprite;
      const collectibleId = String(pickup.getData('collectibleId') ?? '');
      if (collectibleId) {
        runtimeStore.save = setLevelCollectibleStatus(runtimeStore.save, this.world, this.levelIndex, collectibleId);
      }
      const amount = SCORE_VALUES.coin;
      runtimeStore.save.progression.coins += 1;
      runtimeStore.save.progression.score += amount;
      this.renderHud();
      this.showHudToast(`+${amount} ${DISPLAY_NAMES.coin}`);
      this.collectItem(pickup);
      this.dustPuff.emitAt(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2, 6);
      // Sparkle effect
      this.effects.emitSparkle(pickup.x, pickup.y, 0xffd700, 5); // Gold sparkles
      this.playSfx('coin');
    });

    this.physics.add.overlap(this.player, this.stars, (_p, star) => {
      const pickup = star as Phaser.Physics.Arcade.Sprite;
      const powerupType = pickup.getData('powerupType') as string | undefined;

      // Bart's Rule #1 (No Handouts): Suppress power-ups entirely
      if (arePowerUpsDisabled() && powerupType) {
        // Still collect the item visually but don't apply effect
        this.collectItem(pickup);
        this.showHudToast('NO HANDOUTS');
        return;
      }

      const evalId = String(pickup.getData('collectibleId') ?? '');
      if (evalId) {
        runtimeStore.save = setLevelEvalStatus(runtimeStore.save, this.world, this.levelIndex, evalId);
      }
      const amount = SCORE_VALUES.star;
      runtimeStore.save.progression.stars += 1;
      runtimeStore.save.progression.score += amount;
      this.renderHud();
      this.showHudToast(`+${amount} ${DISPLAY_NAMES.star}`);
      this.collectItem(pickup);
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2, 10);
      this.playSfx('power');
    });

    this.physics.add.overlap(this.player, this.personnelFiles, (_p, fileObj) => {
      const file = fileObj as Phaser.Physics.Arcade.Sprite;
      const fileId = String(file.getData('fileId') ?? '');
      const fileWorld = Number(file.getData('fileWorld') ?? this.world);
      if (!fileId) {
        return;
      }
      runtimeStore.save = collectPersonnelFile(runtimeStore.save, fileWorld, fileId);
      persistSave(runtimeStore.save);
      this.showHudToast(`PERSONNEL FILE ${runtimeStore.save.personnelFilesCollected.length}/25`);
      this.collectItem(file);
      this.effects.emitSparkle(this.player.x, this.player.y - 12, 0xfff6b5, 7);
      this.playSfx('coin');
    });

    this.physics.add.overlap(this.player, this.checkpoints, (_p, cpObj) => {
      // Bart's Rule #2 (Manual Override): Checkpoints disabled
      if (areCheckpointsDisabled()) {
        return;
      }
      const point = cpObj as Phaser.Physics.Arcade.Sprite;
      const prevId = this.checkpointId;
      this.checkpointId = String(point.getData('checkpointId'));
      this.checkpointXY = { x: point.x, y: point.y - 20 };
      point.setTint(0x76ff03);
      if (prevId !== this.checkpointId) {
        this.showHudToast(SCENE_TEXT.gameplay.checkpointSaved);
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

    // Monitor proximity detection for environmental storytelling
    this.physics.add.overlap(this.player, this.monitors, () => {
      this.monitorNearby = true;
      if (shouldShowMonitorMessage(this.storytelling, this.time.now)) {
        const msg = getWorldMonitorMessage(
          this.world,
          this.maintenanceAccess,
          runtimeStore.save.unlocks.omegaLogs,
        );
        this.showHudToast(msg);
        updateMonitorDisplayTime(this.storytelling, this.time.now);
      }
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
      const target = this.enemyHandleMap.get(eObj as Phaser.Physics.Arcade.Sprite);
      if (!target) return;
      const result = target.onPlayerCollision(p);
      if (result === 'harmless') return;
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
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      p: Phaser.Input.Keyboard.KeyCodes.P
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.hud = createHud(this);
    this.storytelling = createStorytellingState();
    this.lives = 3;
    if (this.maintenanceAccess) {
      const omegaTag = runtimeStore.save.unlocks.omegaLogs ? ' [OMEGA LOGS]' : '';
      this.showHudToast(`MAINTENANCE ACCESS ACTIVE${omegaTag}`);
    }

    this.audio.configureFromSettings(runtimeStore.save.settings);
    this.audio.stopMusic();
    this.startStageMusic();

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
      if (this.physics?.world?.isPaused) {
        this.physics.world.resume();
      }
      this.stompHitstop = undefined;
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
      this.ping?.destroy();
      this.ping = null;
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
    this.enemyHandleMap.set(walker.sprite, walker);
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
        this.enemyHandleMap.set(handle.sprite, handle);
        this.enemiesGroup.add(handle.sprite);
      },
    };
  }

  private shouldSuppressScorePickup(entityType: string): boolean {
    if (!this.maintenanceAccess) {
      return false;
    }
    return entityType === 'coin'
      || entityType === 'star'
      || entityType === 'token'
      || entityType === 'eval'
      || entityType === 'question_block';
  }

  private shouldSuppressEntityInSetPieceMode(entityType: string): boolean {
    if (this.setPieceMode !== 'approach') {
      return false;
    }
    return (
      entityType === 'walker'
      || entityType === 'shell'
      || entityType === 'flying'
      || entityType === 'spitter'
      || entityType === 'boss'
      || entityType === 'compliance_officer'
      || entityType === 'technical_debt'
      || entityType === 'hallucination'
      || entityType === 'legacy_system'
      || entityType === 'hot_take'
      || entityType === 'analyst'
      || entityType === 'spike'
      || entityType === 'spring'
      || entityType === 'thwomp'
      || entityType === 'moving_platform'
      || entityType === 'diagnostic_node'
      || entityType === 'monitor'
      || entityType === 'poster'
      || entityType === 'personal_effect'
      || entityType === 'checkpoint'
    );
  }

  private shouldSpawnEnemyInMaintenance(entityId: string, enemyType: string): boolean {
    if (!this.maintenanceAccess || enemyType === 'boss') {
      return true;
    }
    const maintenanceChancePercent = Math.max(1, applyMaintenanceDensity(100));
    let hash = 0;
    const source = `${entityId}|${this.world}|${this.levelIndex}`;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 33 + source.charCodeAt(index)) % 10_007;
    }
    return (hash % 100) < maintenanceChancePercent;
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
      maintenanceFileCounterText: this.maintenanceAccess ? getMaintenanceFileCounterText(this.world) : undefined,
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

  /** NES-style stomp: squash flat, pause, then flip upside-down and slide off screen. */
  private squashAndDisableSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
    if (!sprite.active) {
      return;
    }
    const scaleX = sprite.scaleX;
    const scaleY = sprite.scaleY;
    const baselineY = sprite.y;

    // Phase 1: flatten squash (80ms)
    this.tweens.add({
      targets: sprite,
      scaleX: scaleX * 1.15,
      scaleY: Math.max(0.15, scaleY * 0.15),
      y: baselineY + (scaleY * 8),
      duration: 80,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!sprite.active) return;

        // Phase 2: hold squash flat for 120ms, then flip and fall
        this.time.delayedCall(120, () => {
          if (!sprite.active) return;

          // Flip upside-down
          sprite.setFlipY(true);
          sprite.setTint(0x888888);

          // Disable physics collision so it falls through the world
          if (sprite.body) {
            (sprite.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
          }

          // Phase 3: fall off screen (NES Mario enemy death arc)
          this.tweens.add({
            targets: sprite,
            y: sprite.y - 30,
            scaleX: scaleX * 0.9,
            scaleY: scaleY * 0.9,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
              if (!sprite.active) return;
              // Now drop off screen
              this.tweens.add({
                targets: sprite,
                y: sprite.y + 300,
                alpha: 0,
                duration: 400,
                ease: 'Quad.easeIn',
                onComplete: () => {
                  if (sprite.active) {
                    sprite.disableBody(true, true);
                    sprite.destroy();
                  }
                },
              });
            },
          });
        });
      },
    });
  }

  /** Shell-kill: enemy flips upside-down and slides off the bottom of the screen. */
  private flipAndSlideOffScreen(sprite: Phaser.Physics.Arcade.Sprite, dirX: number): void {
    if (!sprite.active) return;
    sprite.setFlipY(true);
    sprite.setTint(0x888888);
    if (sprite.body) {
      (sprite.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;
    }
    this.effects.emitSparkle(sprite.x, sprite.y, 0xffff00, 4);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 40,
      x: sprite.x + dirX * 30,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!sprite.active) return;
        this.tweens.add({
          targets: sprite,
          y: sprite.y + 350,
          x: sprite.x + dirX * 60,
          alpha: 0,
          duration: 450,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (sprite.active) {
              sprite.disableBody(true, true);
              sprite.destroy();
            }
          },
        });
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
    abilities: {
      pulseChargeMs: number;
      manualCheckHoldMs: number;
      doubleJumpUnlocked: boolean;
      airJumpsUsed: number;
      groundPoundActive: boolean;
    };
    playfeel: {
      jumpCutApplied: boolean;
      jumpCutWindowMsLeft: number;
      skidMsLeft: number;
      lastMotionHint: MotionHint;
      stompHitstopActive: boolean;
      stompHitstopFrame: number;
    };
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
      lastMotionHint: this.lastMotionHint,
    };

    return {
      ...this.getRuntimeState(),
      stompHitstopTelemetry: this.getStompHitstopTelemetry(),
      movement,
      animState: this.animator?.getState ? this.animator.getState() : 'idle',
      sceneFrame: this.game.loop.frame,
      // Non-serialized feel contract state for deterministic feel telemetry in QA harnesses.
      feel: this.feel,
      playfeel: {
        jumpCutApplied: this.feel.jumpCutApplied,
        jumpCutWindowMsLeft: this.feel.jumpCutWindowMsLeft,
        skidMsLeft: this.feel.skidMsLeft,
        lastMotionHint: this.lastMotionHint,
        stompHitstopActive: this.stompHitstop !== undefined && this.stompHitstop !== null,
        stompHitstopFrame: this.getStompHitstopTelemetry().lastAppliedStompAtFrame,
      },
      abilities: {
        pulseChargeMs: this.pulseChargeMs,
        manualCheckHoldMs: this.manualCheckHoldMs,
        doubleJumpUnlocked: runtimeStore.save.unlocks.doubleJump,
        airJumpsUsed: this.airJumpsUsed,
        groundPoundActive: this.isGroundPounding,
      },
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

  private playSfx(kind: 'jump' | 'coin' | 'stomp' | 'hurt' | 'power' | 'shell' | 'flag' | 'block_hit' | 'land' | 'skid' | 'death_jingle' | 'victory_fanfare' | 'time_warning'): void {
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
      victory_fanfare: 'victory_fanfare',
      time_warning: 'time_warning'
    } as const;
    this.audio.playSfx(keyMap[kind]);
  }

  private showHudToast(message: string): void {
    const typography = styleConfig.typography;
    const defaultColor = Phaser.Display.Color.HexStringToColor(stylePalette.hudText ?? '#ffffff').color;
    const toast = this.add
      .bitmapText(VIEW_WIDTH / 2, 46, typography.fontKey, message, 14)
      .setOrigin(0.5, 0)
      .setTint(defaultColor)
      .setScrollFactor(0)
      .setDepth(2000);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: toast.y - 12,
      duration: 700,
      delay: 450,
      ease: 'Quad.easeIn',
      onComplete: () => {
        toast.destroy();
      },
    });
  }

  private emitRackPulse(charged: boolean): void {
    const radius = charged ? 140 : 88;
    const scoreDelta = charged ? SCORE_VALUES.stomp * 2 : SCORE_VALUES.stomp;
    let hits = 0;
    for (const handle of this.enemyHandles) {
      if (!handle.sprite.active) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, handle.sprite.x, handle.sprite.y);
      if (distance > radius) {
        continue;
      }
      hits += 1;
      const direction = Math.sign(handle.sprite.x - this.player.x) || 1;
      handle.sprite.setVelocityX(direction * (charged ? 180 : 90));
      handle.sprite.setVelocityY(charged ? -220 : -90);
      this.effects.emitSparkle(handle.sprite.x, handle.sprite.y, charged ? 0xffef9c : 0xa7dfff, charged ? 8 : 4);
      if (charged && handle.kind !== 'shell') {
        this.squashAndDisableSprite(handle.sprite);
        runtimeStore.save.progression.score += scoreDelta;
      }
    }
    this.effects.emitSparkle(this.player.x, this.player.y - 8, charged ? 0xffef9c : 0x9ad8ff, charged ? 10 : 6);
    this.playSfx('power');
    if (hits > 0) {
      this.showHudToast(charged ? 'CHARGED RACK PULSE' : 'RACK PULSE');
    }
  }

  private runManualCheck(): void {
    const nearest = this.diagnosticNodes?.getChildren()
      .map((node) => node as Phaser.Physics.Arcade.Sprite)
      .reduce((best, node) => {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y);
        return Math.min(best, distance);
      }, Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nearest) || nearest > 56) {
      this.showHudToast('NO DIAGNOSTIC NODE IN RANGE');
      return;
    }

    const nearbyFile = this.personnelFiles?.getChildren()
      .map((file) => file as Phaser.Physics.Arcade.Sprite)
      .find((file) => Phaser.Math.Distance.Between(this.player.x, this.player.y, file.x, file.y) <= 220);

    const messages = [
      'MANUAL CHECK: PATROL ROUTE REVEALED',
      'MANUAL CHECK: HAZARD CYCLE LOGGED',
      nearbyFile ? 'MANUAL CHECK: FILE PING WITHIN RANGE' : 'MANUAL CHECK: NO FILE PING',
      'MANUAL CHECK: CRACKED SURFACE MARKED',
    ];
    const index = Math.floor((this.levelTimeMs / 1000) % messages.length);
    this.showHudToast(messages[index]!);
    this.effects.emitSparkle(this.player.x, this.player.y - 16, 0x7fffd4, 6);
    this.playSfx('coin');
  }

  private isRackPulseEnabled(): boolean {
    return this.setPieceMode !== 'avalanche-alley';
  }

  private revealCollapseHazard(dtMs: number): void {
    if (this.setPieceMode !== 'collapse' || this.setPieceCollapseHazards.length === 0 || this.setPieceCollapseHazardIndex >= this.setPieceCollapseHazards.length) {
      return;
    }
    const revealIntervalMs = 420;
    this.setPieceCollapseHazardTimerMs += dtMs;
    while (this.setPieceCollapseHazardTimerMs >= revealIntervalMs && this.setPieceCollapseHazardIndex < this.setPieceCollapseHazards.length) {
      this.setPieceCollapseHazardTimerMs -= revealIntervalMs;
      const platform = this.setPieceCollapseHazardHazardAt(this.setPieceCollapseHazardIndex);
      this.setPieceCollapseHazardIndex += 1;
      if (!platform?.active) {
        continue;
      }
      this.tweens.add({
        targets: platform,
        alpha: 0,
        y: platform.y + 8,
        duration: 280,
        ease: 'Quad.easeIn',
        onComplete: () => {
          platform.disableBody(true, true);
        },
      });
    }
  }

  private setPieceCollapseHazardAt(index: number): Phaser.Physics.Arcade.Sprite | undefined {
    const platform = this.setPieceCollapseHazards[index];
    if (!platform || !platform.body) {
      return undefined;
    }
    return platform;
  }

  private triggerStompHitstop(): void {
    if (!this.physics?.world) {
      return;
    }

    const didPauseForHitstop = !this.physics.world.isPaused;
    const record = {
      frame: this.game.loop.frame,
      appliedMs: PLAYER_CONSTANTS.stompHitstopMs,
      paused: didPauseForHitstop,
      resumed: !didPauseForHitstop,
    };
    this.lastAppliedStompAtFrame = record.frame;
    this.stompHitstopHistory.push(record);
    if (this.stompHitstopHistory.length > this.maxStompHitstopHistory) {
      this.stompHitstopHistory.shift();
    }

    const amount = SCORE_VALUES.stomp;
    this.showHudToast(`+${amount} ${DISPLAY_NAMES.stomp}`);
    if (!didPauseForHitstop) {
      return;
    }

    this.physics.world.pause();
    const delayMs = PLAYER_CONSTANTS.stompHitstopMs;
    this.stompHitstop = this.time.delayedCall(delayMs, () => {
      if (this.physics?.world?.isPaused) {
        this.physics.world.resume();
      }
      this.stompHitstop = undefined;
      record.resumed = true;
    });
  }

  private getStompHitstopTelemetry(): StompHitstopTelemetry {
    const world = this.physics?.world;
    const isWorldPaused = Boolean(world && world.isPaused);
    return {
      lastAppliedStompAtFrame: this.lastAppliedStompAtFrame,
      lastAppliedMs: PLAYER_CONSTANTS.stompHitstopMs,
      currentlyPaused: isWorldPaused && this.stompHitstop != null,
      history: [...this.stompHitstopHistory],
    };
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
        this.startStageMusic();
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
      this.time.addEvent({
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
    const wasBonusRoute = this.bonusRouteId != null;
    this.completed = true;
    this.animator.triggerWin();
    this.audio.stopMusic();
    this.playSfx('victory_fanfare');

    // Stop player movement for the celebration
    this.player.setVelocityX(0);

    runtimeStore.save.progression.score += SCORE_VALUES.completeBonus;
    runtimeStore.save.progression.timeMs += this.levelTimeMs;
    runtimeStore.save = clearActiveBonusRouteId(runtimeStore.save);
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
      if (wasBonusRoute) {
        transitionToScene(this, 'WorldMapScene', undefined, { durationMs: 150, fadeInMs: 180 });
        return;
      }
      transitionToScene(this, 'InterludeScene', {
        completedWorld: this.world,
        completedStage: this.levelIndex,
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

    // Time warning: speed up music when running low on time (NES-style urgency)
    const timeSec = Math.floor(this.levelTimeMs / 1000);
    if (!this.timeWarningActive && timeSec >= PlayScene.TIME_WARNING_SEC) {
      // Deliberately inverted: levelTimeMs counts UP, so warning fires at 60s elapsed
      // Override to ~1.4x the base tempo for that panicked NES feel
      this.timeWarningActive = true;
      const rules = getWorldRules(this.world);
      const baseTempo = rules.campaign?.speedMultiplier
        ? 126 * rules.campaign.speedMultiplier
        : 126;
      this.audio.setMusicTempoOverride(Math.round(baseTempo * 1.4));
      this.playSfx('time_warning');
    }

    if (this.invulnMsRemaining > 0) {
      this.invulnMsRemaining = Math.max(0, this.invulnMsRemaining - dtMs);

      // NES-style invincibility: rapid color cycling through 6 hues
      const INVULN_COLORS = [0xffffff, 0xff4444, 0x44ff44, 0x4488ff, 0xffff44, 0xff44ff];
      const colorIdx = Math.floor(this.levelTimeMs / 60) % INVULN_COLORS.length;
      const alpha = this.invulnMsRemaining % 120 < 60 ? 0.7 : 1;
      this.player.setTint(INVULN_COLORS[colorIdx]!);
      this.playerHead.setTint(INVULN_COLORS[colorIdx]!);
      this.player.setAlpha(alpha);
      this.playerHead.setAlpha(alpha);
    } else {
      this.player.clearTint();
      this.playerHead.clearTint();
      this.player.setAlpha(1);
      this.playerHead.setAlpha(1);
    }

    // -- Auto-scroll logic (World 5 benchmark segments) --
    this.updateAutoScroll(dtMs);
    this.revealCollapseHazard(dtMs);

    if (this.setPieceMode !== 'approach') {
      updateMovingPlatforms(this.movingPlatforms);
    }
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

    const shellChain = collectShellChainKillPairs(
      this.enemyHandles.map((handle) => ({
        active: handle.sprite.active,
        kind: handle.kind,
        x: handle.sprite.x,
        y: handle.sprite.y,
        velocityX: handle.sprite.body?.velocity.x ?? 0,
      })),
    );
    const processedTargets = new Set<number>();
    for (const pair of shellChain) {
      const target = this.enemyHandles[pair.targetIndex];
      const source = this.enemyHandles[pair.sourceIndex];
      if (!source || !target || !source.sprite.active || !target.sprite.active || source.kind !== 'shell') {
        continue;
      }
      if (processedTargets.has(pair.targetIndex)) {
        continue;
      }
      this.flipAndSlideOffScreen(target.sprite, pair.shellDirX);
      processedTargets.add(pair.targetIndex);
      runtimeStore.save.progression.score += SCORE_VALUES.stomp;
    }

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
      maintenanceFileCounterText: this.maintenanceAccess ? getMaintenanceFileCounterText(this.world) : undefined,
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
      this.scene.restart({
        world: this.world,
        stage: this.levelIndex,
        bonus: this.levelBonus,
        bonusRouteId: this.bonusRouteId,
        maintenance: this.maintenanceAccess,
      });
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
    const downHeld = this.keys.down.isDown;
    const jumpHeld = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const jumpPressed = jumpHeld && !this.jumpHeldLast;
    const pulseHeld = this.keys.j.isDown;
    const pulseJustReleased = Phaser.Input.Keyboard.JustUp(this.keys.j);
    const onGroundBeforeStep = this.player.body?.blocked.down || this.player.body?.touching.down || false;
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

    if (onGroundBeforeStep) {
      this.airJumpsUsed = 0;
      this.isGroundPounding = false;
    }

    if (downHeld && jumpPressed && !onGroundBeforeStep && !this.isGroundPounding) {
      this.isGroundPounding = true;
      step.vy = Math.max(step.vy, 520);
      this.effects.emitSparkle(this.player.x, this.player.y + 12, 0xffffff, 5);
      this.showHudToast('GROUND POUND');
    }

    if (this.isGroundPounding && !onGroundBeforeStep) {
      step.vy = Math.max(step.vy, 560);
    }

    if (
      jumpPressed
      && !onGroundBeforeStep
      && !step.jumped
      && runtimeStore.save.unlocks.doubleJump
      && this.airJumpsUsed < 1
    ) {
      step.vy = PLAYER_CONSTANTS.jumpVelocity * 0.86;
      this.airJumpsUsed += 1;
      this.playSfx('jump');
      this.effects.emitSparkle(this.player.x, this.player.y, 0x9cdaff, 6);
      this.showHudToast('DOUBLE JUMP');
    }

    this.player.setVelocityX(step.vx);
    this.player.setVelocityY(step.vy);
    if (step.jumped) this.playSfx('jump');
    this.lastMotionHint = step.motionHint;

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

    // Update Ping companion
    this.ping?.update(this.player.x, this.player.y, Math.min(40, delta));
    // Check for nearby personnel files to increase Ping brightness
    if (this.ping && this.ping.isActive()) {
      let nearestFileDistance = Number.POSITIVE_INFINITY;
      for (const file of this.personnelFiles.getChildren()) {
        const fileSprite = file as Phaser.Physics.Arcade.Sprite;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, fileSprite.x, fileSprite.y);
        if (distance < nearestFileDistance) {
          nearestFileDistance = distance;
        }
      }
      // Brightness increases when near files (within ~200px), max at ~80px
      const fileBrightness = Math.max(0.5, 1.0 - (nearestFileDistance / 200));
      this.ping.setBrightness(fileBrightness);
    }

    // Dust puff + SFX on skid/land
    if (this.animator.justEntered('land')) {
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2);
      this.playSfx('land');
    }
    if (this.animator.justEntered('skid')) {
      this.effects.emitDust(this.player.x, this.player.y + (this.player.height * this.player.scaleY) / 2);
      this.playSfx('skid');
    }

    if (pulseHeld && !downHeld && this.isRackPulseEnabled()) {
      this.pulseChargeMs = Math.min(1800, this.pulseChargeMs + Math.min(40, delta));
      this.manualCheckHoldMs = 0;
    } else if (downHeld && pulseHeld) {
      this.manualCheckHoldMs = Math.min(1300, this.manualCheckHoldMs + Math.min(40, delta));
      this.pulseChargeMs = 0;
      if (this.manualCheckHoldMs >= 1000) {
        this.manualCheckHoldMs = 0;
        this.runManualCheck();
      }
    } else {
      this.manualCheckHoldMs = 0;
    }

    if (pulseJustReleased) {
      if (!this.isRackPulseEnabled()) {
        if (!this.setPieceModeMessageShown) {
          this.showHudToast('NO RACK PULSE');
          this.setPieceModeMessageShown = true;
        }
        this.pulseChargeMs = 0;
        return;
      }
      const charged = this.pulseChargeMs >= 1500;
      this.emitRackPulse(charged);
      this.pulseChargeMs = 0;
    }

    const lookAhead = Phaser.Math.Clamp((this.player.body?.velocity.x ?? 0) * 0.18, -90, 90);
    this.cameras.main.followOffset.x = lookAhead;

    this.jumpHeldLast = jumpHeld;
    this.simulateStep(Math.min(40, delta));
  }
}
