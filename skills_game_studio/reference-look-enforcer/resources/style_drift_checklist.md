# Style Drift Checklist

- [ ] `docs/style_kit.md` matches the current reference screenshot intent.
- [ ] `src/style/styleConfig.ts` includes numeric ranges and named palette entries.
- [ ] `tools/style_validate.ts` fails on out-of-range HUD movement.
- [ ] `tools/style_validate.ts` checks required named colors and ramps.
- [ ] `tools/style_validate.ts` checks bloom ranges and tint format.
- [ ] `npm run test` executes style validation.
