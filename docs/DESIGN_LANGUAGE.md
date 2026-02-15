# Design Language Definition

**Status**: Draft Refinement
**Derived From**: High-Fidelity Target References (Feb 2026)
**Target Aesthetic**: "Premium 16-bit SNES" (Super IT World)

This document refines the visual direction based on the latest concept art and sprite sheets, bridging the gap between the initial NES-style constraints and the desired high-fidelity final look.

## 1. Visual Pillars

### "The Corporate Network Realized"
Every environment must blend standard platformer tropes with "Server Room/IT" reality.
- **Ground**: Not just dirt/grass, but circuit boards, cable bundles, server racks, and cooling vents.
- **Nature**: Organic elements (trees, mushrooms) are actually "bioluminescent data" or "holographic projections".
- **Atmosphere**: Heavy use of biome-specific localized lighting (bloom) to sell the "powered" nature of the world.

### "16-Bit Plus" Reliability
- **Resolution**: 16x16 nominal grid, but effectively 320x180 or 480x270 aesthetics scaled up.
- **Color Depth**: Expanded palettes beyond strict NES limits. Gradient backgrounds, additive blending for energetic effects.
- **Readability**: Dark 2px contours on all dynamic entities (Player, Enemy, Moving Platforms) to separate them from the detailed backgrounds.

## 2. Biome-Specific Design Language

We are moving away from generic "Grass/Snow/Cave" to specific IT-themed Visual Identities.

### World 1: The City (Silicon Forest)
- **Palette**: `grassTop` (Green), `skyBlue`, `grayServer` (New).
- **Motif**: "Clean Corporate Campus". Manicured circuit-board lawns, sleek glass towers (server blades), bright inviting sky.
- **Hazard Color**: Standard Orange (Construction).

### World 2: Cryo-Server Tundra
- **Palette**: `iceDeep` (#32535F), `iceMid` (#74C0D4), `iceLight` (#B7E9F7), `white`.
- **Motif**: "Overclocked Cooling". Server racks encased in glaciers. Snowmen are generic security bots with snow piled on.
- **Atmosphere**: Cold blue bloom, falling pixel-snow.
- **Hazard Color**: Cyan/White (Flash Freeze).

### World 3: Quantum Void
- **Palette**: `voidDark` (#1A0B2E), `nebulaPink` (#D45698), `crystalCyan` (#4DEEEA).
- **Motif**: "The Cloud". Literal floating platforms, impossible geometry, non-euclidean background layers.
- **Atmosphere**: Heavy additive bloom on crystals. Stars parallax independently.
- **Hazard Color**: Neon Pink (Singularity).

### World 4: Deep Web Catacombs
- **Palette**: `toxicGreen` (#68F046), `darkSlime` (#203820), `mudShadow` (#1A1A1A).
- **Motif**: "Legacy Spaghetti Code". Tangled cables everywhere resembling roots/vines. Abandoned hardware covered in digital moss.
- **Hazard Color**: Toxic Green.

### World 5: Digital Graveyard
- **Palette**: `ghostTeal` (#74F6D9), `boneGrey` (#BDBDBD), `shadowMidnight` (#0C0C14).
- **Motif**: "Deprecation Zone". CRT monitors with cracked screens, ghosts (deprecated daemons), cobwebs made of old fiber optics.
- **Atmosphere**: Desaturated, spooky, flickering lights.
- **Hazard Color**: Ectoplasm Teal.

### World 6: Singularity Core (Magma Nexus)
- **Palette**: `coreMagma` (#FF4D00), `heatYellow` (#FFD500), `charcoal` (#221111).
- **Motif**: "Thermal Throttling". Molten silicon, burning data, industrial fans working overtime.
- **Hazard Color**: Blazing Red/Orange.

## 3. Character & Enemy Design (Sprite Refinement)

### Player: "Bart" (The IT Guy)
- **Proportions**: ~16x24px (1.5 tiles high) visuals within a 16x32 hitbox.
- **Key Features**:
  - **Bald Head**: Reads clearly against noisy backgrounds.
  - **Black T-Shirt**: Simplicity, contrasts with colorful backgrounds.
  - **Blue Jeans**: Grounds the character in "blue collar" reality.
- **Expression**: Eyebrows must be expressive (determined, surprised, pained).
- **Animation**: Smear frames on attacks/dashes.

### Enemy: "The Bugs & Bots"
- **Visual Hierarchy**:
  - **Sentry/Patrol**: Mechanical, rigid animations, glowing "eyes" (cameras).
  - **Wildlife (Bugs)**: Organic curves, erratic movement, "glitch" particle trails.
  - **Ghosts**: Semi-transparent (alpha 0.8), trailing after-images.
- **Uniformity**: All mechanical enemies share a common "corporate grey/beige" chassis color to tie them to the "System".

## 4. UI & HUD Refinement

### Boss Battles
- **Dedicated UI**: Toggle off standard HUD.
- **Boss Bar**: Top-Center, wide red bar with Name Label (e.g., "GLACIAL MAINFRAME").
- **Player Status**: During boss fights, simplify life display to just "HP Pips" if the standard counter is too small.

### standard HUD
- **Compact**: Keep the existing "Corner" design.
- **Feedback**: Counters (`Evaluations`, `Tokens`) should pulse/flash `hudAccent` (#FFD700) when collected.

## 5. Lighting & FX Rules
- **Rule of Emission**: If it deals damage, it should probably glow.
- **Rule of Value**: Backgrounds (Parallax) must be lower contrast/saturation than Gameplay Foreground.
- **Bloom Tiers**:
  1.  **Global**: Ambient tint (World-specific).
  2.  **Entity**: Specific sprite glow (Projectiles, Pickups).
  3.  **UI**: High-intensity bloom on "Level Complete" or "Game Over" text.

## 6. Action Items for Refinement
1.  **Palette Expansion**: Update `styleConfig.ts` with biome-specific color ramps.
2.  **Boss UI Implementation**: Create `BossHud` class for stage-specific health bars.
3.  **Tile Set Variances**: Generate specific tilesets for W2-W6 based on the new motifs (Ice, Void, Roots, Graves, Magma).
