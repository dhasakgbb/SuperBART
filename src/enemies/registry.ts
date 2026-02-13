import Phaser from 'phaser';
import { ENEMIES } from '../content/contentManifest';

type EnemyKind =
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'compliance_officer'
  | 'technical_debt';

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

export type EnemyKillSource = 'stomp' | 'playerShot' | 'inferenceShot' | 'environment' | 'companion';

export interface EnemyKillEvent {
  enemyType: EnemyKind;
  source: EnemyKillSource;
  isBoss: boolean;
  x: number;
  y: number;
}

export interface EnemyHandle {
  kind: EnemyKind;
  displayName: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  update(dtMs: number): void;
  onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage';
  createKillEvent(source: EnemyKillSource): EnemyKillEvent;
  serializeDebug(): Record<string, unknown>;
}

export interface EnemyContext {
  scene: Phaser.Scene;
  projectiles: Phaser.Physics.Arcade.Group;
  spawnLingerZone?: (x: number, y: number) => void;
  getPlayerPosition?: () => { x: number; y: number };
  nowMs?: () => number;
  onSpawnEnemy?: (handle: EnemyHandle) => void;
}

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
  const canonicalByKind = {
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
  } as const;

  const canonical = canonicalByKind[kind] ?? kind;
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
  const sprite = scene.physics.add
    .sprite(source.sprite.x + dir * 10, source.sprite.y, 'enemy_shell_retracted') as Phaser.Physics.Arcade.Sprite;
  sprite.setScale(source.sprite.scaleX * 0.65, source.sprite.scaleY * 0.65);
  sprite.setDepth(source.sprite.depth);
  sprite.setCollideWorldBounds(true);
  sprite.body.setSize(8, 8);
  sprite.setVelocityX(dir * 60);
  sprite.setData('enemyKind', 'legacy_system');
  sprite.setData('isMicroservice', true);

  const micro: EnemyHandle = {
    kind: 'legacy_system',
    displayName: getEnemyDisplayName('legacy_system'),
    sprite,
    update(dtMs: number) {
      if (Math.abs(sprite.body.velocity.x) >= 30) {
        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
        return;
      }

      sprite.setVelocityX(dir * 60);
    },
    onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
      const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
      return stomp ? 'stomp' : 'damage';
    },
    createKillEvent(sourceEvent: EnemyKillSource): EnemyKillEvent {
      return {
        enemyType: 'legacy_system',
        source: sourceEvent,
        isBoss: false,
        x: sprite.x,
        y: sprite.y,
      };
    },
    serializeDebug: () => ({
      kind: 'legacy_system',
      x: sprite.x,
      y: sprite.y,
      microservice: true,
    }),
  };
  onSpawnEnemy?.(micro);
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
    sprite.body.setSize(12, 10).setOffset(2, 6);
    return {
      kind,
      displayName: getEnemyDisplayName(kind),
      sprite,
      update(dtMs: number) {
        const state = (sprite.getData('enemyState') as EnemyData) ?? sharedData;
        state.frozenMs = Math.max(0, (state.frozenMs ?? 0) - dtMs);
        state.safeMs = Math.max(0, (state.safeMs ?? 0) - dtMs);

        if (state.retracted) {
          if (state.safeMs <= 0) {
            state.retracted = false;
            state.retractMs = 0;
            state.retractMs = 0;
            sprite.setTexture('enemy_shell');
            sprite.setScale(1.85);
            sprite.setVelocityX(sprite.body.velocity.x >= 0 ? (state.shellMoveSpeed ?? 55) : -(state.shellMoveSpeed ?? 55));
          }
          return;
        }

        if (!sprite.body.velocity.x) {
          sprite.setVelocityX(Math.sign(sprite.x % 2 - 0.5) * (state.shellMoveSpeed ?? 55));
        }

        if (Math.abs(sprite.body.velocity.x) < 140 && (state.shellMoveSpeed ?? 0) > 0) {
          sprite.setVelocityX(Math.sign(sprite.body.velocity.x) * (state.shellMoveSpeed ?? 55));
        }

        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const state = (sprite.getData('enemyState') as EnemyData) ?? sharedData;
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        if (stomp) {
          if (!state.retracted) {
            state.safeMs = 350;
            state.retracted = true;
            state.retractMs = 0;
            sprite.setVelocityX(0);
            sprite.setTexture('enemy_shell_retracted');
            sprite.setScale(1.85);
            return 'stomp';
          }

          if (state.safeMs > 0) {
            return 'stomp';
          }
          const dir = player.x < sprite.x ? 1 : -1;
          sprite.setVelocityX(dir * 220);
          return 'stomp';
        }

        return state.safeMs > 0 ? 'damage' : 'damage';
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
        retracted: Boolean(state.retracted),
      }),
    };
  }

  if (kind === 'hot_take') {
    sprite.setScale(1.8);
    sprite.body.setSize(10, 10).setOffset(3, 3);
    const baseY = y;
    const baseAmp = sharedData.baseAmp ?? 18;
    const localState = {
      ...sharedData,
      phase: 'drift' as const,
      phaseMs: 0,
      phaseDurationMs: 2000 + Math.random() * 2000,
      burstPhaseMs: 0,
      shellMoveSpeed: 0,
      targetY: baseY,
      baseY,
      baseAmp,
    };
    sprite.setData('enemyState', localState);

    return {
      kind,
      displayName: getEnemyDisplayName(kind),
      sprite,
      update(dtMs: number) {
        const state = sprite.getData('enemyState') as EnemyData;
        const escalation = 1 + Math.min(1.5, (Number(ctx.nowMs ? ctx.nowMs() : 0) - Number(ctx.nowMs ? ctx.nowMs() : 0)) / 20000);
        const phase = state.phase ?? 'drift';
        state.phaseMs = (state.phaseMs ?? 0) + dtMs;

        const driftMs = 2000;
        const warnMs = 220;
        const burstMs = 280;
        const phaseDuration = (state.phaseDurationMs ?? 0) || (driftMs + driftMs * 0.4);

        const t = (thisTime()) / 1000;
        if (phase === 'drift') {
          sprite.body.setVelocityX(-35);
          sprite.y = baseY + Math.sin(t * 2.4) * (baseAmp * (0.5 + Math.min(0.4, escalation * 0.1)));
          if ((state.phaseMs ?? 0) >= phaseDuration) {
            state.phase = 'warn';
            state.phaseMs = 0;
            sprite.setTint(0xff4444);
          }
          return;
        }

        if (phase === 'warn') {
          if ((state.phaseMs ?? 0) >= warnMs) {
            state.phase = 'burst';
            state.phaseMs = 0;
            state.burstPhaseMs = 0;
            const amp = 1 + (escalation - 1) * 0.3;
            sprite.setVelocityX((Math.random() < 0.5 ? -1 : 1) * 120);
            sprite.setVelocityY((Math.random() * 2 - 1) * 120 * amp);
            sprite.setTint(0xffc44d);
          }
          return;
        }

        state.burstPhaseMs = (state.burstPhaseMs ?? 0) + dtMs;
        if ((state.burstPhaseMs ?? 0) >= burstMs) {
          sprite.clearTint();
          state.phase = 'drift';
          state.phaseMs = 0;
          state.phaseDurationMs = Math.max(1200, 2600 - 900 * Math.min(1, escalation * 0.25));
          sprite.setVelocityY(0);
          sprite.setVelocityX(-35);
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        return stomp ? 'stomp' : 'damage';
      },
      createKillEvent(source: EnemyKillSource): EnemyKillEvent {
        return { enemyType: kind, source, isBoss: false, x: sprite.x, y: sprite.y };
      },
      serializeDebug: () => ({
        kind,
        x: sprite.x,
        y: sprite.y,
        phase: sprite.getData('enemyState')?.phase,
      }),
    };
  }

  if (kind === 'analyst') {
    sprite.setScale(1.8);
    sprite.body.setSize(10, 10).setOffset(3, 3);
    sprite.body.allowGravity = false;
    sprite.setImmovable(true);
    const baseY = y;
    const state = { ...sharedData, phaseMs: 0, burstPhaseMs: 0, shellMoveSpeed: 0, baseY };
    sprite.setData('enemyState', state);

    return {
      kind,
      displayName: getEnemyDisplayName(kind),
      sprite,
      update(dtMs: number) {
        const local = sprite.getData('enemyState') as EnemyData;
        local.phaseMs = (local.phaseMs ?? 0) + dtMs;
        if ((local.phaseMs ?? 0) >= (local.shellMoveSpeed ?? 0)) {
          local.phaseMs = 0;
          const cadence = Number(data.cadenceMs ?? 2100);
          local.shellMoveSpeed = cadence;
          const b1 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
          const b2 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
          const b3 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
          b1.setData('owner', 'analyst');
          b2.setData('owner', 'analyst');
          b3.setData('owner', 'analyst');
          b1.body.setAllowGravity(false).setVelocity(-130, 0).setCollideWorldBounds(false);
          b2.body.setAllowGravity(false).setVelocity(-115, -55).setCollideWorldBounds(false);
          b3.body.setAllowGravity(false).setVelocity(-115, 55).setCollideWorldBounds(false);

          if (ctx.spawnLingerZone) {
            ctx.spawnLingerZone(sprite.x, baseY + 12);
          }
        }

        if (sprite.y < baseY - 4 && (local.phaseMs ?? 0) > 2000) {
          sprite.setY(sprite.y + 0.3);
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        return stomp ? 'stomp' : 'damage';
      },
      createKillEvent(source: EnemyKillSource): EnemyKillEvent {
        return { enemyType: kind, source, isBoss: false, x: sprite.x, y: sprite.y };
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, cadence: data.cadenceMs ?? 2100 }),
    };
  }

  if (kind === 'compliance_officer') {
    sprite.setScale(1.85);
    sprite.body.setSize(12, 10).setOffset(2, 6);
    sprite.setVelocityX(55);
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
            sprite.body.moves = true;
            sprite.setVelocityX(Math.sign(sprite.body.velocity.x) || 45);
            state.compliancePlatformUntilMs = 0;
          }
          return;
        }

        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
        if (!sprite.body.velocity.x) {
          sprite.setVelocityX((state.shellMoveSpeed ?? 55));
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const state = sprite.getData('enemyState') as EnemyData;
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        if (stomp) {
          if (state.complianceState === 'patrol') {
            state.complianceState = 'platform';
            state.compliancePlatformUntilMs = (ctx.nowMs ? ctx.nowMs() : 0) + 5000;
            sprite.body.moves = false;
            sprite.setVelocityX(0);
            sprite.setTint(0xbadf00);
          }
          return 'stomp';
        }
        return state.complianceState === 'platform' ? 'damage' : 'damage';
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

  if (kind === 'technical_debt') {
    sprite.setScale(1.75);
    sprite.setTint(0x8d5fd3);
    sprite.body.setSize(12, 10).setOffset(2, 6);
    const state: EnemyData = {
      ...sharedData,
      technicalDebtState: 'patrol',
      technicalDebtCooldownMs: 0,
      technicalDebtLungeMs: 0,
      chainStrain: 0,
      technicalDebtAnchorX: x,
      technicalDebtAnchorY: y,
      shellMoveSpeed: 75,
      safeMs: 0,
    };
    sprite.setData('enemyState', state);

    return {
      kind,
      displayName: getEnemyDisplayName(kind),
      sprite,
      update(dtMs: number) {
        const current = sprite.getData('enemyState') as EnemyData;
        const player = ctx.getPlayerPosition ? ctx.getPlayerPosition() : null;
        const now = ctx.nowMs ? ctx.nowMs() : 0;
        current.technicalDebtCooldownMs = Math.max(0, (current.technicalDebtCooldownMs ?? 0) - dtMs);

        if (current.technicalDebtState === 'chase') {
          if (!player) {
            current.technicalDebtState = 'patrol';
            return;
          }
          const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, player.x, player.y);
          sprite.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 60);
          return;
        }

        if (current.technicalDebtState === 'lunge') {
          current.technicalDebtLungeMs = (current.technicalDebtLungeMs ?? 0) + dtMs;
          if ((current.technicalDebtLungeMs ?? 0) >= 280) {
            current.technicalDebtLungeMs = 0;
            current.technicalDebtState = 'patrol';
            sprite.setVelocity(0, 0);
            current.chainStrain = (current.chainStrain ?? 0) + 1;
            const anchorX = current.technicalDebtAnchorX;
            const anchorY = current.technicalDebtAnchorY;
            if (anchorX !== undefined && anchorY !== undefined) {
              sprite.setPosition(anchorX, anchorY);
            }
          }
          return;
        }

        if (!player || current.technicalDebtCooldownMs) {
          return;
        }
        if (Math.abs(player.x - sprite.x) <= 128 && Math.abs(player.y - sprite.y) <= 120) {
          const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, player.x, player.y);
          sprite.setVelocity(Math.cos(angle) * 160, Math.min(-20, Math.sin(angle) * 120));
          current.technicalDebtState = 'lunge';
          current.technicalDebtLungeMs = 0;
          current.technicalDebtCooldownMs = 280;
          if ((current.chainStrain ?? 0) >= 8) {
            current.technicalDebtState = 'chase';
          }
        }
      },
      onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
        const state = sprite.getData('enemyState') as EnemyData;
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        return stomp ? 'stomp' : 'damage';
      },
      createKillEvent(source: EnemyKillSource): EnemyKillEvent {
        const state = sprite.getData('enemyState') as EnemyData;
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
        technicalDebtState: (sprite.getData('enemyState') as EnemyData)?.technicalDebtState,
        chainStrain: (sprite.getData('enemyState') as EnemyData)?.chainStrain ?? 0,
      }),
    };
  }

  const state = sharedData;
  const baseY = y;
  const baseAmp = 16 + (Number(data?.amp) || 0);
  state.phaseMs = 0;
  state.phase = 'drift';
  state.phaseDurationMs = 1400;

  return {
    kind: kind === 'hallucination' ? 'walker' : kind,
    displayName: getEnemyDisplayName(kind === 'walker' ? 'hallucination' : kind),
    sprite,
    update(dtMs: number) {
      const t = (ctx.nowMs ? ctx.nowMs() : 0) / 1000;
      const stateData = sprite.getData('enemyState') as EnemyData;
      stateData.phaseMs = (stateData.phaseMs ?? 0) + dtMs;
      if (stateData.phaseMs >= 2000) {
        stateData.phaseMs = 0;
      }
      const confusion = Math.max(0, 3000 - (ctx.nowMs ? ctx.nowMs() : 0) / 10);
      if ((ctx.nowMs ? ctx.nowMs() : 0) > 0 && Math.random() < dtMs / 1000 / 20) {
        sprite.setVelocityX(Math.random() < 0.5 ? 45 : -45);
      }
      if (sprite.body.blocked.left || sprite.body.blocked.right) {
        sprite.setVelocityX(-sprite.body.velocity.x);
      }
      sprite.y = baseY + Math.sin(t * 2.4) * baseAmp;
    },
    onPlayerCollision(player: Phaser.Physics.Arcade.Sprite) {
      const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
      return stomp ? 'stomp' : 'damage';
    },
    createKillEvent(source: EnemyKillSource): EnemyKillEvent {
      return { enemyType: kind, source, isBoss: false, x: sprite.x, y: sprite.y };
    },
    serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, t: 1 }),
  };
}

function thisTime(): number {
  return Date.now();
}
