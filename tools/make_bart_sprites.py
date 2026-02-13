#!/usr/bin/env python3
"""Generate pixelated Bart avatar sprites from public/assets/target_look.png."""

from __future__ import annotations

from pathlib import Path
import sys

try:
    from PIL import Image, ImageChops, ImageFilter
except Exception:  # pragma: no cover
    print('ERROR: Pillow is required. Run: python3 -m pip install -r tools/requirements.txt')
    raise SystemExit(1)

MARGIN_RATIO = 0.08
COLORS = 24
OUTLINE_RGBA = (18, 18, 18, 255)

OUTPUTS = {
    'bart_head_32.png': (32, 8),
    'bart_head_48.png': (48, 12),
    'bart_head_64.png': (64, 16),
    'bart_portrait_96.png': (96, 32),
}


def center_crop_with_margin(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    side = max(1, int(round(side * (1.0 - MARGIN_RATIO))))
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def pixelate(image: Image.Image, target: int, working: int) -> Image.Image:
    small = image.resize((working, working), Image.Resampling.BOX)
    quant = small.convert('RGB').quantize(
        colors=COLORS,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.FLOYDSTEINBERG,
    ).convert('RGBA')
    return quant.resize((target, target), Image.Resampling.NEAREST)


def add_outline(image: Image.Image) -> Image.Image:
    rgba = image.convert('RGBA')
    alpha = rgba.split()[3]
    expanded = alpha.filter(ImageFilter.MaxFilter(3))
    outline_mask = ImageChops.subtract(expanded, alpha)
    out = rgba.copy()
    out.paste(OUTLINE_RGBA, (0, 0), outline_mask)
    return out


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    source_path = repo_root / 'public' / 'assets' / 'target_look.png'
    sprites_dir = repo_root / 'public' / 'assets' / 'sprites'

    if not source_path.exists():
        print(f'ERROR: missing source portrait: {source_path}')
        return 1

    sprites_dir.mkdir(parents=True, exist_ok=True)

    source = Image.open(source_path).convert('RGBA')
    cropped = center_crop_with_margin(source)

    for filename, (target_size, work_size) in OUTPUTS.items():
        img = pixelate(cropped, target_size, work_size)
        img = add_outline(img)
        out_path = sprites_dir / filename
        img.save(out_path, format='PNG', optimize=True)
        print(f'Wrote {out_path.relative_to(repo_root)} ({target_size}x{target_size})')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
