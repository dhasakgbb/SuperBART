# Super BART Architecture

## Module Boundaries
- `src/scenes`: orchestration and transitions between title/select/play/pause/results.
- `src/core`: constants, runtime store, asset manifest, game config.
- `src/systems`: save/progression policies and persistence logic.
- `src/levelgen`: deterministic procedural generation and validation.
- `src/player`: movement feel and power-up state transitions.
- `src/enemies`: enemy behavior implementations and collision outcomes.
- `src/hazards`: moving platform/thwomp system updates.
- `src/rendering`: parallax/background and visual FX helpers.
- `src/audio`: procedural WebAudio SFX/music synth.
- `src/ui`: HUD composition and style-bound rendering.
- `src/types`: shared contracts.

## Ownership
- Scene flow + UX: `src/scenes/**`
- Persistence + progression contracts: `src/systems/**`, `src/types/game.ts`
- Movement/combat/hazards: `src/player/**`, `src/enemies/**`, `src/hazards/**`
- Generator + deterministic behavior: `src/levelgen/**`
- Visual style contract: `src/style/**`, `src/ui/**`, `tools/style_validate.ts`
- Asset generation + validation: `tools/make_*.ts`, `tools/asset_validate.ts`
- QA/release/perf docs and helpers: `docs/**`

## Integration Points
1. Boot scene loads generated assets and bitmap font from asset manifest.
2. Level Select reads save state and starts Play with selected unlocked level.
3. Play scene computes deterministic seed and requests generated level data.
4. Runtime systems (movement/enemies/hazards) write progression outcomes to save state.
5. Level Complete consumes current save state and unlocks the next campaign stage or final victory.
6. Debug APIs (`getState`, `render_game_to_text`, `capture_perf_snapshot`) expose deterministic runtime data.

## Data Flow
1. `loadSave()` normalizes schema v3 and campaign unlock state.
2. `computeSeed(world, level)` produces deterministic seed for generation.
3. `generateLevel()` emits tile grid + entities + metadata.
4. Play scene materializes physics objects and systems from generated payload.
5. Events (coins, damage, goal) update runtime progression and persist via `persistSave()`.

## Example Violation Path
- Forbidden example: `src/systems/save.ts` importing from `src/scenes/WorldMapScene.ts`.
- Why forbidden: persistence policy layer must remain scene-agnostic for testability and deterministic logic reuse.
