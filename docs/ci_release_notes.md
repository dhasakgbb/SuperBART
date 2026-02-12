# CI Release Notes

## Pipeline Entry
- Trigger: pushes to `main` and release tags.
- Use deterministic node version and clean install (`npm ci` preferred in CI).

## Required CI Stages
1. `npm ci`
2. `npm run gen:all`
3. `npm run lint:assets`
4. `npm run lint:style`
5. `npm run lint:audio`
6. `npm test`
7. `npm run build`
8. `python3 tools/build_release.py --version <version> --profile release`

## Artifact Outputs
- Built bundle: `dist/**`
- Build metadata: `build/build_metadata.json`
- Optional perf capture notes attached for release candidates.

## Failure Handling
- Fail fast on any non-zero stage.
- Never publish artifacts from a failed run.
- Include failed command output and relevant logs in CI summary.
- For flaky failures, re-run once; if still failing, block release and open triage issue.
