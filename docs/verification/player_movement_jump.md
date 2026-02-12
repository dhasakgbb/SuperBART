# Feature Verification: player_movement_jump

## Description
Maps movement and variable jump criteria to logic implementation and deterministic tests.


## Ticket
- Path: `tickets/player_movement_jump.md`

## Acceptance Criteria Mapping
1. Left/right input moves player with speed cap.
   - Implementation evidence: `src/scenes/PlayScene.js`, `src/logic/playerPhysics.js`
   - Test evidence: `tests/player_physics_sanity.test.js`
2. Jump triggers only when grounded.
   - Implementation evidence: grounded jump gate in `PlayScene.updatePlayerMovement`.
   - Test evidence: deterministic jump math in `tests/player_physics_sanity.test.js`.
3. Tap jump is lower than held jump.
   - Implementation evidence: jump-cut via `applyJumpCut`.
   - Test evidence: apex comparison in `tests/player_physics_sanity.test.js`.

## Risks
- Jump feel may require tuning based on playtesting.

## Follow-ups
- Add coyote time only if requested in future scope.
