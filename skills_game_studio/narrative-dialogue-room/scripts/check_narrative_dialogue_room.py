#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": ["docs/voice_guides"],
    "required_files": [
        "docs/lore_bible.md",
        "docs/localization_constraints.md",
    ],
    "contains": [
        {
            "file": "docs/lore_bible.md",
            "needles": ["## Canon", "## Factions", "## Timeline"],
        },
        {
            "file": "docs/localization_constraints.md",
            "needles": ["## Length Limits", "## Placeholders", "## Forbidden Patterns"],
        },
    ],
    "required_globs": [
        {"pattern": "docs/voice_guides/*.md", "min": 1},
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by narrative-dialogue-room.",
        )
    )
