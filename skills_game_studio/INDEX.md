# Game Studio Skill Index

This directory contains a complete Codex skill suite for an engine-neutral game development workflow.

## Skill Map

| Skill | Primary Purpose | Standard Outputs |
| --- | --- | --- |
| `game-design-compiler` | Convert concept into actionable design and phase-0 backlog | `docs/GDD.md`, `tickets/phase_0_backlog.md` |
| `systems-balancer` | Model progression/economy/combat balance with simulation tests | `docs/balance_model.md`, `tools/balance_sim.py`, `tests/test_balance_sanity.py` |
| `engine-architecture-boundaries` | Define module boundaries and dependency rules | `docs/architecture.md`, `docs/dependency_rules.md`, `tools/check_dependency_rules.py` |
| `gameplay-feature-factory` | Ship ticketed gameplay features with code/tests/verification | `build/feature_manifests/<feature_id>.json`, `docs/verification/<feature_id>.md` |
| `performance-sheriff` | Set performance budgets and regression gates | `docs/perf_budget.md`, `tools/profile_helpers/`, `docs/perf_regression_checklist.md` |
| `content-pipeline-asset-hygiene` | Define and validate asset ingestion rules | `docs/pipeline_import_rules.md`, `tools/asset_validate.py`, `assets/placeholders/` |
| `reference-look-enforcer` | Convert screenshot art direction into a strict style contract | `docs/style_kit.md`, `src/style/styleConfig.ts`, `tools/style_validate.ts` |
| `sprite-ui-kit-generator` | Generate deterministic pixel UI/sprite bundles and dimension checks | `tools/make_ui_assets.ts`, `tools/make_bart_sprites.ts`, `tools/asset_validate.ts` |
| `build-release-automator` | Standardize versioning and release automation | `build/versioning.md`, `tools/build_release.py`, `docs/ci_release_notes.md` |
| `qa-harness-repro-first` | Build deterministic repro harnesses for QA | `tests/repro_scenes/`, `docs/qa_repro_playbook.md` |
| `narrative-dialogue-room` | Produce canon, voice standards, and localization constraints | `docs/lore_bible.md`, `docs/voice_guides/`, `docs/localization_constraints.md` |
| `level-design-encounter-tuner` | Define level specs and encounter pacing | `docs/level_specs/`, `docs/encounter_pacing_template.md` |
| `telemetry-experimentation` | Define telemetry schema, KPIs, and log validators | `telemetry/event_schema.json`, `docs/metrics.md`, `tools/log_validator.py` |
| `security-online-safety` | Threat model and secure baseline for online features | `docs/threat_model.md`, `docs/security_baselines.md`, `tools/security_checklist.py` |

## Thinking Level Guidance

Use `x-high` for hard-reasoning tasks:
- architecture boundary design and dependency policy tradeoffs
- non-obvious performance bottlenecks and regression root cause
- complex gameplay bugs with hidden state interactions
- threat modeling and abuse-path analysis for online features

Use `high` for moderate-complexity implementation tasks:
- balancing model iteration with known variables
- release scripting and CI workflow updates
- telemetry schema updates with clear product requirements

Use `medium` for structured content production:
- drafting GDD sections from defined concept constraints
- creating tickets from clear acceptance criteria
- writing level or narrative documents from settled direction

## Shared Studio Resources

- Conventions: `skills_game_studio/_shared/CONVENTIONS.md`
- Templates: `skills_game_studio/_shared/TEMPLATES/`
- Helpers: `skills_game_studio/_shared/SCRIPTS/`

## Invocation Examples

### Codex CLI

Run from repository root:

```bash
cd <path-to-Mario>
codex "Use $game-design-compiler to turn this concept into docs/GDD.md and tickets/phase_0_backlog.md."
```

Feature implementation example:

```bash
codex "Use $gameplay-feature-factory to implement tickets/wall_jump.md and produce a manifest + verification note."
```

### Codex App

In the app prompt box, use explicit skill invocation:

```text
Use $systems-balancer. Build docs/balance_model.md, tools/balance_sim.py, and tests/test_balance_sanity.py for a 10-level progression curve.
```

### IDE Integration

From the IDE Codex chat panel, invoke with concrete artifact targets:

```text
Use $engine-architecture-boundaries to produce docs/architecture.md, docs/dependency_rules.md, and tools/check_dependency_rules.py for our current module layout.
```

## Validation Pattern

Each skill ships a deterministic checker under `scripts/check_*.py`.
Run a checker after producing artifacts:

```bash
python skills_game_studio/<skill-name>/scripts/check_<skill-name>.py
```

For `gameplay-feature-factory`, pass a feature id:

```bash
python skills_game_studio/gameplay-feature-factory/scripts/check_gameplay_feature_factory.py --feature-id wall_jump
```
