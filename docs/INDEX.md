# Documentation Index

## Description
This index is the entry point for Super BART project documentation. It explains what each document is for and where to look first.

## Start Here
1. `README.md` - run/build/test/validate commands and project overview.
2. `docs/GDD.md` - gameplay scope and acceptance criteria.
3. `docs/architecture.md` - code boundaries and integration flow.
4. `docs/TODO.md` - outstanding work before and after publish.

## Core Documents
- `docs/decisions.md`
  Why key technical/gameplay decisions were made.
- `docs/dependency_rules.md`
  Source import boundaries and enforcement model.
- `docs/asset_rules.md`
  Asset naming/sizing/metadata rules.
- `docs/pipeline_import_rules.md`
  Pipeline intake and rejection policy.
- `docs/qa_repro_playbook.md`
  Repro-first QA workflow and evidence requirements.
- `docs/ci_release_notes.md`
  CI and release-stage behavior.
- `docs/7_gate_runbook.md`
  Merge-readiness 7-gate process for command/file-only changes.
- `docs/7_gate_log.md`
  Canonical 7-gate logging schema and artifact format.
- `docs/perf_budget.md`
  Performance targets (p50/p95/p99 and memory/load budgets).
- `docs/perf_regression_checklist.md`
  Regression gate and rollback process.

## Feature Verification Docs
- `docs/clone_feel_contract.md`
  Clone-feel acceptance contract and telemetry schema for movement/pacing.
- `docs/clone_readiness_status.md`
  Current subjective+objective clone-feel readiness status and blockers.
- `docs/verification/scaffold_core.md`
- `docs/verification/player_movement_jump.md`
- `docs/verification/level_camera_collision.md`
- `docs/verification/coins_score.md`
- `docs/verification/enemy_stomp_damage.md`
- `docs/verification/goal_win_lose_respawn.md`
- `docs/verification/qa_build_perf_release.md`

These map each ticket's acceptance criteria to implementation and test evidence.
