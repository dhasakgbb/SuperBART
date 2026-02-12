# Super BART V2 Architecture

## Module Boundaries
- `src/core`: constants, game config, runtime store, asset manifest.
- `src/scenes`: Phaser scene orchestration and state transitions.
- `src/player`: movement feel model and power-up transitions.
- `src/enemies`: enemy behavior registry and collision outcomes.
- `src/hazards`: thwomp and moving-platform update systems.
- `src/levelgen`: deterministic world rules + chunk assembly + validation.
- `src/audio`: WebAudio synth for SFX/music.
- `src/rendering`: theme/parallax background helpers.
- `src/systems`: save/persistence and progression utilities.
- `src/types`: shared data contracts.

## Data Flow
1. `PlayScene` computes seed from campaign state.
2. `levelgen/generator` emits `GeneratedLevel`.
3. Scene instantiates tile solids, platforms, entities.
4. `player/movement` runs deterministic feel-step each frame.
5. Combat and hazard overlaps resolve into progression state updates.
6. Runtime state is exposed through debug APIs for tests and automation.

## Deterministic Interfaces
- `window.__SUPER_BART__.getState()`
- `window.render_game_to_text()`
- `window.advanceTime(ms)`
