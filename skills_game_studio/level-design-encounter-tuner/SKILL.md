---
name: level-design-encounter-tuner
description: Specify level structure and encounter pacing with measurable difficulty and downtime targets.
version: 0.1.0
tags:
  - level-design
  - encounters
  - pacing
triggers:
  - levels lack pacing consistency
  - encounter difficulty spikes unpredictably
  - onboarding and mastery beats are unclear
tools:
  - markdown
  - python
  - shell
entrypoints:
  - scripts/check_level_design_encounter_tuner.py
---

# Level Design Encounter Tuner

## Purpose
Produce level specs and encounter pacing plans that are testable and engine-neutral.

## Inputs Required
- Target mission length and player skill assumptions.
- Encounter types and enemy roster.
- Desired tension curve and rest cadence.

## Workflow
1. Ensure output directories are available.
2. Create `docs/level_specs/` and write one spec per level chunk.
3. Produce encounter pacing template output using `resources/encounter_pacing_template.md`.
4. Document pacing metrics and expected completion time windows.
5. Validate with check script.

## Required Outputs
- `docs/level_specs/` with at least one level spec
- `docs/encounter_pacing_template.md`

## File Conventions
- Level specs must include objective flow, gating, and fail states.
- Encounter pacing document must include intensity curve and downtime windows.
- Use measurable targets (seconds, counts, attempts), not vague descriptors.

## Definition of Done
- Level specs are implementable by level/content teams.
- Encounter pacing has explicit beat timing and challenge targets.
- At least one risk and mitigation is listed for each level.
- Check script exits `0`.

## Guardrails
- Keep pacing adjustments aligned to player learning curve.
- Avoid hidden one-shot failure conditions without telegraphing.
- Do not assume specific engine editor tooling.

## Outputs Contract
- All outputs written under `docs/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
