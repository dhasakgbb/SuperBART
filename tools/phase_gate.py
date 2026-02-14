#!/usr/bin/env python3
"""tools/phase_gate.py - Validates prerequisites before phase execution."""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

GATES = {
    0: [],
    1: ["CLAUDE.md", "docs/GDD.md"],
    2: [],
    3: ["src/ui/popupText.ts"],
    4: ["docs/enemy_matrix.md"],
    5: ["src/types/worldModifiers.ts"],
    6: ["src/player/fireProjectile.ts"],
    7: [],
    8: [],
    9: [
        "src/ui/popupText.ts",
        "src/types/worldModifiers.ts",
        "src/player/fireProjectile.ts",
    ],
    10: [],
    11: [],
}


def main():
    p = argparse.ArgumentParser(description="Phase gate checker")
    p.add_argument("--phase", type=int, required=True)
    args = p.parse_args()

    errors = []
    for f in GATES.get(args.phase, []):
        if not (ROOT / f).exists():
            errors.append(f"Missing: {f}")

    # Verify previous phase status file exists (except Phase 0)
    if args.phase > 0:
        prev = ROOT / "docs" / "phase_status" / f"{args.phase - 1}.md"
        if not prev.exists():
            errors.append(f"Phase {args.phase - 1} not marked complete")

    # Verify build passes
    r = subprocess.run(
        ["npm", "run", "build"],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )
    if r.returncode != 0:
        errors.append("npm run build fails - fix before proceeding")

    if errors:
        print(f"PHASE {args.phase} GATE: BLOCKED")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"PHASE {args.phase} GATE: CLEAR")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
