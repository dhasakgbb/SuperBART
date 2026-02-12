# Feature Verification: campaign_v3_level_select_pause_victory

## Acceptance Criteria Mapping
1. Save schema v3 + migration path:
   - Implemented in `src/systems/save.ts` (`defaultSave`, `loadSave`, `migrateSave`).
   - Test coverage: `tests/save_migration.test.ts`.
2. Required scene flow including pause and final victory:
   - Implemented in `src/main.ts`, `src/scenes/PauseScene.ts`, `src/scenes/FinalVictoryScene.ts`, `src/scenes/LevelCompleteScene.ts`.
3. Level select unlock enforcement + persistent current level:
   - Implemented in `src/scenes/WorldMapScene.ts` + `setCurrentLevel` in `src/systems/save.ts`.
4. Final castle routes to victory:
   - `completeCurrentLevel` returns `finishedCampaign` and `LevelCompleteScene` routes to `FinalVictoryScene`.

## Verification Evidence
- `npm test`
- Manual flow check: title -> level select -> play -> pause/resume -> level clear -> victory route.
