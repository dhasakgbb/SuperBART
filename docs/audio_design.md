# Audio Design

## Constraints
- No external audio files are used (`.mp3`, `.wav`, CDN assets are forbidden).
- All game audio is synthesized procedurally with WebAudio in runtime code under `src/audio/`.
- Music starts only after an explicit player gesture on the title screen (`Enter` or `N`).

## Runtime Modules
- `src/audio/AudioEngine.ts`: singleton audio graph, bus routing, limiter, setting application, and user-gesture unlock gate.
- `src/audio/sfx.ts`: deterministic SFX definition table + oscillator/envelope playback.
- `src/audio/musicPresets.ts`: world preset library (tempo, scale, pattern, timbre).
- `src/audio/music.ts`: pattern sequencer that schedules oscillator voices with ADSR-like envelopes.

## Bus Graph and Caps
- Music and SFX are routed to dedicated buses before the master output.
- Graph: `music bus -> master -> limiter -> destination` and `sfx bus -> sfx limiter -> master -> limiter -> destination`.
- Hard caps in `AUDIO_CAPS`:
  - `masterMax = 0.85`
  - `musicBusMax = 0.74`
  - `sfxBusMax = 0.72`
  - `limiterThresholdDb = -4`
- SFX per-event gain is capped in definitions (`<= 0.3`) to prevent clipping spikes.

## Required SFX Events
Implemented keys in `src/audio/sfx.ts`:
- `jump`
- `coin`
- `stomp`
- `hurt`
- `power_up`
- `shell_kick`
- `goal_clear`
- `menu_move`
- `menu_confirm`

## Music Presets
One looping pattern-based track per campaign world:
- `world1`: major / upbeat (`tempoBpm = 126`)
- `world2`: harmonic minor-ish desert feel (`tempoBpm = 118`)
- `world3`: brighter high-register lead (`tempoBpm = 136`)
- `world4`: minor / factory night (`tempoBpm = 124`)
- `castle`: tense and faster dissonant profile (`tempoBpm = 152`)

Each preset defines:
- root frequency
- scale semitone map
- lead + bass step patterns
- oscillator wave/instrument envelope/filter behavior

## UX and Persistence
- Settings UI (`SettingsScene`) controls:
  - master volume
  - music volume
  - sfx volume
  - music mute toggle
  - sfx mute toggle
- Settings are persisted through save storage and applied immediately through `AudioEngine.configureFromSettings(...)`.

## Validation Gate
- `tools/audio_validate.ts` enforces:
  - music preset presence for `world1..world4` + `castle`
  - all required SFX keys exist
  - volume cap configuration constraints
  - source-level user-gesture guard before music start
- Gate command: `npm run lint:audio`
