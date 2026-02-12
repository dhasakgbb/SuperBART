#!/usr/bin/env python3
"""Run deterministic repository validation checks for Super BART."""

from __future__ import annotations

import subprocess
from pathlib import Path

FEATURE_IDS = [
    'scaffold_core',
    'player_movement_jump',
    'level_camera_collision',
    'coins_score',
    'enemy_stomp_damage',
    'goal_win_lose_respawn',
    'qa_build_perf_release',
]


def run(cmd: list[str], repo_root: Path) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=repo_root, check=True)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]

    checks = [
        ['python3', 'tools/check_dependency_rules.py'],
        ['python3', 'tools/asset_validate.py'],
        ['python3', 'skills_game_studio/game-design-compiler/scripts/check_game_design_compiler.py'],
        ['python3', 'skills_game_studio/engine-architecture-boundaries/scripts/check_engine_architecture_boundaries.py'],
        ['python3', 'skills_game_studio/content-pipeline-asset-hygiene/scripts/check_content_pipeline_asset_hygiene.py'],
        ['python3', 'skills_game_studio/qa-harness-repro-first/scripts/check_qa_harness_repro_first.py'],
        ['python3', 'skills_game_studio/build-release-automator/scripts/check_build_release_automator.py'],
        ['python3', 'skills_game_studio/performance-sheriff/scripts/check_performance_sheriff.py'],
    ]

    for feature_id in FEATURE_IDS:
        checks.append(
            [
                'python3',
                'skills_game_studio/gameplay-feature-factory/scripts/check_gameplay_feature_factory.py',
                '--feature-id',
                feature_id,
            ]
        )

    for cmd in checks:
        run(cmd, repo_root)

    print('All validation checks passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
