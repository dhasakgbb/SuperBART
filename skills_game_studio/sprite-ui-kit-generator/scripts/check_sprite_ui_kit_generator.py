#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": [
        "skills_game_studio/sprite-ui-kit-generator/resources",
        "skills_game_studio/sprite-ui-kit-generator/scripts",
        "skills_game_studio/sprite-ui-kit-generator/evals",
    ],
    "required_files": [
        "tools/make_ui_assets.ts",
        "tools/make_bart_sprites.ts",
        "tools/asset_validate.ts",
        "skills_game_studio/sprite-ui-kit-generator/SKILL.md",
        "skills_game_studio/sprite-ui-kit-generator/README.md",
        "skills_game_studio/sprite-ui-kit-generator/evals/eval_001.md",
    ],
    "contains": [
        {
            "file": "tools/asset_validate.ts",
            "needles": ["public/assets/sprites/coin.png", "Asset validation failed"],
        },
        {
            "file": "package.json",
            "needles": ["gen:assets", "gen:avatars", "gen:all", "lint:assets"],
        },
        {
            "file": "tools/make_ui_assets.ts",
            "needles": ["tileset.png", "question_block.png", "bitmap_font.fnt"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by sprite-ui-kit-generator.",
        )
    )
