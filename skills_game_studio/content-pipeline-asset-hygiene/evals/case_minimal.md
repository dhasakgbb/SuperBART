# Eval Case: Asset Intake Guardrails

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/pipeline_import_rules.md`
- `docs/asset_rules.md`
- `tools/asset_validate.py`
- `assets/placeholders/`

## Pass Checklist
- Rules define accepted formats and rejection criteria.
- Validator script can be executed without external dependencies.
- Placeholder directory exists and contains no large binaries.
- Check script passes.

## Manual Trigger
1. Run the skill using the fixture prompt.
2. Add a synthetic invalid asset name in a test manifest and verify validator fails.
3. Run the skill check script.
