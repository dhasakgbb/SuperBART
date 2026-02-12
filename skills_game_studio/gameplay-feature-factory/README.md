# gameplay-feature-factory

Implements a ticketed gameplay feature and validates that code + tests + verification evidence are present.

## Required Inputs
- Ticket: `tickets/<feature_id>.md`

## Produced Files
- `build/feature_manifests/<feature_id>.json`
- `docs/verification/<feature_id>.md`
- Feature code and tests referenced by the manifest.

## Validate
```bash
python skills_game_studio/gameplay-feature-factory/scripts/check_gameplay_feature_factory.py --feature-id your_feature_id
```

## Example Prompt
"Use `$gameplay-feature-factory` to implement `tickets/wall_jump.md` and produce verification artifacts."
