# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Super BART is a Mario-style web platformer built with **Phaser 3 + TypeScript + Vite**. It has a 28-level campaign across 7 worlds (The City [4], Cryo-Server Tundra [4], Quantum Void [4], Deep Web Catacombs [4], Digital Graveyard [4], Singularity Core [4], Singularity Apex [4]). The game uses an AI automation satire theme where Bart, a network maintenance worker, reclaims a corporate network from an AI overlord named Omega.

All runtime assets (sprites, audio) are procedurally generated or authored in-repo. No external art/audio packs are used.

## Commands

### Development
```bash
npm run dev          # Vite dev server at 127.0.0.1:5173
npm run build        # Production build
npm run preview      # Preview production build
```

### Testing
```bash
npm test             # All lints (content, assets, style, audio, visual) + vitest
vitest run tests/audio_contract.test.ts   # Run a single test file
npm run lint:audio   # Audio contract validation only
npm run lint:style   # Style/visual validation only
npm run lint:assets  # Asset validation only
npm run lint:content # Content bible validation only
npm run lint:visual  # Visual regression (Playwright)
```

Note: `npm test` runs ALL lints before vitest. Some non-audio lints may fail due to pre-existing uncommitted changes. For targeted validation, run individual lint commands + specific vitest files.

### Asset Generation
```bash
npm run gen:all      # Generate all assets (UI, avatars, body spritesheets)
npm run gen:assets   # UI assets only
npm run gen:avatars  # Player avatar spritesheets
npm run gen:body     # Player body animation spritesheets
```

### CI / Quality Gates
```bash
npm run ci:gates     # Full pipeline: gen:all → lints → test → build
npm run ci:gates:log # Same with telemetry logging
```

The 7-gate runbook (`docs/7_gate_runbook.md`) defines the pre-merge validation process. Gates run serially; any FAIL blocks merge.

## Architecture

### Module Boundaries

```
scenes → core|systems|levelgen|player|enemies|hazards|rendering|audio|ui|types|style
ui → style|types|core
systems → core|types
levelgen → core|types|systems
player|enemies|hazards|audio|rendering → core|types
core → types
```

**No module may import from `scenes` except `scenes` itself.** The persistence/systems layer must remain scene-agnostic. See `docs/dependency_rules.md`.

### Source Layout (`src/`)

| Directory | Purpose |
|-----------|---------|
| `scenes/` | Phaser scenes: Boot, Title, WorldMap, Play, Pause, LevelComplete, GameOver, FinalVictory, Settings. `sceneFlow.ts` handles transitions with fades. |
| `core/` | Constants (`TILE_SIZE=16`, `VIEW_WIDTH=960`, `VIEW_HEIGHT=540`), game config, runtime store, asset manifest |
| `systems/` | Save persistence (localStorage `super_bart_save_v5`, schema migration v2→v5) and campaign progression logic |
| `levelgen/` | Deterministic procedural generation: seeded RNG, chunk-based with pacing phases (INTRO→PRACTICE→VARIATION→CHALLENGE→COOLDOWN→FINALE), per-world rules |
| `player/` | Movement feel (`stepMovement()` with world modifiers), form system (small/big/gpu/companion), animations, dust particles |
| `enemies/` | Enemy registry (15 types + 6 bosses): walker, shell, flying, spitter, snowman_sentry, cryo_drone, qubit_swarm, crawler, glitch_phantom, fungal_node, ghost_process, tape_wraith, resume_bot, compliance_officer, technical_debt. Boss system in `bosses/` with phase-driven `BossBase`. |
| `hazards/` | Moving platforms (oscillation) and thwomps (proximity-triggered) |
| `audio/` | Fully procedural Web Audio API — `AudioEngine` singleton, `sfx.ts` (oscillator-based), `music.ts` (pattern synth), `musicPresets.ts` (per-world) |
| `content/` | Content manifest with approved text, enemy/collectible contracts, HUD layout |
| `style/` | Style config, palette, player animation contracts, parallax profiles |
| `ui/` | HUD composition (lives, score, coins, evals, world/time) |
| `types/` | Shared type contracts (`game.ts`, `levelgen.ts`) |

### Key Architectural Patterns

- **Singleton AudioEngine**: `AudioEngine.shared()` manages master/music/sfx gain buses with limiter. SFX gains must be ≤ 0.3.
- **Runtime Store**: Global `runtimeStore` in `src/core/runtime.ts` carries cross-scene state (mode, save, seed, theme, difficulty).
- **Deterministic RNG**: `computeSeed(world, level)` produces reproducible seeds. Level generation must be deterministic — running `gen:all` twice should produce no diff.
- **Contract-Driven Validation**: Audio caps, playfeel metrics, content approvals, and visual style are all enforced via JSON contracts and validation scripts in `tools/`.
- **Campaign Topology**: Fixed `[4,4,4,4,4,4,4]` = 28 levels across 7 worlds. World 7 Stage 4 is the final boss (Omega).

### Data Flow

1. `loadSave()` normalizes schema and campaign unlock state
2. `computeSeed(world, level)` → deterministic seed for generation
3. `generateLevel()` → tile grid + entities + metadata
4. PlayScene materializes physics objects from generated payload
5. Events (coins, damage, goal) update runtime progression → `persistSave()`

### Tools (`tools/`)

TypeScript validation/generation scripts run via `tsx`:
- `audio_validate.ts` — SFX gain ≤ 0.3, music preset constraints, user gesture gate
- `style_validate.ts` — Visual style/HUD/bloom contract enforcement
- `content_validate.ts` — Content bible approved text validation
- `asset_validate.ts` — Asset file existence/naming
- `visual_regress.ts` — Playwright screenshot comparison against golden baselines
- `make_ui_assets.ts`, `make_bart_sprites.ts`, `make_body_spritesheet.ts` — Asset generators

### AI Theme Vocabulary

| Mario Concept | Super BART Equivalent |
|---|---|
| Coins | Tokens (API Credits) |
| Stars | Evals |
| Mushroom (grow) | Azure Subscription |
| Fire Flower | GPU Allocation |
| Star Power | Copilot Mode |
| 1-Up | Deploy to Prod |
| Poison Mushroom | Works On My Machine |
| Goomba | Hallucination |
| Koopa | Legacy System |
| Lakitu | Analyst |
| Bullet Bill | Hot Take |
| Chain Chomp | Technical Debt |
| Hammer Bro | Compliance Officer |
| Game Over | 429: TOO MANY REQUESTS |
| Level Clear | DEPLOYED TO PROD |
| World Map | SERVICE MAP |
| Castle Clear | BENCHMARKS IMPROVED |
| Lives | Instances |
| Score | Accuracy |
| Time | Latency |
| Deaths | Rollbacks |

### Enemy Roster

| Kind | Display Name | Behavior | World Introduced |
|---|---|---|---|
| walker | HALLUCINATION | Patrol + confusion flips | W1 (City) |
| shell | LEGACY SYSTEM | Retract/kick shell | W1 (City) |
| flying | HOT TAKE | Drift/burst pattern | W1 (City) |
| snowman_sentry | SNOWMAN SENTRY | Slow patrol + ice projectile, HP 2 | W2 (Tundra) |
| cryo_drone | CRYO-DRONE | Float + freezing beam, HP 2 | W2 (Tundra) |
| spitter | ANALYST | 3-shot spread, ground damage zones | W2 (Tundra) |
| qubit_swarm | QUBIT SWARM | Two-state dormant/active cycle | W3 (Quantum Void) |
| crawler | CRAWLER | Wall emerge + lunge, HP 2 | W4 (Catacombs) |
| glitch_phantom | GLITCH PHANTOM | Phase in/out 1.5s rhythm | W4 (Catacombs) |
| fungal_node | FUNGAL NODE | Stationary spore cloud on proximity | W4 (Catacombs) |
| ghost_process | GHOST PROCESS | Drifts through walls, solid 1s/4s | W5 (Graveyard) |
| tape_wraith | TAPE WRAITH | Reforms unless source reel destroyed | W5 (Graveyard) |
| resume_bot | RESUME BOT | Non-hostile paper automaton | W5 (Graveyard) |
| compliance_officer | COMPLIANCE OFFICER | Patrol, immune to fire, stomp = platform | W5 (Graveyard) |
| technical_debt | TECHNICAL DEBT | Anchored lunges, chain snaps | W6 (Singularity) |

### Boss Roster

| Boss | World | HP | Key Mechanic |
|---|---|---|---|
| The Watchdog | W1 (City) | 3 | Charge-stagger-expose |
| Glacial Mainframe | W2 (Tundra) | 8 | Beam sweeps + ice |
| The Null Pointer | W3 (Quantum Void) | 10 | Superposition phasing |
| Qubit Serpent | W4 (Catacombs) | 10 | Split decoy + spiral |
| Legacy Daemon | W5 (Graveyard) | 12 | Tape web + empathy mechanic |
| AI Overlord Omega | W6 (Singularity) | 20 | 4-phase scripted fight with Ping absorption |
| Singularity Apex | W7 (Apex) | — | Final gauntlet / epilogue |

### World Modifiers

| World | Theme | Friction | Gravity | Speed | Token Burn | Special |
|---|---|---|---|---|---|---|
| W1 | The City (Prologue) | 1.0 | 1.0 | 1.0 | 1.0 | Tutorial pacing |
| W2 | Cryo-Server Tundra | 1.0 | 1.0 | 1.0 | 1.0 | Ice physics, reduced traction |
| W3 | Quantum Void | 1.0 | 0.82 | 1.0 | 1.0 | Low gravity, gravity zones |
| W4 | Deep Web Catacombs | 0.6 | 1.0 | 1.0 | 1.0 | Signal drift (friction), darkness overlay |
| W5 | Digital Graveyard | 1.0 | 1.15 | 1.0 | 1.2 | Heavier, scarcer, faster burn |
| W6 | Singularity Core | 1.0 | 1.0 | 1.0 | 1.0 | Final boss gauntlet |
| W7 | Singularity Apex | 1.0 | 1.0 | 1.0 | 1.0 | Omega confrontation |

### Execution Contract

This repository uses a 12-phase autonomous build plan. See docs for details:
- `tools/phase_gate.py` — prerequisite checker per phase
- `docs/phase_status/` — completion markers
- `docs/decisions.md` — architectural decision log
- `docs/build_log.md` — task completion timestamps
- `.claude/agents/` — custom subagents (enemy-engineer, level-architect, juice-engineer, qa-reviewer)

### Key Decisions

- Phaser 3 Arcade Physics for deterministic 2D collisions
- Visual lock is contract-based (styleConfig + validators), not pixel-perfect frame matching
- World-space labels over gameplay entities are forbidden; only HUD and menu UI may render persistent text
- Save format is v5 internally with migration from v2/v3/v4
- Perf target: 60 FPS on mid-tier integrated-graphics laptop browsers
