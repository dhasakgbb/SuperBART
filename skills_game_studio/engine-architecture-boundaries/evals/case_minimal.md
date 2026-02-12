# Eval Case: Boundary Contract Setup

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/architecture.md`
- `docs/dependency_rules.md`
- `tools/check_dependency_rules.py`

## Pass Checklist
- Architecture responsibilities are explicit.
- Forbidden dependencies are machine-checkable.
- Checker script exits non-zero on synthetic violation.
- Skill check script passes.

## Manual Trigger
1. Run the skill with the fixture prompt.
2. Add a temporary known-violation import and run `python tools/check_dependency_rules.py`.
3. Verify failure is detected, then remove temporary violation.
4. Run skill check script.
