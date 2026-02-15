# SUPERBART Unity Port Kit

See `Docs/UNITY_PORT_README.md`.

This kit is tracked in-repo as an editable source package, and also packagable via:

```bash
npm run unity:kit:zip
```

It contains Unity-ready scripts (drop into `Assets/`) that:
- Port SUPERBART’s player movement feel model (coyote + buffer + jump-cut + run charge + skid)
- Load a `GeneratedLevel` JSON and build a Tilemap + spawn entity prefabs
- Auto-configure pixel-art texture import settings for anything under `Assets/SuperbartAssets/`

For the first-playable milestone workflow and full command runbook, use:

- `docs/unity_port.md` (authoritative M1 workflow)
- `npm run unity:fixtures:build` (refresh level + metric artifacts)
- `docs/unity_media_curation.md` (media curation policy and deferred media buckets)
- `npm run unity:fixtures:build -- --media-profile ui` (include UI/presentation media in fixture refresh)
- `npm run unity:fixtures:build -- --media-profile full` (include full non-runtime media set in fixture refresh)
- `npm run unity:fixtures:build:ui` and `npm run unity:fixtures:build:full` (same profile options)

To sync just art/audio/media assets without regenerating fixtures:

- `npm run unity:media:sync`
