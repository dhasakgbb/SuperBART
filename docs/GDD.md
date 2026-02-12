# Super BART V2 GDD

## Pillars
1. Tight platformer feel: acceleration curves, coyote time, jump buffer, variable jump.
2. Deterministic progression: 25 campaign levels generated from world/level/seed.
3. Readable challenge growth: enemy/hazard variety and world-themed parameters.
4. Fast iteration: deterministic tools, runtime debug hooks, automation-friendly tests.

## Scope
- Engine: Phaser 3 Arcade Physics.
- Worlds: 5 campaign worlds x 5 levels each.
- Bonus: 3 micro-levels unlocked via stars.
- Power states: `small`, `big`.
- No slopes, no multiplayer, no world-map overworld simulation.

## Core Mechanics
- Run, jump, variable jump cut, coyote (100ms), jump buffer (100ms).
- Damage with knockback + invulnerability frames.
- Death + respawn at active checkpoint.
- Collect coins (score) and stars (unlock progression).
- Goal flag ends level with summary transition.

## Enemy and Hazard Matrix
- Walker patrol enemy.
- Shell enemy with retract + kick.
- Flying sine enemy.
- Spitter enemy with tile-colliding projectiles.
- Spike hazard.
- Thwomp-lite hazard.
- Moving platform + pit + springboard hazard combination.

## Content System
- Runtime procedural generator: `generateLevel({world, levelIndex, seed})`.
- Chunk grammar: start, mid_flat, vertical_climb, coin_arc, enemy_gauntlet, moving_platform, checkpoint, end.
- World rules tune gap rates, enemy density, projectile cadence, moving platforms, palette, and tempo.

## Acceptance Criteria
- Title screen -> world map -> playable level loop.
- Campaign progression supports 25 levels.
- At least 6 enemy/hazard behaviors active.
- Power-up loop `small <-> big` works.
- Checkpoints and deterministic respawns work.
- Audio synthesis with settings toggles works.
- `npm run dev`, `npm run test`, `npm run validate`, `npm run build` pass.
