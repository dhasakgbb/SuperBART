# Feature Verification: level_camera_collision

## Description
Maps level loading, camera follow, and collision criteria to implementation and checks.


## Ticket
- Path: `tickets/level_camera_collision.md`

## Acceptance Criteria Mapping
1. Tilemap loads from local JSON.
   - Implementation evidence: `src/scenes/BootScene.js`, `public/assets/maps/level1.json`
   - Test evidence: `tests/boot_level_load.test.js`
2. Camera follows player and map bounds.
   - Implementation evidence: camera setup in `src/scenes/PlayScene.js`.
   - Test evidence: runtime inspection via `window.render_game_to_text` and scene state.
3. Tile collisions block pass-through.
   - Implementation evidence: `groundLayer.setCollisionByExclusion` + player collider.
   - Test evidence: deterministic map contract + manual repro playbook.

## Risks
- Collider bounds can drift if sprite dimensions are changed.

## Follow-ups
- Add tile collision regression assertions in headless integration tests.
