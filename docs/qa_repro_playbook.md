# QA Repro Playbook

## Goal
Provide deterministic, handoff-friendly reproduction steps for gameplay and progression defects.

## Environment Capture
- Branch/commit hash.
- Node/npm versions.
- Browser name + version.
- Screen resolution and zoom.
- Save schema version and active campaign level.

## Repro Steps
1. Start from clean local state or attach explicit save precondition.
2. Use `npm run gen:all` before launching to avoid stale assets.
3. Run `npm run dev` and note selected world/level.
4. If generator-related, capture `world`, `level`, `seed`, and output from `npm run level:preview`.
5. Execute exact input sequence with timing notes (keys + hold durations).
6. Capture runtime snapshots via `window.render_game_to_text()` and `window.capture_perf_snapshot()`.

## Evidence Checklist
- Expected vs observed behavior.
- Screenshot/video (optional) plus textual state dump.
- Deterministic reproduction confidence (always/intermittent/rare).
- Any dependencies on audio settings, pause flow, or resume timing.

## Exit Criteria
- A repro case is accepted only when another engineer can follow it and hit the same outcome.
- Bug fix PR should link the repro case and corresponding test coverage.
- If deterministic repro is impossible, document why and include best-effort narrowing data.
