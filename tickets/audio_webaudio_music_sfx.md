# Ticket: audio_webaudio_music_sfx

## Owner
Gameplay/Audio Engineer

## Estimate
0.75 day

## Dependencies
- campaign_schema_v3
- level_select_pause_victory_flow

## Acceptance Criteria
1. WebAudio-only synthesis path is used for all music/SFX with no external downloaded audio assets.
2. Required SFX set exists and is routed through a capped SFX bus/limiter.
3. Pattern-based world music presets exist for worlds 1-4 and castle with distinct musical character.
4. Music does not start before an explicit user gesture unlock.
5. Settings UI exposes music/sfx/master volume + mute toggles, and persisted settings apply immediately.
6. A deterministic audio validator (`lint:audio`) enforces preset/key/cap/gesture requirements.
