---
name: sprite-ui-kit-generator
description: Deterministically generate in-repo pixel UI assets and validate required output dimensions for visual fidelity.
version: 0.1.0
tags:
  - sprites
  - ui
  - generation
  - pixel-art
triggers:
  - project needs consistent generated tiles/sprites without external downloads
  - UI and collectible art must match a locked visual target
  - CI requires deterministic asset presence and dimension checks
tools:
  - shell
  - typescript
  - markdown
entrypoints:
  - scripts/check_sprite_ui_kit_generator.py
---

# Sprite UI Kit Generator

## Purpose
Generate deterministic pixel-art assets that echo `public/assets/target_look.png` and enforce output completeness.

## Inputs Required
- `public/assets/target_look.png` for visual direction.
- `public/assets/bart_source.png` for avatar derivation.
- Output contracts under `public/assets/tiles`, `public/assets/sprites`, and `public/assets/fonts`.

## Workflow
1. Run `tools/make_ui_assets.ts` to generate core tiles/UI sprites/font atlas/title-logo.
2. Run `tools/make_bart_sprites.ts` to generate Bart heads/portrait.
3. Run `tools/asset_validate.ts` to verify required files and dimensions.
4. Ensure npm scripts are wired: `gen:assets`, `gen:avatars`, `gen:all`, `lint:assets`, and `prebuild`.
5. Run this skill checker script.

## Required Outputs
- `tools/make_ui_assets.ts`
- `tools/make_bart_sprites.ts`
- `tools/asset_validate.ts`
- Generated assets in `public/assets/tiles`, `public/assets/sprites`, `public/assets/fonts`
- `package.json` script wiring for `gen:*` and `lint:assets`

## Definition of Done
- All required assets are generated locally and deterministic.
- `npm run lint:assets` exits `0` when assets are present with expected dimensions.
- `prebuild` executes `gen:all`.
- Title UI uses generated pixel assets/bitmap text (not system font rendering).

## Guardrails
- Do not pull external asset packs.
- Keep generated PNG dimensions compact (16/24/32/48/64/96 scale targets).
- Prefer crisp silhouettes and dark outlines over soft anti-aliased edges.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/artifact_check.py`

## Local Resource Files
- `resources/asset_pack_checklist.md`
- `resources/pixel_prompt_template.md`
