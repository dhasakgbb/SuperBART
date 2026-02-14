import { ENEMIES } from '../content/contentManifest';
import type { EnemyHandle, EnemyKind, EnemyKillSource, EnemyKillEvent, EnemyContext } from './types';
import { Hallucination } from './definitions/Hallucination';
import { LegacySystem } from './definitions/LegacySystem';
import { TechnicalDebt } from './definitions/TechnicalDebt';
import { HotTake } from './definitions/HotTake';
import { Analyst } from './definitions/Analyst';

type EnemyData = {
  kind: EnemyKind;
  retracted?: boolean;
  microservice?: boolean;
  safeMs?: number;
  retractMs?: number;
  frozenMs?: number;
  phase?: 'drift' | 'warn' | 'burst';
  phaseMs?: number;
  phaseDurationMs?: number;
  burstPhaseMs?: number;
  baseAmp?: number;
  targetY?: number;
  baseY?: number;
  shellRepositionMs?: number;
  shellRepositionDir?: number;
  shellMoveSpeed?: number;
  complianceState?: 'patrol' | 'platform';
  compliancePlatformUntilMs?: number;
  chainStrain?: number;
  technicalDebtState?: 'patrol' | 'lunge' | 'chase';
  technicalDebtCooldownMs?: number;
  technicalDebtLungeMs?: number;
  technicalDebtAnchorX?: number;
  technicalDebtAnchorY?: number;
};

const KIND_ALIASES: Record<string, EnemyKind> = {
  walker: 'hallucination',
  shell: 'legacy_system',
  flying: 'hot_take',
  spitter: 'analyst',
  compliance_officer: 'compliance_officer',
  technical_debt: 'technical_debt',
  hallucination: 'hallucination',
  legacy_system: 'legacy_system',
  hot_take: 'hot_take',
  analyst: 'analyst',
  ghost: 'technical_debt',
};

function resolveEnemyKind(kind: string): EnemyKind {
  return KIND_ALIASES[kind] ?? 'hallucination';
}

function getEnemyDisplayName(kind: EnemyKind): string {
  const canonical = KIND_ALIASES[kind] ?? kind;
  const matched = ENEMIES.find((entry) => entry.id === canonical || entry.aliases.includes(canonical));
  return matched?.displayName ?? kind.toUpperCase();
}

function defaultTextureFor(kind: EnemyKind, microservice = false): string {
  if (kind === 'legacy_system') {
    return microservice ? 'enemy_shell_retracted' : 'enemy_shell';
  }
  if (kind === 'hot_take') return 'enemy_flying';
  if (kind === 'analyst') return 'enemy_spitter';
  if (kind === 'compliance_officer') return 'enemy_shell';
  if (kind === 'technical_debt') return 'enemy_shell_retracted';
  return 'enemy_walker';
}

function createMicroservice(
  scene: Phaser.Scene,
  source: EnemyHandle,
  dir: number,
  onSpawnEnemy?: (handle: EnemyHandle) => void,
): void {
  const enemy = new LegacySystem({ 
      scene, 
      x: source.sprite.x + dir * 10, 
      y: source.sprite.y, 
      texture: 'enemy_shell_retracted' 
  }, true); // isMicroservice = true

  enemy.setVelocityX(dir * 60);

  const handle: EnemyHandle = {
    kind: 'legacy_system',
    displayName: getEnemyDisplayName('legacy_system'),
    sprite: enemy,
    update: (dt) => enemy.manualUpdate(dt),
    onPlayerCollision: (p) => enemy.onPlayerCollision(p),
    createKillEvent(sourceEvent: EnemyKillSource): EnemyKillEvent {
      return {
        enemyType: 'legacy_system',
        source: sourceEvent,
        isBoss: false,
        x: enemy.x,
        y: enemy.y,
      };
    },
    serializeDebug: () => ({
      kind: 'legacy_system',
      x: enemy.x,
      y: enemy.y,
      microservice: true,
    }),
  };
  onSpawnEnemy?.(handle);
}

export function spawnEnemy(
  rawKind: EnemyKind,
  scene: Phaser.Scene,
  x: number,
  y: number,
  ctx: EnemyContext,
  data: Record<string, unknown> = {},
): EnemyHandle {
  const kind = resolveEnemyKind(rawKind);
  const sprite = scene.physics.add.sprite(x, y, defaultTextureFor(kind)) as Phaser.Physics.Arcade.Sprite;
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(34);
  sprite.setScale(1.9);
  sprite.setData('enemyKind', kind);
  const sharedData: EnemyData = {
    kind,
    safeMs: 0,
    retractMs: Number(data.retractMs ?? 0),
    frozenMs: 0,
    baseAmp: Number(data.amp ?? 18),
    baseY: y,
    phase: 'drift',
    phaseMs: 0,
    phaseDurationMs: 0,
    shellMoveSpeed: 55,
    complianceState: kind === 'compliance_officer' ? 'patrol' : undefined,
    compliancePlatformUntilMs: 0,
    chainStrain: 0,
    technicalDebtState: kind === 'technical_debt' ? 'patrol' : undefined,
    technicalDebtLungeMs: 0,
    technicalDebtCooldownMs: 0,
    technicalDebtAnchorX: x,
    technicalDebtAnchorY: y,
  };
  sprite.setData('enemyState', sharedData);

  if (kind === 'legacy_system') {
    const enemy = new LegacySystem({ scene, x, y, texture: defaultTextureFor(kind) });
    // Handle retracted start state if needed
    if (data.retracted || data.isMicroservice) {
        enemy.transitionTo('idle');
    }

    return {
      kind,
      displayName: enemy.displayName,
      sprite: enemy,
      update: (dt) => enemy.manualUpdate(dt),
      onPlayerCollision: (p) => enemy.onPlayerCollision(p),
      createKillEvent: (s) => enemy.createKillEvent(s),
      serializeDebug: () => enemy.serializeDebug(),
    };
  }

  if (kind === 'technical_debt') {
      const enemy = new TechnicalDebt({ scene, x, y, texture: defaultTextureFor(kind) }, ctx);

      return {
        kind,
        displayName: enemy.displayName,
        sprite: enemy,
        update: (dt) => enemy.manualUpdate(dt),
        onPlayerCollision: (p) => enemy.onPlayerCollision(p),
        createKillEvent: (s) => enemy.createKillEvent(s),
        serializeDebug: () => enemy.serializeDebug(),
    };
  }

  if (kind === 'hot_take') {
      const enemy = new HotTake({ scene, x, y, texture: defaultTextureFor(kind) });

      return {
        kind,
        displayName: enemy.displayName,
        sprite: enemy,
        update: (dt) => enemy.manualUpdate(dt),
        onPlayerCollision: (p) => enemy.onPlayerCollision(p),
        createKillEvent: (s) => enemy.createKillEvent(s),
        serializeDebug: () => enemy.serializeDebug(),
    };
  }

  if (kind === 'analyst') {
      const enemy = new Analyst({ scene, x, y, texture: defaultTextureFor(kind) }, ctx);

      return {
        kind,
        displayName: enemy.displayName,
        sprite: enemy,
        update: (dt) => enemy.manualUpdate(dt),
        onPlayerCollision: (p) => enemy.onPlayerCollision(p),
        createKillEvent: (s) => enemy.createKillEvent(s),
        serializeDebug: () => enemy.serializeDebug(),
    };
  }

  if (kind === 'compliance_officer') {
    sprite.setScale(1.85);
    sprite.setVelocityX(55);
    if (sprite.body) {
         sprite.body.setSize(12, 10).setOffset(2, 6);
    }
    const officerState: EnemyData = {
      ...sharedData,
      kind,
      complianceState: 'patrol',
      compliancePlatformUntilMs: 0,
      shellMoveSpeed: 45,
    };
    sprite.setData('enemyState', officerState);

    return {
      kind,
      displayName: getEnemyDisplayName(kind),
      sprite,
      update(dtMs: number) {
        const state = sprite.getData('enemyState') as EnemyData;
        if (!state.complianceState || !state.compliancePlatformUntilMs) {
          return;
        }
        const now = ctx.nowMs ? ctx.nowMs() : 0;
        if (state.complianceState === 'platform') {
          if (now >= (state.compliancePlatformUntilMs ?? 0)) {
            state.complianceState = 'patrol';
            sprite.setTint(0xffffff);
            if (sprite.body) (sprite.body as Phaser.Physics.Arcade.Body).moves = true;
            if (sprite.body) sprite.setVelocityX(Math.sign(sprite.body.velocity.x) || 45);
            state.compliancePlatformUntilMs = 0;
          }
          return;
        }

        if (sprite.body && (sprite.body.blocked.left || sprite.body.blocked.right)) {
          if (sprite.body) sprite.setVelocityX(-sprite.body.velocity.x);
        }
        if (sprite.body && !sprite.body.velocity.x) {
          sprite.setVelocityX((state.shellMoveSpeed ?? 55));
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const state = sprite.getData('enemyState') as EnemyData;
        if (!sprite.body || !player.body) return 'damage';
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        if (stomp) {
          if (state.complianceState === 'patrol') {
            state.complianceState = 'platform';
            state.compliancePlatformUntilMs = (ctx.nowMs ? ctx.nowMs() : 0) + 5000;
            if (sprite.body) (sprite.body as Phaser.Physics.Arcade.Body).moves = false;
            sprite.setVelocityX(0);
            sprite.setTint(0xbadf00);
          }
          return 'stomp';
        }
        return 'damage';
      },
      createKillEvent(source: EnemyKillSource): EnemyKillEvent {
        return {
          enemyType: kind,
          source,
          isBoss: false,
          x: sprite.x,
          y: sprite.y,
        };
      },
      serializeDebug: () => ({
        kind,
        x: sprite.x,
        y: sprite.y,
        complianceState: (sprite.getData('enemyState') as EnemyData)?.complianceState,
      }),
    };
  }


  if (kind === 'hallucination' || kind === 'walker') {
    const enemy = new Hallucination({ scene, x, y, texture: defaultTextureFor(kind) });
    return {
      kind,
      displayName: enemy.displayName,
      sprite: enemy,
      update: (dt) => enemy.manualUpdate(dt),
      onPlayerCollision: (p) => enemy.onPlayerCollision(p),
      createKillEvent: (s) => enemy.createKillEvent(s),
      serializeDebug: () => enemy.serializeDebug(),
    };
  }

  // Fallback for unknown enemy types
  const baseY = y;
  const baseAmp = 16 + (Number(data?.amp) || 0);
  sharedData.phaseMs = 0;
  sharedData.phase = 'drift';
  sharedData.phaseDurationMs = 1400;

  return {
    kind,
    displayName: getEnemyDisplayName(kind),
    sprite,
    update(dtMs: number) {
      const t = (ctx.nowMs ? ctx.nowMs() : 0) / 1000;
      const stateData = sprite.getData('enemyState') as EnemyData;
      stateData.phaseMs = (stateData.phaseMs ?? 0) + dtMs;
      if (stateData.phaseMs >= 2000) {
        stateData.phaseMs = 0;
      }
      if ((ctx.nowMs ? ctx.nowMs() : 0) > 0 && Math.random() < dtMs / 1000 / 20) {
        sprite.setVelocityX(Math.random() < 0.5 ? 45 : -45);
      }
      if (sprite.body && (sprite.body.blocked.left || sprite.body.blocked.right)) {
        sprite.setVelocityX(-sprite.body.velocity.x);
      }
      sprite.y = baseY + Math.sin(t * 2.4) * baseAmp;
    },
    onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
      if (!sprite.body || !player.body) return 'damage';
      const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
      return stomp ? 'stomp' : 'damage';
    },
    createKillEvent(source: EnemyKillSource): EnemyKillEvent {
      return { enemyType: kind, source, isBoss: false, x: sprite.x, y: sprite.y };
    },
    serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, t: 1 }),
  };
}

