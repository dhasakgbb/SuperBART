# Eval Case: Release Process Baseline

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `build/versioning.md`
- `tools/build_release.py`
- `docs/ci_release_notes.md`

## Pass Checklist
- Versioning policy includes tagging and rollback.
- Build script supports dry-run.
- CI notes describe entrypoint and failure handling.
- Check script passes.

## Manual Trigger
1. Run the skill with fixture prompt.
2. Execute `python tools/build_release.py --dry-run`.
3. Run skill check script.
4. Verify metadata output includes version + commit + timestamp.
