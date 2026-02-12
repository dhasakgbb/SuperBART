# Ticket: qa_build_perf_release

## Context
- Problem: release safeguards and deterministic checks missing.
- Why now: final delivery requires reproducible quality gate.

## Scope
- In scope: smoke tests, validation script, build docs, perf checklist.
- Out of scope: full CI deployment automation beyond minimal notes.

## Acceptance Criteria
1. `npm run test` passes with at least two deterministic checks.
2. `npm run validate` runs dependency + asset + skill checks.
3. `npm run build` succeeds with release notes documented.

## Validation
- Tests: boot/load and physics sanity tests.
- Manual checks: run full command matrix from README.

## Delivery
- Owner: QA/Tools Engineer
- Estimate: 0.5 day
- Dependencies: all gameplay tickets
