#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_files": [
        "docs/GDD.md",
        "tickets/phase_0_backlog.md",
    ],
    "contains": [
        {
            "file": "docs/GDD.md",
            "needles": ["## Core Loop", "## MVP Scope", "## Risks"],
        },
        {
            "file": "tickets/phase_0_backlog.md",
            "needles": ["Acceptance Criteria", "Owner", "Estimate"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by game-design-compiler.",
        )
    )
