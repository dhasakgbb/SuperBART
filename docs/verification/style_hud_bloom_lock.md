# Feature Verification: style_hud_bloom_lock

## Acceptance Criteria Mapping
1. HUD top-left portrait/counters and top-right world/time:
   - Implemented in `src/ui/hud.ts` and styled by `src/style/styleConfig.ts`.
2. Bitmap font usage for HUD:
   - Loaded in `src/scenes/BootScene.ts` and consumed by `src/ui/hud.ts` (`bitmapText`).
3. Style-driven bloom fallback:
   - Implemented as additive collectible glow layers in `src/scenes/PlayScene.ts` using `styleConfig.bloom`.
4. Validator coverage for typography/layout/palette/bloom:
   - Implemented in `tools/style_validate.ts`.

## Verification Evidence
- `npm run lint:style`
- `npm test`
- Manual HUD screenshot comparison against `public/assets/target_look.png`.
