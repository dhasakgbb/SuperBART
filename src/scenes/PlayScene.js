import Phaser from 'phaser';
import { GAME_CONSTANTS, GAME_MODES, INPUT_KEYS } from '../game/config.js';
import {
  createInitialState,
  registerCoinCollect,
  registerEnemyStomp,
  registerGoalReach,
  registerPlayerDeath
} from '../game/stateMachine.js';
import { computeHorizontalStep, applyJumpCut } from '../logic/playerPhysics.js';
import { resolveEnemyCollision } from '../logic/combatRules.js';
import { parseLevelObjects } from '../level/levelParser.js';
import { createHud, renderHud } from '../ui/hud.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.horizontalVelocity = 0;
    this.jumpHeldLast = false;
    this.pendingRespawn = false;
    this.invulnerableUntil = 0;
    this.enemyMeta = new Map();
  }

  create() {
    const levelData = this.cache.tilemap.get('level1')?.data;
    if (!levelData) {
      throw new Error('Could not read level1 tilemap data from cache.');
    }

    this.levelObjects = parseLevelObjects(levelData);

    this.map = this.make.tilemap({ key: 'level1' });
    const tileset = this.map.addTilesetImage('terrain', 'terrain');
    this.groundLayer = this.map.createLayer('ground', tileset, 0, 0);
    this.groundLayer.setCollisionByExclusion([0, -1]);

    this.mapWidthPx = this.map.widthInPixels;
    this.mapHeightPx = this.map.heightInPixels;

    this.physics.world.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);

    this.spawnPoint = {
      x: this.levelObjects.spawn.x,
      y: this.levelObjects.spawn.y
    };

    this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 30).setOffset(4, 2);
    this.player.body.setMaxVelocity(
      GAME_CONSTANTS.player.maxSpeed,
      GAME_CONSTANTS.player.maxFallSpeed
    );

    this.coins = this.physics.add.staticGroup();
    for (const coinSpec of this.levelObjects.coins) {
      const coin = this.coins.create(coinSpec.x, coinSpec.y, 'coin');
      coin.refreshBody();
    }

    this.enemies = this.physics.add.group({ allowGravity: true, immovable: false });
    for (const enemySpec of this.levelObjects.enemies) {
      const enemy = this.enemies.create(enemySpec.x, enemySpec.y, 'enemy');
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(GAME_CONSTANTS.enemy.speed);
      this.enemyMeta.set(enemy, {
        patrolMin: enemySpec.patrolMin,
        patrolMax: enemySpec.patrolMax
      });
    }

    this.goalGroup = this.physics.add.staticGroup();
    this.goal = this.goalGroup.create(this.levelObjects.goal.x, this.levelObjects.goal.y, 'flag');
    this.goal.refreshBody();

    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.onPlayerEnemyCollision,
      undefined,
      this
    );
    this.physics.add.overlap(this.player, this.coins, this.onPlayerCoinOverlap, undefined, this);
    this.physics.add.overlap(this.player, this.goalGroup, this.onPlayerGoalOverlap, undefined, this);

    this.cameras.main.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.keys = this.input.keyboard.addKeys({
      leftArrow: 'LEFT',
      rightArrow: 'RIGHT',
      a: 'A',
      d: 'D',
      upArrow: 'UP',
      w: 'W',
      space: 'SPACE',
      restart: INPUT_KEYS.RESTART
    });

    this.state = createInitialState(this.coins.countActive(true));
    this.hud = createHud(this, this.state);

    this.registerDebugHooks();
  }

  registerDebugHooks() {
    const debugRoot = window.__SUPER_BART__ || {};
    debugRoot.scene = this;
    debugRoot.getState = () => this.getRuntimeState();
    window.__SUPER_BART__ = debugRoot;

    window.render_game_to_text = () => JSON.stringify(this.getRuntimeState());
    window.advanceTime = (ms) => this.advanceSimulation(ms);
  }

  getRuntimeState() {
    const coinsRemaining = this.coins ? this.coins.countActive(true) : 0;
    const enemies = [];

    if (this.enemies) {
      this.enemies.children.each((enemy) => {
        if (enemy?.active) {
          enemies.push({
            x: Number(enemy.x.toFixed(2)),
            y: Number(enemy.y.toFixed(2)),
            vx: Number(enemy.body.velocity.x.toFixed(2))
          });
        }
      });
    }

    return {
      coordinateSystem: 'origin=(0,0) top-left; +x right; +y down',
      mode: this.state?.mode,
      score: this.state?.score,
      lives: this.state?.lives,
      lastEvent: this.state?.lastEvent,
      collectedCoins: this.state?.collectedCoins,
      coinsRemaining,
      enemies,
      goalReached: this.state?.mode === GAME_MODES.WIN,
      player: this.player
        ? {
            x: Number(this.player.x.toFixed(2)),
            y: Number(this.player.y.toFixed(2)),
            vx: Number(this.player.body.velocity.x.toFixed(2)),
            vy: Number(this.player.body.velocity.y.toFixed(2)),
            onGround: Boolean(this.player.body.blocked.down)
          }
        : null,
      map: {
        widthPx: this.mapWidthPx,
        heightPx: this.mapHeightPx
      }
    };
  }

  advanceSimulation(ms) {
    const stepMs = GAME_CONSTANTS.fixedStepMs;
    const steps = Math.max(1, Math.round(ms / stepMs));
    for (let i = 0; i < steps; i += 1) {
      this.physics.world.step(stepMs);
      if (this.state.mode === GAME_MODES.RUNNING) {
        this.updateEnemyPatrol();
        this.checkFallDeath();
      }
    }
    this.refreshHud();
  }

  update(_time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.scene.restart();
      return;
    }

    const dt = Math.min(delta, 34) / 1000;

    if (this.state.mode === GAME_MODES.RUNNING && this.player.active) {
      this.updatePlayerMovement(dt);
      this.updateEnemyPatrol();
      this.checkFallDeath();
    }

    this.refreshHud();
  }

  updatePlayerMovement(dt) {
    const left = this.keys.leftArrow.isDown || this.keys.a.isDown;
    const right = this.keys.rightArrow.isDown || this.keys.d.isDown;
    const jumpPressed = this.keys.space.isDown || this.keys.upArrow.isDown || this.keys.w.isDown;

    let inputDirection = 0;
    if (left && !right) {
      inputDirection = -1;
    } else if (right && !left) {
      inputDirection = 1;
    }

    this.horizontalVelocity = computeHorizontalStep({
      vx: this.horizontalVelocity,
      inputDirection,
      dt,
      acceleration: GAME_CONSTANTS.player.acceleration,
      drag: GAME_CONSTANTS.player.drag,
      maxSpeed: GAME_CONSTANTS.player.maxSpeed
    });

    this.player.setVelocityX(this.horizontalVelocity);

    if (jumpPressed && !this.jumpHeldLast && this.player.body.blocked.down) {
      this.player.setVelocityY(GAME_CONSTANTS.player.jumpVelocity);
    }

    if (!jumpPressed && this.jumpHeldLast && this.player.body.velocity.y < 0) {
      this.player.setVelocityY(
        applyJumpCut(this.player.body.velocity.y, GAME_CONSTANTS.player.jumpCutMultiplier)
      );
    }

    this.jumpHeldLast = jumpPressed;
  }

  updateEnemyPatrol() {
    this.enemies.children.each((enemy) => {
      if (!enemy?.active) {
        return;
      }
      const meta = this.enemyMeta.get(enemy);
      if (!meta) {
        return;
      }

      if (enemy.x <= meta.patrolMin) {
        enemy.setVelocityX(Math.abs(GAME_CONSTANTS.enemy.speed));
      } else if (enemy.x >= meta.patrolMax) {
        enemy.setVelocityX(-Math.abs(GAME_CONSTANTS.enemy.speed));
      }
    });
  }

  onPlayerCoinOverlap(_player, coin) {
    if (!coin.active || this.state.mode !== GAME_MODES.RUNNING) {
      return;
    }

    coin.disableBody(true, true);
    this.state = registerCoinCollect(this.state);
    this.refreshHud();
  }

  onPlayerEnemyCollision(playerSprite, enemySprite) {
    if (
      this.state.mode !== GAME_MODES.RUNNING ||
      !enemySprite.active ||
      this.time.now < this.invulnerableUntil
    ) {
      return;
    }

    const resolution = resolveEnemyCollision(playerSprite.body, enemySprite.body);

    if (resolution === 'stomp') {
      enemySprite.disableBody(true, true);
      this.enemyMeta.delete(enemySprite);
      this.state = registerEnemyStomp(this.state);
      playerSprite.setVelocityY(GAME_CONSTANTS.player.stompBounceVelocity);
    } else {
      this.handlePlayerDeath('enemy');
    }
  }

  onPlayerGoalOverlap() {
    if (this.state.mode !== GAME_MODES.RUNNING) {
      return;
    }

    this.state = registerGoalReach(this.state);
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;
    this.refreshHud();
  }

  checkFallDeath() {
    if (this.player.y > this.mapHeightPx + GAME_CONSTANTS.player.fallThreshold) {
      this.handlePlayerDeath('fall');
    }
  }

  handlePlayerDeath(reason) {
    if (this.pendingRespawn || this.state.mode !== GAME_MODES.RUNNING) {
      return;
    }

    this.pendingRespawn = true;
    this.state = registerPlayerDeath(this.state, reason);

    if (this.state.mode === GAME_MODES.LOSE) {
      this.player.setVelocity(0, 0);
      this.player.setTint(0xff6b6b);
      this.player.body.enable = false;
      this.pendingRespawn = false;
      this.refreshHud();
      return;
    }

    this.player.setVelocity(0, 0);
    this.player.body.enable = false;
    this.player.setAlpha(0.4);

    this.time.delayedCall(GAME_CONSTANTS.player.respawnDelayMs, () => {
      this.player.enableBody(true, this.spawnPoint.x, this.spawnPoint.y, true, true);
      this.player.setCollideWorldBounds(true);
      this.player.setAlpha(1);
      this.player.clearTint();
      this.horizontalVelocity = 0;
      this.jumpHeldLast = false;
      this.invulnerableUntil = this.time.now + GAME_CONSTANTS.player.invulnerableMs;
      this.pendingRespawn = false;
    });

    this.refreshHud();
  }

  refreshHud() {
    const coinsRemaining = this.coins.countActive(true);
    renderHud(this.hud, this.state, coinsRemaining);
  }
}
