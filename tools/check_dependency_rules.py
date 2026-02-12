#!/usr/bin/env python3
"""Validate source import boundaries for Super BART."""

from __future__ import annotations

import re
from pathlib import Path

IMPORT_RE = re.compile(r"^\s*import\s.+?from\s+['\"](.+?)['\"]", re.MULTILINE)
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

FORBIDDEN_EXACT = {
    ("core", "scenes"),
    ("systems", "scenes"),
    ("player", "scenes"),
    ("enemies", "scenes"),
    ("hazards", "scenes"),
    ("levelgen", "scenes"),
    ("rendering", "scenes"),
    ("audio", "scenes"),
    ("ui", "scenes"),
}


def get_group(path: Path) -> str | None:
    parts = path.parts
    if "src" not in parts:
        return None
    idx = parts.index("src")
    if idx + 1 >= len(parts):
        return None
    return parts[idx + 1]


def resolve_candidates(base: Path) -> list[Path]:
    candidates = [base]
    for ext in SOURCE_EXTENSIONS:
        candidates.append(base.with_suffix(ext))
    for ext in SOURCE_EXTENSIONS:
        candidates.append(base / f"index{ext}")
    return candidates


def resolve_import_target(file_path: Path, specifier: str, repo_root: Path) -> str | None:
    if not specifier.startswith("."):
        return None

    resolved = (file_path.parent / specifier).resolve()
    for candidate in resolve_candidates(resolved):
        if candidate.exists():
            try:
                relative = candidate.relative_to(repo_root)
            except ValueError:
                return None
            return get_group(relative)
    return None


def should_ignore(relative_path: Path) -> bool:
    return "tests-support" in relative_path.parts


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    src_root = repo_root / "src"

    violations: list[str] = []

    for file_path in src_root.rglob("*"):
        if file_path.suffix not in SOURCE_EXTENSIONS:
            continue
        relative = file_path.relative_to(repo_root)
        if should_ignore(relative):
            continue

        source_group = get_group(relative)
        if source_group is None:
            continue

        content = file_path.read_text(encoding="utf-8")
        imports = IMPORT_RE.findall(content)
        for specifier in imports:
            target_group = resolve_import_target(file_path, specifier, repo_root)
            if target_group is None:
                continue
            if (source_group, target_group) in FORBIDDEN_EXACT:
                violations.append(
                    f"Forbidden import: {relative} ({source_group}) -> {specifier} ({target_group})"
                )

    if violations:
        print("FAIL")
        for item in violations:
            print(f"- {item}")
        return 1

    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
