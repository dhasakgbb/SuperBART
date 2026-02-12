# Ticket: coins_score

## Context
- Problem: score loop currently absent.
- Why now: coins provide immediate progression feedback.

## Scope
- In scope: coin placement, overlap pickup, score updates.
- Out of scope: combo multipliers.

## Acceptance Criteria
1. Coin disappears on overlap with player.
2. Score increments by 10 per collected coin.
3. HUD reflects updated score immediately.

## Validation
- Tests: score update logic via deterministic state transitions.
- Manual checks: collect multiple coins in sequence.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: level_camera_collision
