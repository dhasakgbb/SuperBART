# Super BART Architecture

## Description
Describes code module boundaries, ownership, and runtime integration points for maintainable development.


## Module Boundaries
- `src/scenes/`: Phaser scene orchestration (boot/loading and gameplay lifecycle).
- `src/game/`: global configuration and state-machine transitions.
- `src/logic/`: deterministic, testable gameplay rules (physics helpers, collision resolution).
- `src/level/`: level parsing/contract validation from tilemap JSON.
- `src/ui/`: HUD rendering and state presentation.

## Ownership
- Scene orchestration owner: gameplay runtime layer (`src/scenes`).
- Deterministic gameplay logic owner: logic layer (`src/logic`).
- State transition owner: game state layer (`src/game`).
- Data contract owner: level layer (`src/level`).
- HUD/UX owner: UI layer (`src/ui`).

## Integration Points
- Boot flow: `src/scenes/BootScene.js` preloads assets and transitions to `PlayScene`.
- Runtime flow: `PlayScene` queries `src/level/levelParser.js`, applies rules from `src/logic/*`, and transitions state via `src/game/stateMachine.js`.
- Debug API flow: scene exposes `window.render_game_to_text`, `window.advanceTime`, and `window.__SUPER_BART__.getState`.
- External integration: Vite serves static files from `public/assets/` and bundles runtime from `src/`.
