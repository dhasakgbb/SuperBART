import Phaser from 'phaser';

export function updateMovingPlatforms(group: Phaser.Physics.Arcade.Group): void {
  group.children.each((child) => {
    const p = child as Phaser.Physics.Arcade.Sprite;
    if (!p.active) return true;
    const minX = Number(p.getData('minX'));
    const maxX = Number(p.getData('maxX'));
    const speed = Number(p.getData('speed'));
    if (!p.body?.velocity.x) p.setVelocityX(speed);
    if (p.x < minX) p.setVelocityX(Math.abs(speed));
    if (p.x > maxX) p.setVelocityX(-Math.abs(speed));
    return true;
  });
}

export function updateThwomps(group: Phaser.Physics.Arcade.Group, playerX: number): void {
  group.children.each((child) => {
    const t = child as Phaser.Physics.Arcade.Sprite;
    if (!t.active) return true;
    const topY = Number(t.getData('topY'));
    const bottomY = Number(t.getData('bottomY'));
    const state = String(t.getData('state') ?? 'idle');
    const dx = Math.abs(playerX - t.x);

    if (state === 'idle' && dx < 80) {
      t.setData('state', 'drop');
      t.setVelocityY(240);
    } else if (state === 'drop' && t.y >= bottomY) {
      t.setData('state', 'rise');
      t.setVelocityY(-140);
    } else if (state === 'rise' && t.y <= topY) {
      t.setData('state', 'idle');
      t.setVelocityY(0);
      t.y = topY;
    } else if (state === 'idle') {
      t.y = topY;
    }
    return true;
  });
}
