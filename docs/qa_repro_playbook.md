# QA Repro Playbook

## Goal
Provide deterministic, handoff-friendly repro and evidence steps for campaign playfeel verification.

## Execution environment (required)
- `cd <path-to-SuperBART>`
- Node/npm in a clean toolchain state
- Browser automation target: `http://127.0.0.1:4173`
- Start fresh save each run with a bootstrap helper (runner handles this via `--scenario` payload).
- Ensure input mapping supports run/skid testing by using the local Playwright client:
  - `~/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`
  - This client exposes `ShiftLeft` for run/reversal checks.
- Keep gameplay audio at defaults unless intentionally testing mix sensitivity.

## Phase-2 Playfeel Protocol

### 1) Baseline lock
```bash
npm run ci:gates
npm run ci:gates:log
```
- Confirm pass for all 7 gates before Phase-2 execution.  
  If `ci:gates:log` stops early, keep that blocker in the phase-2 status log before continuing scenario-level captures.
- Capture `run_id` from the latest `artifacts/superbart_gate_runs.jsonl` entry.

Precondition bootstrap payload (single use before phase-2 pass):
```json
{
  "super_bart_save_v5.schemaVersion": 5,
  "super_bart_save_v5.campaign.world": 1,
  "super_bart_save_v5.campaign.stage": 1,
  "super_bart_save_v5.campaign.levelIndex": 1,
  "super_bart_save_v5.campaign.totalLevels": 28,
  "super_bart_save_v5.campaign.worldLayout": [4, 4, 4, 4, 4, 4, 4],
  "super_bart_save_v5.campaign.unlockedLevelKeys": [
    "1-1", "1-2", "1-3", "1-4", "1-5", "1-6",
    "2-1", "2-2", "2-3", "2-4", "2-5", "2-6",
    "3-1", "3-2", "3-3", "3-4", "3-5", "3-6",
    "4-1", "4-2", "4-3", "4-4",
    "5-1", "5-2", "5-3", "5-4",
    "6-1", "6-2", "6-3", "6-4",
    "7-1", "7-2", "7-3", "7-4"
  ]
}
```

### 2) Start service
```bash
npm run dev -- --host 127.0.0.1 --port 4173
```
- Keep this session open while the audit run executes.

### 3) Replay run (playfeel scenarios)
Use one command per scenario:

```bash
npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario run-skid --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario stomp --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario telegraph --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario jump-cut --levels all --headless 1 --iterations 1
```

### 3b) Spot-check example (quick validation)

```bash
npm run dev -- --host 127.0.0.1 --port 4173
npm run playfeel:phase2 -- --scenario jump-cut --levels 1-1 --headless 1 --iterations 1
```

- Pass criteria for this spot-check: status `PASS` in the latest run record and `evidence_screenshot`/`evidence_state` files written under `artifacts/playfeel/phase2`.
- Latest known spot-check pass: `2026-02-13T19:18:04.300Z_43198` (`jump-cut`, `1-1`).
- Latest locked run-gate baseline: `2026-02-13T19:53:47.690Z_76314` from `npm run ci:gates:log`.

Optional subset by level set:
```bash
npm run playfeel:phase2 -- --scenario jump-cut --levels 1-1,1-2,1-3 --headless 1
```

Deterministic single-level focus (for the world-map transition blocker):
```bash
npm run playfeel:phase2 -- --scenario jump-cut --levels 7-4 --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario run-skid --levels 7-4 --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario stomp --levels 7-4 --headless 1 --iterations 1
npm run playfeel:phase2 -- --scenario telegraph --levels 7-4 --headless 1 --iterations 1
```

Optional headful pass for visual review:
```bash
npm run playfeel:phase2 -- --scenario run-skid --headless 0 --levels all
```

### 4) Artifact paths
- Screenshots: `artifacts/playfeel/phase2/screenshots/<scenario>/lvl_<world>_<level>/`
- States: `artifacts/playfeel/phase2/states/<scenario>/lvl_<world>_<level>/`
- Findings: `artifacts/playfeel/phase2/reports/phase2_findings.jsonl`

### 5) Action payloads
- `artifacts/playfeel/phase2/actions/jump_cut.json` → jump-cut edge handling
- `artifacts/playfeel/phase2/actions/run_skid.json` → rapid acceleration + reversal
- `artifacts/playfeel/phase2/actions/stomp_cadence.json` → stomp cadence & lock window
- `artifacts/playfeel/phase2/actions/hazard_telegraph.json` → telegraph timing checks

### 6) Expected outputs per scenario
- `jump-cut`: one-shot jump cut behavior is visible in movement timing and landing arcs; no repeated per-frame dampening on held release.
- `run-skid`: directional reversal at high speed shows skid/transition cue before input direction flips.
- `stomp`: captures should show repeated stomp cadence and short pause cue on impact.
- `telegraph`: first lethal hazard contact should show visual warning state at least one frame before unavoidable contact.

Add a scenario-level pass summary immediately after each run and keep it aligned to blocker behavior from `artifacts/playfeel/phase2/reports/phase2_findings.jsonl`.

## Per-level evidence matrix (template)

Use this schema for each scenario-level row:
- `Level` (world-level form `1-1`..`7-4`)
- `Scenario` (`jump-cut`, `run-skid`, `stomp`, `telegraph`)
- `Observed` (short notes)
- `Pass?` (`PASS`, `FAIL`, `PENDING`)
- `Screenshot refs` (artifact path(s))
- `State refs` (artifact path(s))
- `Next action` (continue / rerun / patch / block)

| Level | Scenario | Observed | Pass? | Screenshot refs | State refs | Next action |
|---|---|---|---|---|---|---|
| 1-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_1/ | Run |
| 1-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_2/ | Run |
| 1-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_3/ | Run |
| 1-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_4/ | Run |
| 1-5 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_5/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_5/ | Run |
| 1-6 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_6/ | artifacts/playfeel/phase2/states/jump-cut/lvl_1_6/ | Run |
| 2-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_1/ | Run |
| 2-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_2/ | Run |
| 2-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_3/ | Run |
| 2-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_4/ | Run |
| 2-5 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_5/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_5/ | Run |
| 2-6 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_2_6/ | artifacts/playfeel/phase2/states/jump-cut/lvl_2_6/ | Run |
| 3-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_1/ | Run |
| 3-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_2/ | Run |
| 3-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_3/ | Run |
| 3-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_4/ | Run |
| 3-5 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_5/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_5/ | Run |
| 3-6 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_3_6/ | artifacts/playfeel/phase2/states/jump-cut/lvl_3_6/ | Run |
| 4-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_1/ | Run |
| 4-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_2/ | Run |
| 4-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_3/ | Run |
| 4-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_4/ | Run |
| 4-5 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_5/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_5/ | Run |
| 4-6 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_4_6/ | artifacts/playfeel/phase2/states/jump-cut/lvl_4_6/ | Run |
| 5-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_5_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_5_1/ | Run |
| 5-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_5_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_5_2/ | Run |
| 5-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_5_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_5_3/ | Run |
| 5-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_5_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_5_4/ | Run |
| 6-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_6_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_6_1/ | Run |
| 6-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_6_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_6_2/ | Run |
| 6-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_6_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_6_3/ | Run |
| 6-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_6_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_6_4/ | Run |
| 7-1 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_7_1/ | artifacts/playfeel/phase2/states/jump-cut/lvl_7_1/ | Run |
| 7-2 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_7_2/ | artifacts/playfeel/phase2/states/jump-cut/lvl_7_2/ | Run |
| 7-3 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_7_3/ | artifacts/playfeel/phase2/states/jump-cut/lvl_7_3/ | Run |
| 7-4 | jump-cut | pending | NOT_STARTED | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_7_4/ | artifacts/playfeel/phase2/states/jump-cut/lvl_7_4/ | Run |

> Repeat the matrix for `run-skid`, `stomp`, and `telegraph` with identical level keys and scenario tag.

## Exit criteria
- Update this playbook with `Pass?` and notes for every level in each scenario.
- Any hard blocker should set `Pass? = FAIL` and `Rollback required = true` in findings.
- Merge is blocked until blockers are cleared or intentionally deferred with explicit scope.

### Known blocker (latest run)
- Across all scenarios, latest sweeps are blocked by harness execution noise:
  - `phase2_bootstrap_title_timeout`
  - `phase2_execution_error`
  - occasional `playfeel_console_error`
- This indicates a session stability issue in long-horizon phase-2 sweeps (title/play transitions and context loss), not yet a confirmed gameplay-layer blocker.
- Re-run `7-4` and long-sweep commands only after harness stability is restored.

### Latest phase-2 evidence bundle

- `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels all`  
  run_id `2026-02-13T18:25:49.129Z_3613` → 24/28 PASS (timeout at `7-4`)
- `npm run playfeel:phase2 -- --scenario run-skid --headless 1 --levels all`  
  run_id `2026-02-13T18:28:57.561Z_3998` → 24/28 PASS (timeout at `7-4`)
- `npm run playfeel:phase2 -- --scenario stomp --headless 1 --levels all`  
  run_id `2026-02-13T18:32:00.898Z_5243` → 24/28 PASS (timeout at `7-4`)
- `npm run playfeel:phase2 -- --scenario telegraph --headless 1 --levels all`  
  run_id `2026-02-13T18:35:02.694Z_7631` → 24/28 PASS (timeout at `7-4`)
- `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels all`  
  run_id `2026-02-13T21:00:21.751Z_96151` → 0/28 FAIL (`phase2_execution_error` / bootstrap instability)
- `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels 1-3 --iterations 1`  
  run_id `2026-02-13T20:59:55.087Z_94818` → `1-3` FAIL (`playfeel_jump_cut_missing`)

### Focused rerun evidence (phase-2 phase-spot checks)

- `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels 1-3 --iterations 1`
  - run_id `2026-02-13T19:55:15.737Z_78462` (`1-3`) FAIL, blocker `playfeel_jump_cut_missing`
- `npm run playfeel:phase2 -- --scenario run-skid --headless 1 --levels 1-6,2-2 --iterations 1`
  - run_id `2026-02-13T19:55:24.246Z_78602` (`1-6`, `2-2`) FAIL, blocker `playfeel_skid_not_detected`
- `npm run playfeel:phase2 -- --scenario telegraph --headless 1 --levels 1-4 --iterations 1`
  - run_id `2026-02-13T19:55:43.234Z_78852` (`1-4`) PASS, telegraph observed.

| Level | Scenario | Observed | Pass? | Screenshot refs | State refs | Next action |
|---|---|---|---|---|---|---|
| 1-3 | jump-cut | no jump-cut transition observed | FAIL | artifacts/playfeel/phase2/screenshots/jump-cut/lvl_1_3/shot-0.png | artifacts/playfeel/phase2/states/jump-cut/lvl_1_3/state-0.json | rerun after action tuning |
| 1-6 | run-skid | skid state not detected | FAIL | artifacts/playfeel/phase2/screenshots/run-skid/lvl_1_6/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_1_6/state-0.json | verify animation state key in telemetry |
| 2-2 | run-skid | skid state not detected | FAIL | artifacts/playfeel/phase2/screenshots/run-skid/lvl_2_2/shot-0.png | artifacts/playfeel/phase2/states/run-skid/lvl_2_2/state-0.json | verify animation state key in telemetry |
| 1-4 | telegraph | telegraph cue observed | PASS | artifacts/playfeel/phase2/screenshots/telegraph/lvl_1_4/shot-0.png | artifacts/playfeel/phase2/states/telegraph/lvl_1_4/state-0.json | continue |
