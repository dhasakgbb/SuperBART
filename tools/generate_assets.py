#!/usr/bin/env python3
"""Generate deterministic NES-inspired SVG assets for Super BART V2."""

from __future__ import annotations

import argparse
from collections import OrderedDict
from pathlib import Path


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def ensure_ordered(dict_like: dict[str, str]) -> OrderedDict[str, str]:
    return OrderedDict(dict_like)


def build_sprite_sets() -> OrderedDict[str, OrderedDict[str, str]]:
    core_sprites = ensure_ordered({
        "player_small.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='4' y='3' width='8' height='8' fill='#cf5151'/>
<rect x='5' y='2' width='6' height='2' fill='#1d1d1d'/>
<rect x='5' y='4' width='6' height='6' fill='#f2d18c'/>
<rect x='6' y='5' width='1' height='1' fill='#111114'/>
<rect x='9' y='5' width='1' height='1' fill='#111114'/>
<rect x='5' y='8' width='1' height='1' fill='#9d2c2c'/>
<rect x='6' y='9' width='4' height='2' fill='#9d2c2c'/>
<rect x='3' y='11' width='2' height='4' fill='#f2d18c'/>
<rect x='11' y='11' width='2' height='4' fill='#f2d18c'/>
<rect x='4' y='11' width='8' height='2' fill='#102d5a'/>
<rect x='2' y='13' width='5' height='2' fill='#1d1d1d'/>
<rect x='9' y='13' width='5' height='2' fill='#1d1d1d'/>
</svg>
""",
        "player_big.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='3' y='0' width='10' height='1' fill='#111114'/>
<rect x='3' y='1' width='10' height='1' fill='#9d2c2c'/>
<rect x='3' y='2' width='10' height='3' fill='#cf5151'/>
<rect x='4' y='5' width='8' height='7' fill='#f2d18c'/>
<rect x='5' y='3' width='2' height='1' fill='#111114'/>
<rect x='9' y='3' width='2' height='1' fill='#111114'/>
<rect x='2' y='11' width='3' height='5' fill='#f2d18c'/>
<rect x='11' y='11' width='3' height='5' fill='#f2d18c'/>
<rect x='4' y='8' width='8' height='1' fill='#111114'/>
<rect x='3' y='9' width='1' height='1' fill='#111114'/>
<rect x='12' y='9' width='1' height='1' fill='#111114'/>
<rect x='3' y='10' width='10' height='5' fill='#102d5a'/>
<rect x='1' y='14' width='6' height='2' fill='#1d1d1d'/>
<rect x='9' y='14' width='6' height='2' fill='#1d1d1d'/>
</svg>
""",
        "enemy.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
<rect width='32' height='32' fill='none'/>
<rect x='6' y='12' width='20' height='10' fill='#7e5a4b'/>
<rect x='5' y='12' width='22' height='3' fill='#bf8263'/>
<rect x='8' y='14' width='16' height='4' fill='#5e4437'/>
<rect x='14' y='8' width='4' height='4' fill='#111114'/>
<rect x='10' y='12' width='1' height='1' fill='#111114'/>
<rect x='21' y='12' width='1' height='1' fill='#111114'/>
</svg>
""",
        "player.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
<rect width='32' height='32' fill='none'/>
<rect x='12' y='6' width='8' height='18' fill='#cf5151'/>
<rect x='11' y='7' width='10' height='2' fill='#1d1d1d'/>
<rect x='11' y='10' width='10' height='1' fill='#1d1d1d'/>
<rect x='12' y='24' width='8' height='2' fill='#102d5a'/>
<rect x='10' y='14' width='12' height='10' fill='#e9b48e'/>
<rect x='11' y='16' width='1' height='1' fill='#111114'/>
<rect x='20' y='16' width='1' height='1' fill='#111114'/>
</svg>
""",
    })

    enemy_sprites = ensure_ordered({
        "enemy_walker.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='11' width='16' height='2' fill='#1d1d1d'/>
<rect x='1' y='9' width='14' height='3' fill='#742b01'/>
<rect x='1' y='7' width='14' height='2' fill='#dc7c1d'/>
<rect x='2' y='5' width='12' height='2' fill='#b6560e'/>
<rect x='2' y='3' width='12' height='2' fill='#dc7c1d'/>
<rect x='2' y='1' width='12' height='2' fill='#1d1d1d'/>
<rect x='5' y='3' width='6' height='2' fill='#2a2824'/>
<rect x='5' y='2' width='6' height='1' fill='#f2f8fd'/>
<rect x='6' y='2' width='1' height='1' fill='#1d1d1d'/>
<rect x='9' y='2' width='1' height='1' fill='#1d1d1d'/>
<rect x='1' y='2' width='1' height='10' fill='#1d1d1d'/>
<rect x='14' y='2' width='1' height='10' fill='#1d1d1d'/>
<rect x='4' y='10' width='1' height='2' fill='#1d1d1d'/>
<rect x='11' y='10' width='1' height='2' fill='#1d1d1d'/>
</svg>
""",
        "enemy_shell.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='12' width='16' height='3' fill='#1d1d1d'/>
<rect x='1' y='3' width='14' height='8' fill='#dc7c1d'/>
<rect x='2' y='2' width='12' height='2' fill='#b6560e'/>
<rect x='2' y='11' width='12' height='1' fill='#742b01'/>
<rect x='3' y='1' width='10' height='1' fill='#1d1d1d'/>
<rect x='3' y='4' width='10' height='2' fill='#b6560e'/>
<rect x='6' y='6' width='4' height='1' fill='#f2f8fd'/>
<rect x='7' y='7' width='2' height='1' fill='#1d1d1d'/>
<rect x='5' y='12' width='1' height='1' fill='#1d1d1d'/>
<rect x='10' y='12' width='1' height='1' fill='#1d1d1d'/>
</svg>
""",
        "enemy_shell_retracted.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='12' width='16' height='3' fill='#1d1d1d'/>
<rect x='2' y='3' width='12' height='7' fill='#dc7c1d'/>
<rect x='3' y='1' width='10' height='2' fill='#b6560e'/>
<rect x='2' y='10' width='12' height='1' fill='#742b01'/>
<rect x='4' y='4' width='8' height='2' fill='#1d1d1d'/>
<rect x='6' y='5' width='4' height='1' fill='#f2f8fd'/>
<rect x='5' y='12' width='1' height='1' fill='#1d1d1d'/>
<rect x='10' y='12' width='1' height='1' fill='#1d1d1d'/>
</svg>
""",
        "enemy_flying.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='7' width='16' height='2' fill='#1d1d1d'/>
<rect x='1' y='7' width='14' height='1' fill='#dc7c1d'/>
<rect x='2' y='2' width='12' height='2' fill='#f2f8fd'/>
<rect x='0' y='4' width='16' height='1' fill='#2a2824'/>
<rect x='0' y='10' width='16' height='1' fill='#2a2824'/>
<rect x='2' y='5' width='12' height='2' fill='#060808'/>
<rect x='2' y='6' width='2' height='1' fill='#f2f8fd'/>
<rect x='12' y='6' width='2' height='1' fill='#f2f8fd'/>
<rect x='4' y='5' width='8' height='1' fill='#b6560e'/>
<rect x='4' y='8' width='8' height='1' fill='#b6560e'/>
</svg>
""",
        "enemy_spitter.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='10' width='16' height='2' fill='#1d1d1d'/>
<rect x='1' y='8' width='14' height='4' fill='#dc7c1d'/>
<rect x='2' y='4' width='12' height='4' fill='#b6560e'/>
<rect x='2' y='2' width='12' height='2' fill='#742b01'/>
<rect x='0' y='7' width='2' height='2' fill='#1d1d1d'/>
<rect x='14' y='7' width='2' height='2' fill='#1d1d1d'/>
<rect x='6' y='11' width='4' height='1' fill='#f2f8fd'/>
<rect x='6' y='5' width='4' height='1' fill='#f2f8fd'/>
<rect x='6' y='9' width='4' height='1' fill='#111114'/>
<rect x='7' y='3' width='1' height='1' fill='#dc7c1d'/>
<rect x='8' y='3' width='1' height='1' fill='#dc7c1d'/>
<rect x='6' y='6' width='1' height='1' fill='#f2f8fd'/>
<rect x='9' y='6' width='1' height='1' fill='#f2f8fd'/>
</svg>
""",
    })
    hazard_sprites = ensure_ordered({
        "moving_platform.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='8' viewBox='0 0 32 8'>
<rect width='32' height='8' fill='none'/>
<rect x='0' y='0' width='32' height='1' fill='#1d1d1d'/>
<rect x='0' y='1' width='32' height='1' fill='#2a2824'/>
<rect x='0' y='2' width='32' height='3' fill='#2f2b2f'/>
<rect x='0' y='5' width='32' height='1' fill='#1d1d1d'/>
<rect x='0' y='6' width='32' height='2' fill='#5f5b52'/>
<rect x='1' y='2' width='2' height='1' fill='#e2bd50'/>
<rect x='4' y='2' width='2' height='1' fill='#dc7c1d'/>
<rect x='7' y='2' width='2' height='1' fill='#e2bd50'/>
<rect x='10' y='2' width='2' height='1' fill='#dc7c1d'/>
<rect x='13' y='2' width='2' height='1' fill='#e2bd50'/>
<rect x='16' y='2' width='2' height='1' fill='#dc7c1d'/>
<rect x='19' y='2' width='2' height='1' fill='#e2bd50'/>
<rect x='22' y='2' width='2' height='1' fill='#dc7c1d'/>
<rect x='25' y='2' width='2' height='1' fill='#e2bd50'/>
<rect x='28' y='2' width='3' height='1' fill='#dc7c1d'/>
</svg>
""",
        "spike.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='14' width='16' height='2' fill='#1d1d1d'/>
<rect x='1' y='12' width='14' height='2' fill='#2a2824'/>
<rect x='1' y='4' width='1' height='9' fill='#dc7c1d'/>
<rect x='2' y='4' width='1' height='9' fill='#1d1d1d'/>
<rect x='4' y='3' width='1' height='10' fill='#dc7c1d'/>
<rect x='5' y='3' width='1' height='10' fill='#1d1d1d'/>
<rect x='7' y='2' width='1' height='11' fill='#dc7c1d'/>
<rect x='8' y='2' width='1' height='11' fill='#1d1d1d'/>
<rect x='10' y='3' width='1' height='10' fill='#dc7c1d'/>
<rect x='11' y='3' width='1' height='10' fill='#1d1d1d'/>
<rect x='13' y='4' width='1' height='9' fill='#dc7c1d'/>
<rect x='14' y='4' width='1' height='9' fill='#1d1d1d'/>
</svg>
""",
        "thwomp.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='0' y='0' width='16' height='16' fill='none'/>
<rect x='2' y='0' width='12' height='13' fill='#2a2824'/>
<rect x='3' y='1' width='10' height='12' fill='#1f1f20'/>
<rect x='4' y='2' width='8' height='4' fill='#b6560e'/>
<rect x='4' y='11' width='8' height='2' fill='#2a2824'/>
<rect x='3' y='3' width='2' height='4' fill='#111114'/>
<rect x='11' y='3' width='2' height='4' fill='#111114'/>
<rect x='6' y='5' width='1' height='2' fill='#f2f8fd'/>
<rect x='9' y='5' width='1' height='2' fill='#f2f8fd'/>
<rect x='2' y='14' width='12' height='2' fill='#1d1d1d'/>
</svg>
""",
        "spring.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='2' y='10' width='12' height='4' fill='#1d1d1d'/>
<rect x='2' y='9' width='12' height='1' fill='#272b31'/>
<rect x='1' y='3' width='14' height='1' fill='#e2bd50'/>
<rect x='1' y='4' width='14' height='1' fill='#dc7c1d'/>
<rect x='1' y='5' width='14' height='1' fill='#b6560e'/>
<rect x='1' y='6' width='14' height='1' fill='#e2bd50'/>
<rect x='1' y='7' width='14' height='1' fill='#1d1d1d'/>
<rect x='1' y='8' width='14' height='1' fill='#2a2824'/>
<rect x='7' y='9' width='2' height='1' fill='#f2f8fd'/>
</svg>
""",
    })

    object_sprites = ensure_ordered({
        "coin.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'>
<rect x='0' y='0' width='12' height='12' fill='none'/>
<rect x='1' y='1' width='10' height='10' fill='#dc7c1d'/>
<rect x='2' y='2' width='8' height='8' fill='#ded256'/>
<rect x='3' y='3' width='6' height='6' fill='#f2f8fd'/>
<rect x='4' y='4' width='1' height='4' fill='#1d1d1d'/>
<rect x='7' y='4' width='1' height='4' fill='#1d1d1d'/>
<rect x='5' y='6' width='2' height='1' fill='#1d1d1d'/>
</svg>
""",
        "star.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'>
<rect width='12' height='12' fill='none'/>
<rect x='5' y='0' width='2' height='2' fill='#f2f8fd'/>
<rect x='0' y='5' width='2' height='2' fill='#f2f8fd'/>
<rect x='2' y='3' width='2' height='2' fill='#f2f8fd'/>
<rect x='2' y='7' width='2' height='2' fill='#f2f8fd'/>
<rect x='5' y='10' width='2' height='2' fill='#f2f8fd'/>
<rect x='8' y='7' width='2' height='2' fill='#f2f8fd'/>
<rect x='8' y='3' width='2' height='2' fill='#f2f8fd'/>
<rect x='10' y='5' width='2' height='2' fill='#f2f8fd'/>
<rect x='5' y='5' width='2' height='2' fill='#ded256'/>
<rect x='5' y='2' width='2' height='1' fill='#1d1d1d'/>
<rect x='5' y='9' width='2' height='1' fill='#1d1d1d'/>
</svg>
""",
        "flag.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'>
<rect x='7' y='1' width='2' height='30' fill='#f2f8fd'/>
<rect x='9' y='1' width='2' height='30' fill='#2a2824'/>
<rect x='1' y='1' width='6' height='10' fill='#dc7c1d'/>
<rect x='0' y='4' width='6' height='1' fill='#1d1d1d'/>
<rect x='0' y='7' width='6' height='1' fill='#1d1d1d'/>
<rect x='2' y='3' width='2' height='1' fill='#1d1d1d'/>
<rect x='2' y='9' width='2' height='1' fill='#1d1d1d'/>
<rect x='4' y='2' width='2' height='1' fill='#f2f8fd'/>
</svg>
""",
        "checkpoint.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<rect width='16' height='16' fill='none'/>
<rect x='7' y='2' width='2' height='12' fill='#f2f8fd'/>
<rect x='9' y='3' width='5' height='6' fill='#46ba4c'/>
<rect x='9' y='9' width='5' height='3' fill='#ded256'/>
<rect x='10' y='4' width='3' height='2' fill='#dc7c1d'/>
<rect x='10' y='10' width='3' height='1' fill='#1d1d1d'/>
<rect x='10' y='5' width='1' height='4' fill='#1d1d1d'/>
<rect x='12' y='5' width='1' height='4' fill='#1d1d1d'/>
</svg>
""",
        "projectile.svg": """
<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'>
<rect width='8' height='8' fill='none'/>
<rect x='2' y='2' width='4' height='4' fill='#ded256'/>
<rect x='3' y='1' width='2' height='1' fill='#dc7c1d'/>
<rect x='3' y='6' width='2' height='1' fill='#dc7c1d'/>
<rect x='1' y='3' width='1' height='2' fill='#f2f8fd'/>
<rect x='6' y='3' width='1' height='2' fill='#f2f8fd'/>
</svg>
""",
    })
