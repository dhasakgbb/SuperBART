import { ENEMIES } from '../content/contentManifest';
import type { EnemyHandle, EnemyKind, EnemyKillSource, EnemyKillEvent, EnemyContext } from './types';
import type { BaseEnemy } from './BaseEnemy';
import { Hallucination } from './definitions/Hallucination';
import { LegacySystem } from './definitions/LegacySystem';
import { TechnicalDebt } from './definitions/TechnicalDebt';
import { HotTake } from './definitions/HotTake';
import { Analyst } from './definitions/Analyst';
import { ComplianceOfficer } from './definitions/ComplianceOfficer';
import { Boss } from './definitions/Boss';
import { SnowmanSentry } from './definitions/SnowmanSentry';
import { CryoDrone } from './definitions/CryoDrone';
import { QubitSwarm } from './definitions/QubitSwarm';
import { Crawler } from './definitions/Crawler';
import { GlitchPhantom } from './definitions/GlitchPhantom';
import { FungalNode } from './definitions/FungalNode';
import { GhostProcess } from './definitions/GhostProcess';
import { TapeWraith } from './definitions/TapeWraith';
import { ResumeBot } from './definitions/ResumeBot';
import { Watchdog } from './bosses/Watchdog';
import { GlacialMainframe } from './bosses/GlacialMainframe';
import { NullPointer } from './bosses/NullPointer';
import { QubitSerpent } from './bosses/QubitSerpent';
import { LegacyDaemon } from './bosses/LegacyDaemon';
import { Omega } from './bosses/Omega';

const KIND_ALIASES: Record<string, EnemyKind> = {
  walker: 'walker',
  shell: 'shell',
  flying: 'flying',
  spitter: 'spitter',
  compliance_officer: 'compliance_officer',
  technical_debt: 'technical_debt',
  compliance: 'compliance_officer',
  tethered_debt: 'technical_debt',
  ai_robot: 'walker',
  firewall: 'shell',
  spam: 'flying',
  bug: 'spitter',
  compliance_drone: 'compliance_officer',
  tech_debt_wraith: 'technical_debt',
  boss: 'boss',
  hallucination: 'walker',
  legacy_system: 'shell',
  hot_take: 'flying',
  analyst: 'spitter',
  ghost: 'technical_debt',
  snowman_sentry: 'snowman_sentry',
  cryo_drone: 'cryo_drone',
  qubit_swarm: 'qubit_swarm',
  crawler: 'crawler',
  glitch_phantom: 'glitch_phantom',
  fungal_node: 'fungal_node',
  ghost_process: 'ghost_process',
  tape_wraith: 'tape_wraith',
  resume_bot: 'resume_bot',
};

function resolveEnemyKind(kind: string): EnemyKind {
  return KIND_ALIASES[kind] ?? 'walker';
}

function getEnemyDisplayName(kind: EnemyKind): string {
  const canonical = KIND_ALIASES[kind] ?? kind;
  const matched = ENEMIES.find((entry) => entry.id === canonical || entry.aliases.includes(canonical));
  return matched?.displayName ?? kind.toUpperCase();
}

function defaultTextureFor(kind: EnemyKind, microservice = false): string {
  if (kind === 'boss') return 'boss_sheet';
  if (kind === 'shell' || kind === 'legacy_system') {
    return microservice ? 'enemy_shell_retracted' : 'enemy_shell';
  }
  if (kind === 'flying' || kind === 'hot_take' || kind === 'cryo_drone') return 'enemy_flying';
  if (kind === 'spitter' || kind === 'analyst') return 'enemy_spitter';
  if (kind === 'compliance_officer') return 'enemy_shell';
  if (kind === 'technical_debt') return 'enemy_shell_retracted';
  if (kind === 'snowman_sentry' || kind === 'qubit_swarm' || kind === 'crawler'
    || kind === 'glitch_phantom' || kind === 'fungal_node' || kind === 'ghost_process'
    || kind === 'tape_wraith' || kind === 'resume_bot') {
    return 'enemy_walker';
  }
  return 'enemy_walker';
}

/** Wraps a BaseEnemy subclass instance as a uniform EnemyHandle. */
function wrapAsHandle(kind: EnemyKind, enemy: BaseEnemy): EnemyHandle {
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

export function spawnEnemy(
  rawKind: EnemyKind,
  scene: Phaser.Scene,
  x: number,
  y: number,
  ctx: EnemyContext,
  data: Record<string, unknown> = {},
): EnemyHandle {
  const kind = resolveEnemyKind(rawKind);
  const texture = resolveTexture(kind, scene);

  switch (kind) {
    case 'shell':
    case 'legacy_system': {
      const enemy = new LegacySystem({ scene, x, y, texture: defaultTextureFor(kind) });
      if (data.retracted || data.isMicroservice) {
        enemy.transitionTo('idle');
      }
      return wrapAsHandle(kind, enemy);
    }

    case 'technical_debt':
      return wrapAsHandle(kind, new TechnicalDebt({ scene, x, y, texture: defaultTextureFor(kind) }, ctx));

    case 'boss':
      return spawnBoss(kind, scene, x, y);

    case 'flying':
    case 'hot_take':
      return wrapAsHandle(kind, new HotTake({ scene, x, y, texture }));

    case 'spitter':
    case 'analyst':
      return wrapAsHandle(kind, new Analyst({ scene, x, y, texture }, ctx));

    case 'compliance_officer':
      return wrapAsHandle(kind, new ComplianceOfficer({ scene, x, y, texture: defaultTextureFor(kind) }, ctx));

    case 'hallucination':
    case 'walker':
      return wrapAsHandle(kind, new Hallucination({ scene, x, y, texture }));

    case 'snowman_sentry':
      return wrapAsHandle(kind, new SnowmanSentry({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'cryo_drone':
      return wrapAsHandle(kind, new CryoDrone({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'qubit_swarm':
      return wrapAsHandle(kind, new QubitSwarm({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'crawler':
      return wrapAsHandle(kind, new Crawler({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'glitch_phantom':
      return wrapAsHandle(kind, new GlitchPhantom({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'fungal_node':
      return wrapAsHandle(kind, new FungalNode({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'ghost_process':
      return wrapAsHandle(kind, new GhostProcess({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'tape_wraith':
      return wrapAsHandle(kind, new TapeWraith({ scene, x, y, texture: defaultTextureFor(kind) }));

    case 'resume_bot':
      return wrapAsHandle(kind, new ResumeBot({ scene, x, y, texture: defaultTextureFor(kind) }));

    default:
      return wrapAsHandle(kind, new Hallucination({ scene, x, y, texture: defaultTextureFor(kind) }));
  }
}

function resolveTexture(kind: EnemyKind, scene: Phaser.Scene): string {
  let texture = defaultTextureFor(kind);
  const worldIndex = (scene as any).world;
  if (worldIndex === 1) {
    if (kind === 'walker') texture = 'enemy_bug';
    if (kind === 'flying') texture = 'enemy_snake';
  } else if (worldIndex === 2) {
    if (kind === 'walker') texture = 'enemy_cryo_sentry';
    if (kind === 'flying') texture = 'enemy_cryo_drone';
  }
  if (!scene.textures.exists(texture)) {
    texture = defaultTextureFor(kind);
  }
  return texture;
}

function spawnBoss(kind: EnemyKind, scene: Phaser.Scene, x: number, y: number): EnemyHandle {
  const worldIndex = (scene as any).world ?? 1;
  const texture = defaultTextureFor('boss');

  const bossMap: Record<number, () => BaseEnemy> = {
    1: () => new Watchdog({ scene, x, y, texture }),
    2: () => new GlacialMainframe({ scene, x, y, texture }),
    3: () => new NullPointer({ scene, x, y, texture }),
    4: () => new QubitSerpent({ scene, x, y, texture }),
    5: () => new LegacyDaemon({ scene, x, y, texture }),
    6: () => new Omega({ scene, x, y, texture }),
  };

  const factory = bossMap[worldIndex];
  const enemy = factory
    ? factory()
    : new Boss({ scene, x, y, texture, displayName: getEnemyDisplayName(kind) });

  const handle = wrapAsHandle(kind, enemy);
  // Bosses may have specialized debug serialization
  if ('serializeBossState' in enemy) {
    handle.serializeDebug = () => (enemy as any).serializeBossState();
  }
  return handle;
}
