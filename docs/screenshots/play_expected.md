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

- Top-left format: `BART  LIVES NN  STAR NNN  COIN NNN`.
- Top-right format: `WORLD W-L  TIME TTT`.
- `COIN` must appear in HUD text (never `PTU`).

## Enforcement

- `PlayScene` must pass `styleConfig.gameplayLayout` into `renderGameplayBackground`.
- `tools/style_validate.ts` enforces background API usage and HUD copy constraints.
