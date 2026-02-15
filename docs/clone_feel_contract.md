# Clone-Feel Contract

## Scope
This contract defines measurable gameplay-feel targets for the Mario-style movement and pacing confidence pass.

## Source
- Canonical target: `scripts/playfeel_contract.json`
- Gate check anchor: `tests/quality.playfeel.test.ts`
- Execution lock: use this alongside `scripts/run_ci_gates.mjs`

## Acceptance criteria
- `run_speed >= 1.35 * walk_speed`
- `air_accel <= 0.70 * ground_accel`
- jump-cut applies once per jump-release event
- skid exists on hard reversal above a speed threshold
- stomp hit-stop is visible and in 50–90 ms window
- one stomp cooldown lock exists (shorter than land cooldown)
- no floating gameplay world text labels in final captures
- deterministic campaign still validates with complete chunk metadata

## Canonical contract payload schema (`scripts/playfeel_contract.json`)
```json
{
  "run_speed_ratio": 1.35,
  "air_accel_ratio": 0.70,
  "jump_cut_frames": 1,
  "stomp_cooldown_ms": 120,
  "has_stomp_hitstop": true,
  "stomp_hitstop_ms": 72,
  "skid_trigger_distance": 120,
  "world_label_violations": 0,
  "telegraph_before_lethal_ratio": 1.0
}
```

## Review protocol
1. Run:
   - `npm run ci:gates`
   - `npm run ci:gates:log`
2. Open the current play baseline captures under `docs/screenshots/golden/*`.
3. Confirm:
   - no world-space label regression in gameplay (`world labels disallowed` contract rule)
   - stomps visually pause/impact with short cue
   - jump release does not keep multiplying upward velocity on held frame loops
4. Record outcome in:
   - `docs/clone_readiness_status.md`

## Queries
- `jq '.run_speed_ratio, .air_accel_ratio, .stomp_cooldown_ms' scripts/playfeel_contract.json`
- `npm run test -- tests/quality.playfeel.test.ts`
