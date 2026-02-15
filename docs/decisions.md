# SuperBART V3 Decisions (Locked)

## Product Canon

- `SCRIPT.md` is source-of-truth.
- Legacy 25-level/5-world enterprise satire flow is deprecated for active runtime.

## Campaign / Save

- Campaign layout is `7 x 4` nodes.
- Save schema is V5.
- Migration preserves settings and aggregate progression, archives old campaign in `legacySnapshot`, and resets route to `1-1`.

## Flow

- Stage completion routes through interludes.
- Boss completion routes through debrief beats.
- World 6-2 records choice and world 7 ending choice persist in save.

## Rendering / Visual

- Renderer is WebGL-first with automatic Canvas fallback.
- Pixel rules remain locked (`pixelArt`, `antialias=false`, `roundPixels=true`).

## Scope Safety

- Gameplay tuning constants are not changed by visual/art batches.
- Boss gameplay depth remains data-driven and can be expanded without changing flow contracts.

## Unity Port (M2)

- Full campaign export: `--all` flag exports all 28 levels (7 worlds x 4). Fixture builder uses `--all` by default.
- Bonus export M1 blocker removed. `--bonus=true` now functional.
- Vanish platforms: `VanishPlatformBehaviour.cs` toggles collider on visible/hidden cycle with fade-out.
- Animator bridge: `AnimatorBridge.cs` maps `MotionHint` to Animator int parameter `MotionState` (0=Air, 1=Walk, 2=Run, 3=Skid).
- Camera: `CinemachineSetup.cs` auto-configures Cinemachine with lookahead/deadzone; falls back to smooth follow when Cinemachine is absent.
- World modifiers: `WorldModifiersTable.cs` provides static per-world physics lookup mirroring Phaser-side values.
- C# remains topology-agnostic — no hardcoded level/world counts in Unity source.
