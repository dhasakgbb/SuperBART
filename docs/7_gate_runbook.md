# SuperBART 7-Gate Runbook (Commands + File Updates)

## Scope
Use this runbook for any non-gameplay change set (commands, tooling, build config, docs, schemas, generators, automation, CI wiring, etc.) before merge/release handoff.

## Execution rules
- Run gates in order, serially, with a fresh branch checkout.
- Any `FAIL` stops the run unless explicitly overridden in `WARN` triage.
- Record each gate result with the compact artifact format in one append-only file.

## Gate 1 — Baseline + environment lock
Commands:
- `git fetch --all --prune`
- `git status --short`
- `git rev-parse HEAD`
- `node -v && npm -v && python3 --version`

Pass: working tree clean, commit resolved, toolchain prints versions.

Triage:
- If working tree is dirty, stash or checkpoint state changes and re-run from clean checkout.
- If version mismatch appears, pin to project baseline versions and rerun.

Rollback:
- Stop and recreate a clean branch from upstream, then re-run Gate 1.

## Gate 2 — Dependency + repo contract
Commands:
- `npm ci`
- `python3 -m pip install -r tools/requirements.txt`
- `npm run validate`

Pass: all commands exit `0`.

Triage:
- Missing lockfile/requirements drift: revert generated lock/venv changes and re-run install.
- Failing rule check: open a dedicated dependency-compat issue with log excerpt.

Rollback:
- Restore baseline dependency files (`package-lock.json`, tool requirements cache/state) and block merge until fixed.

## Gate 3 — Deterministic generation pass
Commands:
- `npm run gen:all`
- `git diff --name-only > /tmp/gate3_gen.diff`
- `npm run gen:all`
- `git diff --name-only --exit-code`

Pass: second generation run is clean (no additional file drift).

Triage:
- If drift exists, inspect `/tmp/gate3_gen.diff` and `/tmp/gate3_gen.diff.new`.
- Confirm whether changed assets are intended; if not, stop and fix generation inputs.

Rollback:
- If unexpected drift is present, halt promotion and revert generation changes until deterministic.

## Gate 4 — Static validation sweep
Commands:
- `npm run lint:content`
- `npm run lint:assets`
- `npm run lint:style`
- `npm run lint:audio`
- `npm run lint:visual`

Pass: all linters return `0`.

Triage:
- Collect failing file list and script output.
- For deterministic parser/validator failures, validate schema and expected formats first.

Rollback:
- Revert/patch touched files that violate contracts; no merge while Gate 4 is failing.

## Gate 5 — Deterministic test block
Commands:
- `npm run test`
- `npm run mechanics:validate`
- `npm run levelgen:smoke`

Pass: all tests/validators return `0` on first pass.

Triage:
- Re-run once to eliminate infra flake.
- On second failure, file and rank by first failing test path.

Rollback:
- Freeze merge queue entry and revert high-risk changes from current batch; keep logs in artifact.

## Gate 6 — Build artifact health
Commands:
- `npm run build`
- `ls -l dist`
- `git status --short dist`

Pass: build completes and no source-tree drift from build output checks.

Triage:
- If build fails, check transpile/type/lint leftovers and re-run gate after fix.
- If build artifacts exceed expected size/bad shape, inspect bundler warnings.

Rollback:
- Block release until build is green and artifact shape is restored.

## Gate 7 — Runtime smoke + release readiness
Commands:
- `npm run preview -- --host 127.0.0.1 --port 4173`
- `npm run level:preview`
- `npm run visual:capture`

Pass:
- `level:preview` and `visual:capture` finish cleanly with deterministic outputs for the same world/level pair.
- No runtime exceptions before script exits.

Triage:
- If smoke fails, capture command output, run with `--` script inputs unchanged, and isolate changed files.
- Treat any deterministic runtime exception as Gate 7 `FAIL`.

Rollback:
- Treat first deterministic runtime failure as release-blocking.
- Revert last risky batch, retest Gates 3–7 from Gate 5, and only re-advance once stable.

## Rollback trigger thresholds
- Gate 1–3: any `FAIL` blocks and requires remediation before progressing.
- Gate 4–5: any `FAIL` blocks merge and requires code fix in same change scope.
- Gate 6–7: any deterministic `FAIL` blocks release; rollback current batch immediately if not reproducible in 15 min.
- Two consecutive `WARN` on same gate in the same run require pausing and review.

## Artifact format for gate logging (compact JSONL)
Append one JSON object per gate to `artifacts/superbart_gate_runs.jsonl`:

```json
{"run_id":"2026-02-13T000000Z_ab12cd3","gate":1,"name":"baseline","status":"PASS","command":"git status --short","exit":0,"duration_ms":312,"changed_files":[],"notes":"clean baseline","rollback_required":false}
```

Required keys:
- `run_id`
- `gate`
- `name`
- `status` (`PASS|WARN|FAIL`)
- `command`
- `exit`
- `duration_ms`
- `changed_files` (array from `git diff --name-only`)
- `notes`
- `rollback_required` (boolean)

Minimal append command:

```bash
node -e "const fs=require('fs');const line={run_id:process.env.RUN_ID||'manual',gate:7,name:'runtime',status:'PASS',command:'npm run level:preview',exit:0,duration_ms:1234,changed_files:[],notes:'',rollback_required:false};fs.appendFileSync('artifacts/superbart_gate_runs.jsonl',JSON.stringify(line)+'\n');"
```
