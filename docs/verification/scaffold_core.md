# Feature Verification: scaffold_core

## Description
Maps initial runtime scaffold criteria to implementation artifacts and boot/build evidence.


## Ticket
- Path: `tickets/scaffold_core.md`

## Acceptance Criteria Mapping
1. `npm run dev` starts a Phaser canvas.
   - Implementation evidence: `src/main.js`, `src/scenes/BootScene.js`, `src/scenes/PlayScene.js`
   - Test evidence: `tests/boot_level_load.test.js`
2. `npm run build` succeeds.
   - Implementation evidence: `package.json`, `vite.config.js`
   - Test evidence: build command in release matrix.
3. Layer boundaries are established.
   - Implementation evidence: `docs/architecture.md`, `docs/dependency_rules.md`, `tools/check_dependency_rules.py`
   - Test evidence: dependency checker in validate pipeline.

## Risks
- Phaser runtime errors could block boot if assets missing.

## Follow-ups
- Extend smoke tests to include automated browser scene traversal.
