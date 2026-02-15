# Super BART

Unity-first platformer project targeting **Unity 2022+/2023 LTS** as the canonical runtime, with Phaser + TypeScript + Vite retained as an internal parity/verification runtime.

## Campaign
- 25-level campaign layout: `World 1-4 => 6 levels each`, `World 5 => final castle`.
- Deterministic chunk+seed generation for each world/level pair.
- Local save progression with unlocked/completed level tracking (schema v3).

## Legacy Web Runtime (Phaser Reference)
```bash
cd SuperBART
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Required Quality Gates
```bash
npm run music:ai:prepare
npm run gen:all
npm run lint:content
npm run lint:assets
npm run lint:style
npm run lint:audio
npm run lint:visual
npm test
npm run build
```

Run all required gates in strict order with one command:

```bash
npm run ci:gates
```

Run all gates and persist per-gate JSONL telemetry:

```bash
npm run ci:gates:log
```

## Clone-feel readiness
- Contract: `docs/clone_feel_contract.md`
- Playfeel validation test: `npm run test -- tests/quality.playfeel.test.ts`
- Status log: `docs/clone_readiness_status.md`

## Unity First-Playable (Canonical Runtime)
Unity is the canonical runtime track from now on. Phaser stays as a deterministic reference implementation for parity checks, fixture generation, and regression scripts.

## Shipping Mode

**Unity-only shipping is active.**
- `phaser` scripts remain reference-only and are never valid production launch paths.
- Unity ship flow is now controlled through `unity:ship:*` and `qa:unity:ship`.

### Canonical Runbook
- Open `unity-port-kit/` in Unity Hub.
- Install required packages in Unity (see `docs/unity_port.md`).
- Follow `docs/unity_port.md` for full engine bootstrap, fixture refresh, and playability checks.
- Use `npm run unity:fixtures:build` before opening Unity to sync deterministic level and media artifacts.
- Use `npm run unity:kit:zip` to snapshot and share the tracked Unity kit state.

### Legacy Commands (Phaser)
- `npm run dev`, `npm run build`, and `npm run preview` are preserved as legacy compatibility entrypoints.
- Prefer explicit legacy commands when running parity checks:
  - `npm run phaser:dev`
  - `npm run phaser:build`
  - `npm run phaser:preview`
- Explicit legacy aliases are also available:
  - `npm run legacy:dev`
  - `npm run legacy:build`
  - `npm run legacy:preview`

- Tracked Unity kit source: `unity-port-kit/`
- Unity runbook: `docs/unity_port.md`
- M1 scope:
  - Player feel parity (coyote, jump buffer, jump cut, run charge, skid)
  - GeneratedLevel JSON loading into Tilemap + entities
  - One deterministic campaign export (`w1_l2.json`, seed `120707`)
  - Synthetic moving platform fixture for runtime validation
- Deferred to post-M1:
  - Vanish one-way behavior
  - Benchmark auto-scroll behavior
  - Bonus-level export path

### Unity Commands
```bash
# Refresh deterministic level + movement metrics fixtures
npm run unity:fixtures:build
# Optional profiles while rebuilding fixtures:
# ui/presentation media
npm run unity:fixtures:build -- --media-profile ui
# full media superset (including discovered polish assets)
npm run unity:fixtures:build -- --media-profile full
npm run unity:fixtures:build:ui
npm run unity:fixtures:build:full

# Sync curated media assets into unity-port-kit/Assets/SuperbartAssets
npm run unity:media:sync
# Sync curated UI/media presentation assets
npm run unity:media:sync:ui
# Sync full non-runtime media superset (for scene polish)
npm run unity:media:sync:full
# Audit media profile coverage vs manifest
npm run unity:media:audit

# Audit variants:
npm run unity:media:audit:ui
npm run unity:media:audit:full

# Export deferred-media backlog (sorted by folder)
npm run unity:media:backlog            # artifacts/unity/media-backlog-m1.json (default)
npm run unity:media:backlog:ui          # artifacts/unity/media-backlog-ui.json
npm run unity:media:backlog:full        # artifacts/unity/media-backlog-full.json

# Export one deterministic campaign smoke level to artifacts
npm run unity:export:single

# Export all campaign levels (28 total)
npm run unity:export:all

# Re-export movement parity metrics
npm run unity:metrics:export

# Package tracked unity-port-kit/ into artifacts/superbart-unity-port-kit.zip
npm run unity:kit:zip

# Unity ship command surface
npm run unity:ship:sync
npm run unity:ship:smoke
npm run unity:ship:build
npm run qa:unity:ship
```

Media curation note: default Unity sync includes `ASSET_MANIFEST` runtime media + optional AI music from `AI_MUSIC_TRACKS`. 

For deterministic curation reviews:

- `npm run unity:media:audit` checks manifest drift and source availability.
- `artifacts/unity/media-audit-*.json` now also reports `catalog.deferredFromExpected` for selecting next assets to curate.
- Non-manifest UI/cutscene/logo variants remain optional until added to the UI/full profiles.

Detailed curation guidance lives in:

- `docs/unity_media_curation.md`

## Asset Generation Commands
```bash
npm run gen:assets
npm run gen:avatars
npm run gen:all
npm run lint:assets
npm run lint:style
npm run lint:audio
npm run lint:visual
```

## AI Music Generation (Optional)
```bash
# Highest quality free tier option:
# 1) Create a free Hugging Face token (hf_xxx)
# 2) (Optional but recommended) set your token so authenticated spaces are easier to access:
export HF_API_TOKEN=...
# 3) Run:
npm run music:ai:generate

# Optional explicit space list (fallback order):
HF_API_TOKEN=... npm run music:ai:generate -- --spaces artificialguybr/Stable-Audio-Open-Zero,1inkusFace/Stable-Audio-Open-Zero,freddyaboulton/stableaudio-open-1.0,ybang/stable-audio,manoskary/stable-audio-open-1.0-music,swaminarayana/Stable-Audio-Open-Zeroojbkj,awacke1/MusicMaker

# Optional quality profile tuning:
HF_API_TOKEN=... npm run music:ai:generate -- --min-duration-seconds 47 --target-format flac --target-samplerate 44100 --target-channels 2

# 4) Regenerate all tracks, even if they already exist:
HF_API_TOKEN=... npm run music:ai:generate -- --force

# 5) Regenerate selected tracks:
HF_API_TOKEN=... npm run music:ai:generate -- --force --tracks world-1,world-2,world-3,boss-1,boss-2,boss-3,title,world-map

# Other supported controls:
HF_API_TOKEN=... npm run music:ai:generate -- --space artificialguybr/Stable-Audio-Open-Zero --endpoint /predict
HF_API_TOKEN=... npm run music:ai:generate -- --steps 120 --cfg 8
HF_API_TOKEN=... npm run music:ai:generate -- --retries 3 --parallel 2
HF_API_TOKEN=... npm run music:ai:generate -- --dry-run
# Endpoint resolver supports /predict, /generate_audio, /generate, /generate_music, plus prompt-like fallbacks.

# Post-generation processing and checks
# Install Python deps for normalization/audit:
# python3 -m pip install mutagen soundfile numpy scipy
npm run music:ai:normalize
npm run music:ai:audit

# Quality gate pattern:
# - if HF_API_TOKEN present, run generate (force) + normalize + audit before release
# - without token, run audit-only to verify local AI artifacts are valid
npm run music:ai:prepare
```
Generated tracks are written to `public/music/ai/world-*.flac`, `public/music/ai/boss-*.flac`, `public/music/ai/title.flac`, and `public/music/ai/world-map.flac`, and loaded automatically by gameplay, title, and world map music flow.
Use `npm run music:ai:generate:force` to regenerate even if files already exist.

## Controls
- Title:
  - `Enter` level select
  - `N` new game
  - `S` settings
- Level Select:
  - `Up/Down/Left/Right` select level
  - `Enter` play selected unlocked level
  - `S` settings
  - `Esc` title
- Gameplay:
  - Move: Arrow keys or `A/D`
  - Jump: `Space`, `W`, or `Up`
  - Restart level: `R`
  - Pause: `Esc` or `P`
- Pause:
  - `Esc` or `P` resume
  - `L` level select
  - `T` title
- Settings:
  - `Q/E` master volume down/up
  - `A/D` music volume down/up
  - `Z/C` SFX volume down/up
  - `M` toggle music mute
  - `X` toggle SFX mute
  - `Esc` back

## Bart Source Update
1. Replace `public/assets/bart_source.png`.
2. Run:
```bash
npm run gen:avatars
npm run lint:assets
```
3. For full refresh before build, run:
```bash
npm run gen:all
```

## Deterministic Debug Helpers
- `window.__SUPER_BART__.getState()`
- `window.render_game_to_text()`
- `window.capture_perf_snapshot()`
- `window.advanceTime(ms)`

## Extra Tooling
```bash
npm run level:preview
python3 tools/check_dependency_rules.py
python3 skills_game_studio/reference-look-enforcer/scripts/check_reference_look_enforcer.py
python3 skills_game_studio/sprite-ui-kit-generator/scripts/check_sprite_ui_kit_generator.py
```
