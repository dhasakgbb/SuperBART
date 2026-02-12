---
name: security-online-safety
description: Produce threat model and online safety baselines with a deterministic security checklist validator.
version: 0.1.0
tags:
  - security
  - online-safety
  - threat-modeling
triggers:
  - adding online features or UGC
  - account/session handling is introduced
  - moderation and abuse safeguards are missing
tools:
  - markdown
  - python
  - shell
entrypoints:
  - scripts/check_security_online_safety.py
---

# Security Online Safety

## Purpose
Define pragmatic security and abuse prevention baselines for multiplayer or connected game features.

## Inputs Required
- Trust boundaries (client, backend, external services, moderation ops).
- Online feature scope (chat, matchmaking, commerce, UGC).
- Compliance and privacy requirements.

## Workflow
1. Ensure standard output directories exist.
2. Create `docs/threat_model.md` with assets, attackers, abuse paths, and mitigations.
3. Create `docs/security_baselines.md` with secure defaults and operational controls.
4. Add `tools/security_checklist.py` to validate checklist completeness.
5. Run skill check script.

## Required Outputs
- `docs/threat_model.md`
- `docs/security_baselines.md`
- `tools/security_checklist.py`

## File Conventions
- Threat model must include trust boundaries, entry points, and mitigation owners.
- Baselines must include auth/session, rate limiting, logging, and moderation controls.
- Checklist script must fail when required baseline controls are missing.

## Definition of Done
- Threat model covers realistic abuse scenarios and operational mitigations.
- Security baselines are explicit, auditable, and ownership-assigned.
- Checklist validator runs and reports actionable gaps.
- Check script exits `0`.

## Guardrails
- Treat client as untrusted by default.
- Avoid storing sensitive data in telemetry/events unless justified and protected.
- Require abuse-report and moderation pathways for social features.

## Outputs Contract
- Security docs in `docs/`.
- Validation helper in `tools/`.

## Shared Resources
- `skills_game_studio/_shared/CONVENTIONS.md`
- `skills_game_studio/_shared/SCRIPTS/ensure_studio_dirs.py`
