# Super BART - Decisions Log

## Description
Records implementation decisions and rationale so design and technical choices are traceable.


## Decision 001 - Engine
- Choice: Phaser 3 with Arcade Physics.
- Reason: mature 2D platformer workflow, reliable tilemap/camera support.
- Alternatives considered: melonJS fallback if Phaser install/runtime fails.

## Decision 002 - Runtime Stack
- Choice: Vite + JavaScript ESM + Vitest.
- Reason: fast local dev/build and deterministic unit tests.

## Decision 003 - Controls
- Choice: Arrow keys and A/D for movement; Space/W/Up for jump; R for restart on Win/Lose.
- Reason: standard keyboard accessibility for platformers.

## Decision 004 - Lives and Scoring
- Lives: 3
- Scoring: coin = 10, stomp kill = 100
- Respawn semantics: collected coins and dead enemies persist until full restart.

## Decision 005 - Jump Model
- Choice: initial jump impulse + jump-cut on key release.
- Reason: simple, deterministic variable jump height without complex state.

## Decision 006 - Asset Policy
- Choice: generate all placeholder art and tilemap locally via script.
- Reason: deterministic, no external downloads, easy validation.

## Decision 007 - Architecture Boundaries
- Choice: separate scene orchestration from logic modules and level parsing.
- Reason: testability and dependency hygiene.

## Decision 008 - Test Strategy
- Choice: deterministic logic/map tests for smoke and physics sanity.
- Reason: avoids flaky browser dependencies for CI and local reproducibility.
