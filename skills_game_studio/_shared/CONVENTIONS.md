# Studio Conventions

This file defines cross-skill conventions for the game studio repository.

## Required Output Destinations
All skills write project artifacts only to these top-level folders:
- `docs/`
- `tickets/`
- `tools/`
- `tests/`
- `telemetry/`
- `build/`
- `assets/`

If a folder is missing, create it first with `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`.

## File Naming
- Use lowercase snake_case for scripts and data files.
- Use descriptive Markdown names for documents.
- Use one concept per file when possible.

## Definition of Done Baseline
A skill run is complete only when:
1. Required artifacts exist at the expected paths.
2. Required sections/checklists are filled with concrete project content.
3. The skill check script exits with status `0`.
4. Any assumptions and open risks are documented in the artifact set.

## Engine-Neutral Policy
- Do not assume Unity/Godot/Unreal.
- Keep outputs engine-neutral unless the user explicitly specifies an engine.
- If engine-specific implementation is required, ask for engine choice once, then continue.

## Shared Templates
- `skills_game_studio/_shared/TEMPLATES/ticket_template.md`
- `skills_game_studio/_shared/TEMPLATES/design_doc_template.md`
- `skills_game_studio/_shared/TEMPLATES/qa_repro_template.md`
- `skills_game_studio/_shared/TEMPLATES/perf_report_template.md`
