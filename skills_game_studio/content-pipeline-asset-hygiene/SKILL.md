---
name: content-pipeline-asset-hygiene
description: Define asset import hygiene rules and enforce them with deterministic validation scripts.
version: 0.1.0
tags:
  - content-pipeline
  - assets
  - validation
triggers:
  - asset imports are inconsistent
  - naming or format drift causes build issues
  - large teams need predictable asset hygiene
tools:
  - python
  - markdown
  - shell
entrypoints:
  - scripts/check_content_pipeline_asset_hygiene.py
---

# Content Pipeline Asset Hygiene

## Purpose
Create enforceable asset rules that reduce broken imports and format drift.

## Inputs Required
- Asset categories (textures, audio, meshes, UI, data).
- Naming/versioning policy.
- Compression and format constraints by platform.

## Workflow
1. Ensure studio output directories exist.
2. Write `docs/pipeline_import_rules.md` with intake rules and rejection reasons.
3. Write `docs/asset_rules.md` with naming, sizing, and metadata requirements.
4. Add `tools/asset_validate.py` to lint manifests and file naming.
5. Prepare `assets/placeholders/` and rules without adding large binaries.
6. Run the check script.

## Required Outputs
- `docs/pipeline_import_rules.md`
- `docs/asset_rules.md`
- `tools/asset_validate.py`
- `assets/placeholders/` directory structure only

## File Conventions
- Keep asset policies human-readable and machine-checkable.
- Validator script must run with Python stdlib only.
- No large binaries in skill output.

## Definition of Done
- Import and naming rules are explicit and testable.
- Validator catches missing metadata and invalid names.
- Placeholder structure exists under `assets/`.
- Check script exits `0`.

## Guardrails
- Do not embed engine-specific importer settings unless requested.
- Keep file size/compression limits visible in docs.
- Reject unversioned source artifacts in pipeline rules.

## Outputs Contract
- Policies in `docs/`.
- Validation logic in `tools/`.
- Placeholder hierarchy in `assets/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
