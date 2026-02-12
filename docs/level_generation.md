# Level Generation

## Input Contract
`generateLevel({ world, levelIndex, seed, bonus? })`

## Chunk Grammar
- `start`
- `mid_flat`
- `vertical_climb`
- `coin_arc`
- `enemy_gauntlet`
- `moving_platform`
- `checkpoint`
- `end`

## Rules
- Deterministic RNG from world+level+seed.
- Spawn and goal always present.
- Ground baseline with bounded variance per world.
- Gaps, hazards, and enemy mix scaled by world ruleset.
- Checkpoint chunks injected on interval.

## World Themes
- World 1: Grass
- World 2: Desert
- World 3: Ice
- World 4: Night/Factory
- World 5: Castle
- Bonus: short challenge profile
