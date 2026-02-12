# game-design-compiler

Turns a concept into two execution artifacts:
- `docs/GDD.md`
- `tickets/phase_0_backlog.md`

## Usage
1. Gather concept and constraints.
2. Run the workflow in `SKILL.md`.
3. Validate outputs:

```bash
python skills_game_studio/game-design-compiler/scripts/check_game_design_compiler.py
```

## Example Prompt
"Use `$game-design-compiler` to compile a co-op action platformer concept into a GDD and phase-0 backlog."
