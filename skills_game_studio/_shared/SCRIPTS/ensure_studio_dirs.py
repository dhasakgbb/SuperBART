#!/usr/bin/env python3
"""Create standard studio output directories if they are missing."""
from pathlib import Path

REQUIRED = ["docs", "tickets", "tools", "tests", "telemetry", "build", "assets"]


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    created = []
    for folder in REQUIRED:
        path = repo_root / folder
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            created.append(folder)
    if created:
        print("Created:", ", ".join(created))
    else:
        print("All standard studio directories already exist.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
