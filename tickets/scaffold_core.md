# Ticket: scaffold_core

## Context
- Problem: repository has no game runtime scaffold.
- Why now: all gameplay depends on deterministic app setup.

## Scope
- In scope: Vite/Phaser setup, core folder structure, base boot flow.
- Out of scope: full gameplay mechanics.

## Acceptance Criteria
1. `npm run dev` starts a Phaser canvas.
2. `npm run build` succeeds.
3. `src/scenes`, `src/logic`, `src/level`, and `src/ui` boundaries are established.

## Validation
- Tests: boot-level smoke test.
- Manual checks: start app and verify canvas renders.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 0.5 day
- Dependencies: none
