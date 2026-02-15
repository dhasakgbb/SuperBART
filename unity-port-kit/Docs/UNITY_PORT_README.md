# SUPERBART → Unity (2D) Port Kit

This kit is meant to get SUPERBART playable in **Unity** quickly while preserving the *feel* you already tuned in Phaser.

## What this kit maps from
- Tooling: **Vite + TypeScript**
- Engine: **Phaser 3** (`phaser` dependency)
- Architecture: scene-based with `BootScene`, `TitleScene`, `WorldMapScene`, `PlayScene`, etc.
- Movement model: deterministic-ish `stepMovement()` with **coyote time**, **jump buffer**, **jump cut**, **run charge**, **skid**.
- Level model: procedural generator returns a `GeneratedLevel` with a simple solid `tileGrid` (0/1 occupancy) + entities.

Vite isn’t what’s making you “weak” here — your runtime architecture is already pretty solid. Unity is still a valid choice if you want editor tooling, prefabs, tilemap workflows, and native builds.

---

## Recommended Unity version + packages
- Unity **2022 LTS** or **2023 LTS**
- 2D packages:
  - **2D Tilemap**
  - **Cinemachine** (camera)
  - **Input System** (optional but recommended)
  - **Newtonsoft Json** (`com.unity.nuget.newtonsoft-json`) for level JSON parsing

> This kit’s `LevelLoader` uses Newtonsoft.Json because Unity’s built-in `JsonUtility` does not handle jagged arrays + nested structures reliably.

---

## Fast start (5 minutes)
1. Create a new Unity project: **2D (URP optional)**
2. Copy this kit’s `Assets/SuperbartPort` folder into your Unity project’s `Assets/`.
3. (Recommended) Copy your art/audio into:
   - `Assets/SuperbartAssets/` (any structure under it is fine)
4. Install packages:
   - Window → Package Manager → install **Cinemachine**
   - Install **Input System** (Unity will prompt to enable)
   - Install **Newtonsoft Json** (search “Newtonsoft”)
5. Create a scene `Level_Test` and add:
   - `Grid` (GameObject → 2D Object → Tilemap → Rectangular)
   - On the Tilemap object, add `TilemapCollider2D` + `CompositeCollider2D` + `Rigidbody2D (Static)`
     - Set TilemapCollider2D → “Used By Composite” ✅
   - Create an empty `GameObject` named `LevelLoader`
     - Add the `LevelLoader` component
     - Assign references (Tilemap, TilePalette, PrefabRegistry)

---

## Phaser → Unity mapping (mental model)

| Phaser (today) | Unity port equivalent |
|---|---|
| `BootScene` | `Boot` scene / bootstrapper GameObject |
| `TitleScene` | `MainMenu` scene |
| `WorldMapScene` | `WorldMap` scene |
| `PlayScene` | `Level` scene (Tilemap + entities) |
| `PauseScene` | UI overlay + timescale |
| `AudioEngine` | `AudioMixer` + `AudioManager` |
| `tileGrid` 0/1 | Tilemap cells + TilemapCollider |
| one-way platforms | `PlatformEffector2D` |
| moving platforms | prefab + script path motion |

---

## Exporting your procedural levels to Unity (recommended)
You can keep your existing TS generator and **pre-bake** JSON levels for Unity from the SuperBART repository.

**Approach**
- Run a Node script that imports your generator (`src/levelgen/generator.ts`)
- Save output JSON files to Unity’s `StreamingAssets/levels/`
- Unity loads them by filename

The canonical exporter lives in the SuperBART repo at `scripts/export_levels_for_unity.ts`, and is exposed via:

```bash
npm run unity:fixtures:build
```

If you need UI or non-runtime polish media in that same refresh, pass the profile:

```bash
npm run unity:fixtures:build -- --media-profile ui
npm run unity:fixtures:build -- --media-profile full
```

That refreshes:
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/w1_l2.json` (deterministic campaign smoke level)
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/parity/movement_metrics.json`
- `unity-port-kit/Assets/SuperbartPort/Resources/Fixtures/levels/synthetic_moving_platform.json` fixture
- Mirrored copies under:
  - `unity-port-kit/Assets/SuperbartPort/Tests/Resources/levels/w1_l2.json`
  - `unity-port-kit/Assets/SuperbartPort/Tests/Resources/parity/movement_metrics.json`

A legacy helper script is still included for historical context:

`unity-port-kit/Tools/export_levels_for_unity.ts` is kept as reference only; it is not part of the canonical workflow.

## Media curation

- Unity expects all sprite/tileset/font assets under `Assets/SuperbartAssets/` so the postprocessor can apply pixel-art import defaults.
- For tracked-source parity workflows, sync media from `public/` using:

```bash
npm run unity:media:sync
```

- For a complete refresh of fixtures + metrics + media in one command:

```bash
npm run unity:fixtures:build
```

This sync reads:
- `src/core/assetManifest.ts` (images, spritesheets, fonts)
- `src/audio/aiMusic.ts` (`/music/ai/*.flac` tracks, optional via `--audio false`).

If you need a wider set during fixture refresh, pass `--media-profile`:

```bash
npm run unity:fixtures:build -- --media-profile ui
npm run unity:fixtures:build -- --media-profile full
npm run unity:fixtures:build:ui
npm run unity:fixtures:build:full
```

M1 intentionally keeps the sync set focused:
- Gameplay runtime assets from `ASSET_MANIFEST` (tiles, sprites, fonts)
- Optional style references and `.svg`/premium presentation art are handled by curation profile choice or manually while post-M1 polish work is completed.

For reproducible curation checks:

```bash
npm run unity:media:audit
npm run unity:media:audit:ui
npm run unity:media:audit:full
npm run unity:media:backlog
npm run unity:media:backlog:ui
npm run unity:media:backlog:full
```

> Note: M1 intentionally does not support bonus (`--bonus=true`) exports due a known legacy-generator issue.

### Media profile notes

For now, sync scope is intentionally gameplay-first by default:

- Required assets: manifest-backed gameplay media + optional AI music
- Deferred assets: title/menu variants, `.svg` source art, premium alternates, and non-essential presentation media
- Use `--profile` to expand beyond baseline:
  - `--profile ui` for curated UI/presentation media
  - `--profile full` for expanded non-runtime polish set

The complete curation matrix is documented at:

- `../../docs/unity_media_curation.md`

---

## What’s inside this kit
- **Player motor**: a direct port of `src/player/movement.ts` into C# (coyote/buffer/jump-cut/run/skid)
- **Level model + loader**: parses your `GeneratedLevel` JSON (tileGrid + entities) and builds a Tilemap
- **Pixel import postprocessor**: if you put textures under `Assets/SuperbartAssets/`, it auto-sets:
  - Pixels Per Unit = 16
  - Filter Mode = Point
  - No mip maps
  - No compression

---

## Next upgrades (after first playable)
1. **Animator parity**: map `MotionHint` to Animator states (idle/walk/run/skid/jump/fall)
2. **Hazards**: spikes/springs/thwomps with clean collision layers
3. **Camera**: Cinemachine follow + lookahead + deadzone
4. **Deterministic replays**: Unity input recording + fixed tick
5. **Content tools**: editor tool to preview a JSON level and spawn it
