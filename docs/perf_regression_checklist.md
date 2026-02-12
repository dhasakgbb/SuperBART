# Performance Regression Checklist

## Description
Provides step-by-step pass/fail and rollback procedure for performance regressions.


## Pass Criteria
- p50, p95, and p99 frame times remain within budget.
- No sustained frame pacing spikes > 25ms for more than 1 second.
- Memory footprint remains within target during 5-minute play session.

## Run Procedure
1. Build and run latest dev server.
2. Perform full level traversal twice.
3. Capture metrics and compare against previous baseline.

## Rollback
- If pass criteria fail, stop release candidate promotion.
- Revert latest performance-regressing change or gate behind flag.
- Re-run checklist after remediation.
