# Super BART

Super BART is a single-level, Mario-style 2D platformer for the web, built with Phaser 3 (Arcade Physics), Vite, and Vitest.

## Description
This project delivers a complete playable loop in a tight MVP scope: run, jump (with variable jump height), collect coins, stomp one enemy type, survive side-hit damage with lives/respawn, and reach a goal flag to win.

## Current Gameplay Scope
- Side-scrolling tile-based level.
- Run + variable jump height.
- Tile collisions and camera follow.
- Coins and score tracking.
- One patrolling enemy (stomp kill, side-hit damage).
- Death, respawn, lives, and game-over flow.
- Goal flag win condition.

## Controls
- Move: `ArrowLeft` / `ArrowRight` or `A` / `D`
- Jump: `Space` / `W` / `ArrowUp`
- Restart (from win/lose): `R`

## Requirements
- Node.js + npm
- Python 3

## Quick Start
```bash
cd /Users/damian/GitHub/NES/SuperBART
npm install
npm run assets:generate
npm run dev
```

## Build
```bash
npm run build
```

## Test
```bash
npm run test
```

## Validate
```bash
npm run validate
```

## Full Command Matrix
```bash
cd /Users/damian/GitHub/NES/SuperBART
npm install
npm run assets:generate
npm run dev
npm run test
npm run validate
npm run build
```

## Documentation
- Docs index: `docs/INDEX.md`
- Outstanding TODOs: `docs/TODO.md`
- Architecture: `docs/architecture.md`
- GDD: `docs/GDD.md`

## Minimal CI Notes
- Pipeline: install -> generate assets -> test -> validate -> build.
- Required commands:
  - `npm install`
  - `npm run assets:generate`
  - `npm run test`
  - `npm run validate`
  - `npm run build`
- See `docs/ci_release_notes.md` for failure handling and artifact guidance.
