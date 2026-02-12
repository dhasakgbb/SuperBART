# build-release-automator

Automates release metadata generation and documents versioning/CI rules.

## Produced Files
- `build/versioning.md`
- `tools/build_release.py`
- `docs/ci_release_notes.md`

## Validate
```bash
python skills_game_studio/build-release-automator/scripts/check_build_release_automator.py
```

## Example Prompt
"Use `$build-release-automator` to define SemVer policy and generate build metadata in CI."
