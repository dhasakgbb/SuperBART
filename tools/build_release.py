#!/usr/bin/env python3
"""Generate deterministic build metadata for Super BART."""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def get_git_commit(repo_root: Path) -> str:
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=repo_root,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except Exception:
        return 'unknown'


def main() -> int:
    parser = argparse.ArgumentParser(description='Generate build metadata for release automation.')
    parser.add_argument('--version', default='0.1.0', help='Version string for this build.')
    parser.add_argument('--profile', default='release', choices=['dev', 'release'])
    parser.add_argument('--output', default='build/build_metadata.json')
    parser.add_argument('--dry-run', action='store_true', help='Print metadata without writing file.')
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    payload = {
        'version': args.version,
        'profile': args.profile,
        'commit': get_git_commit(repo_root),
        'timestamp_utc': datetime.now(timezone.utc).isoformat(),
    }

    if args.dry_run:
        print(json.dumps(payload, indent=2))
        return 0

    out_path = repo_root / args.output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(f'Wrote {out_path.relative_to(repo_root)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
