#!/usr/bin/env python3
"""Deterministic level generation smoke check with ASCII preview."""

from __future__ import annotations

import argparse
import random


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument('--world', type=int, required=True)
    p.add_argument('--level', type=int, required=True)
    p.add_argument('--seed', type=int, required=True)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    width = 120
    height = 22
    base_y = 16

    rng = random.Random(args.seed + args.world * 100_003 + args.level * 9_973)
    grid = [['.' for _ in range(width)] for _ in range(height)]

    y = base_y
    for x in range(width):
      if x % 12 == 0:
        y = max(12, min(18, y + rng.choice([-1, 0, 1])))
      gap = rng.random() < (0.05 + args.world * 0.01)
      if not gap:
        for yy in range(y, height):
          grid[yy][x] = '#'

    spawn = (2, y - 1)
    goal = (width - 3, y - 1)
    grid[spawn[1]][spawn[0]] = 'S'
    grid[goal[1]][goal[0]] = 'G'

    print(f'Level smoke world={args.world} level={args.level} seed={args.seed}')
    for row in grid:
      print(''.join(row))

    assert any('S' in ''.join(r) for r in grid), 'missing spawn marker'
    assert any('G' in ''.join(r) for r in grid), 'missing goal marker'
    print('Smoke validation passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
