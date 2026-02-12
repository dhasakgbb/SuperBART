# Eval Case: Minimal Concept Compilation

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/GDD.md`
- `tickets/phase_0_backlog.md`

## Pass Checklist
- GDD includes core loop, MVP scope, and risks.
- Backlog file contains at least 3 tickets with acceptance criteria.
- Check script passes.

## Fail Conditions
- Missing required files.
- Acceptance criteria are non-testable.
- Scope lacks clear in/out boundaries.

## Manual Trigger
1. Run the skill with the fixture prompt.
2. Execute:
   `python skills_game_studio/game-design-compiler/scripts/check_game_design_compiler.py`
3. Review assumptions section for hidden scope creep.
