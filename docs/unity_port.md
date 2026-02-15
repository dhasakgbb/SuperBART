# SUPERBART Unity Port - First-Playable Runbook (M1)

## Overview

SuperBART uses a **dual-track** approach: Phaser remains the primary shipping web runtime, while Unity is being developed in parallel as a first-playable milestone. This document covers the M1 milestone scope, setup, and validation workflow.

## M1 Milestone Scope

### ✅ In Scope
- Unity player motor parity (coyote, jump buffer, jump-cut, run charge, skid)
- Unity level loading from `GeneratedLevel` JSON contract
- Single deterministic campaign level export for smoke testing (World 1, Level 2, Seed 120707)
- Synthetic fixture for moving-platform runtime validation
- Metric-based movement parity gates (not frame-exact)
- Basic documentation and reproducible packaging commands
- Core gameplay: solids, one-way platforms (non-vanishing), moving platforms, spawn/goal

### ❌ Out of Scope (Post-M1, many resolved in M2)
- Full scene/UI/audio/save migration
- Unity-side UI prefabs, full HUD layout, and cinematic/audio bus architecture
- ~~Vanish platform runtime toggling~~ (✅ M2)
- Benchmark auto-scroll runtime behavior
- ~~Full campaign export matrix~~ (✅ M2: `--all` exports all 28 levels)
- ~~Bonus level exports~~ (✅ M2: `--bonus=true` enabled)

## Repository Structure

```
/unity-port-kit/                    # Tracked Unity source (not zip-only)
  Assets/SuperbartPort/
    Scripts/                        # Movement model, level loader, platform motor
    Tests/
      EditMode/                     # JSON parse + tile build tests
      PlayMode/                     # Movement parity + platform tests
    Resources/                      # Unity-loadable fixtures (Resources.Load)
      Fixtures/
        levels/                     # w1_l2.json + synthetic_moving_platform.json
        parity/                     # movement_metrics.json
    Editor/                         # Pixel art import postprocessor
  Docs/
    UNITY_PORT_README.md            # Quickstart guide
  Assets/SuperbartAssets/            # Copied media assets (from public/*)

/scripts/                           # Build automation
  export_levels_for_unity.ts        # Level JSON exporter
  export_unity_movement_metrics.ts  # Movement metrics exporter
  export_unity_media.ts             # Media sync from ASSET_MANIFEST + optional AI music
  build_unity_fixtures.mjs          # Full fixture refresh workflow
  package_unity_port_kit.mjs        # Zip packager

/artifacts/
  unity/levels/                     # Additional export destination
  superbart-unity-port-kit.zip      # Packaged kit artifact
```

## Prerequisites

### Unity Setup
- **Unity Version**: 2022 LTS or 2023 LTS
- **Required Packages** (install via Package Manager):
  - `com.unity.2d.tilemap` (2D Tilemap)
  - `com.unity.cinemachine` (Cinemachine) — recommended
  - `com.unity.inputsystem` (Input System) — optional
  - `com.unity.nuget.newtonsoft-json` (Newtonsoft Json) — **required** for level JSON parsing

### Node/npm Setup
- Node.js 18+ with npm
- All workspace dependencies installed: `npm install`

## First-Playable Workflow

### Step 1: Build Fixtures

```bash
# From repository root
npm run unity:fixtures:build
```

Use explicit media profiles when your Unity branch needs more than M1 runtime assets:

```bash
npm run unity:fixtures:build -- --media-profile ui
npm run unity:fixtures:build -- --media-profile full
npm run unity:fixtures:build:ui
npm run unity:fixtures:build:full
```

This command:
1. Exports World 1, Level 2 (`w1_l2.json`, seed `120707`) to:
  - `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/w1_l2.json`
  - `artifacts/unity/levels/w1_l2.json`
2. Exports movement metrics to:
  - `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json`
3. Mirrors fixtures into:
   - `unity-port-kit/Assets/SuperbartPort/Tests/Resources/levels/w1_l2.json`
   - `unity-port-kit/Assets/SuperbartPort/Tests/Resources/parity/movement_metrics.json`
4. Syncs curated media assets into:
   - `unity-port-kit/Assets/SuperbartAssets/`
   - Includes all manifest images/sprites/fonts and optional `public/music/ai` tracks.
   - Generates `unity-port-kit/MediaSyncManifest.json` with a resolved asset list.
5. Runs media audit and writes:
   - `artifacts/unity/media-audit-<profile>.json`
6. Exports deferred media backlog for curation planning and writes:
   - `artifacts/unity/media-backlog-<profile>.json`

### Step 1a (Optional): Sync Media Only

```bash
npm run unity:media:sync
```

Use this when you only need to refresh Unity-bound art/sfx/music from the manifest and not regenerate fixtures.

**Note**:
- `npm run unity:fixtures:build` already performs media sync.
- The synthetic moving-platform fixture (`synthetic_moving_platform.json`) is manually authored and committed to the repo. It is not procedurally generated.

### Step 1b (Optional): Media Curation Scope (M1)

Unity M1 intentionally ships a curated media set so parity checks stay deterministic:

1. **Gameplay runtime media (synced by default)**  
   - Images/sprites/fonts from `src/core/assetManifest.ts`
   - AI music tracks from `src/audio/aiMusic.ts` (`/music/ai/*.flac`) when `--audio true` (default)
   - Destination: `unity-port-kit/Assets/SuperbartAssets/`
2. **Style references (UI profile)**  
   - `target_bart*`, `title_bg_*`, `title_logo*`, `world_map_premium`, and related menu assets are included with `--profile ui`
   - `npm run unity:media:sync:ui` and `npm run unity:media:sync:full` expand as needed
3. **Everything else (post-M1 backlog)**  
   - Menus/cutscenes beyond curated profile lists
   - `.svg` placeholders, prototype captures, alternate/legacy visual variants
   - Add through manual import in Unity or by extending `scripts/export_unity_media.ts` for a dedicated post-M1 media superset.

For the full curation list and practical extension notes, use:

- `docs/unity_media_curation.md`

Profile shorthand command set:

```bash
npm run unity:media:sync:ui     # UI/presentation assets
npm run unity:media:sync:full   # Full profile (non-runtime polish media)
```

Equivalent long-form:

```bash
npm run unity:media:sync -- --profile ui
npm run unity:media:sync -- --profile full
```

### Step 1c (Optional): Media Profile Matrix

Use these buckets as you expand beyond M1:

- **Core runtime profile**: manifest + optional AI music (default sync profile)
- **UI profile**: menu/title/cutscene media and premium variants
- **Polish profile**: `.svg` source art, prototype captures, alternative/legacy variants
- **Sound profile**: non-AI audio or additional ambience/SFX assets

The repo keeps these intentionally separated so one-parity smoke remains deterministic while allowing rich Unity scene polish in a later pass.

This is by design for M1: gameplay-first parity first, and a fuller art sync policy in the next phase.

### Step 1d (Optional): Media Audit

After a sync or fixture rebuild, run:

```bash
npm run unity:media:audit
```

This regenerates a deterministic audit JSON in `artifacts/unity/` describing:
- expected profile asset set
- manifest asset drift (missing, extra, destination mismatches)
- required/optional source availability against `public/`
- `catalog.deferredFromExpected`: discovered assets in `public/assets` still outside the selected profile (for curation decisions)

Use this report when deciding which non-runtime/optional assets should be promoted from manual import into scripted curation.

For example, with a baseline audit run:

```bash
cat artifacts/unity/media-audit-m1.json | jq '.catalog.deferredFromExpected | length'
```

This value is your current deferred asset backlog size for `m1`.

### Step 1e (Optional): Backlog Export for Curation

Generate a deterministic, grouped backlog you can use for import planning:

```bash
npm run unity:media:backlog
npm run unity:media:backlog:ui
npm run unity:media:backlog:full
```

Outputs:
- `artifacts/unity/media-backlog-m1.json` (default)
- `artifacts/unity/media-backlog-ui.json`
- `artifacts/unity/media-backlog-full.json`

Use `--format csv` when you need a spreadsheet-ready file:

```bash
npx tsx scripts/export_unity_media_backlog.ts --out artifacts/unity/media-backlog.csv --profile m1 --format csv
```

CSV header is `group,count,file`, and each row is a deferred asset in its folder group.

### Step 2: Package Unity Kit (Optional)

```bash
# From repository root
npm run unity:kit:zip
```

Creates `artifacts/superbart-unity-port-kit.zip` from the tracked `unity-port-kit/` source folder.

### Step 3: Open in Unity

1. Create a new Unity project (2D template, URP optional)
2. Copy these folders into your Unity project's `Assets/`:
   - `unity-port-kit/Assets/SuperbartPort/`
   - `unity-port-kit/Assets/SuperbartAssets/` (from `npm run unity:media:sync`)
3. Install required packages (see Prerequisites)
4. Open Unity Test Runner: `Window → General → Test Runner`

### Step 4: Run Unity Tests

#### EditMode Tests (`LevelLoaderEditModeTests`)
- **BuildFromJson_UsesW1L2Fixture_BuildsTiles_AndTeleportsSpawn**
  - Validates JSON parse from `w1_l2.json`
  - Asserts tile grid is populated
  - Asserts spawn entity teleports player transform to correct Phaser→Unity converted position

- **BuildFromJson_InstantiatesMappedEntities_FromSyntheticFixture**
  - Validates entity instantiation from `synthetic_moving_platform.json`
  - Asserts entity count matches fixture
  - Asserts tilemap has solid tiles

#### PlayMode Tests (`MovingPlatformPlayModeTests`)
- **MovingPlatform_StaysWithinBounds_AndReversesDirection**
  - Spawns moving platform with `minX=128px`, `maxX=224px`
  - Observes 220 frames of motion
  - Asserts platform stays within ±1px tolerance of bounds
  - Asserts at least one direction reversal occurs

#### PlayMode Tests (`MovementParityPlayModeTests`)
- **MovementModel_MatchesCommittedMetricArtifactWithinTolerance**
  - Loads `movement_metrics.json` via `Resources.Load<TextAsset>()`
  - Computes runtime metrics from Unity's `MovementModel` port
  - Asserts all metrics match within tolerances:
    - **Scalar metrics**: ±3%
    - **Frame-count metrics**: ±1 frame
    - **Boolean/event checks**: exact match

### Step 5: Manual Smoke Test

1. Create a test scene with:
   - `Grid` + `Tilemap` + `TilemapCollider2D` + `CompositeCollider2D` + `Rigidbody2D (Static)`
   - Empty GameObject with `LevelLoader` component
   - Assign `Tilemap`, `TilePalette`, and `EntityPrefabRegistry` references

2. Add a player GameObject with:
   - `PlayerMotor2D` component
   - `Rigidbody2D` (Dynamic, Gravity Scale = 3.15)
   - `BoxCollider2D`

3. Assign player transform to `LevelLoader.playerTransform`

4. Call `LevelLoader.BuildFromJson(...)` with `w1_l2.json` or `synthetic_moving_platform.json`

5. Press Play and verify:
   - Player spawns at spawn entity position
   - Player can traverse one-way platforms
   - Player can ride moving platforms
   - Player reaches goal without physics anomalies

## Exported Level Contract

The `GeneratedLevel` JSON contract is authoritative and unchanged from Phaser:
- **Source**: `src/types/levelgen.ts`
- **Generator**: `src/levelgen/generator.ts`
- **Validator**: `src/levelgen/generator.ts` → `validateGeneratedLevel`

### Key Fields
```typescript
{
  tileSize: number;          // 16
  width: number;             // tile grid width
  height: number;            // tile grid height
  tileGrid: number[][];      // 0 = air, 1 = solid
  oneWayPlatforms: Array<{x, y, w}>;
  movingPlatforms: Array<{id, x, y, minX, maxX, speed}>;
  entities: Array<{id, type, x, y}>;  // spawn, goal, walker, etc.
  checkpoints: Array<{id, x, y}>;
  goal: {x, y};
  metadata: {world, levelIndex, theme, seed, ...};
}
```

## Movement Parity Artifact

The `movement_metrics.json` artifact is versioned and stable. It contains:

```json
{
  "version": 1,
  "tolerances": {
    "scalarPct": 0.03,
    "frameCount": 1,
    "booleanExact": true
  },
  "metrics": {
    "runTransitionFrames": 8,
    "runToWalkSpeedRatio": 9.84,
    "airGroundAccelRatio": 0.7,
    "jumpBufferLandingSuccess": true,
    "jumpCutOneShotCount": 1,
    "jumpCutFirstFrame": 0,
    "jumpCutSecondFrame": null,
    "skidFirstFrame": 0,
    "skidDurationFrames": 6,
    "skidDurationMs": 96
  }
}
```

## CLI Commands Reference

### Export Single Campaign Level
```bash
npm run unity:export:single
# Equivalent to:
npx tsx scripts/export_levels_for_unity.ts --out artifacts/unity/levels --world 1 --levels 2
```

### Export Movement Metrics
```bash
npm run unity:metrics:export
# Equivalent to:
npx tsx scripts/export_unity_movement_metrics.ts --out unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json
```

### Build All Fixtures (Recommended)
```bash
npm run unity:fixtures:build
npm run unity:fixtures:build:ui
npm run unity:fixtures:build:full
```

Profile-aware fixture refresh:

```bash
npm run unity:fixtures:build -- --media-profile ui
npm run unity:fixtures:build -- --media-profile full
```

### Sync Media Assets Only
```bash
npm run unity:media:sync
npm run unity:media:audit
npm run unity:media:audit:ui
npm run unity:media:audit:full
npm run unity:media:backlog
npm run unity:media:backlog:ui
npm run unity:media:backlog:full
```

### Package Unity Kit Zip
```bash
npm run unity:kit:zip
```

### Media Sync Rules
- Source root is `public/` and destination is `unity-port-kit/Assets/SuperbartAssets/`.
- Runtime image/font inputs are resolved from `ASSET_MANIFEST` in `src/core/assetManifest.ts`.
- Audio inputs are resolved from `AI_MUSIC_TRACKS` in `src/audio/aiMusic.ts` when `--audio true` (default).
- `unity:fixtures:build` runs media sync automatically after fixture generation.
- Run summary is written to `unity-port-kit/MediaSyncManifest.json`.
- `unity:media:audit` writes a diff report to `artifacts/unity/media-audit-<profile>.json`.
- `unity:media:backlog` writes grouped deferred asset reports to `artifacts/unity/media-backlog-*.json`.

### Media Sync Manifest
- `assetCount`: total assets copied in that run.
- `assets[]`: each entry includes `source`, `destination`, and `category` for audit.
- Optional assets are logged as skipped when missing.

## Known Limitations

### ~~Bonus Level Exports Not Supported in M1~~ (Resolved in M2)
The `--bonus=true` export path is now supported. The M1 error guard has been removed and `CAMPAIGN_WORLD_LAYOUT` is properly imported.

### Fixed Timestep Differences
Unity and Phaser may have slight fixed timestep differences. The metric-based parity gates use tolerances to account for this:
- Scalar metrics: ±3%
- Frame counts: ±1 frame

### Pixel Import Settings
Unity's pixel art importer postprocessor auto-configures textures under `Assets/SuperbartAssets/` with:
- Pixels Per Unit: 16
- Filter Mode: Point (no filter)
- Mipmaps: Disabled
- Compression: None

Place all SUPERBART sprite assets under this directory to trigger automatic configuration.

### Non-Manifest Assets

For M1, media sync pulls from runtime manifest assets + optional AI music tracks.
For any non-manifest media you also want ported (menus, cutscene stills, one-off art), use one of:
- Add them directly in your Unity project after import, outside the scripted sync path, or
- Extend `scripts/export_unity_media.ts` with explicit paths and re-run `npm run unity:media:sync`.

Post-M1, the backlog should include a dedicated superset sync mode so `.svg` and presentation-only media can be mirrored consistently alongside gameplay media.

## Troubleshooting

### Test Fixture Not Found
**Symptom**: `FileNotFoundException: Missing fixture file`

**Solution**: Run `npm run unity:fixtures:build` to refresh test resources.

### Movement Metrics Out of Tolerance
**Symptom**: PlayMode test fails with metric mismatch

**Solution**: 
1. Verify `movement_metrics.json` is up-to-date: `npm run unity:metrics:export`
2. Check Unity's `MovementModel.cs` matches Phaser's `src/player/movement.ts`
3. Verify fixed timestep is set to 0.016 (60 FPS) in Unity Project Settings

### Tilemap Not Rendering
**Symptom**: Level loads but tiles are invisible

**Solution**:
1. Assign `TilePalette` ScriptableObject to `LevelLoader`
2. Verify `TilePalette` has valid tile references for `solidTop`, `solidMid`, `solidBottom`, `oneWay`
3. Check Tilemap Renderer is enabled on the Tilemap GameObject

## M2 Features (Delivered)

1. **Full Campaign Export**: All 28 campaign levels (7 worlds x 4 levels) exported via `--all` flag
2. **Bonus Level Support**: `--bonus=true` now supported (M1 blocker removed)
3. **Animator Parity**: `AnimatorBridge.cs` maps `MotionHint` to Animator parameters (MotionState, SpeedX, IsGrounded, VelocityY)
4. **Camera System**: `CinemachineSetup.cs` with lookahead, deadzone, and fallback follow camera
5. **Vanish Platforms**: `VanishPlatformBehaviour.cs` implements visible/hidden cycle with fade-out feedback
6. **World Modifiers Table**: `WorldModifiersTable.cs` provides per-world physics lookup (gravity, friction, speed, token burn)

### New Commands
```bash
npm run unity:export:all   # Export all 28 campaign levels
```

## Next Steps (Post-M2)

1. **Auto-Scroll**: Benchmark and implement forced camera scrolling behavior
2. **Enemy Prefabs**: Create Unity prefabs for all 15 enemy types + 6 bosses
3. **HUD/UI Migration**: Port HUD composition (lives, score, tokens, evals, latency)
4. **Audio Migration**: Port procedural Web Audio API system to Unity audio
5. **Save System**: Port localStorage save persistence to Unity PlayerPrefs/JSON
6. **Scene Flow**: Port scene transitions (Title, WorldMap, Play, Pause, etc.)
7. **Content Tools**: Unity Editor tool to preview and spawn JSON levels

## Additional Documentation

- **Quickstart Guide**: `unity-port-kit/Docs/UNITY_PORT_README.md`
- **Movement Contract**: `docs/clone_feel_contract.md`
- **Playfeel Validation**: `tests/quality.playfeel.test.ts`
- **Level Generation**: `docs/level_generation.md`
