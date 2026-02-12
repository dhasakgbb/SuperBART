import Phaser from 'phaser';

export type EnemyKind = 'walker' | 'shell' | 'flying' | 'spitter';

export interface EnemyHandle {
  kind: EnemyKind;
  sprite: Phaser.Physics.Arcade.Sprite;
  update(dtMs: number): void;
  onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage';
  serializeDebug(): Record<string, unknown>;
}

export interface EnemyContext {
  scene: Phaser.Scene;
  projectiles: Phaser.Physics.Arcade.Group;
}

export function spawnEnemy(kind: EnemyKind, scene: Phaser.Scene, x: number, y: number, ctx: EnemyContext, data: Record<string, unknown> = {}): EnemyHandle {
  const sprite = scene.physics.add.sprite(x, y, `enemy_${kind}`);
  sprite.setCollideWorldBounds(true);

  if (kind === 'walker') {
    const speed = 45;
    sprite.setVelocityX(speed);
    return {
      kind,
      sprite,
      update() {
        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
      },
      onPlayerCollision(player) {
        const playerBottom = player.body.bottom;
        return playerBottom < sprite.body.top + 8 && player.body.velocity.y > 0 ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y })
    };
  }

  if (kind === 'shell') {
    let retracted = false;
    let safeMs = 0;
    return {
      kind,
      sprite,
      update(dtMs) {
        safeMs = Math.max(0, safeMs - dtMs);
        if (!retracted && (sprite.body.blocked.left || sprite.body.blocked.right)) {
          sprite.setVelocityX(-sprite.body.velocity.x || 55);
        }
      },
      onPlayerCollision(player) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        if (stomp && !retracted) {
          retracted = true;
          safeMs = 350;
          sprite.setVelocityX(0);
          sprite.setTexture('enemy_shell_retracted');
          return 'stomp';
        }
        if (stomp && retracted) {
          if (safeMs > 0) {
            return 'stomp';
          }
          sprite.setVelocityX(player.x < sprite.x ? 220 : -220);
          return 'stomp';
        }
        return safeMs > 0 ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, retracted, safeMs })
    };
  }

  if (kind === 'flying') {
    const baseY = y;
    let t = 0;
    return {
      kind,
      sprite,
      update(dtMs) {
        t += dtMs / 1000;
        sprite.y = baseY + Math.sin(t * 2.4) * Number(data.amp ?? 18);
        sprite.setVelocityX(-35);
        if (sprite.body.blocked.left || sprite.body.blocked.right) {
          sprite.setVelocityX(-sprite.body.velocity.x);
        }
      },
      onPlayerCollision(player) {
        const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
        return stomp ? 'stomp' : 'damage';
      },
      serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y })
    };
  }

  let fireTimer = 0;
  const cadence = Number(data.cadenceMs ?? 2100);
  sprite.setImmovable(true);
  sprite.body.allowGravity = false;
  return {
    kind,
    sprite,
    update(dtMs) {
      fireTimer += dtMs;
      if (fireTimer >= cadence) {
        fireTimer = 0;
        const bullet = ctx.projectiles.create(sprite.x - 10, sprite.y - 6, 'projectile');
        bullet.setVelocityX(-120);
        bullet.setCollideWorldBounds(false);
      }
    },
    onPlayerCollision(player) {
      const stomp = player.body.bottom < sprite.body.top + 8 && player.body.velocity.y > 0;
      return stomp ? 'stomp' : 'damage';
    },
    serializeDebug: () => ({ kind, x: sprite.x, y: sprite.y, fireTimer })
  };
}
