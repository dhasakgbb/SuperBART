#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": ["assets/placeholders"],
    "required_files": [
        "docs/pipeline_import_rules.md",
        "docs/asset_rules.md",
        "tools/asset_validate.py",
    ],
    "contains": [
        {
            "file": "docs/pipeline_import_rules.md",
            "needles": ["## Accepted Formats", "## Rejection Rules"],
        },
        {
            "file": "tools/asset_validate.py",
            "needles": ["def main", "if __name__ == \"__main__\":"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by content-pipeline-asset-hygiene.",
        )
    )
