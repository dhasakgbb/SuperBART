# Eval Case: Ticket to Feature Delivery

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `tickets/wall_jump.md` (input ticket)
- `build/feature_manifests/wall_jump.json`
- `docs/verification/wall_jump.md`
- Code and test files referenced by the manifest

## Pass Checklist
- Manifest references real code and tests.
- Verification note maps each acceptance criterion to evidence.
- Check script passes for `wall_jump`.

## Manual Trigger
1. Run the skill with the fixture ticket.
2. Run:
   `python skills_game_studio/gameplay-feature-factory/scripts/check_gameplay_feature_factory.py --feature-id wall_jump`
3. Open verification note and confirm no criterion is unaccounted.
