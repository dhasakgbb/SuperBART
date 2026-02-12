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
3. Include a dedicated title-screen composition spec (`Title Screen Spec`) with anchors, timing, and attract background checklist.
4. Enforce ranges and named color requirements in `tools/style_validate.ts`.
5. Enforce that `TitleScene` reads from `styleConfig.titleLayout` (no hardcoded placement magic numbers).
6. Ensure `npm run lint:style` runs the validator.
7. Ensure `npm run test` (or equivalent) includes style validation.
8. Run this skill checker script.

## Required Outputs
- `docs/style_kit.md`
- `docs/screenshots/title_expected.md`
- `docs/screenshots/golden/title_scene_golden.png`
- `src/style/styleConfig.ts`
- `tools/style_validate.ts`
- `tools/visual_regress.ts`
- `package.json` script wiring for `lint:style`

## Definition of Done
- Style kit contains palette, HUD coordinates/anchors, outline, scale, typography, bloom, and drift guardrails.
- Style kit contains a title-screen section with composition coordinates, font treatment, prompt blink timing, and background checklist.
- Validator exits nonzero on out-of-range HUD/layout/palette/bloom changes.
- Validator exits nonzero if `TitleScene` drifts from `styleConfig.titleLayout` usage.
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
