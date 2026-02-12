#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_files": [
        "docs/threat_model.md",
        "docs/security_baselines.md",
        "tools/security_checklist.py",
    ],
    "contains": [
        {
            "file": "docs/threat_model.md",
            "needles": ["## Trust Boundaries", "## Abuse Paths", "## Mitigations"],
        },
        {
            "file": "docs/security_baselines.md",
            "needles": ["## Authentication", "## Rate Limiting", "## Moderation"],
        },
        {
            "file": "tools/security_checklist.py",
            "needles": ["REQUIRED_CONTROLS", "def main"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by security-online-safety.",
        )
    )
