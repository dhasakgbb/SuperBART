#!/usr/bin/env python3
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_dirs": ["tools/profile_helpers"],
    "required_files": [
        "docs/perf_budget.md",
        "docs/perf_regression_checklist.md",
    ],
    "contains": [
        {
            "file": "docs/perf_budget.md",
            "needles": ["p50", "p95", "p99"],
        },
        {
            "file": "docs/perf_regression_checklist.md",
            "needles": ["Pass Criteria", "Rollback"],
        },
    ],
    "required_globs": [
        {"pattern": "tools/profile_helpers/*", "min": 1},
    ],
}

if __name__ == "__main__":
    raise SystemExit(
        run_spec(
            SPEC,
            default_root=Path(__file__).resolve().parents[3],
            description="Validate artifacts produced by performance-sheriff.",
        )
    )
