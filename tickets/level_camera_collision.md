# Ticket: level_camera_collision

## Context
- Problem: level traversal needs collision and camera framing.
- Why now: side-scrolling platformer requires consistent world movement.

## Scope
- In scope: tilemap loading, collidable ground, camera follow.
- Out of scope: multi-level transitions.

## Acceptance Criteria
1. Tilemap JSON loads from `public/assets/maps/level1.json`.
2. Camera follows player and respects map bounds.
3. Ground/platform collisions prevent tile pass-through.

## Validation
- Tests: level load smoke test on JSON structure.
- Manual checks: walk and jump across platforms.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: scaffold_core
