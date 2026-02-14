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
- Enforced by TypeScript module structure and code review.
- Import boundaries are documented above; violations caught during PR review.
