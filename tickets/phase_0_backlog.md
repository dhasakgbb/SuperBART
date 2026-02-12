# Phase 0 Backlog - Super BART

## Ticket: visual_style_lock
- Owner: Art/Frontend Engineer
- Estimate: 0.5 day
- Dependencies: none
- Acceptance Criteria:
  1. `docs/style_kit.md` mirrors the target screenshot contract.
  2. `src/style/styleConfig.ts` contains locked palette, HUD anchors, typography, and bloom constants.
  3. `npm run lint:style` fails on contract drift and passes on approved constants.

## Ticket: sprite_and_avatar_generation
- Owner: Tools Engineer
- Estimate: 0.5 day
- Dependencies: visual_style_lock
- Acceptance Criteria:
  1. `gen:assets`, `gen:avatars`, and `gen:all` generate all required PNG/font assets.
  2. Bart outputs exist at 32/48/64/96 sizes from `bart_source.png`.
  3. `npm run lint:assets` validates required files and dimensions.

## Ticket: campaign_schema_v3
- Owner: Gameplay Engineer
- Estimate: 0.75 day
- Dependencies: sprite_and_avatar_generation
- Acceptance Criteria:
  1. Save schema is upgraded to v3 with migration from v2.
  2. Campaign layout is `[6,6,6,6,1]` and total levels is 25.
  3. Progression unlock/completion state is persisted and deterministic.

## Ticket: level_select_pause_victory_flow
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: campaign_schema_v3
- Acceptance Criteria:
  1. Scene flow includes Title, Level Select, Play, Pause, Level Complete, Game Over, Final Victory, Settings.
  2. Level Select shows unlocked/completed states and starts selected levels.
  3. Pause resumes cleanly and final-castle completion routes to victory.

## Ticket: generator_topology_final_castle
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: campaign_schema_v3
- Acceptance Criteria:
  1. Generator remains deterministic for same world/level/seed.
  2. Levels are distinct via chunk+seed variations across all 25 campaign stages.
  3. Final castle is biased toward late-game hazard density and chunk composition.

## Ticket: hud_and_bloom_fidelity
- Owner: Frontend Engineer
- Estimate: 0.75 day
- Dependencies: visual_style_lock
- Acceptance Criteria:
  1. HUD matches locked layout (top-left portrait/counters, top-right world/time).
  2. Bitmap font rendering is active for HUD.
  3. Bloom fallback (additive glows) is visible on bright collectibles and style-driven.

## Ticket: audio_webaudio_music_sfx
- Owner: Gameplay/Audio Engineer
- Estimate: 0.75 day
- Dependencies: campaign_schema_v3, level_select_pause_victory_flow
- Acceptance Criteria:
  1. Required WebAudio SFX keys exist and route through capped buses/limiter.
  2. Pattern music presets exist for worlds 1-4 and castle with user-gesture autoplay gating.
  3. Settings scene controls and persists master/music/sfx volume + mute toggles.
  4. `npm run lint:audio` validates preset/key/cap/gesture contract.

## Ticket: qa_repro_and_determinism
- Owner: QA/Tools Engineer
- Estimate: 0.75 day
- Dependencies: generator_topology_final_castle
- Acceptance Criteria:
  1. Boot sanity and deterministic generator tests pass.
  2. Generator hash test verifies stable output for identical inputs.
  3. `tools/level_preview.ts` produces deterministic preview output.

## Ticket: build_release_perf_gates
- Owner: QA/Release Engineer
- Estimate: 0.5 day
- Dependencies: all previous tickets
- Acceptance Criteria:
  1. README, versioning, and CI notes match implemented scripts and flow.
  2. Perf budget/checklist define numeric p50/p95/p99 pass criteria and rollback triggers.
  3. End-to-end quality gates pass: `gen:all`, `lint:assets`, `lint:style`, `lint:audio`, `npm test`, `npm run build`.
