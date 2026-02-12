---
name: performance-sheriff
description: Establish performance budgets, profiling helpers, and regression gates for gameplay-critical paths.
version: 0.1.0
tags:
  - performance
  - profiling
  - optimization
triggers:
  - frame-time regressions appear
  - load-time or memory targets are undefined
  - release candidate needs perf sign-off
tools:
  - python
  - markdown
  - shell
entrypoints:
  - scripts/check_performance_sheriff.py
---

# Performance Sheriff

## Purpose
Define measurable performance targets and enforce repeatable regression checks.

## Inputs Required
- Target platforms and frame rate goals.
- Critical scenes/workloads.
- Existing profiling method or preferred capture tool.

## Workflow
1. Ensure output directories exist via shared helper.
2. Create `docs/perf_budget.md` with frame-time, memory, and load-time budgets.
3. Create `tools/profile_helpers/` with reusable profiling command helpers.
4. Create `docs/perf_regression_checklist.md` for release gates.
5. Validate artifacts with the check script.

## Required Outputs
- `docs/perf_budget.md`
- `tools/profile_helpers/` (directory with at least one helper file)
- `docs/perf_regression_checklist.md`

## File Conventions
- Budget doc must include p50/p95/p99 targets.
- Checklist must include pass/fail thresholds and rollback policy.
- Profiling helpers must be scriptable from command line.

## Definition of Done
- Budgets are numeric and scene-specific.
- Regression checklist maps directly to release decisions.
- Profile helper directory contains runnable helpers or command docs.
- Check script exits `0`.

## Guardrails
- Do not accept subjective statements as performance proof.
- Avoid one-off benchmark runs; require repeatable captures.
- Keep tooling engine-neutral unless user requests engine-specific profiler integration.

## Outputs Contract
- Documentation in `docs/`.
- Profiling utilities in `tools/profile_helpers/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
- `skills_game_studio/_shared/TEMPLATES/perf_report_template.md`
