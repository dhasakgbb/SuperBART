#!/usr/bin/env python3
"""Validate required generated assets for Super BART V2."""

from __future__ import annotations

from pathlib import Path
import re

try:
    from PIL import Image
except Exception:  # pragma: no cover
    print('ERROR: Pillow is required. Run: python3 -m pip install -r tools/requirements.txt')
    raise SystemExit(1)

REQUIRED_SVG = [
    'public/assets/sprites/player_small.svg',
    'public/assets/sprites/player_big.svg',
    'public/assets/sprites/enemy_walker.svg',
    'public/assets/sprites/enemy_shell.svg',
    'public/assets/sprites/enemy_shell_retracted.svg',
    'public/assets/sprites/enemy_flying.svg',
    'public/assets/sprites/enemy_spitter.svg',
    'public/assets/sprites/projectile.svg',
    'public/assets/sprites/coin.svg',
    'public/assets/sprites/star.svg',
    'public/assets/sprites/flag.svg',
    'public/assets/sprites/checkpoint.svg',
    'public/assets/sprites/spring.svg',
    'public/assets/sprites/spike.svg',
    'public/assets/sprites/thwomp.svg',
    'public/assets/sprites/moving_platform.svg',
    'public/assets/tiles/tile_ground.svg',
    'public/assets/tiles/tile_oneway.svg',
]

REQUIRED_PNG_DIMENSIONS = {
    'public/assets/bart_source.png': None,
    'public/assets/sprites/bart_head_32.png': (32, 32),
    'public/assets/sprites/bart_head_48.png': (48, 48),
    'public/assets/sprites/bart_head_64.png': (64, 64),
    'public/assets/sprites/bart_portrait_96.png': (96, 96),
    'public/assets/sprites/title_logo.png': (512, 160),
}


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    errors: list[str] = []

    for rel in REQUIRED_SVG:
        path = repo / rel
        if not path.exists():
            errors.append(f'missing: {rel}')
            continue
        txt = path.read_text(encoding='utf-8')
        if '<svg' not in txt:
            errors.append(f'not svg: {rel}')
        if re.search(r'TODO|coming soon', txt, flags=re.IGNORECASE):
            errors.append(f'placeholder text in: {rel}')

    for rel, expected_dim in REQUIRED_PNG_DIMENSIONS.items():
        path = repo / rel
        if not path.exists():
            errors.append(f'missing: {rel}')
            continue
        try:
            with Image.open(path) as img:
                img.load()
                if expected_dim and img.size != expected_dim:
                    errors.append(f'wrong dimensions for {rel}: expected {expected_dim}, got {img.size}')
        except Exception as exc:
            errors.append(f'invalid png {rel}: {exc}')

    if errors:
        print('Asset validation failed:')
        for e in errors:
            print(f'- {e}')
        return 1

    print('Asset validation passed.')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
