# Dependency Rules

## Allowed
- `scenes -> core|systems|levelgen|player|enemies|hazards|rendering|audio|ui|types|style`
- `ui -> style|types|core`
- `systems -> core|types`
- `levelgen -> core|types|systems`
- `player|enemies|hazards|audio|rendering -> core|types`
- `core -> types`

## Forbidden
- `core -> scenes`
- `systems -> scenes`
- `player -> scenes`
- `enemies -> scenes`
- `hazards -> scenes`
- `levelgen -> scenes`
- `rendering -> scenes`
- `audio -> scenes`
- `ui -> scenes`

## Enforcement
- Checker: `tools/check_dependency_rules.py`
- Input set: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.js`, `src/**/*.jsx`
- Strategy:
  1. Parse relative `import ... from` statements.
  2. Resolve import target group under `src/<group>/...`.
  3. Fail with non-zero exit if any forbidden edge is found.
- CI gate: run as part of architecture validation and pre-merge checks.
