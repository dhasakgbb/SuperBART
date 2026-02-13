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

ASSET_MANIFEST_PATH = 'src/core/assetManifest.ts'
MANIFEST_PATH_RE = re.compile(r"['\"](/assets/[^'\"]+)['\"]")

REQUIRED_PNG_DIMENSIONS = {
    'public/assets/target_look.png': None,
    'public/assets/target_look_2.jpeg': None,
    'public/assets/sprites/bart_head_32.png': (32, 32),
    'public/assets/sprites/bart_head_48.png': (48, 48),
    'public/assets/sprites/bart_head_64.png': (64, 64),
    'public/assets/sprites/bart_portrait_96.png': (96, 96),
    'public/assets/sprites/title_logo.png': (512, 160),
    'public/assets/sprites/cloud_1.png': (24, 16),
    'public/assets/sprites/cloud_2.png': (32, 18),
    'public/assets/sprites/hill_far.png': (80, 44),
    'public/assets/sprites/hill_near.png': (88, 46),
    'public/assets/sprites/map_node_open.png': (16, 16),
    'public/assets/sprites/map_node_done.png': (16, 16),
    'public/assets/sprites/map_node_locked.png': (16, 16),
    'public/assets/sprites/map_node_selected.png': (16, 16),
    'public/assets/sprites/map_path_dot.png': (8, 8),
}

REFERENCE_IMAGE_CONSTRAINTS = {
    'public/assets/target_look.png': {'format': 'PNG', 'extensions': {'.png'}},
    'public/assets/target_look_2.jpeg': {'format': 'JPEG', 'extensions': {'.jpeg', '.jpg'}},
}


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    errors: list[str] = []

    manifest_path = repo / ASSET_MANIFEST_PATH
    if not manifest_path.exists():
        errors.append(f'missing manifest file: {ASSET_MANIFEST_PATH}')
    else:
        manifest_text = manifest_path.read_text(encoding='utf-8')
        manifest_image_paths = MANIFEST_PATH_RE.findall(manifest_text)
        for rel_path in manifest_image_paths:
            if not rel_path.lower().endswith('.svg'):
                continue
            errors.append(f'asset manifest references SVG in runtime image path: {rel_path}')

        for rel in manifest_image_paths:
            abs_path = repo / 'public' / rel.lstrip('/')
            if not abs_path.exists():
                errors.append(f'missing manifest asset: {rel}')

    for rel, expected_dim in REQUIRED_PNG_DIMENSIONS.items():
        path = repo / rel
        if not path.exists():
            errors.append(f'missing: {rel}')
            continue
        try:
            with Image.open(path) as img:
                img.load()
                if img.width <= 0 or img.height <= 0:
                    errors.append(f'invalid image dimensions for {rel}: cannot be zero-sized')
                if rel in REFERENCE_IMAGE_CONSTRAINTS:
                    constraints = REFERENCE_IMAGE_CONSTRAINTS[rel]
                    suffix = path.suffix.lower()
                    if suffix not in constraints['extensions']:
                        errors.append(
                            f'Invalid extension for {rel}: expected one of {sorted(constraints["extensions"])}; got {suffix}'
                        )
                    if img.format != constraints['format']:
                        errors.append(f'Invalid image format for {rel}: expected {constraints["format"]}, got {img.format}')
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
