#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_files": [
        "build/versioning.md",
        "tools/build_release.py",
        "docs/ci_release_notes.md",
    ],
    "contains": [
        {
            "file": "build/versioning.md",
            "needles": ["## Versioning Policy", "## Rollback"],
        },
        {
            "file": "tools/build_release.py",
            "needles": ["--dry-run", "def main"],
        },
        {
            "file": "docs/ci_release_notes.md",
            "needles": ["## Pipeline Entry", "## Failure Handling"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by build-release-automator.",
        )
    )
