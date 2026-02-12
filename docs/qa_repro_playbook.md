# QA Repro Playbook

## Description
Provides deterministic QA reproduction workflow, evidence capture rules, and exit criteria.


## Environment Capture
- Record OS, browser, and resolution.
- Record commit hash and npm package-lock checksum.
- Record whether run used `npm run dev` or production preview.

## Repro Steps
1. Select a repro scene from `tests/repro_scenes/`.
2. Follow setup exactly before interacting with the game.
3. Execute steps without additional inputs between scripted actions.
4. Capture screenshot or short clip for outcome.

## Evidence Checklist
- Include observed HUD values (score/lives/status).
- Include any console errors.
- Include whether behavior reproduced on first attempt.

## Exit Criteria
- Mark PASS only if expected result is observed exactly.
- Mark FAIL if any divergence occurs, even once.
- File ticket with repro scene ID and attached evidence when FAIL.
