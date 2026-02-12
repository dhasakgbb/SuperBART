---
name: qa-harness-repro-first
description: Build a repro-first QA harness with scene-based fixtures and deterministic bug reproduction playbooks.
version: 0.1.0
tags:
  - qa
  - repro
  - testing
triggers:
  - bugs are not reliably reproducible
  - regression testing is inconsistent
  - QA handoff lacks structured repro data
tools:
  - markdown
  - python
  - shell
entrypoints:
  - scripts/check_qa_harness_repro_first.py
---

# QA Harness Repro First

## Purpose
Create deterministic repro assets and a repeatable QA workflow before broad exploratory testing.

## Inputs Required
- Bug class targets (physics, combat, networking, UI, save/load).
- Required platforms and input methods.
- Existing flaky areas.

## Workflow
1. Ensure output directories exist.
2. Create `tests/repro_scenes/` structure and a starter scene index.
3. Write `docs/qa_repro_playbook.md` with repro protocol and evidence checklist.
4. Add at least one reproducibility fixture template in the scene folder.
5. Validate with check script.

## Required Outputs
- `tests/repro_scenes/` directory
- `tests/repro_scenes/README.md`
- `docs/qa_repro_playbook.md`

## File Conventions
- Each repro scene should have unique ID and expected deterministic outcome.
- Playbook must include environment capture and stop conditions.
- Repro docs should reference shared QA template.

## Definition of Done
- Repro scene structure exists and is documented.
- Playbook supports handoff between engineers and QA.
- Hidden assumptions are called out in each repro case.
- Check script exits `0`.

## Guardrails
- Do not merge bug fixes without a repro case when feasible.
- Keep repro steps explicit; avoid vague instructions.
- Separate environment setup from reproduction steps.

## Outputs Contract
- Scene fixtures in `tests/repro_scenes/`.
- Process docs in `docs/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
- `skills_game_studio/_shared/TEMPLATES/qa_repro_template.md`
