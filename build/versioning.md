# Versioning

## Versioning Policy
- Use Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Patch: bug fixes and non-breaking gameplay tuning.
- Minor: new gameplay features that preserve compatibility.
- Major: architectural or gameplay contract breaking changes.

## Build Metadata
- Each build metadata file includes:
  - version
  - git commit (or `unknown` when unavailable)
  - UTC timestamp
  - build profile (`dev` or `release`)

## Pre-release Process
1. Run `npm run test`.
2. Run `npm run validate`.
3. Run `npm run build`.
4. Generate metadata with `python3 tools/build_release.py --dry-run` then real run.

## Rollback
- If release validation fails, roll back to latest known-good tag.
- Preserve failed build metadata artifacts for audit.
- Hotfix branch increments patch version.
