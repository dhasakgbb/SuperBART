import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';
import { PLAYER_CONSTANTS, SCORE_VALUES, TILE_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from '../core/constants';
import { buildRuntimeState, runtimeStore } from '../core/runtime';
import { spawnEnemy, type EnemyHandle } from '../enemies/registry';
import { updateMovingPlatforms, updateThwomps } from '../hazards/systems';
import { generateLevel, validateGeneratedLevel } from '../levelgen/generator';
import { resolvePlayerDamage } from '../player/powerup';
import { createFeelState, stepMovement } from '../player/movement';
import { renderGameplayBackground } from '../rendering/parallax';
import styleConfig from '../style/styleConfig';
import { computeSeed } from '../systems/progression';
import { persistSave } from '../systems/save';
import type { PlayerForm, SuperBartRuntimeState } from '../types/game';
import { createHud, renderHud, type HudRefs } from '../ui/hud';

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
  private goal!: Phaser.Physics.Arcade.Sprite;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private thwomps!: Phaser.Physics.Arcade.Group;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private enemyHandles: EnemyHandle[] = [];
  private collectibleGlows = new Map<number, Phaser.GameObjects.Image>();
  private glowIdCounter = 1;
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

  private completed = false;
  private world = 1;
  private levelIndex = 1;

  constructor() {
    super('PlayScene');
  }

  init(data: { bonus?: boolean }): void {
    this.levelBonus = Boolean(data?.bonus);
  }

  create(): void {
    runtimeStore.mode = 'playing';

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
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.thwomps = this.physics.add.group({ immovable: true, allowGravity: false });
    this.enemiesGroup = this.physics.add.group();

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
      platform.body.allowGravity = false;
      platform.setImmovable(true);
    }

    let spawn = { x: 48, y: 48 };
    for (const e of level.entities) {
      if (e.type === 'spawn') {
        spawn = { x: e.x, y: e.y };
      } else if (e.type === 'coin') {
        const coin = this.coins.create(e.x, e.y, 'coin') as Phaser.Physics.Arcade.Sprite;
        coin.refreshBody();
        this.attachCollectibleGlow(coin, 'coin');
      } else if (e.type === 'star') {
        const star = this.stars.create(e.x, e.y, 'star') as Phaser.Physics.Arcade.Sprite;
        star.refreshBody();
        this.attachCollectibleGlow(star, 'coin');
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
      } else if (e.type === 'walker' || e.type === 'shell' || e.type === 'flying' || e.type === 'spitter') {
        const handle = spawnEnemy(e.type, this, e.x, e.y, { scene: this, projectiles: this.projectiles }, e.data);
        this.enemyHandles.push(handle);
        this.enemiesGroup.add(handle.sprite);
      }
    }

    const playerTextureKey = this.playerForm === 'big' ? 'bart_head_64' : 'bart_head_48';
    this.player = this.physics.add.sprite(spawn.x, spawn.y, playerTextureKey);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(PLAYER_CONSTANTS.maxSpeed, PLAYER_CONSTANTS.maxFallSpeed);
    this.player.body.setSize(12, 15).setOffset(2, 1);
    this.checkpointXY = { ...spawn };

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.enemiesGroup, this.solids);
    this.physics.add.collider(this.enemiesGroup, this.movingPlatforms);
    this.physics.add.collider(this.projectiles, this.solids, (proj) => proj.destroy());

    this.physics.add.collider(this.player, this.oneWay, undefined, (_player, platform) => {
      const p = _player.body as Phaser.Physics.Arcade.Body;
      const f = (platform as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return p.velocity.y >= 0 && p.bottom <= f.top + 10;
    });

    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      this.detachCollectibleGlow(coin as Phaser.Physics.Arcade.Sprite);
      coin.destroy();
      runtimeStore.save.progression.coins += 1;
      runtimeStore.save.progression.score += SCORE_VALUES.coin;
      this.playSfx('coin');
    });

    this.physics.add.overlap(this.player, this.stars, (_p, star) => {
      this.detachCollectibleGlow(star as Phaser.Physics.Arcade.Sprite);
      star.destroy();
      runtimeStore.save.progression.stars += 1;
      runtimeStore.save.progression.score += SCORE_VALUES.star;
      this.playSfx('power');
    });

    this.physics.add.overlap(this.player, this.checkpoints, (_p, cpObj) => {
      const cp = cpObj as Phaser.Physics.Arcade.Sprite;
      this.checkpointId = String(cp.getData('checkpointId'));
      this.checkpointXY = { x: cp.x, y: cp.y - 20 };
      cp.setTint(0x76ff03);
    });

    this.physics.add.overlap(this.player, this.goal, () => this.onGoalReached());
    this.physics.add.overlap(this.player, this.spikes, () => this.damagePlayer('spike'));
    this.physics.add.overlap(this.player, this.thwomps, () => this.damagePlayer('thwomp'));
    this.physics.add.overlap(this.player, this.projectiles, (_p, proj) => {
      proj.destroy();
      this.damagePlayer('projectile');
    });
    this.physics.add.overlap(this.player, this.springs, () => {
      this.player.setVelocityY(-460);
      this.playSfx('jump');
    });

    this.physics.add.collider(this.player, this.enemiesGroup, (pObj, eObj) => {
      const p = pObj as Phaser.Physics.Arcade.Sprite;
      const target = this.enemyHandles.find((h) => h.sprite === eObj);
      if (!target) return;
      const result = target.onPlayerCollision(p);
      if (result === 'stomp') {
        if (p.body.velocity.y > 0) {
          p.setVelocityY(-220);
        }
        if (target.kind === 'shell' && Math.abs(target.sprite.body.velocity.x) >= 150) {
          this.playSfx('shell');
        }
        if (target.kind !== 'shell' || (target.kind === 'shell' && target.sprite.body.velocity.x === 0)) {
          if (target.kind !== 'shell' || target.sprite.texture.key !== 'enemy_shell_retracted') {
            target.sprite.disableBody(true, true);
          }
        }
        runtimeStore.save.progression.score += SCORE_VALUES.stomp;
        this.playSfx('stomp');
        this.physics.world.pause();
        this.time.delayedCall(PLAYER_CONSTANTS.hitstopMs, () => this.physics.world.resume());
      } else {
        this.damagePlayer('enemy');
      }
    });

    this.cameras.main.setBounds(0, 0, level.width * TILE_SIZE, level.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, false, 0.16, 0.1);
    this.cameras.main.setDeadzone(170, 90);

    this.keys = this.input.keyboard!.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
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
    const root = (window as Window & { __SUPER_BART__?: Record<string, unknown> }).__SUPER_BART__ ?? {};
    root.getState = () => this.getRuntimeState();
    root.scene = this;
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
  }

  private attachCollectibleGlow(sprite: Phaser.Physics.Arcade.Sprite, textureKey: string): void {
    if (!styleConfig.bloom.enabled) {
      return;
    }
    const glow = this.add.image(sprite.x, sprite.y, textureKey)
      .setDepth(sprite.depth - 1)
      .setAlpha(Math.min(0.8, Math.max(0.22, styleConfig.bloom.strength)))
      .setTint(Phaser.Display.Color.HexStringToColor(styleConfig.bloom.tint).color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1 + styleConfig.bloom.radius * 0.09);
    const id = this.glowIdCounter++;
    sprite.setData('collectibleGlowId', id);
    this.collectibleGlows.set(id, glow);
  }

  private detachCollectibleGlow(sprite: Phaser.Physics.Arcade.Sprite): void {
    const id = Number(sprite.getData('collectibleGlowId'));
    if (!Number.isFinite(id)) {
      return;
    }
    const glow = this.collectibleGlows.get(id);
    if (glow) {
      glow.destroy();
      this.collectibleGlows.delete(id);
    }
  }

  private getRuntimeState(): SuperBartRuntimeState {
    return buildRuntimeState({
      playerForm: this.playerForm,
      lives: this.lives,
      invulnMsRemaining: this.invulnMsRemaining,
      checkpointId: this.checkpointId
    });
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

  private playSfx(kind: 'jump' | 'coin' | 'stomp' | 'hurt' | 'power' | 'shell' | 'flag'): void {
    const keyMap = {
      jump: 'jump',
      coin: 'coin',
      stomp: 'stomp',
      hurt: 'hurt',
      power: 'power_up',
      shell: 'shell_kick',
      flag: 'goal_clear'
    } as const;
    this.audio.playSfx(keyMap[kind]);
  }

  private damagePlayer(reason: string): void {
    if (this.invulnMsRemaining > 0 || this.completed) {
      return;
    }

    const result = resolvePlayerDamage(this.playerForm);
    if (!result.dead) {
      this.playerForm = result.nextForm;
      this.player.setTexture(this.playerForm === 'big' ? 'bart_head_64' : 'bart_head_48');
      this.invulnMsRemaining = PLAYER_CONSTANTS.invulnMs;
      this.player.setVelocity(this.player.flipX ? PLAYER_CONSTANTS.knockbackX : -PLAYER_CONSTANTS.knockbackX, PLAYER_CONSTANTS.knockbackY);
      this.playSfx('hurt');
      if (runtimeStore.save.settings.screenShakeEnabled) {
        this.cameras.main.shake(140, 0.003);
      }
      return;
    }

    runtimeStore.save.progression.deaths += 1;
    this.lives -= 1;
    this.invulnMsRemaining = PLAYER_CONSTANTS.invulnMs;
    this.playSfx('hurt');

    if (this.lives <= 0) {
      runtimeStore.mode = 'game_over';
      persistSave(runtimeStore.save);
      this.scene.start('GameOverScene');
      return;
    }

    this.playerForm = 'small';
    this.player.setTexture('bart_head_48');
    this.player.setPosition(this.checkpointXY.x, this.checkpointXY.y);
    this.player.setVelocity(0, 0);
    this.player.clearTint();

    if (reason === 'pit' && runtimeStore.save.settings.screenShakeEnabled) {
      this.cameras.main.shake(190, 0.004);
    }
  }

  private onGoalReached(): void {
    if (this.completed) return;
    this.completed = true;
    this.playSfx('flag');
    runtimeStore.save.progression.score += SCORE_VALUES.completeBonus;
    runtimeStore.save.progression.timeMs += this.levelTimeMs;
    persistSave(runtimeStore.save);
    this.audio.stopMusic();
    this.scene.start('LevelCompleteScene', {
      stats: {
        timeSec: Math.floor(this.levelTimeMs / 1000),
        coins: runtimeStore.save.progression.coins,
        stars: runtimeStore.save.progression.stars,
        deaths: runtimeStore.save.progression.deaths
      }
    });
  }

  private simulateStep(dtMs: number): void {
    if (this.completed) return;
    this.levelTimeMs += dtMs;
    if (this.invulnMsRemaining > 0) {
      this.invulnMsRemaining = Math.max(0, this.invulnMsRemaining - dtMs);
      this.player.setAlpha(this.invulnMsRemaining % 120 < 60 ? 0.6 : 1);
    } else {
      this.player.setAlpha(1);
    }

    updateMovingPlatforms(this.movingPlatforms);
    updateThwomps(this.thwomps, this.player.x);

    for (const handle of this.enemyHandles) {
      if (handle.sprite.active) handle.update(dtMs);
    }

    this.projectiles.children.each((c) => {
      const p = c as Phaser.Physics.Arcade.Sprite;
      if (p.active && (p.x < 0 || p.x > this.physics.world.bounds.width + 30)) {
        p.destroy();
      }
    });

    this.enemyHandles.forEach((shell) => {
      if (shell.kind !== 'shell' || !shell.sprite.active) return;
      if (Math.abs(shell.sprite.body.velocity.x) < 150) return;
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
      timeSec: Math.floor(this.levelTimeMs / 1000)
    });
  }

  update(_time: number, delta: number): void {
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

    const step = stepMovement({
      dtMs: Math.min(40, delta),
      vx: this.player.body.velocity.x,
      vy: this.player.body.velocity.y,
      inputX: left === right ? 0 : left ? -1 : 1,
      jumpPressed,
      jumpHeld,
      onGround: this.player.body.blocked.down || this.player.body.touching.down,
      feel: this.feel
    });
    this.feel = step.feel;

    this.player.setVelocityX(step.vx);
    this.player.setVelocityY(step.vy);
    if (step.jumped) this.playSfx('jump');

    if (this.player.body.velocity.x > 0) this.player.setFlipX(false);
    if (this.player.body.velocity.x < 0) this.player.setFlipX(true);

    const lookAhead = Phaser.Math.Clamp(this.player.body.velocity.x * 0.18, -90, 90);
    this.cameras.main.followOffset.x = lookAhead;

    this.jumpHeldLast = jumpHeld;
    this.simulateStep(Math.min(40, delta));
  }
}
