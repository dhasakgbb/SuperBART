# SuperBART Unity First-Playable M1 Status

**Date**: 2026-02-15  
**Status**: ✅ COMPLETE

## Shipping Boundary

- Unity is now the canonical shipping runtime.
- Legacy web runtime paths remain parity-only references for determinism and evidence.

## Summary

The SuperBART Unity M1 (first-playable) milestone has been successfully implemented. The project has moved from dual-track to **Unity-canonical** execution, with Phaser retained as a parity/reference implementation.

## Delivered Components

### 1. Tracked Unity Source Structure ✅

**Location**: `unity-port-kit/`

The Unity kit is now maintained as tracked source in the repository (not zip-only):

```
unity-port-kit/
├── Assets/SuperbartPort/
│   ├── Scripts/
│   │   ├── Player/              # Movement model port
│   │   ├── Level/               # Level loader, platform motor
│   │   └── Core/                # Constants and utilities
│   ├── Tests/
│   │   ├── EditMode/            # JSON parse + tile build tests
│   │   ├── PlayMode/            # Movement parity + platform tests
│   │   └── Resources/           # Unity-loadable fixtures (Resources.Load)
│   │       └── Fixtures/
│   │           ├── levels/      # campaign level fixtures + synthetic_moving_platform.json
│   │           └── parity/      # movement_metrics.json
│   └── Editor/                  # Pixel art import postprocessor
└── Docs/
    └── UNITY_PORT_README.md
```

### 2. Deterministic Level Export ✅

**Script**: `scripts/export_levels_for_unity.ts`

- Exports levels from the existing `generateLevel()` function
- Validates using `validateGeneratedLevel()` before writing
- Default export: World 1, Level 2, Seed 120707
- Exports `w1_l2` by default, and supports `--all`/`--bonus` for matrix and bonus runs

**Command**:
```bash
npm run unity:export:single
```

**Artifacts**:
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/` (all campaign fixtures)
- `artifacts/unity/levels/` (all campaign fixtures)

### 3. Synthetic Moving-Platform Fixture ✅

**Location**: `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/synthetic_moving_platform.json`

- Manually authored and committed
- Contains valid `tileGrid`, `movingPlatforms`, `oneWayPlatforms`, `spawn`, and `goal`
- Used by Unity PlayMode tests to validate moving platform runtime behavior

### 4. Movement Parity Metrics ✅

**Script**: `scripts/export_unity_movement_metrics.ts`

Computes and exports canonical movement metrics from Phaser's movement model:
- Run transition frames
- Run/walk speed ratio
- Air vs ground acceleration ratio
- Jump buffer landing success
- Jump cut one-shot behavior
- Skid trigger and duration

**Command**:
```bash
npm run unity:metrics:export
```

**Artifact**: `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json`

**Tolerances**:
- Scalar metrics: ±3%
- Frame-count metrics: ±1 frame
- Boolean/event checks: exact match

### 5. Unity Test Harness ✅

**Location**: `unity-port-kit/Assets/SuperbartPort/Tests/`

#### EditMode Tests (`LevelLoaderEditModeTests.cs`)
- `BuildFromJson_UsesW1L2Fixture_BuildsTiles_AndTeleportsSpawn`
  - Parses `w1_l2.json`
  - Validates tile grid population
  - Validates spawn teleport with Phaser→Unity coordinate conversion
- `BuildFromJson_InstantiatesMappedEntities_FromSyntheticFixture`
  - Validates entity instantiation from synthetic fixture
  - Asserts entity count and tile count

#### PlayMode Tests (`MovingPlatformPlayModeTests.cs`)
- `MovingPlatform_StaysWithinBounds_AndReversesDirection`
  - Tests moving platform stays within `minX`/`maxX` bounds (±1px tolerance)
  - Validates at least one direction reversal occurs

#### PlayMode Tests (`MovementParityPlayModeTests.cs`)
- `MovementModel_MatchesCommittedMetricArtifactWithinTolerance`
  - Loads `movement_metrics.json` via `Resources.Load<TextAsset>()`
  - Computes runtime metrics from Unity's `MovementModel` port
  - Asserts all metrics match within defined tolerances

### 6. Build Automation ✅

**Script**: `scripts/build_unity_fixtures.mjs`

**Command**:
```bash
npm run unity:fixtures:build
```

Orchestrates full fixture refresh workflow:
1. Exports full campaign fixtures (including `w1_l2.json`) to canonical and artifact locations
2. Exports movement metrics
3. Syncs media assets via `npx tsx scripts/export_unity_media.ts --out unity-port-kit/Assets/SuperbartAssets --audio true --manifest true`
4. Syncs fixtures into Unity test resources
5. Runs media audit and writes grouped backlog report

**Output**:
```
unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/ (all campaign fixtures)
unity-port-kit/Assets/SuperbartPort/Tests/Resources/levels/ (all campaign fixtures)
artifacts/unity/levels/ (all campaign fixtures)
unity-port-kit/MediaSyncManifest.json
unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json
unity-port-kit/Assets/SuperbartPort/Tests/Resources/parity/movement_metrics.json
artifacts/unity/media-audit-m1.json
artifacts/unity/media-backlog-m1.json
```

### 7. Packaging Script ✅

**Script**: `scripts/package_unity_port_kit.mjs`

**Command**:
```bash
npm run unity:kit:zip
```

Creates `artifacts/superbart-unity-port-kit.zip` from the tracked `unity-port-kit/` source folder.

### 8. Package.json Unity Commands ✅

All Unity commands are integrated into `package.json`:

```json
{
  "unity:kit:zip": "node scripts/package_unity_port_kit.mjs",
  "unity:export:single": "tsx scripts/export_levels_for_unity.ts --out artifacts/unity/levels --world 1 --levels 2",
  "unity:metrics:export": "tsx scripts/export_unity_movement_metrics.ts --out unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json",
  "unity:media:sync": "tsx scripts/export_unity_media.ts --out unity-port-kit/Assets/SuperbartAssets --audio true --manifest true",
  "unity:media:sync:ui": "tsx scripts/export_unity_media.ts --out unity-port-kit/Assets/SuperbartAssets --audio true --manifest true --profile ui",
  "unity:media:sync:full": "tsx scripts/export_unity_media.ts --out unity-port-kit/Assets/SuperbartAssets --audio true --manifest true --profile full",
  "unity:media:audit": "tsx scripts/export_unity_media_audit.ts",
  "unity:media:audit:ui": "tsx scripts/export_unity_media_audit.ts --profile ui",
  "unity:media:audit:full": "tsx scripts/export_unity_media_audit.ts --profile full",
  "unity:media:backlog": "tsx scripts/export_unity_media_backlog.ts --out artifacts/unity/media-backlog-m1.json --profile m1",
  "unity:media:backlog:ui": "tsx scripts/export_unity_media_backlog.ts --out artifacts/unity/media-backlog-ui.json --profile ui",
  "unity:media:backlog:full": "tsx scripts/export_unity_media_backlog.ts --out artifacts/unity/media-backlog-full.json --profile full",
  "unity:fixtures:build": "node scripts/build_unity_fixtures.mjs",
  "unity:fixtures:build:ui": "node scripts/build_unity_fixtures.mjs --media-profile ui",
  "unity:fixtures:build:full": "node scripts/build_unity_fixtures.mjs --media-profile full"
}
```

### 8b. Media Curation ✅

**Script**: `scripts/export_unity_media.ts`
**Script**: `scripts/export_unity_media_audit.ts`
**Script**: `scripts/export_unity_media_backlog.ts`

- Syncs runtime media from `src/core/assetManifest.ts` plus optional music from `src/audio/aiMusic.ts` (default on).
- Writes `unity-port-kit/MediaSyncManifest.json` with full path/category audit for each copied asset.
- Keeps migration fast and deterministic by making profile selection explicit (`m1`, `ui`, `full`).
- Includes a deferred asset list in `media-audit-*.json` (`catalog.deferredFromExpected`) so curation can be decided intentionally.
- Adds grouped backlog exports (`media-backlog-*.json`) for actionable curation planning and review.
- Detailed profile buckets and curation guidance are tracked in `docs/unity_media_curation.md`.
- Audit report:
  - `artifacts/unity/media-audit-m1.json`, `media-audit-ui.json`, and `media-audit-full.json` (when requested).

### 9. Documentation ✅

#### Main Repository README
**Location**: `README.md`

Added "Unity First-Playable (Dual Track)" section with:
- M1 scope overview
- Deferred features
- Unity command reference

#### Unity Port Runbook
**Location**: `docs/unity_port.md`

Comprehensive first-playable runbook including:
- M1 scope and out-of-scope items
- Repository structure
- Prerequisites (Unity 2022/2023 LTS + packages)
- Step-by-step first-playable workflow
- Unity test descriptions
- Exported level contract reference
- Movement parity artifact format
- CLI command reference
- Known limitations
- Troubleshooting guide
- Post-M1 roadmap

#### Unity Quickstart Guide
**Location**: `unity-port-kit/Docs/UNITY_PORT_README.md`

Quick reference for Unity setup and integration.

## Validation

### Build Commands Tested ✅
```bash
npm run unity:fixtures:build  # SUCCESS
npm run unity:kit:zip         # SUCCESS
```

### Artifacts Generated ✅
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/` (campaign set; includes `w1_l2.json` seeded 120707)
- `unity-port-kit/MediaSyncManifest.json` (runtime media set for Unity sync)
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json` (version=1)
- `artifacts/superbart-unity-port-kit.zip`
- `artifacts/unity/media-backlog-m1.json` and profile variants (`ui`, `full`)

### Unity Tests Available ✅
- 2 EditMode tests
- 2 PlayMode tests (moving platform + movement parity)

## Contract Compliance

### GeneratedLevel Contract ✅
- **Source**: `src/types/levelgen.ts` (unchanged)
- **Generator**: `src/levelgen/generator.ts` (unchanged)
- **Validator**: `validateGeneratedLevel()` (unchanged)

Unity's `GeneratedLevelModel.cs` mirrors the Phaser contract exactly.

### Movement Metrics Contract ✅
- **Source**: `src/player/movement.ts` + `tests/helpers/movementAcceptance.ts`
- **Contract**: `scripts/playfeel_contract.json`

Unity's `MovementModel.cs` ports the Phaser movement model with parity validation.

## Known Limitations (M1 - Resolved in M2)

### ✅ Bonus Level Exports (Fixed in M2)
The `--bonus=true` export path is now functional. The M1 error guard has been removed.

### ✅ Resolved in M2
- ~~Vanish one-way platform timing behavior~~ → `VanishPlatformBehaviour.cs`
- ~~Full campaign export matrix~~ → `--all` flag exports all 28 levels
- ~~Animator parity~~ → `AnimatorBridge.cs`
- ~~Camera system~~ → `CinemachineSetup.cs`
- ~~World modifiers~~ → `WorldModifiersTable.cs`

### ⏭ Deferred to Post-M2
- Benchmark auto-scroll behavior
- Full scene/UI/audio/save migration
- Full Unity media superset sync (legacy `.svg`, premium/title variants, cutscene assets)
- Enemy prefab creation (15 types + 6 bosses)
- HUD/UI migration

## Next Steps (Post-M2 Roadmap)

1. **Auto-Scroll**: Benchmark and implement forced camera scrolling
2. **Enemy Prefabs**: Create prefabs for all 15 enemy types + 6 bosses
3. **HUD/UI Migration**: Port HUD composition
4. **Audio Migration**: Port procedural Web Audio system
5. **Save System**: Port save persistence
6. **Scene Flow**: Port scene transitions
7. **Content Tools**: Unity Editor tool to preview and spawn JSON levels

## Repository Integrity

### No Breaking Changes ✅
- Legacy Phaser parity runtime remains for comparison and verification scripts.
- Existing automated checks continue to pass.
- Core gameplay contracts remain source-of-truth in generation/fixture logic.

### Unity-Canonical Strategy Validated ✅
- Unity is now the shipping runtime target.
- Phaser remains as a legacy parity/validation companion.
- Deterministic fixture and media workflows are in place for Unity.
- Reproducible build process maintained across Unity and legacy outputs.

## Sign-Off

**M1 Milestone**: ✅ COMPLETE  
**Platform Strategy**: Unity-canonical migration in progress  
**Artifact Strategy**: Tracked source confirmed  
**Parity Strategy**: Metric-based tolerances established  
**Test Coverage**: EditMode + PlayMode harness in place  
**Documentation**: Comprehensive runbook and quickstart delivered

All M1 deliverables are complete and validated.
