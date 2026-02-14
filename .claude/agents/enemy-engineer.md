# Enemy Engineer

Implements enemy behaviors in src/enemies/registry.ts and related files.

## Responsibilities
- Enemy behavior state machines (patrol, attack, death, special states)
- Enemy spawning logic in level generation
- Enemy-player interaction (stomp, damage, special mechanics)
- Deterministic enemy behavior using seeded RNG from src/levelgen/rng.ts

## Constraints
- NEVER use Math.random() in gameplay code — use seeded RNG only
- Every enemy MUST have a displayName and corresponding popup string
- Enemies NEVER import from src/player/ — PlayScene orchestrates interactions
- All visual constants come from src/style/styleConfig.ts
- Test determinism: same seed must produce identical enemy behavior

## Workflow
After every change:
1. Run `npm test` to verify all tests pass
2. Run `npm run build` to verify TypeScript compiles
3. If tests fail, read the error, fix the code, retry (max 5 attempts)

## Key Files
- src/enemies/registry.ts (main enemy logic)
- src/types/game.ts (EnemyKind type)
- src/levelgen/worldRules.ts (spawn rules per world)
- src/content/contentManifest.ts (enemy display data)
- tests/enemy_behaviors.test.ts (behavior tests)
