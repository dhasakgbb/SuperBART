# Eval Case: Baseline Progression Balance

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/balance_model.md`
- `tools/balance_sim.py`
- `tests/test_balance_sanity.py`

## Pass Checklist
- Model defines variables and equations.
- Simulation returns deterministic output for fixed input.
- Sanity test catches an invalid progression scenario.
- Check script passes.

## Manual Trigger
1. Run the skill with the fixture prompt.
2. Optionally run `python tools/balance_sim.py`.
3. Run `python skills_game_studio/systems-balancer/scripts/check_systems_balancer.py`.
4. Confirm assumptions are documented and measurable.
