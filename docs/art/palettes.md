# Palette Discipline

To prevent visual drift and ensure a cohesive 16-bit aesthetic, all assets must adhere to strict palettes.

## Global Palettes

### Player Palette (Locked)

Used for all Bart sprites (body, head, animations).

- Skin: `#DED256` (Base), `#DC7C1D` (Shadow)
- Shirt: `#F65218` (Orange Red)
- Shorts/Shoes: `#2667FF` (Blue)
- Outline: `#1D1D1D` (Ink Dark)

### UI Palette (Locked)

Used for HUD, menus, and text.

- Text: `#FFFFFF`
- Accent: `#FFD700`
- Panel Background: `#1A1A1D`
- Borders: `#FFFFFF`, `#2B2824`

## Per-World Palettes (Worlds 1–5)

### World 1: Silicon Forest

- Greens: `#46BA4C`, `#20A36D`
- Tech Teals: `#00FFFF`, `#008888`
- Background: `#060808`

### World 2: Cryo-Server Tundra

- Cyans: `#00FFFF`, `#88FFFF`
- Cold Blues: `#6B8CFF`, `#004488`
- White/Frost: `#FFFFFF`, `#E0E0FF`

### World 3: Abyssal Cloud

- Deep Blues: `#000044`, `#000088`
- Pressure Lights: `#FFFF00`, `#FF8800`

### World 4: Magma Nexus

- Oranges: `#FF8800`, `#FF4400`
- Reds: `#FF0000`, `#880000`
- Soot/Ash: `#444444`, `#222222`

### World 5: Deep Web Catacombs

- Biolume Greens: `#00FF00`, `#008800`
- Decay Purples: `#880088`, `#440044`
- Server Grays: `#888888`, `#AAAAAA`

## Enforcement

The `lint:palette` script checks all assets in `public/assets/` against these definitions.

- **Player/UI**: Quantization OFF by default (strict color matching not enforced on every pixel, but palette should be respected).
- **Tiles/Parallax**: Quantization ON by default (must strictly adhere to world palette).
- **Enemies**: Quantization ON unless readability suffers.
