# Repro Scene: goal_completion

## Intent
Verify touching goal flag transitions to win state.

## Setup
- Build: latest local dev build
- Platform: desktop browser
- Seed/state: player alive with any score

## Steps
1. Traverse level to goal flag.
2. Touch flag collider.
3. Attempt movement input after goal.

## Deterministic Expected Result
- State becomes WIN.
- Player active movement stops.
- HUD shows win message.

## Failure Signature
- Player can continue active play after touching flag, or state does not change.
