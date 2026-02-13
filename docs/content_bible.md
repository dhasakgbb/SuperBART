# Super BART Content Bible v1.0
North-star: The game should play like classic NES-era platforming and look/feel like `public/assets/target_look.png`. The satire should read as “smart workplace mythology,” not meme spam.

## 1) Tone and rules of humor
Super BART is funny because it’s true. The jokes are short, readable, and secondary to gameplay clarity. Humor is delivered through naming, signage, and micro copy at key moments (death, level clear, game over), not constant quips.

The game must remain premium-feeling. If a line reads like a tweet, delete it. If a reference requires explaining, remove it. If it risks brand cringe, generalize it.

Target tone: wry, grounded, slightly absurd, never chaotic.

## 2) Canon premise
Bart Czernicki, Microsoft’s Principal Technical Architect for Machine Intelligence, is trying to ship through the modern AI landscape. Each world is a real engineering or enterprise friction disguised as a platformer constraint.

## 3) Visual language (identity)
The game is pixel-forward with readable silhouettes and controlled glow. UI is compact and icon-driven. Every screen should look like it belongs to the same cartridge.

Do not ship system fonts. All text is bitmap font. Do not ship runtime SVG placeholders in production visuals.

The reference image is the contract. “Close enough” is not acceptable.

## 4) HUD contract (must match target)
Top-left block shows: Bart portrait, “BART xNN” (instances/lives), star icon with value, token icon with “xNN”.
Top-right shows: “WORLD W-L” and “TIME ###”.

Avoid labels like “LIVES / STAR / COIN” in the HUD. Everything is icon + number. The “x” multiplier glyph is part of the visual identity.

## 5) World structure
The game ships as 4 worlds × 6 levels + final castle (25 total). Each world has a consistent palette shift, a mechanical twist, and a recognizably different generator bias.

- World 1: Azure Basics. Bright and welcoming. Standard pacing. The game teaches without cruelty.
- World 2: Data Pipeline. Underground/plumbing. Vertical routing, pipes, moving platforms.
- World 3: Enterprise POC. Corporate gray. Reduced traction (slide). Platforms with brief availability windows (“SLA windows”).
- World 4: GPU Shortage. Scarcity and weight. Higher gravity, tighter time burn, fewer drops.
- World 5: The Benchmark. Dark neon metrics. Auto-scroll “RUN IN PROGRESS” segments and mixed enemy sets.

## 6) Collectibles and power-ups (canonical list)
Tokens replace coins. 100 tokens grant one extra life.
Evals replace stars. They are rare, optional, and primarily off the main line.
GPU Allocation is the fire-flower equivalent. It upgrades Big Bart into Fire Bart and enables inference projectiles (cap 3 on screen).
Copilot Mode is star-power. 8 seconds invincibility, speed-up, auto-stomp. Visual treatment should be tasteful: rainbow trail is okay if subtle; code glyph particles are okay if minimal.
Semantic Kernel is a unique timed pickup. It spawns a short-lived assistant drone that targets enemies for ~15 seconds.
Deploy to Prod is the 1-up equivalent. It is a green button icon.
Works On My Machine is a poison mushroom. It looks plausible but shrinks you. It must be “fair,” with a subtle tell.

## 7) Enemies (canonical list and behavior intent)
- Hallucination: a walker with small bursts of “confident wrongness.” It patrols, sometimes pauses, and occasionally reverses at a non-edge moment. Keep this readable, not random chaos.
- Legacy System: shell enemy. Kickable shell. On wall hit, it splits once into two smaller “services” and then stops splitting. Shell re-expands after ~4 seconds.
- Hot Take: flyer. Burst lunges with a clear telegraph. Escalates in intensity later in the game.
- Analyst: spitter. Fires a 3-shot spread. Projectiles may leave a brief ground hazard.
- Technical Debt: chain-chomp style. Anchored lunges. After N lunges it breaks and pursues. It punishes loitering.

Naming note: Avoid over-specific brand names in enemy titles. “Analyst” is preferred over “Gartner Analyst.” The behavior delivers the joke.

## 8) Player states (canonical)
- Small Bart: baseline.
- Big Bart: breaks “legacy blocks.”
- Fire Bart: inference projectile state, with caps and immunities (compliance is immune).
- Copilot Mode: timed invincible speed state with auto-stomp.

The player must animate like Mario: idle, walk, run, skid, jump, fall, land, hurt, dead, win. The Bart head is layered onto an animated body, never a disembodied head.

## 9) Text and UI strings (approved set)
Game Over: “429: TOO MANY REQUESTS”
Level Clear: “DEPLOYED TO PROD”
Final Victory: “BENCHMARKS IMPROVED” with optional small subtext: “shipping still pending”
Stats labels: “Latency / Tokens / Evals / Rollbacks”
World Map: “SERVICE MAP”
Loading variants: “PROVISIONING…”, “WARMING CACHE…”, “REDUCING HALLUCINATIONS…”
Pit death: “CONTEXT WINDOW EXCEEDED”
Checkpoint: “SAVED TO BLOB STORAGE”
Stomp kill popup: “CORRECTED”

Rule: UI strings must be short, legible, and not constant. Keep the joke density low. The game is the main act.

## 10) Level generation vocabulary (chunk library)
Chunks are themed templates with clear silhouettes and one mechanical idea per chunk. Each chunk introduces, then remixes.

Required chunk families:
- server_room: tight corridors, timed hazards, deliberate rhythm.
- training_run: escalating enemy density and cadence jumps.
- rag_pipeline: vertical routing and optional hard-to-reach evals.
- rate_limiter: precision timing and spring sequences.

Chunk naming must remain literal and readable. No meme chunk names.

## 11) Audio identity (procedural, no files)
SFX palette: short, punchy, non-annoying. SFX must be volume-capped and routed through a bus.
Required SFX events: jump, coin/token, stomp, hurt, power-up, shell kick, goal/clear, menu move, menu confirm.

Music: chiptune-ish loops per world. Each world has a preset (tempo, scale, oscillator mix). Music starts only after user gesture. Settings allow independent music and SFX volume with mute toggles persisted in localStorage.

## 12) “Do not do this” list
- Do not use meme slang in primary UI.
- Do not use wall-of-text jokes.
- Do not use brand-specific references that age badly or require context.
- Do not turn the world into an “AI word salad.”
- Do not ship system fonts.
- Do not ship runtime SVG placeholders in production visuals.
- Do not ship goldens that do not reflect the target look.

## 13) Definition of done for content
A new world, enemy, collectible, or chunk is “done” only if it has:
1) a clear silhouette,
2) a readable behavior,
3) consistent naming, and
4) is validated by tooling (assets exist, strings are approved, HUD remains compliant).
