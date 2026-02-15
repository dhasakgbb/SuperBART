# V2 TODO and Risk Log

## Canonical Campaign Scope
- [x] Campaign scope is canonicalized to 28 levels (`[4,4,4,4,4,4,4]`) in runtime.
- [x] `campaign_25_levels.json` is retained as historical reference only; avoid using it as active source-of-truth.

## High Priority
- [x] Add explicit bonus-level scene routing for all 3 unlockable micro-level IDs.
- [x] Add bounded shell chain-kill invariant test to prevent runaway interactions.
- Add deterministic replay fixture for checkpoint edge cases around moving platforms.

## Medium Priority
- Improve sprite readability with optional imagegen pass and palette quantization.
- Add richer world-map visual progression (icons/paths) while keeping deterministic logic.
- Expand levelgen smoke tool to emit image minimaps in addition to ASCII.

## Low Priority
- Optional fire-form prototype behind feature flag after stability budget review.
- Add richer chiptune arrangement layers (bass + percussion envelopes).
