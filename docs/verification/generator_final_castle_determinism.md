# Feature Verification: generator_final_castle_determinism

## Acceptance Criteria Mapping
1. Campaign layout `[4,4,4,4,4,4,4]`:
   - Referenced through progression/constants and used by tests.
2. Final castle hazard/chunk bias:
   - Implemented in `src/levelgen/generator.ts` when `world=5` and `levelIndex=1`.
3. Determinism hash lock:
   - Implemented in `tests/generator_determinism_hash.test.ts`.
4. Deterministic preview tool:
   - Implemented in `tools/level_preview.ts`.

## Verification Evidence
- `npm run level:preview`
- `npm test`
