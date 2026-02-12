# Eval Case: Repro Harness Bootstrap

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `tests/repro_scenes/README.md`
- At least one `tests/repro_scenes/*.md` fixture
- `docs/qa_repro_playbook.md`

## Pass Checklist
- Repro scene includes deterministic expected result.
- Playbook defines environment capture and exit criteria.
- Check script passes.

## Manual Trigger
1. Run the skill with fixture prompt.
2. Execute check script.
3. Re-run one repro scene from scratch and confirm repeatability.
