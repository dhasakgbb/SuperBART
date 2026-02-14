# Super BART Lore Bible v1.0

This document defines the satirical canon of Super BART. It governs world flavor, faction identity, enemy motivation, and the narrative tone that connects twenty-five levels of platforming into something that feels deliberate rather than random.

Everything here is subordinate to gameplay clarity. Lore exists to make naming consistent and humor legible. If a lore detail makes a level harder to read at a glance, the lore loses.

---

## 1) Premise

Bart Czernicki is a Principal Technical Architect who shipped production ML systems before "AI" became a budget line item. He is competent, methodical, and permanently one quarter behind on the roadmap.

The game follows Bart as he navigates a landscape that has become hostile not because the technology is bad, but because everything around it -- procurement, hype, compliance, scarcity, and measurement -- conspires to prevent useful work from reaching production.

Each world is a real engineering or enterprise friction dressed up as a platformer biome. The satire is structural: the obstacles are funny because practitioners recognize them, not because the labels are clever.

---

## 2) Factions

### The Hallucinations (Primary Enemies)

Hallucinations are the rank-and-file opposition. They are not malicious. They are confidently, cheerfully wrong. They patrol with purpose, occasionally pause as if reconsidering, and then continue in exactly the wrong direction.

They represent misinformation at scale: plausible-sounding output that falls apart under scrutiny. Their danger is not aggression but volume. One Hallucination is a nuisance. A corridor full of them is a level design problem.

**Behavioral note:** Hallucinations should never feel random or chaotic. They are wrong with conviction. Their patrol patterns are deliberate, just incorrect.

### The Legacy Systems (Shell Enemies)

Legacy Systems are heavy, entrenched, and surprisingly dangerous when disturbed. Left alone, they sit inert. Kicked, they careen through the level destroying everything in their path -- including other enemies, including the player if they are not careful.

They represent old infrastructure that works fine until someone tries to modernize it. The shell-kick mechanic is the joke: touching legacy code sets off a chain reaction.

When a Legacy System shell hits a wall, it splits once into two smaller "microservices" that briefly scatter before stopping. This is the only split. They do not recursively decompose. Even satire has limits.

### The Enterprise (Compliance Bureaucracy)

The Enterprise is not a single enemy type but a design philosophy applied to World 3. Enterprise friction manifests as:

- Reduced traction on surfaces (everything feels like a slide deck)
- Platforms with brief availability windows ("SLA windows") that appear and vanish on schedule
- Environmental obstacles that are not dangerous, just slow

The Enterprise does not want to hurt Bart. It wants to schedule a meeting about whether hurting Bart aligns with the current OKRs.

**Named entity: Compliance Officer.** A special enemy type that is immune to inference projectiles. You cannot argue with compliance. You route around it.

### The GPU Cartel (Scarcity Gatekeepers)

The GPU Cartel governs World 4. They control access to compute, and they have decided there is not enough. World 4 expresses this through:

- Higher gravity (everything is heavier, everything costs more)
- Tighter time pressure (the clock burns faster because your allocation is limited)
- Fewer collectible drops (scarcity is the mechanic, not just the theme)

The GPU Cartel is never seen directly. Their influence is environmental. The world itself is the antagonist: a landscape where doing the same work requires more effort because someone upstream decided you do not need the resources.

### The Benchmark (Final Boss / World 5)

The Benchmark does not fight. It measures. World 5 is a single level -- the final castle -- and it is a gauntlet that combines every mechanic from the previous four worlds under auto-scroll pressure.

The Benchmark does not care about Bart's intentions, his architecture decisions, or his team's velocity. It cares about numbers. The final level is called "RUN IN PROGRESS" and it moves forward whether Bart is ready or not.

The Benchmark represents the industry's obsession with quantified evaluation: the idea that everything worth doing can be reduced to a leaderboard position. Bart's victory is not beating the Benchmark. It is surviving it.

---

## 3) World Lore

### World 1: Azure Basics

**Theme:** Cloud onboarding. Bright, welcoming, deceptively simple.

This is the tutorial world. The sky is open, the platforms are generous, and the enemies are sparse. Everything feels achievable because it is designed to.

The satire is subtle here: Azure Basics is easy because it is supposed to sell you on the platform. The real complexity is in Worlds 2 through 4. World 1 is the free tier.

**Environmental flavor:**
- Block textures suggest server racks and cloud iconography
- Backgrounds are clean gradients with gentle parallax
- The palette is warm and inviting -- the color of a marketing page

**Lore note:** World 1 levels should feel like onboarding documentation: clear, organized, and missing exactly the information you will need later.

### World 2: Data Pipeline

**Theme:** Underground data plumbing. Dark, vertical, mechanical.

World 2 moves underground. The platforming becomes vertical -- pipes route up and down, moving platforms carry data (and Bart) between processing stages, and the level layouts favor routing puzzles over pure speed.

The enemies here are denser but more predictable. Data pipelines have known failure modes. The challenge is navigating a system that works correctly but is not designed for human comfort.

**Environmental flavor:**
- Pipe textures and underground color shifts (teals, dark greens, industrial grays)
- Moving platforms that feel like conveyor infrastructure
- Vertical scrolling segments that emphasize routing over running

**Lore note:** World 2 is where Bart learns that the pretty cloud interface from World 1 is a facade over miles of plumbing. The data has to go somewhere, and "somewhere" is down.

### World 3: Enterprise POC

**Theme:** Corporate gray bureaucracy. Slow, frustrating by design.

World 3 is an enterprise proof-of-concept environment. Everything is gray. Traction is reduced -- Bart slides on polished conference room floors. Platforms appear and disappear on schedule (SLA windows), not when Bart needs them.

The Compliance Officer enemy type debuts here. It cannot be defeated with projectiles. It can only be avoided or waited out. This is intentional.

**Environmental flavor:**
- Muted palette: grays, off-whites, the occasional corporate blue accent
- Surface textures suggest tile floors and cubicle walls
- Lighting is flat and fluorescent -- no warm bloom here

**Lore note:** World 3 is the world where Bart's technical skills matter least. The obstacles are not technical. They are procedural. The POC environment was provisioned six weeks ago and the access request is still pending.

### World 4: GPU Shortage

**Theme:** Scarcity and weight. Heavy, tight, resource-starved.

World 4 turns the dials. Gravity is higher, so jumps are shorter and commitment to a trajectory is more punishing. The timer burns faster because Bart's compute allocation is capped. Collectible drops are sparse because the budget was cut.

The environment communicates scarcity: the platforms are narrower, the gaps are wider, and the safety nets from earlier worlds are gone. This is not unfair -- it is the same game with fewer resources.

**Environmental flavor:**
- Warm, heavy palette: ambers, deep reds, industrial orange
- Backgrounds suggest heat (GPU thermal imagery) and constraint
- Particle effects are minimal -- even the VFX budget is limited

**Lore note:** World 4 is where Bart learns that having the right architecture means nothing if you cannot get the hardware to run it. The shortage is not a bug. It is a market condition.

### World 5: The Benchmark

**Theme:** Dark neon metrics. Relentless, measuring, final.

World 5 is one level. It is an auto-scroll gauntlet labeled "RUN IN PROGRESS." The screen moves forward at a fixed pace. Bart keeps up or fails.

Every enemy type from the previous worlds appears. Every mechanic is remixed. The level is the Benchmark's evaluation suite, and Bart is the model being tested.

**Environmental flavor:**
- Dark backgrounds with neon metric overlays (subtle, not cyberpunk noise)
- The auto-scroll creates constant forward pressure
- Mixed enemy sets force adaptation, not memorization

**Lore note:** The Benchmark does not have a health bar. It does not take damage. It runs to completion or Bart runs out of lives. Victory is survival. The post-game text reads "BENCHMARKS IMPROVED" because in this industry, even success is framed as incremental improvement.

---

## 4) Character Voice

### Bart

Bart does not speak during gameplay. His character is expressed through movement, reactions (hurt animation, win pose), and the systemic choices the player makes.

In menu and UI text, Bart is implied but never quoted. The game does not put words in Bart's mouth. The UI speaks in the voice of the system -- deployment logs, status codes, infrastructure jargon -- not in the voice of the protagonist.

### Enemies

Enemies do not have dialogue. Their "voice" is their behavior:

- **Hallucinations** are confidently wrong. They patrol with conviction.
- **Legacy Systems** are inert until disturbed, then destructively unpredictable.
- **Hot Takes** telegraph their attacks but commit fully. They are loud and brief.
- **Analysts** fire in spreads. They have data. The data is projectiles.
- **Technical Debt** is patient, then suddenly is not. It punishes standing still.
- **Compliance Officers** are immovable. They do not attack. They obstruct.

### The System

The true "narrator" of Super BART is the system itself. Game Over is a status code (`429: TOO MANY REQUESTS`). Level Clear is a deploy event (`DEPLOYED TO PROD`). Death messages are infrastructure errors (`CONTEXT WINDOW EXCEEDED`).

The system voice is dry, factual, and slightly inhuman. It reports what happened without editorial. The humor comes from the gap between the player's emotional experience (frustration, triumph) and the system's clinical indifference.

---

## 5) Tone Rules

### Do

- Ground every joke in something a practitioner would recognize.
- Keep flavor text short. One line. If it needs a second line, it is too long.
- Let behavior deliver the satire. A Hallucination that patrols confidently in the wrong direction is funnier than a label that says "WRONG."
- Use infrastructure and enterprise vocabulary for system text: status codes, deployment events, resource errors.
- Maintain the gap between what happened (Bart fell in a pit) and what the system reports (CONTEXT WINDOW EXCEEDED).

### Do Not

- Write jokes that require knowledge of a specific company's internal tooling.
- Use meme formats, hashtags, or social media cadence in any text.
- Make enemies sympathetic or give them personality beyond their behavioral archetype.
- Reference real product names in enemy or faction titles.
- Write lore that contradicts gameplay readability. If the lore says an enemy should behave one way but the gameplay needs it to behave differently, gameplay wins.
- Add lore that requires reading to enjoy the game. Every satirical element must work visually and mechanically first, textually second.

### The Tweet Test

If a line of in-game text reads like something someone would post on social media for engagement, delete it. The game's humor is observational and structural, not performative.

### The Explain Test

If a joke requires the player to know what a specific acronym stands for to find it funny, generalize it. "SLA WINDOWS" works because the mechanic (timed platforms) is self-explanatory. "RLHF LOSS SPIKE" does not work because the mechanic does not explain the acronym.

---

## 6) Canon Status

This document is the source of truth for narrative and faction decisions. Content that appears in the game but contradicts this document is a bug.

Additions to the canon require:
1. A clear gameplay mechanic that the lore supports
2. Consistency with existing faction and tone rules
3. Approval via the content validation pipeline (`tools/content_validate.ts`)

Lore that exists only in this document and has no gameplay expression is flavor context for creators, not shipping content.
