# Play Scene Expected Composition

This gate describes the required `PlayScene` visual direction.

## Required Background

- Play scene calls `renderGameplayBackground(...)`.
- Background stack includes:
  - sky gradient + haze,
  - drifting clouds,
  - `hill_far`,
  - `hill_near`.
- No legacy `renderThemedBackground(...)`.

## Required HUD

- Top-left format: `BART x{instances}  ✦{values}  ◎{values}`.
- Top-right format: `WORLD W-L  TIME TTT`.
- Token/eval icon labels must remain icon-only (`✦`, `◎`) and never use `LIVES`, `STAR`, or `COIN` text labels.

## Enforcement

- `PlayScene` must pass `styleConfig.gameplayLayout` into `renderGameplayBackground`.
- `tools/style_validate.ts` enforces background API usage and HUD copy constraints.
