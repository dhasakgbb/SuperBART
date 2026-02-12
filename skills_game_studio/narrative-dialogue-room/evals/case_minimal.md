# Eval Case: Narrative Foundation Pass

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/lore_bible.md`
- At least one file in `docs/voice_guides/`
- `docs/localization_constraints.md`

## Pass Checklist
- Canon and timeline are coherent.
- Voice guide includes concrete do/don't rules.
- Localization constraints include placeholder rules.
- Check script passes.

## Manual Trigger
1. Run the skill with fixture prompt.
2. Run check script.
3. Spot-check one dialogue scene draft against the constraints.
