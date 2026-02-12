# Eval Case: Perf Budget and Gate Setup

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/perf_budget.md`
- `tools/profile_helpers/*`
- `docs/perf_regression_checklist.md`

## Pass Checklist
- Numeric budgets exist for frame time and memory.
- Helper directory has at least one runnable helper script or command file.
- Checklist includes pass criteria and rollback action.
- Check script passes.

## Manual Trigger
1. Run the skill from the fixture prompt.
2. Execute check script.
3. Confirm checklist includes owner and escalation path for failed budgets.
