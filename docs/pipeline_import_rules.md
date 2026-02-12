# Pipeline Import Rules

## Description
Defines accepted asset formats, intake rules, and rejection conditions for the content pipeline.


## Accepted Formats
- Tiles: SVG (placeholder stage), PNG (future production stage)
- Sprites: SVG (placeholder stage), PNG sprite sheets (future)
- Tilemaps: JSON (Tiled-compatible structure)

## Intake Rules
1. All runtime assets must live under `public/assets/`.
2. Map references must point to local relative files only.
3. New assets must be deterministic and reproducible by tool scripts where possible.

## Rejection Rules
1. Reject external URLs in tilemap `tilesets[].image`.
2. Reject missing required entity object types (`spawn`, `coin`, `enemy`, `goal`).
3. Reject tile layer payload length mismatch with map dimensions.
4. Reject unsupported binary files in placeholder stage.
