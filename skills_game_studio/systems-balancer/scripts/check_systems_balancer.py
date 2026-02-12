#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_files": [
        "docs/balance_model.md",
        "tools/balance_sim.py",
        "tests/test_balance_sanity.py",
    ],
    "contains": [
        {
            "file": "docs/balance_model.md",
            "needles": ["## Variables", "## Equations", "## Validation Plan"],
        },
        {
            "file": "tools/balance_sim.py",
            "needles": ["def run_simulation", "if __name__ == \"__main__\":"],
        },
        {
            "file": "tests/test_balance_sanity.py",
            "needles": ["def test_", "assert"],
        },
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by systems-balancer.",
        )
    )
