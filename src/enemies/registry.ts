import Phaser from 'phaser';
import { ENEMIES } from '../content/contentManifest';

export type EnemyKind = 'walker' | 'shell' | 'flying' | 'spitter';

function getEnemyDisplayName(kind: EnemyKind): string {
  const canonicalByKind = {
    walker: 'hallucination',
    shell: 'legacy_system',
    flying: 'hot_take',
    spitter: 'analyst',
  } satisfies Record<EnemyKind, string>;

  const matched = ENEMIES.find((entry) => entry.id === canonicalByKind[kind] || entry.aliases.includes(kind));
  return matched?.displayName ?? kind.toUpperCase();
}

export const ENEMY_DISPLAY_NAMES: Record<EnemyKind, string> = {
  walker: getEnemyDisplayName('walker'),
  shell: getEnemyDisplayName('shell'),
  flying: getEnemyDisplayName('flying'),
  spitter: getEnemyDisplayName('spitter'),
};

export interface EnemyHandle {
  kind: EnemyKind;
  displayName: string;
  sprite: Phaser.Physics.Arcade.Sprite;
  update(dtMs: number): void;
  onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage';
  serializeDebug(): Record<string, unknown>;
}

export interface EnemyContext {
  scene: Phaser.Scene;
  projectiles: Phaser.Physics.Arcade.Group;
  onSpawnEnemy?: (handle: EnemyHandle) => void;
}

export function spawnEnemy(
  kind: EnemyKind,
  scene: Phaser.Scene,
  x: number,
  y: number,
  ctx: EnemyContext,
  data: Record<string, unknown> = {},
): EnemyHandle {
  const sprite = scene.physics.add.sprite(x, y, `enemy_${kind}`);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(34);
  sprite.setScale(1.9);

  if (kind === 'walker') {
    sprite.body.setSize(12, 10).setOffset(2, 6);
    const speed = 45;
    sprite.setVelocityX(speed);
    let confusionTimer = 2000 + Math.random() * 2000;
    let thinkingMs = 0;
    let glitchMs = 0;
    let glitchTint = false;

    return {
      kind,
      displayName: ENEMY_DISPLAY_NAMES[kind],
      sprite,
      update(dtMs: number) {
        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }

        confusionTimer -= dtMs;
        if (confusionTimer <= 0) {
          confusionTimer = 2000 + Math.random() * 2000;
          if (Math.random() < 0.3) {
            thinkingMs = 300;
            sprite.setVelocityX(0);
            glitchMs = 250;
          } else {
            sprite.setVelocityX(-sprite.body.velocity.x || (Math.random() < 0.5 ? speed : -speed));
          }
        }

        if (thinkingMs > 0) {
          thinkingMs -= dtMs;
          glitchMs = Math.max(glitchMs - dtMs, 0);
          if (glitchMs > 0) {
            glitchTint = !glitchTint;
            sprite.setTint(glitchTint ? 0xff6f8f : 0xffffff);
            sprite.setX(sprite.x + (Math.random() < 0.5 ? -0.7 : 0.7));
          } else {
            sprite.clearTint();
          }
          if (thinkingMs <= 0) {
            sprite.setVelocityX(Math.random() < 0.5 ? speed : -speed);
            sprite.clearTint();
            sprite.setX(Math.round(sprite.x));
          }
        }
      },
      onPlayerCollision(player) {
        const playerBottom = player.body.bottom;
        return playerBottom < sprite.body.top + 8 && player.body.velocity.y > 0 ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, confusionTimer, thinkingMs }),
    };
  }

  if (kind === 'shell') {
    sprite.setScale(1.85);
    sprite.body.setSize(12, 10).setOffset(2, 6);
    let retracted = false;
    let safeMs = 0;
    let retractedElapsed = 0;
    let trailTimer = 0;

    return {
      kind,
      displayName: ENEMY_DISPLAY_NAMES[kind],
      sprite,
      update(dtMs: number) {
        safeMs = Math.max(0, safeMs - dtMs);

        if (!retracted && (sprite.body.blocked.left || sprite.body.blocked.right)) {
          sprite.setVelocityX(-sprite.body.velocity.x || 55);
        }

        if (retracted && sprite.body.velocity.x === 0) {
          retractedElapsed += dtMs;
          if (retractedElapsed >= 4000) {
            retracted = false;
            retractedElapsed = 0;
            sprite.setTexture('enemy_shell');
            sprite.setScale(1.85);
            sprite.setVelocityX(Math.random() < 0.5 ? 55 : -55);
          }
        } else {
          retractedElapsed = 0;
        }

        const vx = sprite.body.velocity.x;
        if (Math.abs(vx) >= 150) {
          trailTimer += dtMs;
          if (trailTimer >= 80) {
            trailTimer -= 80;
            const dot = ctx.scene.add.circle(sprite.x, sprite.y + 4, 2, 0xff5252, 0.7).setDepth(20);
            ctx.scene.tweens.add({ targets: dot, alpha: 0, scale: 0, duration: 600, onComplete: () => dot.destroy() });
          }

          if (sprite.body.blocked.left || sprite.body.blocked.right) {
            const splitX = sprite.x;
            const splitY = sprite.y;
            sprite.disableBody(true, true);

            for (const dir of [-1, 1]) {
              const micro = ctx.scene.physics.add.sprite(splitX + dir * 10, splitY, 'enemy_shell_retracted');
              micro.setScale(0.65 * 1.85);
              micro.setDepth(34);
              micro.setCollideWorldBounds(true);
              micro.body.setSize(8, 8);
              micro.setVelocityX(dir * 60);
              const microHandle: EnemyHandle = {
                kind: 'shell',
                displayName: ENEMY_DISPLAY_NAMES[kind],
                sprite: micro,
                update(_dt: number) {
                  if (micro.body.blocked.left || micro.body.blocked.right) {
                    micro.setVelocityX(-micro.body.velocity.x);
                  }
                },
                onPlayerCollision(player) {
                  return player.body.bottom < micro.body.top + 8 && player.body.velocity.y > 0 ? 'stomp' : 'damage';
                },
                serializeDebug: () => ({ kind: 'shell', x: micro.x, y: micro.y }),
              };
              ctx.onSpawnEnemy?.(microHandle);
            }
          }
        } else {
          trailTimer = 0;
        }
      },
      onPlayerCollision(player) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        if (stomp && !retracted) {
          retracted = true;
          safeMs = 350;
          retractedElapsed = 0;
          sprite.setVelocityX(0);
          sprite.setTexture('enemy_shell_retracted');
          sprite.setScale(1.85);
          return 'stomp';
        }
        if (stomp && retracted) {
          if (safeMs > 0) {
            return 'stomp';
          }
          retractedElapsed = 0;
          sprite.setVelocityX(player.x < sprite.x ? 220 : -220);
          return 'stomp';
        }
        return safeMs > 0 ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, retracted, safeMs, retractedElapsed }),
    };
  }

  if (kind === 'flying') {
    sprite.setScale(1.8);
    sprite.body.setSize(10, 10).setOffset(3, 3);
    const baseY = y;
    let t = 0;
    let baseAmp = Number(data.amp ?? 18);
    let phase: 'drift' | 'warn' | 'burst' = 'drift';
    let phaseTimer = 0;
    let driftDuration = 1500 + Math.random() * 1500;

    return {
      kind,
      displayName: ENEMY_DISPLAY_NAMES[kind],
      sprite,
      update(dtMs: number) {
        t += dtMs / 1000;
        phaseTimer += dtMs;

        if (phase === 'drift') {
          sprite.y = baseY + Math.sin(t * 2.4) * (baseAmp * 0.5);
          sprite.setVelocityX(-25);
          if (phaseTimer >= driftDuration) {
            phase = 'warn';
            phaseTimer = 0;
          }
        } else if (phase === 'warn') {
          sprite.setTint(0xff4444);
          if (phaseTimer >= 200) {
            phase = 'burst';
            phaseTimer = 0;
          }
        } else if (phase === 'burst') {
          sprite.setVelocityX(-120 + Math.random() * 240);
          sprite.y += (-100 + Math.random() * 200) * (dtMs / 1000);
          if (phaseTimer >= 300) {
            sprite.clearTint();
            phase = 'drift';
            phaseTimer = 0;
            driftDuration = 1500 + Math.random() * 1500;
          }
        }

        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
      },
      onPlayerCollision(player) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        return stomp ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, phase, baseAmp }),
    };
  }

  let fireTimer = 0;
  const cadence = Number(data.cadenceMs ?? 2100);
  sprite.setScale(1.8);
  sprite.body.setSize(10, 10).setOffset(3, 3);
  sprite.setImmovable(true);
  sprite.body.allowGravity = false;
  const baseY = y;
  let burstCount = 0;
  let riseTimer = 0;

  return {
    kind,
    displayName: ENEMY_DISPLAY_NAMES[kind],
    sprite,
    update(dtMs: number) {
      fireTimer += dtMs;
      riseTimer += dtMs;
      if (fireTimer >= cadence) {
        fireTimer = 0;
        burstCount += 1;

        const b1 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
        b1.setVelocity(-120, 0).setCollideWorldBounds(false);
        const b2 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
        b2.setVelocity(-100, -50).setCollideWorldBounds(false);
        const b3 = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile') as Phaser.Physics.Arcade.Sprite;
        b3.setVelocity(-100, 50).setCollideWorldBounds(false);

        if (burstCount % 2 === 0 && sprite.y > baseY - 48) {
          ctx.scene.tweens.add({
            targets: sprite,
            y: Math.max(baseY - 48, sprite.y - 16),
            duration: 800,
            ease: 'Sine.easeOut',
          });
        }
      }

      if (sprite.y < baseY - 4 && riseTimer > 2000) {
        sprite.y += 0.3;
      }
    },
    onPlayerCollision(player) {
      const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
      return stomp ? 'stomp' : 'damage';
    },
    serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, fireTimer, burstCount }),
  };
}
