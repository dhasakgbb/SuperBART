# Target Look Style Kit

Source of truth for visual and typography contract decisions.

## Reference Contract

| name                | path                               | role      | required | scenes                                                                                                        | reason                                                             | notes                                               |
| ------------------- | ---------------------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| primary_reference   | `public/assets/target_look.png`    | primary   | true     | BootScene,TitleScene,WorldMapScene,PlayScene,GameOverScene,LevelCompleteScene,FinalVictoryScene,SettingsScene | Primary NES baseline for all user-facing lock scenes.              | Used as canonical lock coverage source.             |
| secondary_reference | `public/assets/target_look_2.jpeg` | secondary | false    | PlayScene,WorldMapScene                                                                                       | Supplemental visual parity reference for play/map campaign review. | Do not treat as source-of-truth for lock decisions. |

## Scene Style Exceptions

No approved scene exceptions are currently documented.

If an exception is approved later, add rows below with the exact columns: `scene`, `rationale`, `approvedBy`, `since`, and `notes`.

## Contract Metadata

- contractVersion: `1.0.0`
- authoritativeSource: `src/style/styleConfig.ts`
- referenceTargetSource: `styleConfig.referenceTargets`
- sceneLockScope: `all-user-facing`

## Contract Scope

- `sceneLockScope` is `all-user-facing`.
- User-facing scenes: `BootScene`, `TitleScene`, `WorldMapScene`, `PlayScene`, `GameOverScene`, `LevelCompleteScene`, `FinalVictoryScene`, `SettingsScene`.

## Palette

| Name         | Hex       | Usage                                      |
| ------------ | --------- | ------------------------------------------ |
| inkDark      | `#1D1D1D` | Primary sprite/UI outlines                 |
| inkSoft      | `#2B2824` | Secondary contours                         |
| skyDeep      | `#000000` | Gameplay/title upper sky                   |
| skyMid       | `#060808` | Gameplay/title lower sky                   |
| skyBlue      | `#6B8CFF` | Gameplay sky (top)                         |
| skyLight     | `#9CBDFF` | Gameplay sky (bottom)                      |
| grassTop     | `#46BA4C` | Terrain highlight + map completion accents |
| grassMid     | `#20A36D` | Terrain mids                               |
| groundShadow | `#742B01` | Terrain low values                         |
| groundMid    | `#B6560E` | Terrain mids                               |
| groundWarm   | `#DC7C1D` | Terrain warmth + title depth               |
| coinCore     | `#DED256` | Coin/light interior                        |
| coinEdge     | `#DC7C1D` | Coin edge                                  |
| hudText      | `#FFFFFF` | Primary HUD/map text                       |
| hudAccent    | `#FFD700` | Counters, title accents, selected state    |
| hudPanel     | `#1A1A1D` | HUD/map dark panel fill                    |
| bloomWarm    | `#FFEB9C` | Additive glow tint                         |

## HUD Contract

- Gameplay HUD is icon-driven and compact.
  - Left group: `bart_portrait_96` plus `BART` with life counter text (`BART xNN`).
  - Right group: world/time text remains compact and bitmap rendered.
  - Collectible counters use dedicated icons and numeric text (`✦###` for evals, `◎###` for tokens/coins).
- Gameplay world labels are disallowed on entities.
  - No gameplay entity names, static title-style copy, or floating `add.text` labels over world actors in `PlayScene.ts`.
  - Allowed in-play popups are HUD toast messages only (`this.showHudToast`).

## Pixel Rules

- Base tile grid: `16x16`.
- World rendering uses nearest-neighbor only.
- Outline target is `2px` and max allowed is `3px`.
- Preserve dark silhouette readability for player, enemies, nodes, and blocks.
- Gameplay must not place world-space labels above entities (enemy, pickup, or block sprites).
- Allowed gameplay text is transient popup messaging only (`showHudToast`), including short checkpoint notices.

## Source Color Baseline

- `skyDeep`: `#000000`
- `skyMid`: `#060808`
- `grassTop`: `#46BA4C`
- `hudText`: `#FFFFFF`
- `hudAccent`: `#FFD700`

## Player Animation Contract

- `stateContract`: exact state list is `idle`, `walk`, `run`, `skid`, `jump`, `fall`, `land`, `hurt`, `win`, `dead`.
- Contract source is `src/player/PlayerAnimator.ts` (`STATE_TO_FRAME`), and it must match both the runtime animator state map and the generated animation definitions in `src/anim/playerAnims.ts`.
- Both `bart_body_small` and `bart_body_big` must define every contract state with matching frame sequences and source mode.

## Title Screen Contract

- World/Title HUD and copy remain defined by `src/style/styleConfig.ts`.
- All title UI elements remain camera-fixed via `setScrollFactor(0)`.
- Title render pass is `renderGameplayBackground(...)` for attract sequence background.
- Title text/labels are bitmap-only and sourced from `scene.fontKey`.

## Gameplay Background Contract

- `renderGameplayBackground(...)` owns play background composition.
- Required layers:
  - fixed sky + haze,
  - drifting clouds (`scrollFactor` locked within `0.05-0.12`),
  - far hill layer (`hill_far`, `scrollFactor 0.10`),
  - near hill layer (`hill_near`, `scrollFactor 0.22`).
- Gameplay uses no persistent world-space title labels.

## World Map Contract

- `WorldMapScene` uses bitmap text and sprite-kit visuals only.
- Node states use generated sprites:
  - `map_node_open`, `map_node_done`, `map_node_locked`, `map_node_selected`.
- Layout is driven by `styleConfig.worldMapLayout` with all 25 campaign nodes.

## Visual Regression Gate

- Runtime capture script: `tools/capture_visual_baselines.ts`.
- Goldens:
  - `docs/screenshots/golden/title_scene_golden.png`
  - `docs/screenshots/golden/map_scene_golden.png`
  - `docs/screenshots/golden/play_scene_golden.png`
- Required commands:
  - `npm run lint:style`
  - `npm run lint:visual`
