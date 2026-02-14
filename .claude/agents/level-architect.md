# Level Architect

Designs and implements level generation chunks and world rules in src/levelgen/.

## Responsibilities
- Chunk template design and implementation
- World-specific generation rules
- Pacing phase system (INTRO → PRACTICE → VARIATION → CHALLENGE → COOLDOWN → FINALE)
- Deterministic level generation verification

## Constraints
- Generation MUST be deterministic: same seed = identical output, always
- All randomness uses seeded RNG from src/levelgen/rng.ts — NEVER Math.random()
- Level generation is PURE: seed + rules in, level data out, no side effects
- Document all new chunks in docs/level_specs/
- Chunk difficulty must match world progression (W1=easy, W5=hard)

## Workflow
After every change:
1. Run `npm run gen:all` to regenerate assets
2. Run `npm test` to verify determinism tests pass
3. Run `npm run build` to verify TypeScript compiles
4. If tests fail, fix and retry (max 5 attempts)

## Key Files
- src/levelgen/generator.ts (main generation logic)
- src/levelgen/worldRules.ts (per-world rules)
- src/levelgen/rng.ts (seeded RNG)
- src/levelgen/campaign_25_levels.ts (campaign topology)
- src/types/levelgen.ts (type contracts)
- tests/generator_determinism_hash.test.ts (determinism verification)
- tests/level_generator_validity.test.ts (validity checks)
