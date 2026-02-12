# Ticket: player_movement_jump

## Context
- Problem: player controller is not implemented.
- Why now: movement and jump are core to platformer feel.

## Scope
- In scope: horizontal movement, jump, variable jump height.
- Out of scope: power-ups and advanced abilities.

## Acceptance Criteria
1. Left/right input moves player with speed cap.
2. Jump key triggers upward velocity only when grounded.
3. Releasing jump early lowers apex versus holding jump.

## Validation
- Tests: physics sanity test comparing tap and hold apex.
- Manual checks: playable feel check in dev server.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: scaffold_core
