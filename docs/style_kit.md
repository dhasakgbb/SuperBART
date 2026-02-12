# Target Look Style Kit

Source reference: `public/assets/target_look.png`

This document defines hard style constraints used by `tools/style_validate.ts` to prevent visual drift.

## Palette (Approximate Hex)

| Name | Hex | Usage |
| --- | --- | --- |
| inkDark | `#1D1D1D` | Global 1-2px outlines, silhouette protection |
| inkSoft | `#2B2824` | Secondary contour lines and seams |
| skyDeep | `#0A121C` | Deep background gradient base |
| skyMid | `#212826` | Mid background tones |
| grassTop | `#46BA4C` | Bright top grass highlights |
| grassMid | `#20A36D` | Grass and moss mids |
| groundShadow | `#742B01` | Ground shadow ramp |
| groundMid | `#B6560E` | Ground mid ramp |
| groundWarm | `#DC7C1D` | Warm highlight on terrain and blocks |
| coinCore | `#DED256` | Coin/light core |
| coinEdge | `#DC7C1D` | Coin and question-block edges |
| hudText | `#F2FDFD` | Primary HUD text |
| hudAccent | `#DED256` | HUD accent text and counters |
| hudPanel | `#1F1F20` | HUD panel backgrounds |
| bloomWarm | `#F6D58B` | Additive glow tint |

## Outline Thickness Rules

- World sprites: `2px` default, never thinner than `1px`.
- UI widgets/HUD frame edges: `2px`.
- Absolute max outline thickness: `3px`.
- Use `inkDark` for silhouette-preserving boundaries and collision readability.

## Sprite Scale Rules

- Base tile size: `16x16` pixels.
- World sprite scale: `1x` source pixel size (no smoothing).
- HUD portrait source: `96x96`, rendered at scale `0.62`.
- Pixel art rule: nearest-neighbor only.

## HUD Layout Spec (960x540 viewport)

### Fixed anchors and coordinates

- `topText`
  - Anchor: `top-left`
  - Position: `x=12`, `y=10`
  - Allowed validator range: `x: 8-20`, `y: 8-16`
  - Font size: `16px` (allowed `14-18`)
- `rightText`
  - Anchor: `top-left`
  - Position: `x=786`, `y=10`
  - Allowed validator range: `x: 770-810`, `y: 8-16`
  - Font size: `14px` (allowed `12-16`)
- `portrait`
  - Anchor: `top-left`
  - Position: `x=910`, `y=74`
  - Allowed validator range: `x: 890-930`, `y: 60-86`
  - Source size: `96px`
  - Render scale: `0.62` (allowed `0.58-0.68`)

## Typography Rules (Bitmap Style)

- Visual style: bitmap/arcade, uppercase-heavy HUD strings.
- Tracking: `1px` letter spacing equivalent.
- Text blocks should be short, high contrast, and never antialiased.
- Fallback font family in code: `monospace` with pixel rendering assumptions.

## Bloom/Glow Parameters

- `enabled: true`
- `threshold: 0.73` (allowed `0.65-0.82`)
- `strength: 0.46` (allowed `0.25-0.65`)
- `radius: 3` (allowed `2-5`)
- `downsample: 2` (allowed `1-3`)
- `tint: #F6D58B`

Glow target: soft warm highlight around bright collectibles/HUD accents without washing silhouettes.

## Do / Don't

### Do
- Keep silhouettes chunky and immediately readable at gameplay speed.
- Keep outlines dark and continuous around interactive sprites.
- Keep HUD positions inside the validated coordinate windows.
- Use warm highlights over brown/green midtones for terrain readability.
- Use nearest-neighbor scaling for all pixel art transforms.

### Don't
- Don't move HUD elements by large offsets (for example, +30px) without updating the style contract.
- Don't introduce anti-aliased vector-like smoothing in generated sprites.
- Don't replace dark outlines with soft glows that reduce edge readability.
- Don't add new palette colors outside named swatches for core gameplay art.
- Don't increase bloom strength/radius beyond validated ranges.
