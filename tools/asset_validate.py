#!/usr/bin/env python3
"""Validate asset and level references for Super BART."""

from __future__ import annotations

import json
from pathlib import Path

REQUIRED_FILES = [
    "public/assets/tiles/terrain.svg",
    "public/assets/sprites/player.svg",
    "public/assets/sprites/enemy.svg",
    "public/assets/sprites/coin.svg",
    "public/assets/sprites/flag.svg",
    "public/assets/maps/level1.json",
]


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    errors: list[str] = []

    for rel in REQUIRED_FILES:
        if not (repo_root / rel).is_file():
            errors.append(f"Missing required asset file: {rel}")

    map_path = repo_root / "public/assets/maps/level1.json"
    if map_path.is_file():
        try:
            level_data = json.loads(map_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid JSON in level1.json: {exc}")
            level_data = None

        if level_data is not None:
            ground = next((l for l in level_data.get("layers", []) if l.get("name") == "ground"), None)
            entities = next(
                (
                    l
                    for l in level_data.get("layers", [])
                    if l.get("name") == "entities" and l.get("type") == "objectgroup"
                ),
                None,
            )

            if ground is None:
                errors.append('Map must include tile layer named "ground".')
            if entities is None:
                errors.append('Map must include object layer named "entities".')

            if ground is not None:
                expected_len = level_data.get("width", 0) * level_data.get("height", 0)
                actual_len = len(ground.get("data", []))
                if actual_len != expected_len:
                    errors.append(
                        f"Ground tile data size mismatch: expected {expected_len}, got {actual_len}"
                    )

            if entities is not None:
                types = {obj.get("type") for obj in entities.get("objects", [])}
                for required_type in ("spawn", "coin", "enemy", "goal"):
                    if required_type not in types:
                        errors.append(f"Missing required entity type: {required_type}")

            for tileset in level_data.get("tilesets", []):
                image = tileset.get("image", "")
                if image.startswith("http://") or image.startswith("https://"):
                    errors.append("Tileset image must be local, external URL found.")
                tileset_file = (map_path.parent / image).resolve()
                if not tileset_file.is_file():
                    errors.append(
                        f"Tileset image path not found from map reference: {image}"
                    )

    if errors:
        print("FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
