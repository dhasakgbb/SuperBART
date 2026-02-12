---
name: systems-balancer
description: Build and validate a balancing model with simulation tooling and sanity tests.
version: 0.1.0
tags:
  - game-dev
  - balancing
  - simulation
triggers:
  - stat progression feels unstable
  - economy tuning is ad hoc
  - difficulty curve requires quantification
tools:
  - python
  - markdown
  - shell
entrypoints:
  - scripts/check_systems_balancer.py
---

# Systems Balancer

## Purpose
Produce a reproducible balancing model with executable simulation and baseline tests.

## Inputs Required
- Target progression arc (early/mid/late game expectations).
- Entities and tunables (health, damage, economy rates, cooldowns).
- Failure signals (snowballing, dead zones, exploit loops).

## Workflow
1. Ensure standard directories exist with the shared helper script.
2. Document assumptions and equations in `docs/balance_model.md`.
3. Implement model runner in `tools/balance_sim.py`.
4. Add sanity tests in `tests/test_balance_sanity.py`.
5. Validate with the local check script.

## Required Outputs
- `docs/balance_model.md`
- `tools/balance_sim.py`
- `tests/test_balance_sanity.py`

## File Conventions
- Document all variables and units in the model file.
- `balance_sim.py` must expose `run_simulation(config)`.
- Sanity tests must include at least one monotonic progression assertion.

## Definition of Done
- All required files exist.
- Model includes equations, constraints, and balancing assumptions.
- Simulation script runs without external dependencies.
- Tests execute and assert non-trivial behavior.
- Check script exits `0`.

## Guardrails
- Do not hardcode engine-specific APIs.
- Keep formulas inspectable; avoid opaque constants without explanation.
- Separate simulation inputs from code constants.

## Outputs Contract
- Write design rationale to `docs/`.
- Write executable logic to `tools/` and validation to `tests/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
