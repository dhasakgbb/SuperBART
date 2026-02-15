# SCRIPT Alignment Matrix

`SCRIPT.md` section ownership mapping for implementation.

| SCRIPT Area | Primary Code Owner(s) | Supporting Paths |
| --- | --- | --- |
| Premise + world progression | `src/content/scriptCampaign.ts` | `src/content/contentManifest.ts`, `src/levelgen/worldRules.ts` |
| Living world map | `src/scenes/WorldMapScene.ts` | `src/style/styleConfig.ts`, `src/systems/save.ts` |
| Inter-stage interludes | `src/scenes/InterludeScene.ts` | `src/content/scriptNarrative.ts` |
| Debrief beats | `src/scenes/DebriefScene.ts` | `src/content/scriptNarrative.ts` |
| Choice beats + ending | `src/scenes/ChoiceScene.ts` | `src/scenes/CreditsScene.ts`, `src/systems/save.ts` |
| Human-cost environmental layer | `src/content/scriptPlacements.ts` | `src/levelgen/generator.ts`, `src/scenes/PlayScene.ts` |
| Bart moveset (pulse/charge/pound/manual/double-jump) | `src/scenes/PlayScene.ts` | `src/player/movement.ts`, `src/systems/save.ts` |
| Enemy/boss canon wiring | `src/enemies/registry.ts` | `src/enemies/types.ts`, `src/enemies/definitions/Boss.ts` |
| Save/progression persistence contracts | `src/systems/save.ts` | `src/systems/progression.ts`, `src/types/game.ts` |
| Validation + CI gates | `tools/content_validate.ts` | `tests/*.test.ts`, `tools/style_validate.ts`, `tools/asset_validate.ts` |
