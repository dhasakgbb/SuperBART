---
name: reference-look-enforcer
description: Convert a target screenshot into a strict style contract and enforce it with deterministic validation.
version: 0.1.0
tags:
  - art-direction
  - style
  - validation
  - hud
triggers:
  - screenshot target exists and visual drift is appearing
  - HUD placement and palette consistency must be locked
  - CI needs a style guardrail that fails on contract violations
tools:
  - shell
  - typescript
  - markdown
entrypoints:
  - scripts/check_reference_look_enforcer.py
---

# Reference Look Enforcer

## Purpose
Turn `public/assets/target_look.png` into a codified style contract and enforceable style lint checks.

## Inputs Required
- Reference screenshot path (`public/assets/target_look.png`).
- Current HUD constants and style config (`src/style/styleConfig.ts`).
- Project scripts (`package.json`) for lint/test integration.

## Workflow
1. Write and update `docs/style_kit.md` from the reference screenshot.
2. Keep `src/style/styleConfig.ts` as the canonical style contract input.
3. Enforce ranges and named color requirements in `tools/style_validate.ts`.
4. Ensure `npm run lint:style` runs the validator.
5. Ensure `npm run test` (or equivalent) includes style validation.
6. Run this skill checker script.

## Required Outputs
- `docs/style_kit.md`
- `src/style/styleConfig.ts`
- `tools/style_validate.ts`
- `package.json` script wiring for `lint:style`

## Definition of Done
- Style kit contains palette, HUD coordinates/anchors, outline, scale, typography, bloom, and drift guardrails.
- Validator exits nonzero on out-of-range HUD/layout/palette/bloom changes.
- Test or CI path executes style validation before merge.

## Guardrails
- Keep all thresholds numeric and explicit.
- Fail fast with actionable messages.
- Do not allow undocumented palette entries for core gameplay/UI surfaces.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/artifact_check.py`

## Local Resource Files
- `resources/style_contract_template.md`
- `resources/style_drift_checklist.md`
