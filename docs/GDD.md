# Super BART GDD

## Core Loop
1. Select an unlocked campaign level from Level Select.
2. Run/jump through a deterministic chunk-generated platforming route.
3. Collect coins/stars, defeat enemies, activate checkpoints, and clear goal.
4. Receive level summary and unlock the next level.
5. Complete all 25 levels (`4x6 + final castle`) to reach final victory.

## MVP Scope
- Engine: Phaser 3 + TypeScript + Vite.
- Campaign topology: World 1-4 each have 6 levels; World 5 has a single final castle level.
- Menus/screens: Title, Level Select, Play, Pause, Level Complete, Game Over, Final Victory, Settings.
- Required movement feel: acceleration/deceleration, coyote time, jump buffer, variable jump cut, stomp hitstop.
- Required enemies/hazards: walker, shell enemy, flyer, shooter, spike, thwomp-lite, moving platforms.
- Art/audio constraints:
  - In-repo generated assets only; no external downloads.
- Bart portrait/head generated from `public/assets/target_look.png`.
  - Procedural WebAudio SFX and looping world music.
- Persistence: localStorage save schema v3 with unlocked/completed level tracking.

## Visual Direction
- North-star: `public/assets/target_look.png`.
- Chunky pixel silhouettes, dark outlines, warm bloom accents.
- Locked HUD composition:
  - Top-left portrait + `BART` + lives/star/coin counters.
  - Top-right `WORLD` and `TIME`.
- Style constants must live in `src/style/styleConfig.ts` and be enforced by `tools/style_validate.ts`.

## Systems
- Level generation: deterministic chunk+seed generation with world-specific rules and final-castle bias.
- Progression: unlock next level on clear, preserve completion state, final-castle completion ends campaign.
- Runtime debugging: state export (`window.__SUPER_BART__.getState`, `window.render_game_to_text`) and perf snapshot helper.

## Risks
- Visual drift from target screenshot if style constants are bypassed.
- Campaign progression regressions during v2->v3 save migration.
- Scene-flow regressions when adding Pause and Final Victory routes.
- Chunk generator changes can silently affect fairness or determinism.
- Large production bundle can impact low-end browser performance.

## Mitigations
- Mandatory gates: `gen:all`, `lint:assets`, `lint:style`, `lint:audio`, `npm test`, `npm run build`.
- Deterministic generator hash test and level preview tooling.
- Save migration tests for schema normalization and final-level completion behavior.
- Dependency-boundary checker to prevent architecture drift.

## Milestones
1. Phase A: visual/style lock + deterministic asset generation.
2. Phase B: spec and architecture rule update.
3. Phase C: gameplay + progression + scene flow completion.
4. Phase D: QA reproducibility, build/release docs, perf budget and helpers.
