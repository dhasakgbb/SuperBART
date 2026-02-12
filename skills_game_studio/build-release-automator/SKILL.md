---
name: build-release-automator
description: Define versioning policy and automate release metadata generation with CI integration notes.
version: 0.1.0
tags:
  - release
  - build
  - automation
triggers:
  - release process is manual and error-prone
  - versioning rules are inconsistent
  - CI release gates need documentation
tools:
  - python
  - markdown
  - shell
entrypoints:
  - scripts/check_build_release_automator.py
---

# Build Release Automator

## Purpose
Standardize build/versioning operations with deterministic scripts and CI-ready guidance.

## Inputs Required
- Release cadence and branching model.
- Versioning policy (SemVer or alternate).
- Build artifact targets and metadata fields.

## Workflow
1. Ensure output folders exist.
2. Write `build/versioning.md` with version bump policy and tagging rules.
3. Implement `tools/build_release.py` to generate build metadata (version, commit, timestamp).
4. Write CI integration notes in `docs/ci_release_notes.md`.
5. Validate with check script.

## Required Outputs
- `build/versioning.md`
- `tools/build_release.py`
- `docs/ci_release_notes.md`

## File Conventions
- Versioning doc must include pre-release and rollback policy.
- Build script must support dry-run mode.
- CI notes must describe pipeline entrypoints and failure handling.

## Definition of Done
- Versioning rules are explicit and executable.
- Build script produces deterministic metadata output.
- CI notes are sufficient for setup without tribal knowledge.
- Check script exits `0`.

## Guardrails
- Never mutate release tags without explicit approval.
- Preserve reproducibility by recording source commit and build inputs.
- Keep script portable and stdlib-only where possible.

## Outputs Contract
- Version policy in `build/`.
- Automation scripts in `tools/`.
- CI notes in `docs/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
