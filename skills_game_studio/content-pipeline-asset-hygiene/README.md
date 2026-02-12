# content-pipeline-asset-hygiene

Defines asset intake rules and enforces them via validation scripts.

## Produced Files
- `docs/pipeline_import_rules.md`
- `docs/asset_rules.md`
- `tools/asset_validate.py`
- `assets/placeholders/`

## Validate
```bash
python skills_game_studio/content-pipeline-asset-hygiene/scripts/check_content_pipeline_asset_hygiene.py
```

## Example Prompt
"Use `$content-pipeline-asset-hygiene` to define import validation for textures/audio and add a lint script."
