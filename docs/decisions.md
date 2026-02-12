# Decisions

- Phaser 3 Arcade Physics remains the gameplay engine for deterministic 2D collision behavior.
- Visual lock is contract-based (`styleConfig` + validators), not literal pixel-by-pixel frame matching.
- Campaign topology is fixed to `[6,6,6,6,1]` (4 worlds x 6 levels + final castle) for exactly 25 levels.
- Save format is upgraded from `SaveGameV2` to `SaveGameV3` with local migration and normalized unlock/completion lists.
- Final castle is implemented as `World 5, Level 1`; clearing it routes to Final Victory.
- No external art/audio packs are allowed; all runtime assets are generated/authored in repo.
- Bart head/portrait assets are generated prebuild from `public/assets/bart_source.png` only.
- HUD uses generated bitmap font + top-left portrait/counters and top-right world/time anchors.
- Bloom/glow uses style-config numeric controls with additive sprite layers as deterministic fallback.
- Legacy JS compatibility files are retained where existing tests still reference them; gameplay runtime path is TypeScript-first.
- Perf baseline target is 60 FPS on mid-tier integrated-graphics laptop browsers.
