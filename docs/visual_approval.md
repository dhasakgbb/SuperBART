# Visual Approval Protocol

To ensure the "Premium 16-bit SNES" aesthetic is maintained, all visual changes must pass this approval protocol.

## Required Review Artifacts (Per Batch)

For every batch of visual updates (Player, Enemies, World Tiles, UI), the following artifacts must be generated and presented for review:

1.  **Title Screen Capture**: `docs/screenshots/current/title_scene_current.png`
2.  **World Map Capture**: `docs/screenshots/current/map_scene_current.png`
3.  **Gameplay Capture**: `docs/screenshots/current/play_scene_current.png`
4.  **Diff Sheets**: Generated via `tools/imagegen/diff_sheet.ts` showing difference against golden.
    - Path: `docs/screenshots/diff/`

### Batch-Specific Artifacts

- **Batch A (Player)**:
  - **Head-Offset Contact Sheet**: A grid showing head positions relative to body for all frames to ensure no jitter.
  - **Palette Compliance Report**: Output from `npm run lint:palette`.

- **Batch B (Enemies)**:
  - **Strip Pack**: The 64x16 packed strip for validation.

- **Batch C (Worlds)**:
  - **Seam Check Report**: Output from `tools/imagegen/check_tileable.py`.

## Approval Process

1.  **Generate Artifacts**: Run `npm run visual:capture` and necessary imagegen tools.
2.  **Self-Review**: Developer checks for regression, jitter, or palette violations.
3.  **Pull Request**: Attach the artifacts to the PR description.
4.  **Approval**: A designated reviewer (or Layout Owner) must approve the visuals.
5.  **Golden Update**: Only AFTER approval, run `npm run visual:update-golden` to commit the new baseline.
6.  **Log**: Add an entry to `docs/screenshots/APPROVED.md`.

## Golden Update Guardrail

Do not update goldens without an associated `APPROVED.md` entry.
