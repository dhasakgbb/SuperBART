# World Map Expected Composition

This gate describes the required `WorldMapScene` look.

## Required Visual Layout

- Header and hints use bitmap text only (no system fonts).
- Map displays 25 campaign nodes with sprite states:
  - `map_node_open`
  - `map_node_done`
  - `map_node_locked`
  - `map_node_selected`
- Path dots connect node order using `map_path_dot`.
- World labels (`WORLD 1` ... `WORLD 5`) align to style-config rows.

## Required Behavior

- Selected node bobs subtly.
- Arrow keys update selected node visuals and keep unlock logic unchanged.
- Enter on unlocked node starts `PlayScene`; locked nodes reject selection.

## Enforcement

- `WorldMapScene` reads coordinates, sprite keys, and text copy from `styleConfig.worldMapLayout`.
- `tools/style_validate.ts` enforces bitmap text usage and sprite-kit node state keys.
