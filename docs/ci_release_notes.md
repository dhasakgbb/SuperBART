# CI Release Notes

## Description
Documents CI pipeline stages, artifact expectations, and release failure handling policy.


## Pipeline Entry
- Trigger on push to `main` and release tags.
- Required stages:
  1. Install dependencies (`npm install`)
  2. Generate assets (`npm run assets:generate`)
  3. Test (`npm run test`)
  4. Validate (`npm run validate`)
  5. Build (`npm run build`)

## Artifact Stage
- Store `dist/` bundle.
- Store generated build metadata JSON from `tools/build_release.py`.

## Failure Handling
- Fail fast if any stage exits non-zero.
- Do not publish build artifacts when validation/test fails.
- Attach failing command output to CI summary for triage.
