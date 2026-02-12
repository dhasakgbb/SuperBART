# Decisions

- Phaser 3 Arcade Physics retained for stable 2D platforming and tooling fit.
- TypeScript migration chosen to improve contract safety while growing feature count.
- Procedural level generation chosen over static maps to reach 25+ levels reliably.
- Secondary collectible set to stars for bonus unlock gates.
- Power-up scope locked to `small` and `big` for stability.
- WebAudio synthesis used for zero-external-asset SFX/music requirement.
- Save format standardized as `SaveGameV2` in localStorage with schema versioning.
- Feature scope prioritized toward deterministic mechanics over high-fidelity art.
