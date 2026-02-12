# Dependency Rules

## Description
Specifies allowed/forbidden source-module dependency directions and enforcement strategy.


## Allowed
- `scenes -> game`
- `scenes -> logic`
- `scenes -> level`
- `scenes -> ui`
- `game -> (no restriction except scenes forbidden)`
- `logic -> game`
- `level -> game`
- `ui -> game`

## Forbidden
- `logic -> scenes`
- `level -> scenes`
- `ui -> scenes`

## Enforcement
- `tools/check_dependency_rules.py` scans `src/**/*.js` import statements.
- The script resolves relative imports to source-group names.
- Any forbidden edge exits non-zero and prints violation details.
