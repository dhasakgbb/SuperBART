---
name: narrative-dialogue-room
description: Build narrative foundations, voice guides, and localization constraints for production-ready dialogue content.
version: 0.1.0
tags:
  - narrative
  - dialogue
  - localization
triggers:
  - story direction is fragmented
  - dialogue quality varies by writer
  - localization constraints are undefined
tools:
  - markdown
  - shell
  - python
entrypoints:
  - scripts/check_narrative_dialogue_room.py
---

# Narrative Dialogue Room

## Purpose
Create coherent story and dialogue constraints that scale across writers and localization.

## Inputs Required
- Narrative premise and tone targets.
- Player fantasy and character roles.
- Localization target languages and text limits.

## Workflow
1. Ensure output destinations exist.
2. Write `docs/lore_bible.md` with canon, factions, and timeline.
3. Create `docs/voice_guides/` with tone rules per major character group.
4. Write `docs/localization_constraints.md` with text length, placeholders, and gender/pluralization rules.
5. Validate artifacts with skill checker.

## Required Outputs
- `docs/lore_bible.md`
- `docs/voice_guides/` (with at least one guide)
- `docs/localization_constraints.md`

## File Conventions
- Lore bible must separate immutable canon from flexible implementation details.
- Voice guides must include do/don't examples.
- Localization constraints must include formatting tokens and forbidden string patterns.

## Definition of Done
- Narrative canon is stable enough for content production.
- Voice guides are actionable for dialogue authors.
- Localization limits are explicit and testable.
- Check script exits `0`.

## Guardrails
- Avoid lore contradictions; record retcon policy.
- Do not encode region-specific stereotypes in voice guides.
- Keep placeholders and variables consistent across files.

## Outputs Contract
- All narrative artifacts live in `docs/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
