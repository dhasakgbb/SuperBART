# Feature Verification: coins_score

## Description
Maps the coin/score feature ticket criteria to concrete implementation and validation evidence.


## Ticket
- Path: `tickets/coins_score.md`

## Acceptance Criteria Mapping
1. Coin disappears on overlap.
   - Implementation evidence: `onPlayerCoinOverlap` in `src/scenes/PlayScene.js`.
   - Test evidence: state exposed through `window.render_game_to_text` coin count.
2. Score increments by 10.
   - Implementation evidence: `registerCoinCollect` in `src/game/stateMachine.js`.
   - Test evidence: state transitions verifiable in runtime debug output.
3. HUD updates immediately.
   - Implementation evidence: `src/ui/hud.js` with per-frame refresh.
   - Test evidence: manual QA repro and HUD checks.

## Risks
- Duplicate overlap events could cause double scoring if coin disable order changes.

## Follow-ups
- Add explicit score assertion integration test after browser automation harness expansion.
