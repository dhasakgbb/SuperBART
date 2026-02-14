#!/usr/bin/env python3
"""Run deterministic repository validation checks for Super BART V2."""

from __future__ import annotations

from pathlib import Path
import subprocess


def run(cmd: list[str], cwd: Path) -> None:
    print('$', ' '.join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    checks = [
        ['npm', 'run', 'gen:all'],
        ['npm', 'run', 'lint:assets'],
        ['npm', 'run', 'lint:content'],
        ['npm', 'run', 'lint:style'],
        ['npm', 'run', 'lint:audio'],
        ['npm', 'run', 'lint:visual'],
        ['npm', 'run', 'test'],
    ]

    for c in checks:
        run(c, repo)

    print('All repository validations passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
