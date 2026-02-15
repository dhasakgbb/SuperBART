# SuperBART Unity Media Curation (M1 + Post-M1)

Unity porting works best with a clear media policy. M1 keeps media in sync to a deterministic runtime set first; all remaining art/sfx can be staged by profile.

## M1 Baseline Media Profile

`npm run unity:media:sync` is authoritative for baseline parity and does two things:

- Copies everything in `src/core/assetManifest.ts` (`images`, `spritesheets`, `bitmapFonts`) into `unity-port-kit/Assets/SuperbartAssets/`.
- Copies `src/audio/aiMusic.ts` tracks in `/music/ai` when `--audio true` (default).

This profile is required for:

- Player movement and entity smoke playback
- Movement parity tests
- Tilemap and moving-platform runtime scene smoke

The command also emits `unity-port-kit/MediaSyncManifest.json`, which is the authoritative sync audit artifact for what moved.

Baseline does include more than only "hard gameplay" art because `ASSET_MANIFEST` currently contains world/map art and HUD sprites that are required by current gameplay scenes. Treat `m1` as "ship first" rather than "stripped to absolute minimum."

### Fixture Build Profile Sync

When regenerating fixtures, keep the same media intent explicit:

```bash
# Baseline (default)
npm run unity:fixtures:build

# Baseline + UI/presentation media while rebuilding fixtures
npm run unity:fixtures:build:ui
npm run unity:fixtures:build -- --media-profile ui

# Baseline + full superset while rebuilding fixtures
npm run unity:fixtures:build:full
npm run unity:fixtures:build -- --media-profile full
```

## Deferred Media Profiles (Post-M1)

The following are intentionally deferred from baseline for M1 and usually added manually when target scenes are ready:

- `.svg` source or vector-only art
- Premium/UI variants and alternatives not in the gameplay scene set (`title_bart*`, `title_bg_*_premium`, `title_logo_premium`, etc.)
- Prototype/test-only media (`unnamed*`, `Gemini_Generated_*`, legacy style contract/debug captures)
- Optional map and scene references not yet consumed by M1 level smoke
- Non-AI music / SFX collections not in `AI_MUSIC_TRACKS`

These can be added manually into Unity once scene wiring is in place.

## Media Audit + Curation Decisions

`npm run unity:media:audit` computes where your manifest is relative to the expected profile and writes a reproducible JSON report to `artifacts/unity/media-audit-*.json`.

Example:

```bash
npm run unity:media:audit
npm run unity:media:audit:ui
npm run unity:media:audit:full
```

The report now includes an explicit curation lens so you can decide what to pull forward next:

- Expected assets from profile + `--audio` settings
- Manifest assets loaded from `unity-port-kit/MediaSyncManifest.json`
- Missing/extra assets, destination mismatches, and source availability checks
- `catalog.deferredFromExpected` list: files discovered under `public/assets` that are still deferred by the selected profile

Example: this is what you inspect when asking "what else should we port from art assets?":

```bash
npx tsx scripts/export_unity_media_audit.ts --profile m1 --out artifacts/unity
```

Then:

```bash
cat artifacts/unity/media-audit-m1.json | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')); console.log(data.catalog.deferredFromExpected.length, 'deferred assets'); console.log(data.catalog.deferredFromExpected.slice(0,20).join('\\n'));"
```

If you decide a subset should be included in the default workflow, promote them by:

- adding them to `UI_MEDIA_ASSETS` for a curated inclusion, or
- switching to `--profile full` during fixture build and moving profile-specific assets into a dedicated Unity scene pipeline later.

When you want a concrete backlog artifact to hand to level artists or Unity setup, run:

```bash
npm run unity:media:backlog
```

Use `--profile ui` / `full` variants or CSV format for spreadsheet review:

```bash
npm run unity:media:backlog:ui
npm run unity:media:backlog:full
npx tsx scripts/export_unity_media_backlog.ts --out artifacts/unity/media-backlog.csv --profile full --format csv
```

Use strict mode for release gates when desired:

```bash
tsx scripts/export_unity_media_audit.ts --strict true --profile full
```

## Recommended Curation Workflow

1. Run baseline sync:
   - `npm run unity:media:sync`
2. Verify manifest summary:
   - `cat unity-port-kit/MediaSyncManifest.json`
3. Run an audit to prove the expected manifest contract:
   - `npm run unity:media:audit`
   - `npm run unity:media:backlog` (or `:ui` / `:full`)
4. Manually copy deferred assets only for scenes that need them:
   - UI/HUD: menu backgrounds, premium logo/title variants
   - Narrative/screens: map and scene cutover graphics
   - FX polish: vector `.svg` references while waiting for conversion to final PNG
5. When you add deferred groups, document them in this file and keep parity tests scoped to M1 media.

## Profile-by-Profile Curation Checklist

- `m1`: what ships for first playable smoke and movement parity
  - Ensure this profile stays deterministic and low-noise.
  - Any added asset must be justified by a test or runtime requirement.
- `ui`: presentation polish for title/menu prototypes
  - Keep in sync only for art direction sessions, not for baseline CI.
- `full`: temporary one-shot polish snapshot for offline demo validation
  - This can grow quickly; regenerate intentionally and snapshot artifact checks may change.

## Practical Rule of Thumb

- If an item appears in `src/core/assetManifest.ts`, it is safe to sync via script.
- If it is not there, it belongs to deferred UI/polish buckets unless you intentionally expand M1 scope for a specific playtest.

## Supported Sync Profiles

`scripts/export_unity_media.ts` supports profile flags:

- `--profile m1` (default): runtime baseline only.
- `--profile ui`: baseline + curated UI/presentation assets.
- `--profile full`: ui + discovered extra media (non-manifest images/SVG/font sidecar files) for fuller stage polish.

### Example Commands

```bash
# M1 baseline
npx tsx scripts/export_unity_media.ts --profile m1

# Include curated UI/presentation assets
npx tsx scripts/export_unity_media.ts --profile ui

# Include full media superset for scene polish
npx tsx scripts/export_unity_media.ts --profile full

# Equivalent fixture rebuild path with profile
npm run unity:fixtures:build -- --media-profile ui
npm run unity:fixtures:build -- --media-profile full
```

If you want npm-friendly commands, we also expose:

- `npm run unity:media:sync` (m1)
- `npm run unity:media:sync:ui`
- `npm run unity:media:sync:full`
