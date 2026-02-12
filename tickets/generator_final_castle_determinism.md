# Ticket: generator_final_castle_determinism

- Owner: Gameplay/Tools Engineer
- Estimate: 1 day
- Dependencies: campaign_schema_v3

## Acceptance Criteria
1. Generator supports 25-level campaign with world layout [6,6,6,6,1].
2. Final castle uses higher hazard density and chunk biasing.
3. Deterministic hash test proves stable output for identical inputs.
4. Level preview tool prints deterministic snapshot for world/level/seed.
