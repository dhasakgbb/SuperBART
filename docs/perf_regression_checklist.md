# Performance Regression Checklist

## Scope
Run this checklist before merging gameplay, rendering, generator, or save-flow changes.

## Capture Steps
1. Run `npm run build` and launch preview.
2. Capture 60s traversal in a normal world (with coins/enemies/checkpoint/goal).
3. Capture 60s traversal in final castle stress route.
4. Trigger pause/resume and level transition at least twice.
5. Collect `window.capture_perf_snapshot()` samples during each run.

## Pass Criteria
- Frame-time budgets in `docs/perf_budget.md` are met for p50/p95/p99.
- No sustained frame-time spikes > 25 ms for more than 1 second.
- Heap usage remains <= documented memory budget.
- Pause/resume and level transition times stay within budget.

## Failure Signals
- p95/p99 exceeds budget in either normal or stress route.
- Frame-time spikes recur in deterministic repro route.
- Heap climbs continuously without settling.
- Pause/resume introduces input lag or stutter.

## Rollback
- If a regression lands, revert the offending commit range or disable the feature path.
- Restore last known passing perf baseline from CI artifacts/notes.
- Re-run full checklist after rollback to verify recovery.
