# Repro Scene: enemy_side_hit

## Intent
Verify side collision with patrol enemy triggers player death/respawn instead of stomp.

## Setup
- Build: latest local dev build
- Platform: desktop browser
- Seed/state: level start, no previous deaths required

## Steps
1. Start level and move to first enemy patrol zone.
2. Walk into enemy body from the side while not descending from a jump.
3. Observe lives decrement and respawn.

## Deterministic Expected Result
- Lives decrease by 1.
- Player respawns at spawn point.
- Enemy remains alive.

## Failure Signature
- Enemy dies on side contact, or lives do not decrement.
