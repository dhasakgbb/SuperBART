# Dependency Rules Template

## Allowed Dependencies
- `gameplay -> core`
- `ui -> gameplay`
- `tools -> core`

## Forbidden Dependencies
- `core -> gameplay`
- `core -> ui`
- `network -> editor`

## Enforcement Notes
- Rules should map to import/path patterns.
- Violations fail CI.
