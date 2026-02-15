import Phaser from 'phaser';

export type EnemyKind =
  | 'walker'
  | 'shell'
  | 'flying'
  | 'spitter'
  | 'compliance_officer'
  | 'technical_debt'
  | 'hallucination'
  | 'legacy_system'
  | 'hot_take'
  | 'analyst'
  | 'compliance'
  | 'tethered_debt'
  | 'boss'
  | 'snowman_sentry'
  | 'cryo_drone'
  | 'qubit_swarm'
  | 'crawler'
  | 'glitch_phantom'
  | 'fungal_node'
  | 'ghost_process'
  | 'tape_wraith'
  | 'resume_bot';

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
  onPlayerCollision(player: Phaser.Physics.Arcade.Sprite): 'stomp' | 'damage' | 'harmless';
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
