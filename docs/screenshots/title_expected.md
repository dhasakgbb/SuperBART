# Title Expected Composition

This gate describes the required title-screen composition for `TitleScene`.

## Required Visual Layout

- Upper third shows generated `title_logo.png` centered and reading `SUPER BART`.
- Portrait (`bart_portrait_96.png`) appears near the wordmark as a brand marker.
- Subtitle line below the logo:
  - `4 WORLDS X 6 LEVELS + FINAL CASTLE`
- Bottom area includes blinking `PRESS ENTER` and hint row:
  - `N: NEW GAME   L: LEVEL SELECT   S: SETTINGS`

## Camera Lock Requirement

- Title UI must be camera-independent while attract background pans.
- Required implementation detail: title UI objects call `setScrollFactor(0)`.

## Required Background Behavior

- Live attract-style scene with gameplay visual language:
  - sky/haze,
  - drifting clouds,
  - ground strip,
  - bobbing question block,
  - shimmering coin line.
- Camera pans horizontally with smooth yoyo timing.

## Enforcement

- `TitleScene` reads all layout/timing from `src/style/styleConfig.ts` (`titleLayout`).
- `tools/style_validate.ts` enforces:
  - `title_logo.png` usage,
  - bitmap text usage,
  - `setScrollFactor(0)` presence for title UI,
  - no system-font `this.add.text(...)`.
