---
name: telemetry-experimentation
description: Define telemetry event contracts, metric definitions, and log validation for experiments and balancing.
version: 0.1.0
tags:
  - telemetry
  - analytics
  - experimentation
triggers:
  - metrics are ambiguous or inconsistent
  - event logging has schema drift
  - A/B tests need event contracts
tools:
  - json
  - python
  - markdown
entrypoints:
  - scripts/check_telemetry_experimentation.py
---

# Telemetry Experimentation

## Purpose
Create reliable telemetry contracts and metric definitions that support balancing and experiments.

## Inputs Required
- Core player journey stages.
- Candidate events and experiment hypotheses.
- Privacy constraints for collected fields.

## Workflow
1. Ensure output directories exist.
2. Write canonical schema in `telemetry/event_schema.json`.
3. Write metric definitions in `docs/metrics.md`.
4. Implement `tools/log_validator.py` to validate event payloads against schema.
5. Run check script and sample validation.

## Required Outputs
- `telemetry/event_schema.json`
- `docs/metrics.md`
- `tools/log_validator.py`

## File Conventions
- Schema must include version and required fields for each event.
- Metrics doc must include formula and owner for each KPI.
- Log validator should fail clearly on unknown events or missing required fields.

## Definition of Done
- Event schema is valid JSON and versioned.
- Metrics are reproducible from logged events.
- Validator catches malformed payloads deterministically.
- Check script exits `0`.

## Guardrails
- Avoid logging sensitive or personal data by default.
- Do not add metrics that cannot be computed from defined events.
- Keep event names stable and backward-compatible where possible.

## Outputs Contract
- Schemas in `telemetry/`.
- Documentation in `docs/`.
- Validators in `tools/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
