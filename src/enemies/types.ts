import Phaser from 'phaser';

export type EnemyKind =
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
  getPlayerPosition?: () => { x: number; y: number } | null;
  nowMs?: () => number;
  onSpawnEnemy?: (handle: EnemyHandle) => void;
}
