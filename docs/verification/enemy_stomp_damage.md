# Feature Verification: enemy_stomp_damage

## Description
Maps enemy stomp/side-hit criteria to implemented behavior and known risks.


## Ticket
- Path: `tickets/enemy_stomp_damage.md`

## Acceptance Criteria Mapping
1. Enemy patrols between bounds.
   - Implementation evidence: `updateEnemyPatrol` in `src/scenes/PlayScene.js` and map enemy properties.
   - Test evidence: repro scene `tests/repro_scenes/repro_enemy_side_hit.md`.
2. Stomp kill + 100 score.
   - Implementation evidence: `resolveEnemyCollision` + `registerEnemyStomp`.
   - Test evidence: runtime state debug includes score and enemy list.
3. Side-hit causes player death flow.
   - Implementation evidence: `handlePlayerDeath('enemy')` in collision callback.
   - Test evidence: repro scene for side-hit behavior.

## Risks
- Edge-angle collisions may classify as stomp or side-hit near threshold.

## Follow-ups
- Add additional collision angle tolerance tests.
