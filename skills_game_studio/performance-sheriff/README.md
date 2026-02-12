# performance-sheriff

Sets budgets and performance gates before optimization work or release.

## Produced Files
- `docs/perf_budget.md`
- `tools/profile_helpers/`
- `docs/perf_regression_checklist.md`

## Validate
```bash
python skills_game_studio/performance-sheriff/scripts/check_performance_sheriff.py
```

## Example Prompt
"Use `$performance-sheriff` to set 60fps budgets for combat and traversal scenes and define regression gates."
