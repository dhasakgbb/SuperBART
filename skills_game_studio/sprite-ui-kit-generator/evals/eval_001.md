# Eval 001 - Missing Coin Detection

## Input
"Delete coin.png"

## Expected
- `npm run lint:assets` fails.
- Failure output clearly reports missing `public/assets/sprites/coin.png`.

## Pass/Fail Checklist
- [ ] Validator exits nonzero.
- [ ] Missing file path is explicit in output.
- [ ] No false pass when one required file is removed.
