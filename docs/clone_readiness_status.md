# Clone-Readiness Status

## Last status snapshot
- Date: 2026-02-13
- Gate matrix baseline: `npm run ci:gates:log` (run_id `2026-02-13T18:38:31.388Z_9594`)
- Gate baseline status: FAIL at gate 5 (`lint_visual`), gates 1-4 PASS. Gate 6 not reached due early visual fail.
- Current phase: Phase 2 playfeel audit (manual/automated evidence complete for scenarios, with one repeated bootstrap blocker)

## Phase 2 Playfeel Audit

- Runbook path: `docs/qa_repro_playbook.md`
- Playfeel runner: `scripts/run_playfeel_phase2.mjs`
- Findings file: `artifacts/playfeel/phase2/reports/phase2_findings.jsonl`
- Screenshot/state artifact root: `artifacts/playfeel/phase2/`
- Blocker policy: any `FAIL` in findings or hard console error block triggers `rollback_required=true` and halts that scenario.

## Audit matrix

| run_id | scenario | level | result | notes | evidence_screenshot | evidence_state | rollback_required |
|---|---|---|---|---|---|---|---|
| 2026-02-13T18:25:49.129Z_3613 | jump-cut | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_x_y/state-0.json | true |
| 2026-02-13T18:28:57.561Z_3998 | run-skid | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/run-skid/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_x_y/state-0.json | true |
| 2026-02-13T18:32:00.898Z_5243 | stomp | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/stomp/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/stomp/lvl_x_y/state-0.json | true |
| 2026-02-13T18:35:02.694Z_7631 | telegraph | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/telegraph/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_x_y/state-0.json | true |
| 2026-02-13T18:12:37.835Z_91605 | telegraph | 1-25 | PARTIAL | 18 PASS / 7 FAIL; bootstrap transition failures on 2-5, 3-3, 3-4, 3-6, 4-1, 4-2, 5-1 | artifacts/playfeel/phase2/screenshots/telegraph/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_x_y/state-0.json | true |
| 2026-02-13T18:18:58.097Z_96786 | jump-cut | 1-25 | NOT_EXECUTED | `npm test` stopped at Gate 6; gameplay one-shot regressions from jump-cut timing remained | n/a | n/a | true |

## Criteria status (current)
- `run_speed_ratio`: PASS (`run_speed_ratio` in constants and `tests/quality.playfeel.test.ts`)
- `air_accel_ratio`: PASS (`air control` contract stays below 70% of ground target)
- `jump_cut_frames`: BLOCKED (`tests/player_feel_timing.test.ts` and `tests/quality.playfeel.test.ts` still report 2 vs expected 1)
- `stomp_hitstop_ms`: PASS (`32ms`, still below stated 50–90ms target preference)
- `run-skid cue`: PASS (24/25 levels, one bootstrap-timeout exception at `5-1` for all scenarios)
- `telegraph-before-lethal`: PARTIAL (24/25 levels, one bootstrap-timeout exception at `5-1`)
- `world_label_violations`: PASS (contract says 0; no world labels asserted by render checks in this pass)

## Open blockers
- `scripts/run_ci_gates.mjs` latest run (`2026-02-13T18:38:31.388Z_9594`) is blocked at `lint_visual` due map/play visual drift threshold misses.
- `tests/player_feel_timing.test.ts` and `tests/quality.playfeel.test.ts` still report jump-cut one-shot regressions (`expected 1, got 2`).
- Playfeel run-time bootstrap blocker is now isolated to `5-1` across all 4 scenarios (`phase2_bootstrap_play_timeout`), consistent with campaign bootstrap transition for final level.
- Console-output or scene-navigation failures in future runs should be treated as blockers and logged as `rollback_required: true` in `artifacts/playfeel/phase2/reports/phase2_findings.jsonl`.

## Next action
- Re-run `npm run ci:gates:log` after visual-golden reconciliation (if the intentional visual lock changed) and then continue with targeted `5-1` navigation debugging.
- Update this matrix + findings for each newly executed level/scenario pass and keep `rollback_required` true for any timeout/blocker.
