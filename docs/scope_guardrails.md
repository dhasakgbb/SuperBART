# Scope Guardrails (Do-Not-Touch)

Unless a future “gameplay tuning” batch explicitly unlocks them, do not change the following areas. This ensures that the visual overhaul does not introduce gameplay regressions or "drift".

## Do Not Touch

- **Collision boxes / Physics body sizes**: The physical dimensions of objects must remain identical to preserve gameplay feel.
- **Movement/Jump Constants**: `PLAYER_CONSTANTS` and other physics tuning values are frozen.
- **Animation Frame Indices**: The number of frames and their order in state lists must be preserved to ensure logic hooks fire correctly.
- **Enemy Behavior**: Logic, hitboxes, spawn rates, and AI patterns are out of scope.
- **Level Generation**: `levelgen/` logic should not be touched unless correcting a visual artifact that doesn't affect layout.

## Visual-Only File Allowlist

Edits are generally restricted to the following types of files and locations. If you find yourself editing outside this list, stop and justify why.

- `src/assets/**/*.png` (Asset replacements)
- `src/style/` (CSS and style constants)
- `src/scenes/*.ts` (Only for visual setup, z-ordering, or background rendering; NO logic changes)
- `tools/imagegen/` (New tools)
- `docs/art/` (Documentation)

## Enforcement

Edits outside of this scope will be flagged during code review.
