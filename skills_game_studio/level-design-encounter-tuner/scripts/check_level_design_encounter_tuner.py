#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": ["docs/level_specs"],
    "required_files": ["docs/encounter_pacing_template.md"],
    "contains": [
        {
            "file": "docs/encounter_pacing_template.md",
            "needles": ["Beat Timeline", "Downtime", "Intensity"],
        }
    ],
    "required_globs": [
        {"pattern": "docs/level_specs/*.md", "min": 1},
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by level-design-encounter-tuner.",
        )
    )
