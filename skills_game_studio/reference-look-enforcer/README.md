# reference-look-enforcer

Creates and enforces a style contract from `public/assets/target_look.png`.

## Usage Examples

```text
Use $reference-look-enforcer to lock HUD coordinates, palette ramps, and bloom settings to our target screenshot.
```

```text
Use $reference-look-enforcer and fail CI when HUD offsets drift outside approved ranges.
```

## Validate Skill Artifacts

```bash
python skills_game_studio/reference-look-enforcer/scripts/check_reference_look_enforcer.py
```
