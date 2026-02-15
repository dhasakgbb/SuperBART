# Clone-Readiness Status

## Last status snapshot
- Date: 2026-02-13
- Gate matrix baseline: `npm run ci:gates:log` baseline remains passing in the last known matrix lock (all 7 gates green).
- Current phase: Phase 2 playfeel audit (harness-level unblocking + evidence collection)
- Latest harness hardening:
  - `scripts/run_playfeel_phase2.mjs` now focuses the canvas before each menu handoff.
  - It now injects target campaign ordinal into `WorldMapScene.selectedOrdinal` before Enter so level selection is deterministic.
- Latest verified gate lock run: `2026-02-13T21:00:32.801Z_96531` (all 7 gates PASS via `ci:gates:log`).

## Latest phase-2 run status

- Scope: all four scenarios with the updated bootstrap harness and same action corpus.
- Current status: no scenario has produced a full PASS matrix in a 25-level sweep in this session.
- Gate state before rerun: PASS baseline lock (full 7-gate matrix) held in `artifacts/superbart_gate_runs.jsonl`.
- `2026-02-13T21:00:32.801Z_96531` confirms the gate lock is still green before playfeel evidence collection.
- Latest phase-2 run coverage:
  - `2026-02-13T21:00:21.751Z_96151` (`jump-cut`, `1-25`) — `FAIL (0/25)` due `phase2_execution_error` after repeated `playfeel_execution_error` and scene bootstrap instability.
  - `2026-02-13T20:59:55.087Z_94818` (`jump-cut`, `1-3`) — `FAIL` at `1-3` for no jump-cut detection.
  - `2026-02-13T19:55:43.234Z_78852` (`telegraph`, `1-4`) — `PASS` focused smoke; retained as one healthy control sample.

## Phase 2 Playfeel Audit

- Runbook path: `docs/qa_repro_playbook.md`
- Playfeel runner: `scripts/run_playfeel_phase2.mjs`
- Findings file: `artifacts/playfeel/phase2/reports/phase2_findings.jsonl`
- Screenshot/state artifact root: `artifacts/playfeel/phase2/`
- Blocker policy: any `FAIL` in findings or hard console error block triggers `rollback_required=true` and halts that scenario.

## Audit matrix

| run_id | scenario | level | result | notes | evidence_screenshot | evidence_state | rollback_required |
|---|---|---|---|---|---|---|---|
| 2026-02-13T19:18:04.300Z_43198 | jump-cut | 1-1 | PASS | one-shot jump-cut detected under live server; one scenario-level smoke only | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_1/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_1_1/state-0.json | false |
| 2026-02-13T20:59:55.087Z_94818 | jump-cut | 1-3 | FAIL | `playfeel_jump_cut_missing` at focused 1-3 validation | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_3/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_1_3/state-0.json | true |
| 2026-02-13T21:00:21.751Z_96151 | jump-cut | 1-25 | FAIL (0/25) | scenario-level execution errors and bootstrap instability prevented full sweep interpretation | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_x_y/state-0.json | true |
| 2026-02-13T18:25:49.129Z_3613 | jump-cut | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_x_y/state-0.json | true |
| 2026-02-13T18:28:57.561Z_3998 | run-skid | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/run-skid/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_x_y/state-0.json | true |
| 2026-02-13T18:32:00.898Z_5243 | stomp | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/stomp/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/stomp/lvl_x_y/state-0.json | true |
| 2026-02-13T18:35:02.694Z_7631 | telegraph | 1-25 | PASS (24/25) | Fails only at `5-1` with bootstrap play-scene timeout (`phase2_bootstrap_play_timeout`) | artifacts/playfeel/phase2/screenshots/telegraph/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_x_y/state-0.json | true |
| 2026-02-13T18:12:37.835Z_91605 | telegraph | 1-25 | PARTIAL | 18 PASS / 7 FAIL; bootstrap transition failures on 2-5, 3-3, 3-4, 3-6, 4-1, 4-2, 5-1 | artifacts/playfeel/phase2/screenshots/telegraph/lvl_x_y/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_x_y/state-0.json | true |
| 2026-02-13T18:18:58.097Z_96786 | jump-cut | 1-25 | NOT_EXECUTED | `npm test` stopped at Gate 6; gameplay one-shot regressions from jump-cut timing remained | n/a | n/a | true |

## Criteria status (current)
- `run_speed_ratio`: PASS (`run_speed_ratio` in constants and `tests/quality.playfeel.test.ts`)
- `air_accel_ratio`: PASS (`air control` contract stays below 70% of ground target)
- `jump_cut_frames`: PASS (`tests/player_feel_timing.test.ts` and `tests/quality.playfeel.test.ts` report one-shot enforcement = 1)
- `stomp_hitstop_ms`: PASS (`32ms`, still below stated 50–90ms target preference)
- `run-skid cue`: BLOCKED (0/25 in latest full sweep; behavior not currently trustworthy while harness bootstrap stability recovers)
- `telegraph-before-lethal`: BLOCKED (latest full 25-level run not completed due execution instability in harness)
- `world_label_violations`: PASS (contract says 0; no world labels asserted by render checks in this pass)
- `run/air/stomp contract`: PASS at unit level, BLOCKED in live harness due runtime telemetry noise and scene-transition instability.

## Open blockers
- `playfeel` runtime probes still observe missing jump-cut/reversal/stomp-hitstop behavior in some levels (see focused findings), despite unit contracts passing.
- `5-1` bootstrap transition still needs dedicated debugging, but latest runs also show broader scene bootstrap and play-scene handoff instability across scenarios (`phase2_bootstrap_title_timeout`, `phase2_execution_error`, and context loss), so this cannot be isolated yet.
- `scripts/run_playfeel_phase2.mjs` currently emits high-volume play scene transition noise in long sweeps; this requires stabilizing runner/session handling before gameplay tuning conclusions can be trusted.
- `scripts/run_ci_gates.mjs` visual pass remains sensitive to baseline drift if the golden asset set is intentionally changed; rerun and reconcile before merge.

## Next action
- Re-run `npm run ci:gates:log` after visual-golden reconciliation (if the intentional visual lock changed), then continue with a focused session-stability fix for `scripts/run_playfeel_phase2.mjs` before another full 25-level sweep.
- Update this matrix + findings for each newly executed level/scenario pass and keep `rollback_required` true for any timeout/blocker.

## Focused rerun addendum (2026-02-13)

- Command set: `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels 1-3 --iterations 1`, `npm run playfeel:phase2 -- --scenario run-skid --headless 1 --levels 1-6,2-2 --iterations 1`, and `npm run playfeel:phase2 -- --scenario telegraph --headless 1 --levels 1-4 --iterations 1`.
- Baseline lock check before rerun: `npm run ci:gates:log` remains passing in `artifacts/superbart_gate_runs.jsonl`.
- Scope outcome: 4/4 targeted cases executed; 3 blockers remain.

| run_id | scenario | level | result | notes | evidence_screenshot | evidence_state | rollback_required |
|---|---|---|---|---|---|---|
| 2026-02-13T19:55:15.737Z_78462 | jump-cut | 1-3 | FAIL | `playfeel_jump_cut_missing` — no jump-cut transition observed | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_3/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_1_3/state-0.json | true |
| 2026-02-13T19:55:24.246Z_78602 | run-skid | 1-6 | FAIL | `playfeel_skid_not_detected` — no skid state observed | artifacts/playfeel/phase2/screenshots/run-skid/lvl_1_6/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_1_6/state-0.json | true |
| 2026-02-13T19:55:24.246Z_78602 | run-skid | 2-2 | FAIL | `playfeel_skid_not_detected` — no skid state observed | artifacts/playfeel/phase2/screenshots/run-skid/lvl_2_2/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_2_2/state-0.json | true |
| 2026-02-13T19:55:43.234Z_78852 | telegraph | 1-4 | PASS | `telegraph_visible=true` | artifacts/playfeel/phase2/screenshots/telegraph/lvl_1_4/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_1_4/state-0.json | false |

- Open blockers unchanged from baseline: runtime phase-2 probes still miss jump-cut and skid signals in focused levels; plus the earlier `5-1` bootstrap transition uncertainty.
