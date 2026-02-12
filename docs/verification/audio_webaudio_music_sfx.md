# Verification - audio_webaudio_music_sfx

## Scope
Implemented and integrated the procedural WebAudio stack for required gameplay and UI audio events with world-scoped pattern music.

## Acceptance Criteria Mapping
1. WebAudio-only path:
   - `src/audio/AudioEngine.ts`, `src/audio/music.ts`, and `src/audio/sfx.ts` generate runtime audio via oscillators/envelopes.
   - No runtime use of external audio files was added.
2. Required SFX coverage + capped bus:
   - Required SFX keys are defined in `src/audio/sfx.ts`.
   - SFX route through `sfxGain -> sfxLimiter -> masterGain` in `src/audio/AudioEngine.ts`.
   - Volume caps are enforced via `AUDIO_CAPS`.
3. Per-world/castle music presets:
   - `src/audio/musicPresets.ts` defines `world1`, `world2`, `world3`, `world4`, and `castle` presets with distinct tempo/scale/instrument values.
4. User gesture gate:
   - `startMusicPreset` in `src/audio/AudioEngine.ts` exits early when `userGestureUnlocked` is false.
   - `TitleScene` unlocks audio on player gesture before entering gameplay.
5. Settings + persistence:
   - `src/scenes/SettingsScene.ts` supports master/music/sfx volume controls and mute toggles.
   - Settings persist via `persistSave` and are re-applied with `audio.configureFromSettings(...)`.
6. Validator gate:
   - `tools/audio_validate.ts` checks required presets, required SFX keys, cap constraints, and user gesture guard patterns.
   - Script exposed as `npm run lint:audio`.

## Evidence
- Deterministic contract test: `tests/audio_contract.test.ts`.
- Scene integration updates: `src/scenes/PlayScene.ts`, `src/scenes/TitleScene.ts`, `src/scenes/WorldMapScene.ts`, `src/scenes/SettingsScene.ts`.
- Gate command execution captured in final command matrix.
