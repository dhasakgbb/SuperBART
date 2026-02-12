# Target Look Style Kit

Source reference: `public/assets/target_look.png`

This style kit is the source-of-truth contract enforced by `tools/style_validate.ts`.

## Palette (Approximate Hex)

| Name | Hex | Usage |
| --- | --- | --- |
| inkDark | `#1D1D1D` | Primary sprite/UI outlines |
| inkSoft | `#2B2824` | Secondary contours |
| skyDeep | `#0A121C` | Gameplay/title upper sky |
| skyMid | `#212826` | Gameplay/title lower sky |
| grassTop | `#46BA4C` | Terrain highlight + map completion accents |
| grassMid | `#20A36D` | Terrain mids |
| groundShadow | `#742B01` | Terrain low values |
| groundMid | `#B6560E` | Terrain mids |
| groundWarm | `#DC7C1D` | Terrain warmth + title depth |
| coinCore | `#DED256` | Coin/light interior |
| coinEdge | `#DC7C1D` | Coin edge |
| hudText | `#F2FDFD` | Primary HUD/map text |
| hudAccent | `#DED256` | Counters, title accents, selected state |
| bloomWarm | `#F6D58B` | Additive glow tint |

## Pixel Rules

- Base tile grid: `16x16`.
- World rendering uses nearest-neighbor only.
- Outline target is `2px` and max allowed is `3px`.
- Preserve dark silhouette readability for player, enemies, nodes, and blocks.

## HUD Layout (960x540)

- `portrait`: `x=14`, `y=8`, scale `0.66`.
- `leftGroup`: `x=84`, `y=11`, font `14`.
- `rightGroup`: `x=948`, `y=11`, font `14`, right-aligned.
- Locked text format:
  - `BART  LIVES NN  STAR NNN  COIN NNN`
  - `WORLD W-L  TIME TTT`
- `TIME` is always 3 digits (`TTT`).

## Title Screen Contract

- Wordmark uses generated `title_logo.png` and copy must be `SUPER BART`.
- All title UI elements are camera-fixed (`setScrollFactor(0)`), including:
  - logo glow, logo, portrait, subtitle, prompt, hints.
- Title attract-mode keeps gameplay visual language:
  - dark sky gradient + haze,
  - drifting clouds,
  - tiled ground strip,
  - bobbing question block,
  - coin shimmer line,
  - slow horizontal camera pan.

## Gameplay Background Contract

- `renderGameplayBackground(...)` is the only allowed play-scene renderer.
- Layers:
  - fixed sky + haze,
  - drifting clouds (`scrollFactor` locked within `0.05-0.12`),
  - far hill layer (`hill_far`, `scrollFactor 0.10`),
  - near hill layer (`hill_near`, `scrollFactor 0.22`).
- Keep warm glow only on highlights; avoid broad washed-out bloom.

## World Map Contract

- `WorldMapScene` uses bitmap text and sprite-kit visuals only (no system fonts).
- Node states use generated sprites:
  - `map_node_open`, `map_node_done`, `map_node_locked`, `map_node_selected`.
- Path uses generated `map_path_dot`.
- Layout is style-config driven with explicit coordinates for all 25 campaign nodes.
- Selected node has bob animation; unlock logic remains save-system controlled.

## Visual Regression Gate

- Runtime capture script: `tools/capture_visual_baselines.ts`.
- Goldens:
  - `docs/screenshots/golden/title_scene_golden.png`
  - `docs/screenshots/golden/map_scene_golden.png`
  - `docs/screenshots/golden/play_scene_golden.png`
- Required commands:
  - `npm run lint:style`
  - `npm run lint:visual`
