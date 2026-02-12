#!/usr/bin/env python3
"""Shared checker utility for studio skills (stdlib only)."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any


def _check_spec(root: Path, spec: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    for rel in spec.get("required_dirs", []):
        if not (root / rel).is_dir():
            errors.append(f"Missing directory: {rel}")

    for rel in spec.get("required_files", []):
        if not (root / rel).is_file():
            errors.append(f"Missing file: {rel}")

    for contains in spec.get("contains", []):
        rel = contains["file"]
        path = root / rel
        if not path.is_file():
            errors.append(f"Missing file for content check: {rel}")
            continue
        text = path.read_text(encoding="utf-8")
        for needle in contains.get("needles", []):
            if needle not in text:
                errors.append(f"'{needle}' not found in {rel}")

    for rule in spec.get("required_globs", []):
        pattern = rule["pattern"]
        minimum = int(rule.get("min", 1))
        matches = list(root.glob(pattern))
        if len(matches) < minimum:
            errors.append(
                f"Glob '{pattern}' matched {len(matches)} item(s), expected at least {minimum}"
            )

    return errors


def run_spec(spec: dict[str, Any], default_root: Path, description: str) -> int:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--root",
        type=Path,
        default=default_root,
        help="Repository root to validate (defaults to current repo root).",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    errors = _check_spec(root, spec)
    if errors:
        print("FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PASS")
    return 0
