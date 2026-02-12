# Eval Case: Online Safety Baseline

## Input Prompt
Use fixture: `evals/fixtures/input_prompt.md`

## Expected Artifacts
- `docs/threat_model.md`
- `docs/security_baselines.md`
- `tools/security_checklist.py`

## Pass Checklist
- Threat model includes trust boundaries and abuse paths.
- Security baseline includes auth, rate-limits, and moderation controls.
- Checklist script detects missing required controls.
- Check script passes.

## Manual Trigger
1. Run the skill with fixture prompt.
2. Execute check script.
3. Remove one required control in baseline doc and confirm checklist script fails.
