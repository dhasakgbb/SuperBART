# Test Plan

## Automated (Vitest)
- Boot/config sanity and manifest checks.
- Level generator validity across world/seed matrix.
- Player feel timing checks: jump buffer and variable jump.
- Save schema migration and campaign progression checks.

## Tooling Checks
- `tools/asset_validate.py`
- `tools/mechanics_validate.py`
- `tools/levelgen_smoke.py`
- `tools/validate_repo.py`

## Runtime Smoke
- Title -> World Map -> Play level.
- Check coin collection, enemy collisions, checkpoint activation, and goal transition.
- Verify runtime debug hooks return coherent state.
