# Eval 001 - HUD Drift Rejection

## Input
"Change HUD positions by 30px"

## Expected
- `npm run lint:style` fails.
- Failure output explains which HUD constraint violated style ranges (for example `hudLayout.topText.x out of range`).

## Pass/Fail Checklist
- [ ] Validator exits nonzero.
- [ ] Error message names the exact field and allowed range.
- [ ] No silent pass when offsets exceed style-kit windows.
