# Super BART

Mario-style web platformer built with Phaser 3 + TypeScript + Vite.

## Campaign
- 25-level campaign layout: `World 1-4 => 6 levels each`, `World 5 => final castle`.
- Deterministic chunk+seed generation for each world/level pair.
- Local save progression with unlocked/completed level tracking (schema v3).

## Install and Run
```bash
cd /Users/damian/GitHub/NES/SuperBART
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Required Quality Gates
```bash
npm run gen:all
npm run lint:assets
npm run lint:style
npm run lint:audio
npm run lint:visual
npm test
npm run build
```

## Asset Generation Commands
```bash
npm run gen:assets
npm run gen:avatars
npm run gen:all
npm run lint:assets
npm run lint:style
npm run lint:audio
npm run lint:visual
```

## Controls
- Title:
  - `Enter` level select
  - `N` new game
  - `S` settings
- Level Select:
  - `Up/Down/Left/Right` select level
  - `Enter` play selected unlocked level
  - `S` settings
  - `Esc` title
- Gameplay:
  - Move: Arrow keys or `A/D`
  - Jump: `Space`, `W`, or `Up`
  - Restart level: `R`
  - Pause: `Esc` or `P`
- Pause:
  - `Esc` or `P` resume
  - `L` level select
  - `T` title
- Settings:
  - `Q/E` master volume down/up
  - `A/D` music volume down/up
  - `Z/C` SFX volume down/up
  - `M` toggle music mute
  - `X` toggle SFX mute
  - `Esc` back

## Bart Source Update
1. Replace `/Users/damian/GitHub/NES/SuperBART/public/assets/bart_source.png`.
2. Run:
```bash
npm run gen:avatars
npm run lint:assets
```
3. For full refresh before build, run:
```bash
npm run gen:all
```

## Deterministic Debug Helpers
- `window.__SUPER_BART__.getState()`
- `window.render_game_to_text()`
- `window.capture_perf_snapshot()`
- `window.advanceTime(ms)`

## Extra Tooling
```bash
npm run level:preview
python3 tools/check_dependency_rules.py
python3 skills_game_studio/reference-look-enforcer/scripts/check_reference_look_enforcer.py
python3 skills_game_studio/sprite-ui-kit-generator/scripts/check_sprite_ui_kit_generator.py
```
