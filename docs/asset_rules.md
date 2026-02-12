# Asset Rules

## Description
Defines naming, sizing, and metadata requirements for runtime placeholder assets and map data.


## Naming
- Use lowercase snake_case file names.
- Prefix map files by level (`level1.json`, `level2.json`, etc.).

## Sizing
- Tile size baseline: 32x32.
- Player/enemy placeholders: 32x32.
- Coin placeholder: 16x16.
- Goal placeholder: 32x64.

## Metadata Requirements
- Tilemap must define `ground` tile layer and `entities` object layer.
- Enemy entities must provide patrol bounds via `patrolMin` and `patrolMax`.
- Spawn and goal must be present exactly once in the current single-level scope.

## Validation Command
Run `python3 tools/asset_validate.py` before build/release.
