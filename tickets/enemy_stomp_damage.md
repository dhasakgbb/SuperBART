# Ticket: enemy_stomp_damage

## Context
- Problem: enemy interaction loop missing.
- Why now: challenge/reward loop needs hazard and combat interaction.

## Scope
- In scope: one enemy type with patrol, stomp kill, side-hit damage.
- Out of scope: ranged attacks or multiple enemy archetypes.

## Acceptance Criteria
1. Enemy patrols between configured min/max X bounds.
2. Downward stomp kills enemy and adds 100 score.
3. Side collision triggers player death flow.

## Validation
- Tests: combat predicate logic deterministic assertions.
- Manual checks: verify stomp and side-hit outcomes.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: player_movement_jump
