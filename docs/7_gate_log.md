# SuperBART 7-Gate Log Specification

## Purpose
This document defines the canonical gate execution contract used for deterministic release readiness and post-change verification.

## Gate sequence (fail-fast)
Run all commands in strict order:

1. `npm run gen:all`
2. `npm run lint:assets`
3. `npm run lint:style`
4. `npm run lint:audio`
5. `npm run lint:visual`
6. `npm test`
7. `npm run build`

Any `FAIL` stops execution immediately unless manually invoked via a WARN override policy.

## Execution model
- `npm run ci:gates`
  - Executes the full sequence with fail-fast semantics.
- `npm run ci:gates:log`
  - Executes the same sequence and records per-gate JSONL events to `artifacts/superbart_gate_runs.jsonl`.

## Severity conventions
- `PASS` — gate succeeded.
- `WARN` — non-blocking warning (rare manual override).
- `FAIL` — gate failed; stop immediately and fix minimal scope before rerun.

## Canonical gate log schema
All logs are JSON objects (one per gate) with keys:

- `run_id` (string)
- `timestamp` (ISO 8601 UTC)
- `gate` (number, 1-7)
- `name` (string)
- `command` (string)
- `status` (`PASS|WARN|FAIL`)
- `exit_code` (number)
- `duration_ms` (number)
- `changed_files` (array of strings)
- `notes` (string)
- `rollback_required` (boolean)

### Example entry
```json
{"run_id":"2026-02-13T000000Z_ab12cd3","timestamp":"2026-02-13T00:00:00.000Z","gate":1,"name":"gen_all","command":"npm run gen:all","status":"PASS","exit_code":0,"duration_ms":1250,"changed_files":["public/assets/sprites/enemy_walker.png"],"notes":"deterministic regeneration completed","rollback_required":false}
```

## Suggested review queries
- Show all failures in latest run:

```bash
jq -c 'select(.status=="FAIL")' artifacts/superbart_gate_runs.jsonl
```

- Show last run by `run_id`:

```bash
run_id="$(tail -n1 artifacts/superbart_gate_runs.jsonl | jq -r '.run_id')"
jq -s --arg RUN "$run_id" 'map(select(.run_id==$RUN))' artifacts/superbart_gate_runs.jsonl
```

## Rollback guideline
- Any `FAIL` in gates 1-7 blocks merge.
- Fix the smallest possible scope for the failing gate.
- Re-run from the failed gate onward.
