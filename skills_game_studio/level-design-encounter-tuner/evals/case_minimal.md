# Eval Case: Encounter Pacing Blueprint

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/level_specs/` with at least one level spec
- `docs/encounter_pacing_template.md`

## Pass Checklist
- Level spec has objective flow and fail states.
- Encounter pacing includes timeline + intensity values.
- Downtime and recovery beats are explicit.
- Check script passes.

## Manual Trigger
1. Run the skill from fixture prompt.
2. Execute check script.
3. Compare the pacing timeline against mission duration assumptions.
