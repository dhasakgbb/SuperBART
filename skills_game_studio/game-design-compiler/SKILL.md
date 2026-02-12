---
name: game-design-compiler
description: Convert a raw game concept into an actionable GDD and phase-0 backlog with testable acceptance criteria.
version: 0.1.0
tags:
  - game-dev
  - design
  - planning
triggers:
  - new game concept needs structure
  - pre-production kickoff
  - ambiguous feature scope
tools:
  - shell
  - markdown
  - python
entrypoints:
  - scripts/check_game_design_compiler.py
---

# Game Design Compiler

## Purpose
Compile a concept pitch into implementation-ready documents without locking into a specific game engine.

## Inputs Required
- One concept statement (theme, genre, target audience).
- Constraints (timeline, team size, platforms).
- Optional engine choice (ask once only if engine-specific delivery is requested).

## Workflow
1. Run `python skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`.
2. Expand the concept into `docs/GDD.md` using `skills_game_studio/_shared/TEMPLATES/design_doc_template.md` and `resources/gdd_section_template.md`.
3. Create `tickets/phase_0_backlog.md` using `skills_game_studio/_shared/TEMPLATES/ticket_template.md`.
4. Ensure each backlog item contains explicit acceptance criteria and validation notes.
5. Record unresolved assumptions in a dedicated risks section.

## Required Outputs
- `docs/GDD.md`
- `tickets/phase_0_backlog.md`

## File Conventions
- `docs/GDD.md` must include headings for core loop, MVP scope, risks, and milestone plan.
- `tickets/phase_0_backlog.md` must include owner, estimate, dependencies, and acceptance criteria for each ticket.

## Definition of Done
- Both required files exist and are non-empty.
- The GDD describes gameplay loop, systems, scope boundaries, and risk mitigations.
- Backlog entries are testable and implementation-ready.
- `python skills_game_studio/game-design-compiler/scripts/check_game_design_compiler.py` exits `0`.

## Guardrails
- Keep the scope aligned to the stated timeline and team size.
- Do not produce engine-specific implementation directives unless the user requested an engine.
- Avoid vague criteria such as "feels fun" without measurable proxies.

## Outputs Contract
- Write only to `docs/` and `tickets/` for this skill.
- Keep templates in `skills_game_studio/game-design-compiler/resources/` as sources, not final deliverables.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
- `skills_game_studio/_shared/TEMPLATES/design_doc_template.md`
- `skills_game_studio/_shared/TEMPLATES/ticket_template.md`
