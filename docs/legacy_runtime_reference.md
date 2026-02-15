# Legacy Web Runtime Reference

Unity is now the canonical shipping runtime for SuperBART.

## Purpose
This document exists to preserve behavior assumptions from the web/Phaser implementation without using it as a production runtime path.

## What this runtime is for
- Deterministic contract comparison and fixture generation
- Regression script parity checks
- Playfeel baseline comparison when iterating on the Unity port
- Historical behavior reference for edge-case investigation

## Canonical boundary
- Gameplay execution, progression, save-state, scene routing, audio/visual polish, and release artifacts are controlled from the Unity port.
- Phaser/Phaser-in-TS changes must not be used as production ship fixes.
- New shipping behavior should target `unity-port-kit` and be represented in Unity save/contracts.

## Shared contract touch points
- Movement parity: `src/player/movement.ts` and `unity-port-kit/Assets/SuperbartPort/Scripts/Player/MovementModel.cs`
- Level fixture format: `src/types/levelgen.ts` and `unity-port-kit/Assets/SuperbartPort/Scripts/Level/GeneratedLevelModel.cs`
- Fixture regeneration: `npm run unity:fixtures:build`
