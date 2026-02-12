#!/usr/bin/env python3
"""Generate deterministic placeholder assets and level map for Super BART."""

from __future__ import annotations

import json
from pathlib import Path

TILE_SIZE = 32
MAP_WIDTH = 100
MAP_HEIGHT = 18


def _idx(x: int, y: int) -> int:
    return y * MAP_WIDTH + x


def build_tile_data() -> list[int]:
    data = [0] * (MAP_WIDTH * MAP_HEIGHT)

    def fill_range(y: int, x_start: int, x_end: int, tile: int = 1) -> None:
        for x in range(x_start, x_end + 1):
            if 0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT:
                data[_idx(x, y)] = tile

    fill_range(17, 0, MAP_WIDTH - 1, 1)

    for gap_x in (34, 35, 68, 69):
        data[_idx(gap_x, 17)] = 0

    fill_range(14, 10, 15, 1)
    fill_range(12, 24, 30, 1)
    fill_range(13, 42, 47, 1)
    fill_range(11, 56, 63, 1)
    fill_range(12, 76, 82, 1)

    return data


def build_level_json() -> dict:
    return {
        "compressionlevel": -1,
        "height": MAP_HEIGHT,
        "width": MAP_WIDTH,
        "infinite": False,
        "layers": [
            {
                "id": 1,
                "name": "ground",
                "type": "tilelayer",
                "width": MAP_WIDTH,
                "height": MAP_HEIGHT,
                "opacity": 1,
                "visible": True,
                "x": 0,
                "y": 0,
                "data": build_tile_data(),
            },
            {
                "id": 2,
                "name": "entities",
                "type": "objectgroup",
                "opacity": 1,
                "visible": True,
                "draworder": "topdown",
                "objects": [
                    {
                        "id": 1,
                        "name": "spawn",
                        "type": "spawn",
                        "x": 80,
                        "y": 528,
                        "width": 32,
                        "height": 32,
                    },
                    {
                        "id": 2,
                        "name": "coin_01",
                        "type": "coin",
                        "x": 200,
                        "y": 480,
                        "width": 16,
                        "height": 16,
                    },
                    {
                        "id": 3,
                        "name": "coin_02",
                        "type": "coin",
                        "x": 430,
                        "y": 368,
                        "width": 16,
                        "height": 16,
                    },
                    {
                        "id": 4,
                        "name": "coin_03",
                        "type": "coin",
                        "x": 920,
                        "y": 336,
                        "width": 16,
                        "height": 16,
                    },
                    {
                        "id": 5,
                        "name": "coin_04",
                        "type": "coin",
                        "x": 1430,
                        "y": 496,
                        "width": 16,
                        "height": 16,
                    },
                    {
                        "id": 6,
                        "name": "coin_05",
                        "type": "coin",
                        "x": 2130,
                        "y": 496,
                        "width": 16,
                        "height": 16,
                    },
                    {
                        "id": 7,
                        "name": "goomba_like",
                        "type": "enemy",
                        "x": 1248,
                        "y": 528,
                        "width": 32,
                        "height": 32,
                        "properties": [
                            {"name": "patrolMin", "type": "int", "value": 1160},
                            {"name": "patrolMax", "type": "int", "value": 1360},
                        ],
                    },
                    {
                        "id": 8,
                        "name": "flag_goal",
                        "type": "goal",
                        "x": 3072,
                        "y": 496,
                        "width": 32,
                        "height": 64,
                    },
                ],
            },
        ],
        "nextlayerid": 3,
        "nextobjectid": 9,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "tileheight": TILE_SIZE,
        "tilewidth": TILE_SIZE,
        "tilesets": [
            {
                "columns": 2,
                "firstgid": 1,
                "image": "../tiles/terrain.svg",
                "imageheight": 64,
                "imagewidth": 64,
                "margin": 0,
                "name": "terrain",
                "spacing": 0,
                "tilecount": 4,
                "tileheight": TILE_SIZE,
                "tilewidth": TILE_SIZE,
            }
        ],
        "type": "map",
        "version": "1.10",
    }


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    assets_root = repo_root / "public" / "assets"

    terrain_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
  <rect x='0' y='0' width='32' height='32' fill='#6b4f2a'/>
  <rect x='0' y='0' width='32' height='8' fill='#8bc34a'/>
  <rect x='32' y='0' width='32' height='32' fill='#9e9e9e'/>
  <rect x='32' y='0' width='32' height='6' fill='#d7d7d7'/>
  <rect x='0' y='32' width='32' height='32' fill='#4e342e'/>
  <rect x='32' y='32' width='32' height='32' fill='#455a64'/>
</svg>
"""

    player_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
  <rect x='6' y='4' width='20' height='24' rx='3' fill='#ff5252'/>
  <rect x='10' y='8' width='12' height='8' fill='#ffe082'/>
  <rect x='8' y='24' width='16' height='4' fill='#263238'/>
</svg>
"""

    enemy_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
  <ellipse cx='16' cy='18' rx='12' ry='10' fill='#8d6e63'/>
  <circle cx='12' cy='16' r='2' fill='#000'/>
  <circle cx='20' cy='16' r='2' fill='#000'/>
  <rect x='8' y='24' width='16' height='4' fill='#3e2723'/>
</svg>
"""

    coin_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
  <circle cx='8' cy='8' r='7' fill='#ffd54f' stroke='#f57f17' stroke-width='2'/>
</svg>
"""

    flag_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='32' height='64' viewBox='0 0 32 64'>
  <rect x='14' y='4' width='4' height='56' fill='#e0e0e0'/>
  <polygon points='18,8 28,14 18,20' fill='#ef5350'/>
  <rect x='11' y='60' width='10' height='3' fill='#455a64'/>
</svg>
"""

    write_file(assets_root / "tiles" / "terrain.svg", terrain_svg)
    write_file(assets_root / "sprites" / "player.svg", player_svg)
    write_file(assets_root / "sprites" / "enemy.svg", enemy_svg)
    write_file(assets_root / "sprites" / "coin.svg", coin_svg)
    write_file(assets_root / "sprites" / "flag.svg", flag_svg)

    level_data = build_level_json()
    map_path = assets_root / "maps" / "level1.json"
    map_path.parent.mkdir(parents=True, exist_ok=True)
    map_path.write_text(json.dumps(level_data, indent=2), encoding="utf-8")

    print("Generated placeholder assets and level map.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
