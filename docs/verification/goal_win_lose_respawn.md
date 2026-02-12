# Feature Verification: goal_win_lose_respawn

## Description
Maps win/lose/respawn criteria to implemented state transitions and verification evidence.


## Ticket
- Path: `tickets/goal_win_lose_respawn.md`

## Acceptance Criteria Mapping
1. Fall and side-hit trigger death + respawn while lives remain.
   - Implementation evidence: `checkFallDeath` and `handlePlayerDeath`.
   - Test evidence: repro scenes and runtime state mode/lives values.
2. Lives reaching zero triggers Game Over.
   - Implementation evidence: `registerPlayerDeath` mode transition to `LOSE`.
   - Test evidence: deterministic state machine transitions.
3. Goal triggers Win state.
   - Implementation evidence: `onPlayerGoalOverlap` with movement halt.
   - Test evidence: `repro_goal_completion.md` scenario.

## Risks
- Respawn invulnerability timing may require tuning.

## Follow-ups
- Add automated integration test for full lose/win flow with scripted inputs.
