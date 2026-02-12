#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate artifacts produced by gameplay-feature-factory."
    )
    parser.add_argument("--feature-id", required=True, help="Feature identifier.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[3],
        help="Repository root.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    feature_id = args.feature_id

    ticket = root / "tickets" / f"{feature_id}.md"
    manifest = root / "build" / "feature_manifests" / f"{feature_id}.json"
    verification = root / "docs" / "verification" / f"{feature_id}.md"

    errors: list[str] = []

    if not ticket.is_file():
        errors.append(f"Missing ticket: {ticket.relative_to(root)}")
    if not manifest.is_file():
        errors.append(f"Missing manifest: {manifest.relative_to(root)}")
    if not verification.is_file():
        errors.append(f"Missing verification note: {verification.relative_to(root)}")

    if manifest.is_file():
        try:
            payload = json.loads(manifest.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid manifest JSON: {exc}")
            payload = {}

        code_paths = payload.get("code_paths", [])
        test_paths = payload.get("test_paths", [])

        if not code_paths:
            errors.append("Manifest must contain at least one code path.")
        if not test_paths:
            errors.append("Manifest must contain at least one test path.")

        for rel in code_paths + test_paths:
            path = root / rel
            if not path.is_file():
                errors.append(f"Manifest path does not exist: {rel}")

    if verification.is_file():
        text = verification.read_text(encoding="utf-8")
        if "Acceptance Criteria Mapping" not in text:
            errors.append("Verification note must include 'Acceptance Criteria Mapping'.")

    if errors:
        print("FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
