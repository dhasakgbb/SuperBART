#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[2] / "_shared" / "SCRIPTS"
sys.path.insert(0, str(SHARED))

from artifact_check import run_spec

SPEC = {
    "required_files": [
        "telemetry/event_schema.json",
        "docs/metrics.md",
        "tools/log_validator.py",
    ],
    "contains": [
        {
            "file": "docs/metrics.md",
            "needles": ["## KPI Definitions", "Formula", "Owner"],
        },
        {
            "file": "tools/log_validator.py",
            "needles": ["def validate_event", "def main"],
        },
    ],
}


def main() -> int:
    root = Path(__file__).resolve().parents[3]
    base_result = run_spec(
        SPEC,
        default_root=root,
        description="Validate artifacts produced by telemetry-experimentation.",
    )
    if base_result != 0:
        return base_result

    schema_path = root / "telemetry" / "event_schema.json"
    try:
        payload = json.loads(schema_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"FAIL\n- Invalid JSON schema: {exc}")
        return 1

    if "schema_version" not in payload or "events" not in payload:
        print("FAIL\n- Schema must include 'schema_version' and 'events'.")
        return 1

    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
