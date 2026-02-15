# Unity Canonical Cutover Plan

**Date:** 2026-02-15  
**Primary State:** Unity runtime is now canonical.

## Shipping Contract (Hard)

- **Unity is the only production shipping runtime.**
- Legacy web/Phaser is retained only as deterministic reference and fixture-generation tooling.
- No gameplay shipping fix should target Phaser without an accompanying Unity implementation.

## What changed

We are stopping dual-track ambiguity and moving to a clear policy:

- Unity carries shipping execution ownership.
- Phaser remains in-repo for deterministic parity, fixture generation, and regression evidence.
- All new feature work defaults to Unity paths unless explicitly marked as legacy-phaser-only.

## Non-negotiables

- The migration is **not reversible** by design. We are not turning this back.
- Web/Phaser is treated as archival-parity code and tooling only.
- Shipping releases, feature branches, and acceptance gates are Unity-bound.

## Bucketed Cutover Board

| Bucket | Scope | Unity Status | Next action |
|---|---|---|---|
| A. Core runtime & scene flow | Player scene orchestration, scene transitions, runtime bootstrap | ✅ In progress (baseline in `unity-port-kit`) | Finish campaign scene flow migration and replace remaining Phaser scene-entry assumptions. |
| B. Movement, physics, and locomotion | Player motor, collision envelopes, platform behaviors, environmental hazards | ✅ Parity baseline in place | Expand PlayMode coverage for remaining hazard edge-cases and benchmarked contact cases. |
| C. Campaign + content | Level loading from `GeneratedLevel`, save state, progression, maintenance/replay mode | 🟨 Partially migrated | Keep contract source in shared fixtures; migrate save/progression storage in Unity next. |
| D. Enemies & systems | Enemy behavior families, combat contracts, HUD/notification systems | 🟨 In progress (contracts + service registry) | Continue prefab migration and attach combat feedback handlers to HUD/audio/FX. |
| E. Audio/visual polish | UI theme loops, music transitions, menus, cutscene polish | 🟨 In progress (shell services + scene stubs) | Expand UI/audio/FX to full badass runtime profile and cinematic flow. |

## Unity Shipping Boundary

- Scene transitions now follow:
  `Boot -> MainMenu -> WorldMap -> LevelPlay -> LevelResult`.
- Save, progression, and checkpoint contract are now Unity-native under key `super_bart_unity_save_v1`.
- Use **`docs/legacy_runtime_reference.md`** for all references to legacy/phaser behavior.

## Immediate hard-stop rules

1. Do not expand web gameplay code for shipping behavior improvements until corresponding Unity bucket work is updated.
2. Treat Unity tests under `unity-port-kit/Assets/SuperbartPort/Tests/` as the release gate for parity-critical changes.
3. Any new asset/media change must include a Unity sync action (`npm run unity:media:sync*`) before sign-off.
4. Treat `docs/INDEX.md` and this plan as the source of truth for execution priority.

## Canonical weekly loop

- Monday: review bucket table, set ownership for one bucket.
- Wednesday: run Unity fixture/media refresh (`npm run unity:fixtures:build`), then parity and smoke check.
- Friday: update bucket statuses and blockers in this doc.

## Current target commands

- `npm run unity:fixtures:build`
- `npm run unity:media:audit`
- `npm run unity:metrics:export`
- `npm run unity:kit:zip`
- `npm run unity:media:backlog`

## Escalation criteria

If a parity gap appears in a shipped flow, block the related bucket until fixed and record:

- failing symptom
- affected scene or level IDs
- expected artifact/fixture contract
- owner + date for resolution
