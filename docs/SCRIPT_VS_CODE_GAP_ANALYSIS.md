# Super BART: Script vs. Code Gap Analysis PRD

**Date:** 2026-02-14
**Author:** Damian Hasak / Claude
**Source Documents:** `SCRIPT.md` (V4 narrative script) vs. live codebase (`src/`)

---

## 0.1 Canonical Title Contract Audit

- Canonical game title: `SUPER BART: CLOUD QUEST`
- Canonical references and enforcement points:
  - `SCRIPT.md:1`
  - `src/content/contentManifest.ts:181` (`GAME_TITLE`)
  - `src/style/styleConfig.ts:384` (`titleLayout.wordmark.copy`)
  - `src/scenes/TitleScene.ts` (`renderTitleUi` + `renderTitleSupplementalText`)
  - `tools/style_validate.ts` (`TITLE` visual gate)
  - `docs/voice_guides/ui_text.md:23`
  - `docs/screenshots/title_expected.md:7`

Acceptance checks:
- Case-sensitive grep over all code/docs must always include exact string `SUPER BART: CLOUD QUEST` in title-contract assets.
- `TitleScene` must only render the wordmark when `titleMode === 'game-name-only'`.
- No non-empty title subtitle/prompt/hints fields are rendered in runtime when `titleMode === 'game-name-only'`.
- `docs/voice_guides/ui_text.md` and `docs/screenshots/title_expected.md` must continue to document title-only behavior.

## 0. GAP EXECUTION MATRIX (Contract / Ownership / Acceptance)

| Gap | Current mismatch | Priority | Owner | Effort | Action | Evidence | Acceptance |
|---|---|---:|---|---:|---|---|---|
| Strict title text contract | No default-title subtitle/prompt/hints copy allowed in game-name-only mode | P0 | UI/UX + Rendering | S | Keep `titleMode` in `game-name-only`, suppress subtitle/prompt/hints rendering in `TitleScene`, and validate empty title-mode payloads in `tools/style_validate.ts` | `src/style/styleConfig.ts:384`, `src/scenes/TitleScene.ts`, `tools/style_validate.ts`, `docs/voice_guides/ui_text.md:23`, `docs/screenshots/title_expected.md:9-10` | Only `title_logo`/wordmark and Bart portrait are visible in normal title flow |
| Global naming consistency | Canonical title string is enforced in content, runtime, and tooling; no drift allowed | P0 | Content + Docs | S | Enforce `GAME_TITLE` as the single source, use `titleLayout.wordmark.copy`, and verify all canonical title references remain `SUPER BART: CLOUD QUEST` | `src/content/contentManifest.ts:181`, `src/scenes/TitleScene.ts:243-248`, `src/style/styleConfig.ts:401`, `tools/style_validate.ts`, `docs/voice_guides/ui_text.md:23`, `docs/screenshots/title_expected.md:7`, `docs/SCRIPT_VS_CODE_GAP_ANALYSIS.md:34` | Every reviewed contract and runtime source renders `SUPER BART: CLOUD QUEST` |
| Campaign topology mismatch docs vs runtime | Runtime docs disagree on world/level totals | P1 | Content + Docs | S | Clarify that runtime is 7x4 and document script/runtime mismatch explicitly | `src/core/constants.ts:19`, `src/content/scriptCampaign.ts:70`, `src/scenes/WorldMapScene.ts:50`, `SCRIPT.md:55-57`, `SECTION 2.1` | Documented in both working and intent-divergence sections without silent assumptions |
| Fog progression state machine | Runtime had fog overlays and a partial reveal; richer accents were inconsistent | P1 | Engine/Map | M | Keep 3-state fog-state contract (unclaimed/next/revealed), then keep reveal dissolve and accents behind `revealWorld` payload | `src/scenes/WorldMapScene.ts:349-420`, `src/scenes/InterludeScene.ts:27`, `src/scenes/DebriefScene.ts` | Unclaimed/next worlds render fog overlays; completion payload now triggers timed reveal dissolve with accent treatment |
| Debrief cinematic depth | Script beat timing was text-first, with limited cinematic projection | P1 | Narrative + Play | M | Keep 3-beat timing (exit/intercept/map), preserve reveal gating and add projection + map reveal visuals around existing timing | `src/scenes/DebriefScene.ts`, `src/scenes/WorldMapScene.ts` | Part 1/2/3 sequencing and payload-driven map transition now include projection panel and map reveal beat visuals |
| Set-piece implementation vs chunk generation | Set-piece descriptors are present, but scripted choreography is still simplified | P1 | Level Gen + Play | M–L | Expand `setPieceMode` handling so 1-3, 2-3, 5-2 alter movement/enemy/hazard behavior beyond token metadata | `src/levelgen/scriptCampaignLevels.ts`, `src/levelgen/generator.ts`, `src/scenes/PlayScene.ts:220-900` | Stage-specific behavior is visible in Avalanche/Collapse/Approach worlds and remains deterministic per metadata |
| Maintenance + encounter density contract | 50% replay enemy density is enforced and file counter is displayed | P2 | Systems + UI | S | Keep `applyMaintenanceDensity` gating in `PlayScene` and keep maintenance file counter in HUD payload | `src/systems/maintenanceAccess.ts`, `src/scenes/PlayScene.ts`, `src/ui/hud.ts` | Maintenance replay applies reduced density and shows `FILES: X/Y` in HUD |
| Power-up vocabulary contract | Canonical item naming is duplicated across script and UI/code contexts | P2 | Content Pipeline | M | Define/consume a canonical ID→display-name map for all pickup render/summaries | `src/content/contentManifest.ts:254`, `src/scenes/PlayScene.ts:414` | One approved display map used everywhere pickups are emitted |

---

## Problem Statement

The game design narrative (SCRIPT.md) describes a specific creative vision for Super BART's Cloud Quest. The codebase has been built autonomously through a 12-phase build plan. Significant divergences exist between the script's intent and what shipped. Some divergences are improvements. Some are regressions. Some are features that never made it into code at all. This document catalogs every meaningful gap so the team can prioritize what to fix, what to accept, and what to build next.

---

## 1. WORKING AS INTENDED (Script-Faithful or Better Than Scripted)

### 1.0 Title contract is canonicalized

- Canonical game title is defined in `src/content/contentManifest.ts` as `GAME_TITLE = 'SUPER BART: CLOUD QUEST'`.
- Title-screen flow uses `styleConfig.titleLayout.titleMode: 'game-name-only'` so `TitleScene` only renders the canonical title wordmark (plus hero marker) in normal operation.
- `tools/style_validate.ts` enforces `titleLayout.wordmark.copy === GAME_TITLE`, and title screenshot gate documentation requires the canonical logo text.

### 1.1 Narrative Content System -- Fully Realized

The environmental storytelling layer described in the script is implemented with surprising fidelity:

- **17 interludes** with text pulled directly from script passages (Bart's apartment, the bunkroom poker game, the tally wall, the CRT monitors)
- **4 debrief documents** matching the script's intercept beats (QV-1 brief, decommission order, Dr. Sara Reyes voice log, the "REMAINING OBSTACLE: 1" projection)
- **25 personnel files** across all worlds, with character profiles matching script samples (Janet Okonkwo's 404 Burger, Dmitri Volkov's three visits, the anonymous Ghost architect, Thomas Abadi the HR coordinator)
- **6 Omega logs** unlocked after full collection, with text matching the script's escalating self-awareness arc ("WHAT IS HE THAT I AM NOT?")
- **Monitor messages** per world matching the script's propaganda/system status progression
- **2 player choices** (delete personnel records, reboot network) implemented via a dedicated ChoiceScene

**Verdict:** The narrative content pipeline is the strongest area of script fidelity. The content bible validation system (`tools/content_validate.ts`) ensures approved strings stay locked.

### 1.2 Boss Roster -- All Six Implemented with Correct Phase Structures

| Boss | Script HP | Code HP | Phases Match? |
|------|-----------|---------|---------------|
| The Watchdog | 3 | 3 | Yes (charge-stagger-expose) |
| Glacial Mainframe | 8 | 8 | Yes (beam sweeps, floor freeze, floating platforms) |
| The Null Pointer | 10 | 10 | Yes (superposition phasing, desync, fragmentation) |
| Qubit Serpent | 10 | 10 | Yes (split decoy, constricting spiral) |
| Legacy Daemon | 12 | 12 | Yes (CRT projectiles, tape web, stun window at 35%) |
| Omega | 20 | 20 | Yes (4 phases, Ping absorption, override bar, memory sequence) |

The Legacy Daemon's empathy mechanic (the "SHUTDOWN? [Y/N]" stun window at 35% HP where aggressive vs. Manual Check paths diverge) is implemented. Omega's 5-panel memory sequence in Phase 4 (City amber, Tundra blue, Void purple, Catacomb green, Graveyard gray) is implemented. These are the two hardest boss designs in the script, and both made it to code.

### 1.3 Enemy Roster -- 15 Types, All Behavioral Contracts Met

Every enemy from the script's bestiary exists in the registry with correct world introductions, HP values, and behavior patterns. The code adds a few enemies not in the script (snowman_sentry and cryo_drone in Tundra match the script's descriptions even though the bestiary table uses different formatting). The Resume Bot's "non-hostile, drops nothing, destroying feels wrong" design is faithfully implemented.

### 1.4 Ping Companion -- Full Arc

Ping is implemented as described: green cube with LED eye, follows Bart, provides supplementary light, brightens near personnel files, gets absorbed during Omega Phase 2, recovered in Phase 4. The emotional beats are preserved in code.

### 1.5 Bart's Rules (New Game+) -- All Five Constraints

Implemented exactly as scripted: No Handouts, Manual Override, Trust Nothing, Analog Only, and The Full Bartkowski. Stored in save state, enforced at runtime.

### 1.6 World Modifiers -- Correctly Applied

| World | Script Gravity | Code Gravity | Script Friction | Code Friction |
|-------|---------------|-------------|-----------------|---------------|
| W4 Catacombs | -- | -- | 0.6 | 0.6 |
| W5 Graveyard | 1.15 | 1.15 | -- | -- |
| W5 Token Burn | 1.2x | 1.2x | -- | -- |
| W3 Void | 0.82 | 0.82 | -- | -- |

### 1.7 Procedural Generation Quality

The level generator uses a chunk-based pacing system (INTRO, PRACTICE, VARIATION, CHALLENGE, COOLDOWN, FINALE) that maps well to the script's five-beat tension-release cycle (Approach, Build, Spike, Release, Payoff). Deterministic seeded RNG ensures reproducibility.

### 1.8 Maintenance Replay Contract Baseline

- Maintenance replay enemy density now follows `applyMaintenanceDensity(100)` in `PlayScene.shouldSpawnEnemyInMaintenance`, which enforces the helper-backed 50% density reduction.
- HUD receives `FILES: X/Y` from `getMaintenanceFileCounterText` during maintenance mode.
- This closes the runtime contract gap for visibility and density; balancing still remains in scope of combat-pass tuning.

---

## 2. INTENT DIVERGENCE (Script Alignment Gaps)

### 2.1 Campaign Structure -- 28 Levels Instead of 22

**Script target:** `SCRIPT.md` defines a 6-zone outline (city + five remote hubs) with a 22-level arc.
**Code:** `src/core/constants.ts` and `src/content/scriptCampaign.ts` currently use `CAMPAIGN_WORLD_LAYOUT = [4, 4, 4, 4, 4, 4, 4]` and `SCRIPT_WORLD_DEFINITIONS = 7` IDs, for 28 levels.

The code adds a 7th world ("Singularity Apex") and pads each zone to 4 stages. This is a fundamental structural divergence:

- The script's Prologue (3 stages + mini-boss) becomes a full 4-stage world, diluting the tutorial pacing.
- The script's Singularity Core (gauntlet + approach + boss = 3 stages) splits into two worlds (6 and 7), breaking the narrative compression of the finale.
- The [3,4,4,4,4,3] shape was deliberate: shorter bookends frame the 4-stage core worlds. The uniform [4,4,4,4,4,4,4] removes that asymmetry.

**Impact:** The script explicitly calls out that the Prologue should be shorter (tutorial pacing) and the finale should be compressed (urgency, no filler). Padding both to 4 stages works against the design intent.

**Recommendation:** P0. Restore the [3,4,4,4,4,3] layout. Collapse worlds 6+7 back into a single Singularity Core. Remove the padding stages or repurpose their content.

### 2.2 Player Combat -- Stomp-Dominant Instead of Rack Pulse-Primary

**Script:** Rack Pulse (B button, short-range EMP burst) is Bart's signature attack. Ground Pound (A+Down) is secondary. Stomp is not mentioned as a primary attack verb. Charged Rack Pulse (B hold 1.5s) provides 2x damage.

**Code:** Rack Pulse exists (`emitRackPulse()` in PlayScene) but the primary interaction model is stomp-based (Mario-style). Score values reference "stomp" as the core combat action (100 points). The movement system tracks jump/land/coyote time but not Rack Pulse cooldowns or ranges as first-class feel parameters.

The script is clear: "Rack Pulse" is Bart's identity. "It's infrastructure repurposed as a weapon, which is Bart's entire identity." The current implementation treats it as a secondary ability rather than the primary combat verb. The feel system (`movement.ts`) has no Rack Pulse integration -- no wind-up frames, no recovery feel, no knockback on charged shots.

**Impact:** The game plays like Mario with an optional ranged attack. The script describes a game where the ranged EMP burst is the signature mechanic and stomping is incidental. This changes the entire combat identity.

**Recommendation:** P0. Rack Pulse needs to become the primary combat verb with full feel integration: wind-up frames, recovery, knockback, enemy-specific reactions (AI Bots spark and stagger, Bugs flip, Firewalls crack). Stomp should remain viable but not dominant.

### 2.3 Encrypted Fog System -- Baseline Implemented with Reveal Accents Added

**Script:** The World Map uses an Encrypted Fog system where only the next world is visible. Clearing a world triggers a fog-crack reveal animation (2-second dissolve) exposing the next biome. The Singularity Core stays hidden until all four main worlds are cleared, then reveals in a dramatic full-fog dissolution.

**Code:** WorldMapScene now renders fog overlays for `unclaimed/next` worlds, supports `revealWorld` payloads from level completion, performs timed dissolve transitions, and adds reveal accents/staggered dissolve timing.

The script calls the fog system out as serving three specific functions: preventing cognitive overload, creating discovery rewards, and building anticipation for the finale. It also calls the fog reveal a "dopamine multiplier" that adds an anticipation spike neurologically distinct from satisfaction. This isn't decoration -- it's core reward architecture.

**Impact:** Reveal timing and state mechanics are now implemented with an initial presentation layer, but there is still room for richer motif assets and per-world atmospheric reveal choreography.

**Recommendation:** P1. Keep the state machine and progressively layer richer textures and per-world crack motifs until reveal reads as a signature moment.

### 2.4 Living Map -- Partial Reclamation Feedback Implemented

**Script:** Cleared world nodes transform visually: red pulse dies, biome color returns, tiny figures appear (people returning), lights turn on, paths between nodes steady and clear. By game end, the full map is alive with five glowing biome nodes and tiny figures at each.

**Code:** `reclaimedFigureTweens` and `renderLivingMapFigures()` now render reclaim markers on reclaimed worlds and apply node/path state responses. The full 3-layer cinematic transformation and per-world reveal accents are still pending.

**Impact:** The world map lacks the "reclamation as reward" visual feedback the script designed as a progress indicator.

**Recommendation:** P1. Expand the current marker-based baseline into the full per-world reveal sequence while preserving state timing.

### 2.5 Inter-Stage Interludes -- Walk Transitions Missing

**Script:** Between stages, a 3-5 second walk transition plays. Bart moves through a corridor with one piece of environmental storytelling visible (monitor, poster, personal effect, graffiti). No input required. These provide pacing cooldowns.

**Code:** InterludeScene exists and delivers the text content, but the script describes these as visual walk-through moments with environmental props, not text overlays. The text is there; the spatial experience is not.

**Impact:** Interludes read as UI text boxes rather than environmental moments. The script's design principle -- "The satire lives in the environment, not in the dialogue" -- is undermined when the delivery mechanism is dialogue-style text.

**Recommendation:** P2. The text content is correct. Visual presentation could be enhanced to show Bart walking past the described element, but this is polish, not structural.

### 2.6 Debrief Beats -- Timing + Projection/Major Reveal Visuals Implemented

**Script:** 15-20 second non-interactive sequences with three parts: Exit (Bart walks out, facility dims), Intercept (badge hologram document, skippable after 2s), Map (fog crack reveal). Three distinct reward types in 15 seconds.

**Code:** DebriefScene now implements the three-beat timing, optional skip, projection panel for intercept text, and map-reveal beat visuals with world-state-driven reveal fog and node highlighting.

**Impact:** Timing, handoff logic, and projection/map reveal beats are now all present; the scene now delivers measurable cinematic progression between beats.

**Recommendation:** P1. Keep the current timing implementation and restore projection/motion visuals around the existing beat boundaries.

### 2.7 Ping Introduction Timing

**Script:** Ping is introduced in Stage 3-1 (Deep Web Catacombs, the third main world).
**Code:** Ping appears from W4+ (the fourth world in the 7-world structure).

This is likely a consequence of the world count divergence -- the code's W4 maps to the script's W3 (Catacombs). But if the intent was to match world names, Ping should appear in Catacombs regardless of its world number.

**Recommendation:** P1. Verify Ping's introduction world matches Catacombs, not a specific world number.

---

## 3. NOT IMPLEMENTED (Missing Script Features)

### 3.1 Manual Check / Diagnostic Nodes -- Data Exists, Mechanic Unclear

**Script:** Down + B (hold 1s near terminal) triggers Manual Check. Diagnostic Nodes (2-3 per stage) reveal hidden patrol routes, hazard timing, Personnel File proximity pings, or structural weaknesses for 15-20 seconds. This is a core optional mechanic that turns "Check the fans. Check the rails." into a gameplay verb.

**Code:** `scriptPlacements.ts` defines diagnostic node budgets per world (3 for Prologue, 2-3 for W1-W2, 2 for W3-W4, 1 for W5). PlayScene references diagnosticNodes. But the full input mechanic (hold Down+B, 1-second interruptible animation, 15-20 second intel reveal with patrol route overlays and hazard timing visualization) is not clearly implemented as a rich information system.

**Impact:** The Manual Check is the script's answer to "how does Bart's engineering identity express mechanically beyond combat?" Without it, Bart is just a fighter. With it, he's an engineer who fights. The script explicitly says: "The player who stops to check gets a tactical edge. The player who rushes gets a complete, fair game."

**Recommendation:** P1. The data scaffolding exists. The mechanic needs full input binding, animation, and intel overlay rendering.

### 3.2 Double Jump Gating

**Script:** Double Jump unlocked after World 2 (Quantum Void) by finding the Lateral Thruster Module. Worlds 1-2 are designed around single-jump precision. The Quantum Void's gravity zones serve as a mechanical bridge to prepare for Double Jump.

**Code:** Double Jump exists in the save state (`doubleJump` flag in `types/game.ts`). The unlock mechanism and the "brief safe platforming section to test Double Jump before the boss" are referenced but the narrative delivery (finding the Lateral Thruster Module in the Void's wreckage during the collapse escape sequence) may not be implemented as a story moment.

**Recommendation:** P2. Verify the unlock is gated correctly and has narrative framing.

### 3.3 Ground Pound

**Script:** A + Down input. Slams downward, stuns grounded enemies, breaks cracked floor blocks. Mentioned as a core action available from start.

**Code:** `groundPound` is referenced in PlayScene but the full mechanic (stun radius, cracked block interaction, floor break VFX) needs verification as a first-class ability rather than a simple downward attack.

**Recommendation:** P2. Verify implementation completeness.

### 3.4 Set-Piece Stages

**Script describes three set-piece stages** that break the standard platforming formula:

1. **Stage 1-3: Avalanche Alley** -- Downhill chase on a torn server panel. Left/right/jump only, no Rack Pulse. Collectibles line optimal paths. Avalanche pursues from behind. "The game's first set-piece sequence."
2. **Stage 2-3: The Collapse** -- Escape sequence. Quantum Void collapses inward, crystal platforms shatter in sequence. Bart races downward using gravity zones to accelerate.
3. **Stage 5-2: The Approach** -- Single long corridor. No enemies. No hazards. Music drops to a low hum. Pure atmosphere. "Check the fans."

**Code:** Level generation is chunk-based and pacing-aware, but auto-scroll sequences appear limited to W6 ("benchmark" mode). The script's set-pieces require hand-crafted or heavily scripted generation, not standard chunk assembly.

**Impact:** Set-pieces are the script's pacing relief valves -- moments where the game changes its own rules to create memorable peaks. Without them, every stage is a variation on the same platforming template.

**Recommendation:** P1. Avalanche Alley and The Collapse are the highest-impact set-pieces. The Approach (no enemies, pure walk) could be implemented cheaply as a generation preset with zero enemy/hazard spawns.

### 3.5 Power-Up Set -- Vocabulary Mismatch

**Script power-ups:**
| Item | Effect |
|------|--------|
| Data Packet | Currency/Score (100 = 1UP) |
| Firewall Shield | 10s invincibility |
| Pulse Charge | Triple-shot Rack Pulse 15s |
| Bandwidth Boost | +50% move speed 20s |
| Cache Restore | Full health |
| Overclock | Slows all enemies 10s |

**Code power-ups (from AI theme vocabulary):**
| Item | Equivalent |
|------|-----------|
| Tokens (API Credits) | Coins |
| Evals (Override Shards) | Stars |
| Azure Subscription | Mushroom (grow) |
| GPU Allocation | Fire Flower |
| Copilot Mode | Star Power |
| Deploy to Prod | 1-Up |
| Works On My Machine | Poison Mushroom |
| Semantic Kernel | Companion form |

The code uses the CLAUDE.md theme vocabulary (Mario equivalents) while the script defines its own power-up names. These are two different naming systems that don't fully overlap. The script's "Firewall Shield," "Pulse Charge," "Bandwidth Boost," and "Overclock" don't appear in the code's vocabulary. The code's "Azure Subscription," "Semantic Kernel," and "Works On My Machine" don't appear in the script.

**Impact:** Cosmetic, but creates confusion about which vocabulary is canonical.

**Recommendation:** P2. Reconcile the two vocabularies. The code's AI-themed names are funnier and more on-brand. The script's names are more descriptive of function. Pick one system.

### 3.6 Corporate Propaganda Posters -- Decay Progression

**Script:** Six specific poster texts ("AUTOMATE TO LIBERATE," "YOUR REPLACEMENT ISN'T YOUR REPLACEMENT. IT'S YOUR UPGRADE." etc.). In Prologue and W1-W2 they're intact. In W3-W4 they're torn, defaced, half-eaten by decay. In W5 they're absent.

**Code:** Poster placement budgets exist in `scriptPlacements.ts` (2 per stage in Prologue, 1-2 in W1-W2, 0-1 in W3-W4, 0 in W5-W6). The decay variant rendering (overlay effects vs. separate assets) needs verification.

**Recommendation:** P2. The placement data is correct. Visual decay variants may need implementation.

### 3.7 The Empty Chair Motif

**Script** describes a specific chair progression across all six worlds as a recurring visual motif:
- Prologue: Bart's chair, pushed back, still there
- W1: Chairs stacked in a corner
- W2: No chairs (facility never designed for humans)
- W3: Single chair facing a dead terminal
- W4: Desks but no chairs (the absence is deafening)
- W5: No desks, no chairs

This motif is described as a core thematic device. It's not referenced in the codebase.

**Recommendation:** P2. Environmental detail that could be added as a generation rule or prop placement pattern.

### 3.8 The Lanyard Touch Animation

**Script:** Bart touches the badge before entering each boss room. Quick two-frame animation. In W3 the touch lingers one extra frame. In the Prologue it's the longest hold (three frames). "He hasn't been back here in years."

**Code:** Not found as an implemented animation sequence.

**Recommendation:** P2. Small but thematically important. Two-frame sprite work.

### 3.9 Post-Boss Silence

**Script:** After every boss defeat: 2-second silence. No music. No effects. Then Override Chip tone (single resonant note). Then victory dialogue. "Chaos > silence > tone > warmth. Seven times. Never gets old."

**Code:** Post-boss audio sequencing may exist but the specific 2-second silence + single tone + warmth progression needs verification as a deliberate audio design rather than a natural gap.

**Recommendation:** P2. Audio engineering detail. Verify or implement in the AudioEngine.

### 3.10 Maintenance Access (Post-Boss Level Replay)

**Script:** After clearing a world's boss, players can return to any stage with 50% enemy density and a file counter showing which stages have uncollected personnel files.

**Code:** `maintenanceAccess` flag, 50% density, and maintenance file counter are implemented. Replays now use the helper-backed spawn reduction and HUD counter payload.

**Recommendation:** P2. Add regression checks for replay density and file-counter visibility during maintenance flows.

### 3.11 Omega Logs Replay Mode

**Script:** Unlocked by collecting all 25 Personnel Files. Replaying any level reveals Omega's internal logs on monitors.

**Code:** Omega logs content exists in `omegaLogs.ts`. GalleryScene exists for unlockable content. Whether replaying levels with Omega log overlays on monitors is implemented needs verification.

**Recommendation:** P2. Content exists. Delivery mechanism during replay needs verification.

### 3.12 Credits Sequence -- World Vignettes

**Script** describes a detailed credits roll showing each world restored: people returning to the Tundra, someone picking up the lunchbox, the fungi labeled "Steve," "Karen," "Big Gus," chairs brought back to the Graveyard, a worker tracing Bart's cable run pattern. Final shot: Ping on a monitoring console, green light, someone reading.

**Code:** CreditsScene exists. Whether it implements the per-world vignette sequence from the script needs verification.

**Recommendation:** P2. The credits vignettes are the script's emotional payoff for the entire environmental storytelling layer. Worth implementing even if simplified.

### 3.13 Post-Credits Scene

**Script:** A single server rack. One red light blinks. Then goes green. "...Or does it flicker? SUPER BART WILL RETURN."

**Code:** Not found as implemented.

**Recommendation:** P3. Sequel tease. Low priority but takes minimal effort.

---

## 4. OPEN QUESTIONS

| # | Question | Owner |
|---|----------|-------|
| 1 | Is the 7-world / 28-level structure intentional or an artifact of uniform generation? Was there a deliberate decision to deviate from [3,4,4,4,4,3]? | Engineering / Design |
| 2 | Should Rack Pulse become the primary combat verb (script intent) or remain secondary to stomping (current code)? This is the single biggest identity question. | Design |
| 3 | The code has enemies not in the script (technical_debt is listed in CLAUDE.md for W6 but not in SCRIPT.md's bestiary). Are these additions intentional? | Design |
| 4 | The script describes specific boss victory dialogue ("You were supposed to keep things cool. Not frozen."). Is this dialogue rendered in-game or only in the debrief? | Engineering |
| 5 | Playfeel blockers (jump-cut missing in levels 1-3, run-skid not detected in 1-6/2-2, bootstrap instability at 5-1) block full validation sweeps. What's the timeline? | Engineering |
| 6 | The script's choice system describes a "walk past" option (15s inactivity timeout). Is this timeout implemented? | Engineering |
| 7 | Which power-up vocabulary is canonical: SCRIPT.md names or CLAUDE.md AI-themed names? | Design |

---

## 5. PRIORITY SUMMARY

### P0 -- Breaks the Creative Vision
1. **Campaign structure**: Restore [3,4,4,4,4,3] from [4,4,4,4,4,4,4]
2. **Rack Pulse as primary combat**: Elevate from secondary to signature mechanic

### P1 -- Significant Feature Gaps
3. **Encrypted Fog system**: World map fog state machine + reveal animations
4. **Living Map reclamation**: Node transformation + figure animations
5. **Debrief Beat cinematics**: Three-part structure (exit, intercept, map reveal)
6. **Manual Check mechanic**: Full input binding + intel overlay system
7. **Set-piece stages**: Avalanche Alley, The Collapse, The Approach
8. **Ping introduction timing**: Verify matches Catacombs world

### P2 -- Polish and Fidelity
9. Power-up vocabulary reconciliation
10. Propaganda poster decay variants
11. Empty Chair motif as environmental prop progression
12. Lanyard touch pre-boss animation
13. Post-boss silence audio sequence
14. Maintenance Access gameplay modifications
15. Omega Logs replay delivery
16. Credits world vignettes
17. Double Jump narrative delivery
18. Ground Pound completeness verification

### P3 -- Nice to Have
19. Post-credits scene

---

## 6. SUCCESS METRICS

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Script fidelity score | 90%+ of scripted features implemented | Checklist audit against SCRIPT.md sections |
| Campaign structure match | [3,4,4,4,4,3] restored | Level count validation in CI |
| Fog system coverage | 5 fog states x 3 assets = 15 assets | Asset validation gate |
| Combat identity | Rack Pulse used in >60% of enemy defeats | Telemetry in playtest |
| Playtest emotional peaks | Players report Retraining Center and Omega Phase 4 as memorable | Qualitative playtest feedback |
| Post-boss reward stack | 5 distinct reward types within 20 seconds of boss defeat | Timed sequence audit |

---

*"Every system has a single point of failure. I made sure this one's single point of recovery was a guy with a soldering iron and a bad attitude."*
