---
name: gameplay-feature-factory
description: Implement a gameplay feature from a ticket, including code, tests, and a verifiable delivery note.
version: 0.1.0
tags:
  - gameplay
  - implementation
  - testing
triggers:
  - a ticket is ready for implementation
  - feature branch needs deterministic completion criteria
  - QA needs feature verification notes
tools:
  - shell
  - python
  - markdown
entrypoints:
  - scripts/check_gameplay_feature_factory.py
---

# Gameplay Feature Factory

## Purpose
Turn a scoped ticket into shipped feature artifacts with explicit verification.

## Inputs Required
- `tickets/<feature_id>.md` with acceptance criteria.
- Engine choice only if code path requires engine-specific APIs.
- Feature branch target and risk constraints.

## Workflow
1. Ensure standard output directories exist.
2. Read the source ticket and extract acceptance criteria into a test plan.
3. Implement feature code in engine-appropriate project paths.
4. Add tests covering normal flow and one edge case.
5. Write `docs/verification/<feature_id>.md` summarizing implementation evidence.
6. Write `build/feature_manifests/<feature_id>.json` listing produced code and test paths.
7. Run the skill check script with `--feature-id`.

## Required Outputs
- `build/feature_manifests/<feature_id>.json`
- `docs/verification/<feature_id>.md`
- At least one code file and one test file listed in the manifest.

## File Conventions
- Manifest JSON schema:
  - `feature_id` (string)
  - `code_paths` (list of repo-relative paths)
  - `test_paths` (list of repo-relative paths)
- Verification note must include acceptance criteria traceability.

## Definition of Done
- Source ticket criteria are mapped to implementation and tests.
- Manifest paths exist in repo.
- Verification note contains test evidence.
- Check script exits `0`.

## Guardrails
- Do not implement unapproved scope beyond ticket criteria.
- Keep feature toggles/config explicit when risk is high.
- If ticket criteria conflict, resolve in ticket before coding.

## Outputs Contract
- Verification documents in `docs/verification/`.
- Delivery metadata in `build/feature_manifests/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
