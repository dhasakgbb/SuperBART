#!/usr/bin/env python3
"""Static mechanics contract checks for Super BART V2."""

from __future__ import annotations

from pathlib import Path


EXPECT_SNIPPETS = {
    'src/player/movement.ts': ['coyoteMs', 'jumpBufferMs', 'jumpCutMultiplier'],
    'src/scenes/PlayScene.ts': ['damagePlayer', 'onGoalReached', 'checkpoints', 'movingPlatforms', 'thwomps'],
    'src/enemies/registry.ts': ['walker', 'shell', 'flying', 'spitter', 'compliance_officer', 'technical_debt'],
}


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    missing: list[str] = []

    for rel, snippets in EXPECT_SNIPPETS.items():
        p = repo / rel
        if not p.exists():
            missing.append(f'missing file: {rel}')
            continue
        text = p.read_text(encoding='utf-8')
        for s in snippets:
            if s not in text:
                missing.append(f'missing snippet "{s}" in {rel}')

    if missing:
        print('Mechanics validation failed:')
        for m in missing:
            print('-', m)
        return 1

    print('Mechanics validation passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
