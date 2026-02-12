#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": ["tests/repro_scenes"],
    "required_files": [
        "tests/repro_scenes/README.md",
        "docs/qa_repro_playbook.md",
    ],
    "contains": [
        {
            "file": "docs/qa_repro_playbook.md",
            "needles": ["## Environment Capture", "## Repro Steps", "## Exit Criteria"],
        }
    ],
    "required_globs": [
        {"pattern": "tests/repro_scenes/*.md", "min": 1},
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by qa-harness-repro-first.",
        )
    )
