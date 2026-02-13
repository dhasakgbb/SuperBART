# QA Repro Playbook

## Goal
Provide deterministic, handoff-friendly repro and evidence steps for campaign playfeel verification.

## Execution environment (required)
- `cd /Users/damian/GitHub/NES/SuperBART`
- Node/npm in a clean toolchain state
- Browser automation target: `http://127.0.0.1:4173`
- Start fresh save each run with a bootstrap helper (runner handles this via `--scenario` payload).
- Ensure input mapping supports run/skid testing by using the local Playwright client:
  - `scripts/playfeel_web_game_client.js`
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
  "super_bart_save_v3.schemaVersion": 3,
  "super_bart_save_v3.campaign.world": 1,
  "super_bart_save_v3.campaign.levelIndex": 1,
  "super_bart_save_v3.totalLevels": 25,
  "super_bart_save_v3.worldLayout": [6, 6, 6, 6, 1],
  "super_bart_save_v3.campaign.unlockedLevelKeys": [
    "1-1", "1-2", "1-3", "1-4", "1-5", "1-6",
    "2-1", "2-2", "2-3", "2-4", "2-5", "2-6",
    "3-1", "3-2", "3-3", "3-4", "3-5", "3-6",
    "4-1", "4-2", "4-3", "4-4", "4-5", "4-6",
    "5-1"
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
```

Optional subset by level set:
```bash
npm run playfeel:phase2 -- --scenario jump-cut --levels 1-1,1-2,1-3 --headless 1
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
- `Level` (world-level form `1-1`..`5-1`)
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

> Repeat the matrix for `run-skid`, `stomp`, and `telegraph` with identical level keys and scenario tag.

## Exit criteria
- Update this playbook with `Pass?` and notes for every level in each scenario.
- Any hard blocker should set `Pass? = FAIL` and `Rollback required = true` in findings.
- Merge is blocked until blockers are cleared or intentionally deferred with explicit scope.

### Known blocker (latest run)
- Across all scenarios, level `5-1` fails with:
  `phase2_bootstrap_play_timeout` (`failed transition to play scene`).
- This indicates a deterministic level-bootstrap/navigation failure on final world-5 entry, not a per-scenario behavior issue.
- Keep `rollback_required=true` for that finding until resolved and then re-run:
  - `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels 5-1`
  - `npm run playfeel:phase2 -- --scenario run-skid --headless 1 --levels 5-1`
  - `npm run playfeel:phase2 -- --scenario stomp --headless 1 --levels 5-1`
  - `npm run playfeel:phase2 -- --scenario telegraph --headless 1 --levels 5-1`

### Latest phase-2 evidence bundle

- `npm run playfeel:phase2 -- --scenario jump-cut --headless 1 --levels all`  
  run_id `2026-02-13T18:25:49.129Z_3613` → 24/25 PASS (`5-1` timeout)
- `npm run playfeel:phase2 -- --scenario run-skid --headless 1 --levels all`  
  run_id `2026-02-13T18:28:57.561Z_3998` → 24/25 PASS (`5-1` timeout)
- `npm run playfeel:phase2 -- --scenario stomp --headless 1 --levels all`  
  run_id `2026-02-13T18:32:00.898Z_5243` → 24/25 PASS (`5-1` timeout)
- `npm run playfeel:phase2 -- --scenario telegraph --headless 1 --levels all`  
  run_id `2026-02-13T18:35:02.694Z_7631` → 24/25 PASS (`5-1` timeout)
