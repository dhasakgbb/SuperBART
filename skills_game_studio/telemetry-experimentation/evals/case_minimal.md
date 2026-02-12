# Eval Case: Event Contract Baseline

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `telemetry/event_schema.json`
- `docs/metrics.md`
- `tools/log_validator.py`

## Pass Checklist
- Schema has version and required fields per event.
- Metrics map to events with explicit formulas.
- Validator script catches missing required fields.
- Check script passes.

## Manual Trigger
1. Run the skill with fixture prompt.
2. Execute `python skills_game_studio/telemetry-experimentation/scripts/check_telemetry_experimentation.py`.
3. Run validator against one malformed sample payload to confirm failure path.
