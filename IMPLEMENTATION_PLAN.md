# Implementation Plan: Align Codebase to SCRIPT.md V4

## Overview

The codebase runs V3 architecture (7 worlds, 28 levels, generic enemies/bosses, Mario-style power-ups). SCRIPT.md V4 specifies 5 worlds + prologue, 13 enemy types, 6 unique bosses, new power-up system, Ping companion, and deep environmental storytelling. This plan gets from here to there.

Each phase is designed to leave the game in a working state. No phase depends on a later phase. Every phase has a verification step.

---

## Phase 0: Foundation Cleanup (No gameplay changes)
**Goal:** Update campaign topology and world definitions without breaking existing systems.

### 0A: Campaign Topology
**Files:** `src/core/constants.ts`, `src/content/scriptCampaign.ts`, `src/systems/progression.ts`, `src/types/game.ts`

- Change `CAMPAIGN_WORLD_LAYOUT` from `[4,4,4,4,4,4,4]` to `[3,4,4,4,4,3]`
  - Index 0 = Prologue: The City (2 stages + mini-boss = 3)
  - Index 1 = W1: Cryo-Server Tundra (3 stages + boss = 4)
  - Index 2 = W2: Quantum Void (3 stages + boss = 4)
  - Index 3 = W3: Deep Web Catacombs (3 stages + boss = 4)
  - Index 4 = W4: Digital Graveyard (3 stages + boss = 4)
  - Index 5 = W5: Singularity Core (gauntlet + approach + boss = 3)
  - Total: 22 stages
- Update `TOTAL_CAMPAIGN_LEVELS` to 22
- Update world definitions in `scriptCampaign.ts`:
  - Remove Silicon Forest, Abyssal Cloud, Magma Nexus
  - Add The City (Prologue)
  - Rename remaining worlds to match script
  - Assign correct biome colors (City amber, Tundra #6FA8DC, Void purple, Catacomb #5E7D4A, Graveyard #7A7A82, Core #D4B24A)
- Update stage titles to match script (P-1, P-2, P-Boss, 1-1, 1-2, 1-3, 1-Boss, etc.)
- Update `isBossStage()` logic for variable stages per world
- Update save schema migration (v5 to v6) to remap old world/stage data

### 0B: World Physics
**Files:** `src/levelgen/worldRules.ts`, `src/player/movement.ts`

- Set world modifiers per script:
  - Prologue: friction=1.0, gravity=1.0, speed=1.0, tokenBurn=1.0
  - W1 Tundra: friction=1.0, gravity=1.0, speed=1.0, tokenBurn=1.0
  - W2 Void: friction=1.0, gravity=1.0, speed=1.0, tokenBurn=1.0 (gravity zones handled per-entity, not global)
  - W3 Catacombs: friction=0.6 (signal drift), gravity=1.0, speed=1.0, tokenBurn=1.0
  - W4 Graveyard: friction=1.0, gravity=1.15, speed=1.0, tokenBurn=1.2
  - W5 Singularity: friction=1.0, gravity=1.0, speed=1.0, tokenBurn=1.0

### 0C: World Map
**Files:** `src/scenes/WorldMapScene.ts`, `src/content/scriptCampaign.ts`

- Update node count from 7 to 6 (Prologue + 5 worlds)
- Update node positions, labels, and colors
- Update `worldStates` schema for 6 worlds
- Keep existing fog/lock mechanics (visual upgrade comes in Phase 5)

### 0D: Narrative Content
**Files:** `src/content/scriptNarrative.ts`, `src/content/scriptPlacements.ts`

- Rewrite all interlude text to match script's 6-world structure
- Rewrite debrief documents (4 total: after W1-W4)
- Update choice trigger: Choice 1 fires after W4 stage 2 (not W6)
- Update Personnel File count from 35 to 25

**Verify:** Game boots, all 22 levels load, world map shows 6 nodes, save/load works, interludes and debriefs display correct text.

---

## Phase 1: Enemy Roster Expansion
**Goal:** Implement all 13 script enemy types with correct behaviors.

### 1A: New Enemy Definitions
**Files:** New files in `src/enemies/definitions/`

Create 9 new enemy classes:

| Enemy | File | Behavior | HP | World |
|-------|------|----------|-----|-------|
| SnowmanSentry | SnowmanSentry.ts | Slow patrol, ice projectile throw (arm-raise telegraph) | 2 | W1 |
| CryoDrone | CryoDrone.ts | Float (no gravity), freezing beam (slows Bart, ice-crystal visual) | 2 | W1 |
| QubitSwarm | QubitSwarm.ts | Two-state (dormant=translucent/harmless, active=solid/aggressive), visible rhythm toggle | 1 | W2 |
| Crawler | Crawler.ts | Emerges from walls (0.75s rustle+glow tell), lunges | 2 | W3 |
| GlitchPhantom | GlitchPhantom.ts | Phases in/out on consistent rhythm, contact damage during visible frames | 1 | W3 |
| FungalNode | FungalNode.ts | Stationary, releases spore cloud causing signal drift (local friction reduction) | 1 | W3 |
| GhostProcess | GhostProcess.ts | Drifts through walls, damageable only during brief solid phases (brightens before solid) | 2 | W4 |
| TapeWraith | TapeWraith.ts | Reforms unless source reel is Rack Pulsed (visible tether to reel) | 2 | W4 |
| ResumeBot | ResumeBot.ts | Non-hostile patrol, bumps and redirects, 1HP, no drops, destroyable but feels wrong | 1 | W4 |

### 1B: Update Enemy Registry
**Files:** `src/enemies/registry.ts`, `src/enemies/types.ts`

- Add all new enemy kinds to `EnemyKind` union
- Register spawn functions in registry
- Remove legacy aliases that don't match script (keep backward compat for save migration)

### 1C: Update World Rules
**Files:** `src/levelgen/worldRules.ts`

- Assign correct enemy pools per world:
  - Prologue: AI Bot (walker), Spam (flying), Bug (spitter)
  - W1: Snowman Sentry, Cryo-Drone, Firewall (multi-hit wall)
  - W2: Qubit Swarm
  - W3: Crawler, Glitch Phantom, Fungal Node
  - W4: Ghost Process, Tape Wraith, Resume Bot
  - W5: All previous as ghostly variants

### 1D: Update Existing Enemies
**Files:** `src/enemies/definitions/Boss.ts` (rename to generic), existing enemy files

- Firewall: Rework from shell (retract/kick) to multi-hit brick wall (3-10 HP, crack lines show damage, blocks paths)
- AI Bot: Rework walker to standard patrol robot behavior (simpler than Hallucination)
- Keep Hallucination, LegacySystem, HotTake, Analyst, TechnicalDebt, ComplianceOfficer for backward compat but remove from active world rules

**Verify:** Each enemy spawns correctly, has correct HP, telegraphs, animations, and death behavior. Run `npm test` to check contracts.

---

## Phase 2: Boss System Overhaul
**Goal:** Replace generic Boss class with 6 distinct boss implementations.

### 2A: Boss Architecture
**Files:** `src/systems/boss/BossController.ts`, new files in `src/enemies/definitions/bosses/`

Create a `BossBase` abstract class with hooks for:
- Phase transitions (HP thresholds)
- Attack patterns (per-phase)
- Dialogue display (timed text overlays)
- Victory sequence (silence > chip tone > dialogue)

### 2B: Individual Bosses

| Boss | File | Phases | Unique Mechanic |
|------|------|--------|-----------------|
| Watchdog | Watchdog.ts | 1 phase (charge > stagger > exposed, 3 hits) | Tutorial boss: learn the window |
| GlacialMainframe | GlacialMainframe.ts | 3 phases: beam sweeps, floor freeze, full freeze blast | Ice platforms rise during full-floor blast |
| NullPointer | NullPointer.ts | 3 phases: state alternation, desync forms, fragment to 4 | Superposition: solid vs. phased, only solid takes damage |
| QubitSerpent | QubitSerpent.ts | 3 phases: strike+coil, split to 2 (real+decoy), spiral constrict | Find the real one by inner glow brightness |
| LegacyDaemon | LegacyDaemon.ts | 4 phases: CRT projectiles, tape web, Phase 2.5 empathy, core expose | Phase 2.5: Manual Check vs. keep attacking choice |
| Omega | Omega.ts | 4 phases: geometric patterns, swarm (find real), deflect Override bar, 5-panel sequence | Ping absorption in Phase 2, dialogue system, override panel memory game |

### 2C: Boss Dialogue System
**Files:** New `src/systems/boss/BossDialogue.ts`

- Timed text display above arena during boss fights
- Supports Omega's multi-exchange conversations
- Integrates with phase transitions
- Bart's responses in different color/style

### 2D: Post-Boss Silence
**Files:** `src/scenes/PlayScene.ts`, `src/audio/AudioEngine.ts`

- On boss defeat: stop all audio immediately
- 2-second silence
- Single resonant chip tone
- Then victory dialogue
- Then debrief music/transition

**Verify:** Each boss has correct phase behaviors, dialogue triggers, victory sequences. Watchdog is beatable in ~30 seconds. Omega fight takes 3-5 minutes.

---

## Phase 3: Player Systems
**Goal:** Align player moveset and power-ups with script.

### 3A: Power-Up Overhaul
**Files:** `src/player/powerup.ts`, `src/types/game.ts`, `src/types/levelgen.ts`

Remove Mario-style form chain (small > big > gpu > companion). Replace with:

| Power-Up | Effect | Duration | Visual |
|----------|--------|----------|--------|
| Data Packet | Currency/Score (100 = 1UP) | Instant | Spinning blue diamond |
| Firewall Shield | Invincibility | 10s | Golden glow |
| Pulse Charge | Triple-shot Rack Pulse | 15s | Blue crackling aura |
| Bandwidth Boost | Speed +50% | 20s | Speed lines on sprite |
| Cache Restore | Full health | Instant | Green cross |
| Overclock | Slows all enemies | 10s | Screen tints blue |

- Health system: Replace form-based HP with a simple 3-hit system (small sprite throughout, no form changes)
- Invulnerability frames on hit (existing NES flicker works)

### 3B: Ping Companion
**Files:** New `src/player/Ping.ts`, `src/scenes/PlayScene.ts`

- Sprite: Small green cube with blinking LED eye
- States: idle (bounce), dim (scared), bright (near file), red-flicker (ghost proximity)
- Follow AI: Trails Bart with slight lag, stays nearby
- Passive abilities:
  - Supplementary green light in dark areas (W3+)
  - Brightens near uncollected Personnel Files (replaces badge flicker in W3+)
  - Enhanced integrity reports at Diagnostic Nodes
- Activation: Spawns mid-W3 Stage 3-1 (not present before)
- Arc events: Ghost corruption flicker (W4), absorption by Omega (W5 Phase 2), recovery (W5 Phase 4), credits console

### 3C: Ground Pound Enhancement
**Files:** `src/player/movement.ts`, `src/scenes/PlayScene.ts`

- Add stun effect on grounded enemies (1.5s freeze)
- Add cracked floor block destruction (new tile type)
- Keep existing downward velocity boost

### 3D: Double Jump Gate
**Files:** `src/systems/save.ts`, `src/scenes/PlayScene.ts`

- Verify Double Jump unlocks after W2 boss (Null Pointer), not earlier
- Add Lateral Thruster Module pickup to W2 Stage 2-3 escape sequence
- Test that W1-W2 levels are completable without Double Jump

**Verify:** All power-ups work correctly. Ping follows Bart in W3+. Ground Pound stuns and breaks. Double Jump gates properly.

---

## Phase 4: Level Design Alignment
**Goal:** Make level generation produce stages matching script descriptions.

### 4A: Bespoke Set-Pieces
**Files:** `src/levelgen/campaign_25_levels.ts` (rename from `campaign_25_levels.ts`), `src/levelgen/generator.ts`

The script calls for specific set-piece stages that can't be purely procedural:

| Stage | Type | Description |
|-------|------|-------------|
| P-1 | Tutorial | City streets, rooftops, zero-punishment |
| P-2 | Interior | Building 7, Bart's desk, server room, basement |
| 1-3 | Chase | Downhill avalanche on server panel, no Rack Pulse |
| 2-1 | Vertical | Gravity zones (green=up, red=down) |
| 2-2 | Ascent | Data streams (conveyor currents), zero-gravity section |
| 2-3 | Escape | Collapse sequence (falling platforms), Double Jump unlock |
| 4-2 | Narrative | Retraining Center (empty desks, Resume Bots, choice terminal) |
| 4-3 | Gauntlet | Ghost variants of all prior enemies, straight endurance |
| 5-1 | Exam | 5 Firewall enemies in sequence, one per world theme |
| 5-2 | Walk | No enemies, environmental transition to digital realm |

For these, create hand-authored `LevelSpec` entries with fixed chunk sequences rather than procedural generation. The generator already supports this via the `sequence` array in `LevelSpec`.

### 4B: Gravity Zone System (W2)
**Files:** New `src/hazards/gravityZone.ts`, `src/scenes/PlayScene.ts`

- Green-tinted zone: reduced gravity (0.5x), floaty jumps
- Red-tinted zone: heavy gravity (1.5x), short jumps
- Applied per-frame when player overlaps zone rectangle
- Visible, consistent, never random
- Used in W2 stages and W5 Void Firewall segment

### 4C: Auto-Scroll / Chase Mechanics
**Files:** `src/scenes/PlayScene.ts`

- W1 Stage 1-3 (Avalanche): Camera moves right at fixed speed, player slides on panel, only left/right/jump inputs, no Rack Pulse
- W2 Stage 2-3 (Collapse): Platforms shatter from edges inward on timer, player descends
- Reuse/adapt existing auto-scroll code from W5 (benchmark segments)

### 4D: Darkness / Headlamp (W3)
**Files:** `src/rendering/darkness.ts` (new), `src/scenes/PlayScene.ts`

- W3 stages: Screen mostly dark, headlamp illuminates cone in front of Bart
- Headlamp flickers on slow cycle (dim 1s every 8s in Stage 3-3)
- Ping provides supplementary green light (smaller radius)
- Implementation: Dark overlay with circular alpha mask following player + Ping

### 4E: Update Chunk Catalog
**Files:** `src/levelgen/worldRules.ts`, chunk template files

- Add new chunk tags for script-specific elements:
  - GRAVITY_ZONE, DATA_STREAM, DARK_CORRIDOR, FUNGAL_PATCH, TAPE_ARCHIVE, DESK_ROWS
- Assign to appropriate world rules
- Remove chunks that reference cut worlds (Silicon Forest canopy, Magma heat vents, etc.)

**Verify:** Each stage loads with correct theme, enemies, and mechanics. Chase stages work. Gravity zones work. Darkness works. All 22 levels completable.

---

## Phase 5: Environmental Storytelling & Narrative
**Goal:** Implement the visual storytelling layer.

### 5A: Monitor Terminal System
**Files:** New `src/systems/MonitorSystem.ts`, `src/scenes/PlayScene.ts`

- Monitors display scrolling text on proximity (player within 3 tiles)
- Text pulled from `scriptNarrative.ts` per world
- Visual: CRT-style green/amber text on dark rect, scanline effect
- 6 distinct messages (one per world) matching script exactly

### 5B: Poster Rendering
**Files:** `src/scenes/PlayScene.ts`, `src/content/scriptNarrative.ts`

- 6 poster textures with text: "AUTOMATE TO LIBERATE", etc.
- Decay variants: pristine (Prologue, W1-W2), torn (W3), defaced (W4), absent (W5)
- Implementation: Billboard sprite + overlaid bitmap text, decay = alpha mask + tear sprites

### 5C: Personal Effects
**Files:** `src/scenes/PlayScene.ts`, level generation

- Type-specific sprites: coffee_mug, photo_frame, jacket, lunchbox, graffiti_text
- Placed per script locations:
  - Prologue: Bart's desk items, Employee of the Month
  - W1: Bunkroom props, sealed lunchbox
  - W3: Tool marks, tally wall
  - W4: Empty desks, Retraining Center modules

### 5D: Personnel File Display UI
**Files:** New `src/ui/PersonnelFileViewer.ts`, `src/content/personnelFiles.ts`

- Create content file with all 25 Personnel File profiles
- On collection: pause gameplay briefly, display file in styled overlay
- Name, role, years, post-displacement status
- Track in save, show in Pause Menu gallery

### 5E: Encrypted Fog Visual
**Files:** `src/scenes/WorldMapScene.ts`

- Red animated static over fogged nodes (noise shader or sprite animation)
- Faint pulsing question marks on hidden nodes
- Fog crack dissolve animation (2s) when next world revealed
- Singularity Core full-reveal event when W4 cleared

### 5F: Debrief Beat Animations
**Files:** `src/scenes/DebriefScene.ts`

- Part 1: Bart walk-out animation (sprite moves right, lights dim behind)
- Part 2: Badge hologram effect (document text with amber glow frame)
- Part 3: Map camera rise, node transform animation, fog crack

### 5G: Credits Sequence
**Files:** `src/scenes/CreditsScene.ts`

- 6 world-specific vignettes showing restoration:
  - City: people, jobs fair flyer
  - Tundra: crew returns, lunchbox found
  - Void: maintenance notice, Ping fragment
  - Catacombs: lights installed, tally mark 2,848
  - Graveyard: chairs back, mentoring scene
  - Core: human at console, Ping monitoring
- Scroll format with parallax backgrounds per world
- Personnel File count integration
- Choice-affected details (Employee of Month photo present/absent based on Choice 1)

**Verify:** All environmental storytelling renders correctly. Personnel Files display profiles. Fog system animates. Credits show all 6 vignettes.

---

## Phase 6: Audio Alignment
**Goal:** Match audio to 6-world structure and script requirements.

### 6A: Music Presets
**Files:** `src/audio/musicPresets.ts`

- Map existing presets to new worlds:
  - Prologue (City): Azure preset (bright, welcoming) -- slight rework for urban feel
  - W1 (Tundra): Pipeline preset (tension, cold) -- add high shimmer for ice
  - W2 (Void): Enterprise preset (floating, Lydian) -- fits quantum ethereal
  - W3 (Catacombs): GPU preset (brooding, minor) -- add low-pass filter for underground
  - W4 (Graveyard): New preset needed: muted, ghostly, sparse
  - W5 (Singularity): Benchmark preset (tense, fast) -- fits finale

### 6B: New SFX
**Files:** `src/audio/sfx.ts`

Add SFX for new mechanics:
- `freeze_beam`: Cryo-Drone attack sound
- `ice_shatter`: Ice enemy defeat
- `qubit_shift`: Qubit Swarm state change
- `crawler_emerge`: Wall emergence sound
- `phantom_phase`: Glitch Phantom materialization
- `spore_cloud`: Fungal Node release
- `ghost_wail`: Ghost Process becoming solid
- `tape_reel`: Tape Wraith reform
- `paper_puff`: Resume Bot destruction
- `ping_glow`: Ping brightens near file
- `gravity_zone_enter`: Entering gravity zone
- `override_chip`: Chip recovery tone (single resonant note)
- `fog_crack`: World map fog dissolve

### 6C: Post-Boss Silence Protocol
**Files:** `src/scenes/PlayScene.ts`, `src/audio/AudioEngine.ts`

Implement exact sequence:
1. Boss HP hits 0: all audio stops immediately
2. 2-second pure silence
3. Override chip tone (new SFX: sustained resonant note, 1.5s)
4. Victory dialogue text appears
5. Debrief Beat music begins

**Verify:** Each world has distinct music. All new SFX play. Post-boss silence feels correct. No audio gaps or pops.

---

## Phase 7: Post-Game Systems
**Goal:** Implement replay and NG+ features.

### 7A: Bart's Rules (New Game+)
**Files:** New `src/systems/bartsRules.ts`, `src/scenes/WorldMapScene.ts`, `src/scenes/PlayScene.ts`

- Post-completion menu at Bart's workbench (new title screen variant)
- 5 toggleable rules:
  1. No Handouts: power-ups disabled
  2. Manual Override: checkpoints disabled
  3. Trust Nothing: telegraphs -30%, boss windows -20%
  4. Analog Only: Rack Pulse half range, charge 2.5s
  5. The Full Bartkowski: all four active
- Rules stored in save, applied in PlayScene via modifiers
- Completion reward: second iron visual on workbench

### 7B: Omega Logs
**Files:** New `src/content/omegaLogs.ts`, `src/scenes/PlayScene.ts`

- Unlock when all 25 Personnel Files collected
- On replay, monitors display Omega's internal logs instead of standard messages
- 5 log entries (one per world) showing Omega's escalating confusion
- Red glow on monitor terminals in Omega Log mode

### 7C: Maintenance Access
**Files:** `src/scenes/WorldMapScene.ts`, `src/scenes/PlayScene.ts`

- After beating a world's boss, player can revisit any stage in that world
- 50% enemy spawn density
- File counter per stage (shows uncollected count)
- Already partially implemented (M key toggle exists) -- flesh out spawn reduction

**Verify:** All 5 Bart's Rules work individually and combined. Omega Logs display on replay. Maintenance Access reduces enemies and shows file counters.

---

## Phase 8: Polish & Validation
**Goal:** Final pass for consistency, feel, and test coverage.

### 8A: Content Validation Update
**Files:** `tools/content_validate.ts`, `src/content/contentManifest.ts`

- Update approved UI text for new world names, enemy names, power-up names
- Update HUD text validation
- Update Personnel File count (25, not 35)

### 8B: Asset Generation
**Files:** `tools/make_ui_assets.ts`, `tools/make_bart_sprites.ts`

- Generate sprites for new enemies (procedural, per existing pattern)
- Generate Ping sprite (green cube, 4 states)
- Generate poster textures
- Generate Personnel File UI assets

### 8C: Visual Regression Baselines
**Files:** `tools/visual_regress.ts`

- Capture new golden screenshots for all 6 worlds
- Update world map baseline
- Add HUD baselines with new power-up indicators

### 8D: Integration Testing
- Full playthrough: Prologue through W5 Omega
- Verify all 25 Personnel Files are findable
- Verify both choices work with all 4 ending variants
- Verify Ping arc (introduction, ghost corruption, absorption, recovery, credits)
- Verify Bart's Rules NG+
- Verify Omega Logs mode
- Performance: maintain 60 FPS target

### 8E: Update CLAUDE.md
**Files:** `CLAUDE.md`

- Update campaign topology section ([3,4,4,4,4,3] = 22 levels)
- Update enemy roster table
- Update AI Theme Vocabulary table (remove old Mario mappings)
- Update world modifier table
- Update save version (v6)

---

## Dependency Graph

```
Phase 0 (Foundation) ─────────────────────────────────────────┐
  ├── Phase 1 (Enemies) ──── Phase 2 (Bosses)                │
  ├── Phase 3 (Player) ──── Phase 4 (Level Design)           │
  │                              │                             │
  │                    Phase 5 (Storytelling)                  │
  │                              │                             │
  │                    Phase 6 (Audio)                         │
  │                              │                             │
  │                    Phase 7 (Post-Game)                     │
  │                              │                             │
  └──────────────────── Phase 8 (Polish) ─────────────────────┘
```

Phases 1 and 3 can run in parallel after Phase 0.
Phases 2 and 4 can run in parallel after their prerequisites.
Phase 5 requires Phases 1-4 (needs enemies, bosses, player, and levels in place).
Phase 6 can run after Phase 0 (independent of gameplay).
Phase 7 requires Phase 5 (needs full content).
Phase 8 is final and requires everything.

---

## Estimated Scope

| Phase | Files Touched | New Files | Complexity |
|-------|--------------|-----------|------------|
| 0: Foundation | ~12 | 0 | Medium (high risk: save migration) |
| 1: Enemies | ~5 | 9 | Medium (repetitive, well-patterned) |
| 2: Bosses | ~4 | 8 | High (each boss is unique) |
| 3: Player | ~6 | 2 | Medium (power-up swap, Ping) |
| 4: Levels | ~8 | 3 | High (set-pieces, new mechanics) |
| 5: Storytelling | ~6 | 5 | Medium (content-heavy, less logic) |
| 6: Audio | ~3 | 0 | Low-Medium (preset tweaks + new SFX) |
| 7: Post-Game | ~4 | 3 | Medium (systems, not content) |
| 8: Polish | ~8 | 0 | Low (validation, docs) |

Total: ~30 new files, ~56 files modified.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Save migration breaks existing saves | High | Thorough v5-to-v6 migration with fallback to fresh save |
| Boss fights too complex to test | High | Each boss in isolation first, integration second |
| Level generation breaks with new topology | High | Keep old generator logic, swap campaign spec only |
| Ping companion causes performance issues | Medium | Simple follow AI, no pathfinding, one sprite + one light |
| Gravity zones conflict with world modifiers | Medium | Gravity zones override local area only, not global physics |
| 22 levels isn't enough content | Low | Script stages are longer and more varied than current uniform stages |
