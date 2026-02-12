#!/usr/bin/env python3
"""Generate deterministic placeholder SVG assets for Super BART V2."""

from __future__ import annotations

from pathlib import Path


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    assets = repo / "public" / "assets"

    sprites = {
        "player_small.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/><rect x='4' y='3' width='8' height='10' rx='2' fill='#ff5252'/><rect x='5' y='2' width='6' height='3' fill='#ffca28'/><rect x='5' y='12' width='6' height='2' fill='#263238'/>
</svg>
""",
        "player_big.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/><rect x='3' y='1' width='10' height='13' rx='2' fill='#ff7043'/><rect x='4' y='0' width='8' height='3' fill='#ffe082'/><rect x='4' y='13' width='8' height='2' fill='#263238'/>
</svg>
""",
        "enemy_walker.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<ellipse cx='8' cy='9' rx='6' ry='5' fill='#8d6e63'/><rect x='3' y='12' width='10' height='2' fill='#3e2723'/><circle cx='6' cy='8' r='1' fill='#000'/><circle cx='10' cy='8' r='1' fill='#000'/>
</svg>
""",
        "enemy_shell.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<ellipse cx='8' cy='9' rx='6' ry='5' fill='#66bb6a'/><rect x='4' y='7' width='8' height='4' fill='#2e7d32'/>
</svg>
""",
        "enemy_shell_retracted.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<ellipse cx='8' cy='10' rx='6' ry='4' fill='#558b2f'/>
</svg>
""",
        "enemy_flying.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<ellipse cx='8' cy='9' rx='4' ry='4' fill='#ab47bc'/><path d='M2 8h3M11 8h3' stroke='#ce93d8' stroke-width='2'/>
</svg>
""",
        "enemy_spitter.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect x='3' y='4' width='10' height='9' rx='2' fill='#78909c'/><circle cx='7' cy='8' r='1' fill='#000'/><circle cx='10' cy='8' r='1' fill='#000'/><rect x='12' y='7' width='3' height='2' fill='#ff8f00'/>
</svg>
""",
        "projectile.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'>
<circle cx='4' cy='4' r='3' fill='#ffb74d'/>
</svg>
""",
        "coin.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'>
<circle cx='6' cy='6' r='5' fill='#ffd54f' stroke='#f57f17' stroke-width='1.5'/>
</svg>
""",
        "star.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'>
<polygon points='6,1 7.5,4.5 11,4.5 8.2,6.8 9.2,10.5 6,8.5 2.8,10.5 3.8,6.8 1,4.5 4.5,4.5' fill='#fff176'/>
</svg>
""",
        "flag.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'>
<rect x='7' y='1' width='2' height='29' fill='#e0e0e0'/><polygon points='9,4 15,7 9,10' fill='#ef5350'/>
</svg>
""",
        "checkpoint.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect x='7' y='2' width='2' height='12' fill='#e0e0e0'/><polygon points='9,4 14,6 9,8' fill='#29b6f6'/>
</svg>
""",
        "spring.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect x='2' y='11' width='12' height='3' fill='#37474f'/><path d='M3 11 l2 -3 l2 3 l2 -3 l2 3 l2 -3' stroke='#ffca28' fill='none'/>
</svg>
""",
        "spike.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<polygon points='2,14 8,2 14,14' fill='#b0bec5'/>
</svg>
""",
        "thwomp.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect x='1' y='1' width='14' height='14' fill='#607d8b'/><rect x='4' y='6' width='2' height='2' fill='#000'/><rect x='10' y='6' width='2' height='2' fill='#000'/><rect x='4' y='11' width='8' height='2' fill='#263238'/>
</svg>
""",
        "moving_platform.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='8' viewBox='0 0 32 8'>
<rect x='0' y='0' width='32' height='8' rx='2' fill='#8d6e63'/>
</svg>
""",
    }

    tiles = {
        "tile_ground.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='#795548'/><rect y='0' width='16' height='4' fill='#8bc34a'/>
</svg>
""",
        "tile_oneway.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect y='7' width='16' height='2' fill='#b0bec5'/><rect y='9' width='16' height='1' fill='#eceff1'/>
</svg>
""",
    }

    for name, svg in sprites.items():
      write(assets / "sprites" / name, svg)
    for name, svg in tiles.items():
      write(assets / "tiles" / name, svg)

    print("Generated V2 placeholder sprites and tiles.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
