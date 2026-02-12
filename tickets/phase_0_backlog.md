# Phase 0 Backlog - Super BART

## Ticket: scaffold_core
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: none
- Acceptance Criteria:
  1. Vite + Phaser scaffold compiles and boots.
  2. `npm run dev` opens a running game canvas.
  3. Core module boundaries are documented.

## Ticket: player_movement_jump
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: scaffold_core
- Acceptance Criteria:
  1. Player moves left/right with max speed cap.
  2. Player jumps and supports variable jump height (tap vs hold).
  3. Player collides with tile-based ground/platforms.

## Ticket: level_camera_collision
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: scaffold_core
- Acceptance Criteria:
  1. Tilemap loads from local JSON.
  2. Camera follows player and is clamped to level bounds.
  3. Player cannot pass through collidable tiles.

## Ticket: coins_score
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: level_camera_collision
- Acceptance Criteria:
  1. Coin overlap removes coin sprite.
  2. Score increments by 10 per coin exactly once.
  3. HUD updates score in real time.

## Ticket: enemy_stomp_damage
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: player_movement_jump
- Acceptance Criteria:
  1. Enemy patrols between configured bounds.
  2. Stomp collision kills enemy and adds 100 score.
  3. Side-hit causes player damage/death flow.

## Ticket: goal_win_lose_respawn
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: enemy_stomp_damage, coins_score
- Acceptance Criteria:
  1. Falling below world or side-hit causes death + respawn.
  2. Lives decrement from 3 to 0 and trigger Game Over at zero.
  3. Goal flag triggers Win state and halts active play.

## Ticket: qa_build_perf_release
- Owner: QA/Tools Engineer
- Estimate: 0.5 day
- Dependencies: all gameplay tickets
- Acceptance Criteria:
  1. Two deterministic automated tests are present and passing.
  2. Asset validation and dependency rules checks run in `npm run validate`.
  3. Build, release notes, and perf checklist docs are complete.
