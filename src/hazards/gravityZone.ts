import * as Phaser from 'phaser';

/**
 * Gravity Zones modify local gravity in World 3 (Quantum Void).
 * Green zones: reduced gravity (0.5x), floaty jumps
 * Red zones: heavy gravity (1.5x), short jumps
 * Applied per-frame when player overlaps zone rectangle.
 */

export interface GravityZone {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'green' | 'red';
  multiplier: number;
}

/**
 * Create a visual gravity zone indicator in the scene.
 * Zones are mostly transparent with subtle coloring.
 */
export function createGravityZone(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  type: 'green' | 'red'
): Phaser.GameObjects.Rectangle {
  const color = type === 'green' ? 0x44FF44 : 0xFF4444;
  const zone = scene.add.rectangle(x, y, width, height, color);
  zone.setAlpha(0.15);
  zone.setDepth(1);
  zone.setData('zoneType', type);
  zone.setData('multiplier', type === 'green' ? 0.5 : 1.5);
  zone.setStrokeStyle(1, color, 0.3);
  return zone;
}

/**
 * Check if player position overlaps any gravity zone.
 * Returns the multiplier for the overlapped zone, or 1.0 if no overlap.
 */
export function checkGravityZoneOverlap(
  playerX: number,
  playerY: number,
  zones: Phaser.GameObjects.Rectangle[]
): number {
  for (const zone of zones) {
    const bounds = zone.getBounds();
    if (bounds.contains(playerX, playerY)) {
      return zone.getData('multiplier') as number;
    }
  }
  return 1.0; // No zone overlap, normal gravity
}

/**
 * Get all gravity zones for a given world and level.
 * Returns empty array if world is not World 3 or if no zones are defined.
 */
export function getGravityZonesForLevel(
  world: number,
  level: number
): GravityZone[] {
  // World 3 (Quantum Void) uses gravity zones
  if (world !== 3) {
    return [];
  }

  // Define zone placement by level
  const zones: Record<number, GravityZone[]> = {
    1: [
      // Level 3-1: Simple intro with one green zone
      {
        x: 192,
        y: 240,
        width: 128,
        height: 96,
        type: 'green',
        multiplier: 0.5,
      },
    ],
    2: [
      // Level 3-2: Mixed green and red zones
      {
        x: 240,
        y: 200,
        width: 96,
        height: 80,
        type: 'green',
        multiplier: 0.5,
      },
      {
        x: 432,
        y: 280,
        width: 96,
        height: 80,
        type: 'red',
        multiplier: 1.5,
      },
    ],
    3: [
      // Level 3-3: Vertical focus with alternating zones
      {
        x: 288,
        y: 160,
        width: 80,
        height: 120,
        type: 'green',
        multiplier: 0.5,
      },
      {
        x: 384,
        y: 240,
        width: 80,
        height: 120,
        type: 'red',
        multiplier: 1.5,
      },
      {
        x: 480,
        y: 320,
        width: 80,
        height: 120,
        type: 'green',
        multiplier: 0.5,
      },
    ],
    4: [
      // Level 3-4: Complex pattern with tight zones
      {
        x: 240,
        y: 180,
        width: 96,
        height: 64,
        type: 'red',
        multiplier: 1.5,
      },
      {
        x: 368,
        y: 240,
        width: 96,
        height: 80,
        type: 'green',
        multiplier: 0.5,
      },
      {
        x: 496,
        y: 200,
        width: 96,
        height: 100,
        type: 'red',
        multiplier: 1.5,
      },
      {
        x: 624,
        y: 320,
        width: 96,
        height: 80,
        type: 'green',
        multiplier: 0.5,
      },
    ],
  };

  return zones[level] ?? [];
}
