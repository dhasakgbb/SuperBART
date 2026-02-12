# Target Look Style Kit

Source reference: `public/assets/target_look.png`

This document defines the locked art-direction contract enforced by `tools/style_validate.ts`.

## Palette (Approximate Hex)

| Name | Hex | Usage |
| --- | --- | --- |
| inkDark | `#1D1D1D` | Primary 1-2px outlines and silhouette anchors |
| inkSoft | `#2B2824` | Secondary contour lines |
| skyDeep | `#0A121C` | Deep sky gradient |
| skyMid | `#212826` | Mid sky gradient |
| grassTop | `#46BA4C` | Terrain top highlight |
| grassMid | `#20A36D` | Terrain mids and moss |
| groundShadow | `#742B01` | Terrain low values |
| groundMid | `#B6560E` | Terrain mids |
| groundWarm | `#DC7C1D` | Terrain warm highlight |
| coinCore | `#DED256` | Coin interior highlight |
| coinEdge | `#DC7C1D` | Coin edge and warm UI accents |
| hudText | `#F2FDFD` | Primary HUD labels |
| hudAccent | `#DED256` | HUD counters and WORLD/TIME emphasis |
| hudPanel | `#1F1F20` | HUD panel fill |
| bloomWarm | `#F6D58B` | Additive glow tint |

## Outline Thickness Rules

- World sprites: `2px` target outline.
- UI outline: `2px`.
- Maximum outline thickness: `3px`.
- Preserve clear dark silhouette edges on gameplay-critical objects.

## Sprite Scale Rules

- Base tile size: `16x16`.
- World scale: `1x` source pixel scale (nearest-neighbor only).
- HUD portrait source: `96x96`, rendered at `0.66` scale.
- No smoothing or runtime interpolation.

## HUD Layout Spec (960x540 viewport)

### Top-left group (portrait + BART + counters)

- `portrait`
  - Anchor: `top-left`
  - Position: `x=14`, `y=8`
  - Texture size: `96`
  - Render scale: `0.66`
- `topText`
  - Anchor: `top-left`
  - Position: `x=84`, `y=11`
  - Font size: `14`
  - Content format: `BART  LIVES NN  STAR NNN  COIN NNN`

### Top-right group (world + time)

- `rightText`
  - Anchor: `top-right`
  - Position: `x=948`, `y=11`
  - Font size: `14`
  - Content format: `WORLD W-L  TIME TTT`

## Typography Rules

- Style: bitmap/pixel font.
- Font key: `hud` bitmap font from generated asset pack.
- Casing: uppercase.
- Tracking: `1px` equivalent letter spacing.
- Line height target: `16px`.

## Bloom/Glow Parameters

- `enabled: true`
- `threshold: 0.73`
- `strength: 0.46`
- `radius: 3`
- `downsample: 2`
- `tint: #F6D58B`

Implementation policy: if post-processing pipeline is unavailable, use additive layered sprite glows on bright collectibles and HUD accents with these numeric controls.

## Spacing and Composition Rules

- Keep gameplay readable by reserving the top HUD band and leaving world action unobstructed.
- Maintain chunky cloud silhouettes and warm/cool terrain separation.
- Keep coin rendering high-contrast against sky and terrain.

## Do / Don't

### Do
- Preserve dark outlines around all interactive sprites.
- Keep HUD within locked anchor/coordinate windows.
- Use generated bitmap font and nearest-neighbor scaling.
- Keep bloom subtle and warm.

### Don't
- Don't move portrait to the right side.
- Don't replace bitmap HUD text with anti-aliased vector text.
- Don't introduce new core palette colors without adding them to `styleConfig`.
- Don't exceed bloom constraints or wash out silhouettes.
