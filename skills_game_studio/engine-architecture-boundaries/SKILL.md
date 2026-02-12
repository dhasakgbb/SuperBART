---
name: engine-architecture-boundaries
description: Define architecture boundaries and enforce dependency rules with a deterministic checker.
version: 0.1.0
tags:
  - architecture
  - boundaries
  - maintainability
triggers:
  - modules are tightly coupled
  - team needs layering rules
  - regressions come from dependency drift
tools:
  - markdown
  - python
  - shell
entrypoints:
  - scripts/check_engine_architecture_boundaries.py
---

# Engine Architecture Boundaries

## Purpose
Create architecture constraints that remain engine-neutral and machine-checkable.

## Inputs Required
- Current subsystem list.
- Integration points (runtime, content pipeline, networking, UI, data).
- Known pain points and cyclic dependencies.

## Workflow
1. Ensure destination folders exist.
2. Write `docs/architecture.md` with module map and ownership.
3. Write `docs/dependency_rules.md` with allowed/blocked dependency edges.
4. Generate `tools/check_dependency_rules.py` from the template and adapt it to the code layout.
5. Execute checker on the repository.

## Required Outputs
- `docs/architecture.md`
- `docs/dependency_rules.md`
- `tools/check_dependency_rules.py`

## File Conventions
- Architecture doc must include boundary diagram in text form and module responsibilities.
- Dependency rules file must include allowlist and denylist sections.
- Checker script must fail non-zero when a deny rule is violated.

## Definition of Done
- Required files exist and are coherent.
- Dependency rules can be executed by the checker script.
- At least one sample violation path is documented for reviewer clarity.
- Skill check script exits `0`.

## Guardrails
- Keep rules simple enough for daily use.
- Do not encode engine-specific package paths unless engine is explicitly selected.
- Treat cyclic dependencies as blocking defects.

## Outputs Contract
- Documentation in `docs/`.
- Executable enforcement in `tools/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
