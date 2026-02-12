# Ticket: campaign_v3_level_select_pause_victory

- Owner: Gameplay Engineer
- Estimate: 1.5 days
- Dependencies: visual_style_lock, campaign_schema_v3

## Acceptance Criteria
1. Save schema is v3 with campaign unlock/completion tracking and v2 migration path.
2. Scene flow supports Title -> Level Select -> Play -> Pause -> Level Complete -> Game Over -> Final Victory -> Settings.
3. Level select only starts unlocked levels and persists chosen world/level.
4. Final castle completion routes to Final Victory.
