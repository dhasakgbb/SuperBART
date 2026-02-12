# Super BART - Game Design Document

## Description
Defines the gameplay vision, MVP scope, risks, milestones, and acceptance criteria for Super BART.


## Goal
Build a single-level, playable Mario-style side-scrolling platformer in the browser using Phaser 3 Arcade Physics.

## Core Loop
1. Move right through a tile-based level.
2. Jump across platforms and hazards.
3. Collect coins for score.
4. Stomp patrolling enemies while avoiding side damage.
5. Reach the goal flag to finish the level.

## MVP Scope
- In scope:
  - One side-scrolling level.
  - Run + jump + variable jump height.
  - Tile collisions and camera follow.
  - Coins, score, one enemy type (patrol), stomp kill, side damage.
  - Death + respawn + lives + game over.
  - Goal/flag win condition.
- Out of scope:
  - Slopes, advanced power-ups, multiple levels, world map, multiplayer.

## Systems
- Player Controller: horizontal movement, jump, jump-cut behavior.
- Physics & Collision: Arcade Physics against tile layer and entity overlaps.
- Combat: stomp vs side-hit enemy resolution.
- Progression: score, lives, win/lose modes.
- UI/HUD: score, lives, mode messaging.

## Level Design
- One tilemap (`level1.json`) with ground and floating platforms.
- Entity object layer includes `spawn`, `coin`, `enemy`, and `goal` objects.
- Camera follows player and clamps to map bounds.

## Risks
- Risk: variable jump can feel inconsistent.
  - Mitigation: implement deterministic jump-cut constant and test held vs tap apex.
- Risk: enemy collision false positives.
  - Mitigation: use explicit stomp predicate (vertical velocity + relative Y).
- Risk: asset reference drift.
  - Mitigation: add asset validation script used by `npm run validate`.

## Milestones
1. Scaffold app + architecture boundaries.
2. Implement movement/collision/camera.
3. Add coins, enemy, stomp/damage, respawn, goal.
4. Add generated placeholder assets + validators.
5. Add tests, perf checklist, release notes, and validation pipeline.

## Acceptance Criteria
1. Game runs via `npm run dev` and is playable from spawn to goal.
2. Player supports run, jump, variable jump height, and tile collisions.
3. Collecting a coin increments score by 10 and removes coin.
4. Stomping enemy kills it and adds 100 score; side-hit damages player.
5. Death triggers respawn unless lives reach zero, then Game Over.
6. Goal flag sets Win state and ends active play.
7. `npm run test`, `npm run validate`, and `npm run build` succeed.
