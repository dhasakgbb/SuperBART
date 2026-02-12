# Ticket: goal_win_lose_respawn

## Context
- Problem: level completion and failure states are incomplete.
- Why now: game needs full end-to-end completion loop.

## Scope
- In scope: death+respawn, lives, game over, goal/flag win.
- Out of scope: save slots and checkpoints.

## Acceptance Criteria
1. Fall death and enemy side-hit reduce lives and respawn player when lives remain.
2. Lives reaching zero enters Game Over state.
3. Touching goal flag enters Win state and halts active movement.

## Validation
- Tests: state machine transition tests.
- Manual checks: playthrough to win and forced game-over path.

## Delivery
- Owner: Gameplay Engineer
- Estimate: 1 day
- Dependencies: enemy_stomp_damage, coins_score
