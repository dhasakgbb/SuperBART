import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { AUDIO_CAPS } from '../src/audio/AudioEngine';
import { MUSIC_PRESETS } from '../src/audio/musicPresets';
import { REQUIRED_SFX_KEYS, SFX_DEFINITIONS } from '../src/audio/sfx';

const REQUIRED_PRESET_KEYS = ['azure', 'pipeline', 'enterprise', 'gpu', 'benchmark'] as const;
const REQUIRED_SFX_KEYS_CONTRACT = [
  'jump',
  'coin',
  'stomp',
  'hurt',
  'power_up',
  'shell_kick',
  'goal_clear',
  'menu_move',
  'menu_confirm',
  'game_over',
  'pause',
  'block_hit',
  'one_up',
  'fireball'
] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

describe('audio contract', () => {
  test('has world music presets including castle', () => {
    for (const key of REQUIRED_PRESET_KEYS) {
      expect(MUSIC_PRESETS[key]).toBeDefined();
      expect(MUSIC_PRESETS[key].scale.length).toBeGreaterThanOrEqual(5);
      expect(MUSIC_PRESETS[key].tempoBpm).toBeGreaterThan(80);
      expect(MUSIC_PRESETS[key].tempoBpm).toBeLessThan(200);
    }
  });

  test('exposes required SFX event keys', () => {
    const required = new Set(REQUIRED_SFX_KEYS);

    for (const key of REQUIRED_SFX_KEYS_CONTRACT) {
      expect(required.has(key)).toBe(true);
      expect(SFX_DEFINITIONS[key]).toBeDefined();
      expect(SFX_DEFINITIONS[key].gain).toBeGreaterThan(0);
      expect(SFX_DEFINITIONS[key].gain).toBeLessThanOrEqual(0.3);
    }
  });

  test('keeps master and bus caps bounded', () => {
    expect(AUDIO_CAPS.masterMax).toBeGreaterThan(0);
    expect(AUDIO_CAPS.masterMax).toBeLessThanOrEqual(0.9);
    expect(AUDIO_CAPS.musicBusMax).toBeGreaterThan(0);
    expect(AUDIO_CAPS.musicBusMax).toBeLessThanOrEqual(AUDIO_CAPS.masterMax);
    expect(AUDIO_CAPS.sfxBusMax).toBeGreaterThan(0);
    expect(AUDIO_CAPS.sfxBusMax).toBeLessThanOrEqual(AUDIO_CAPS.masterMax);
    expect(AUDIO_CAPS.limiterThresholdDb).toBeLessThanOrEqual(-1);
    expect(AUDIO_CAPS.limiterThresholdDb).toBeGreaterThanOrEqual(-24);
  });

  test('guards music start behind user gesture unlock', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/audio/AudioEngine.ts'), 'utf8');

    expect(source).toMatch(/startMusicPreset\([\s\S]*if \(!this\.userGestureUnlocked\) \{\s*return false;/m);
    expect(source).toMatch(/unlockFromUserGesture\(\): void \{[\s\S]*this\.userGestureUnlocked = true;/m);
  });
});
