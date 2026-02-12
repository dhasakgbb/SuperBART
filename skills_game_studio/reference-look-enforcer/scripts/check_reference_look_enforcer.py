#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": [
        "skills_game_studio/reference-look-enforcer/resources",
        "skills_game_studio/reference-look-enforcer/scripts",
        "skills_game_studio/reference-look-enforcer/evals",
    ],
    "required_files": [
        "docs/style_kit.md",
        "src/style/styleConfig.ts",
        "tools/style_validate.ts",
        "skills_game_studio/reference-look-enforcer/SKILL.md",
        "skills_game_studio/reference-look-enforcer/README.md",
        "skills_game_studio/reference-look-enforcer/evals/eval_001.md",
    ],
    "contains": [
        {
            "file": "docs/style_kit.md",
            "needles": ["## Palette", "## HUD Layout Spec", "## Do / Don't"],
        },
        {
            "file": "tools/style_validate.ts",
            "needles": ["validateHudLayout", "validatePalette", "validateBloom"],
        },
        {
            "file": "package.json",
            "needles": ["lint:style", "npm run lint:style"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by reference-look-enforcer.",
        )
    )
