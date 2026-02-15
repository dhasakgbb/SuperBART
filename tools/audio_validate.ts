#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIO_CAPS } from '../src/audio/AudioEngine';
import { MUSIC_PRESETS } from '../src/audio/musicPresets';
import { REQUIRED_SFX_KEYS, SFX_DEFINITIONS } from '../src/audio/sfx';

const REQUIRED_PRESET_KEYS = ['azure', 'pipeline', 'enterprise', 'gpu', 'benchmark'] as const;
const REQUIRED_SFX_EVENT_KEYS = [
  'jump',
  'coin',
  'stomp',
  'hurt',
  'power_up',
  'shell_kick',
  'goal_clear',
  'menu_move',
  'menu_confirm'
] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function validatePresets(errors: string[]): void {
  for (const key of REQUIRED_PRESET_KEYS) {
    const preset = MUSIC_PRESETS[key];
    if (!preset) {
      errors.push(`Missing music preset: ${key}`);
      continue;
    }

    if (!Number.isFinite(preset.tempoBpm) || preset.tempoBpm < 80 || preset.tempoBpm > 190) {
      errors.push(`Invalid tempo for preset ${key}: ${preset.tempoBpm}`);
    }
    if (!Array.isArray(preset.scale) || preset.scale.length < 5) {
      errors.push(`Preset ${key} must define a playable scale with at least 5 tones.`);
    }
  }
}

function validateSfx(errors: string[]): void {
  const requiredFromArray = new Set(REQUIRED_SFX_KEYS);

  for (const key of REQUIRED_SFX_EVENT_KEYS) {
    if (!requiredFromArray.has(key)) {
      errors.push(`REQUIRED_SFX_KEYS is missing required event key: ${key}`);
    }
    const def = SFX_DEFINITIONS[key];
    if (!def) {
      errors.push(`SFX_DEFINITIONS is missing key: ${key}`);
      continue;
    }

    if (!Number.isFinite(def.gain) || def.gain <= 0 || def.gain > 0.3) {
      errors.push(`SFX gain out of cap for ${key}: ${def.gain} (expected >0 and <=0.3)`);
    }
  }

  // Validate gain cap across ALL SFX definitions, not just required keys
  for (const [key, def] of Object.entries(SFX_DEFINITIONS)) {
    if (!def || !Number.isFinite(def.gain)) continue;
    if (def.gain > 0.3) {
      errors.push(`SFX gain exceeds 0.3 cap for "${key}": ${def.gain}`);
    }
  }
}

function validateCaps(errors: string[]): void {
  if (!Number.isFinite(AUDIO_CAPS.masterMax) || AUDIO_CAPS.masterMax <= 0 || AUDIO_CAPS.masterMax > 0.9) {
    errors.push(`AUDIO_CAPS.masterMax must be >0 and <=0.9, got ${AUDIO_CAPS.masterMax}`);
  }

  if (!Number.isFinite(AUDIO_CAPS.musicBusMax) || AUDIO_CAPS.musicBusMax <= 0 || AUDIO_CAPS.musicBusMax > AUDIO_CAPS.masterMax) {
    errors.push(
      `AUDIO_CAPS.musicBusMax must be >0 and <= masterMax (${AUDIO_CAPS.masterMax}), got ${AUDIO_CAPS.musicBusMax}`
    );
  }

  if (!Number.isFinite(AUDIO_CAPS.sfxBusMax) || AUDIO_CAPS.sfxBusMax <= 0 || AUDIO_CAPS.sfxBusMax > AUDIO_CAPS.masterMax) {
    errors.push(
      `AUDIO_CAPS.sfxBusMax must be >0 and <= masterMax (${AUDIO_CAPS.masterMax}), got ${AUDIO_CAPS.sfxBusMax}`
    );
  }

  if (
    !Number.isFinite(AUDIO_CAPS.limiterThresholdDb)
    || AUDIO_CAPS.limiterThresholdDb > -1
    || AUDIO_CAPS.limiterThresholdDb < -24
  ) {
    errors.push(`AUDIO_CAPS.limiterThresholdDb must be between -24 and -1 dB, got ${AUDIO_CAPS.limiterThresholdDb}`);
  }
}

function validateUserGestureGate(errors: string[]): void {
  const audioEnginePath = path.join(repoRoot, 'src/audio/AudioEngine.ts');
  const source = fs.readFileSync(audioEnginePath, 'utf8');

  const hasStartGuard = /startMusicPreset\([\s\S]*?if \(!this\.userGestureUnlocked\) \{\s*return false;\s*\}/m.test(source);
  if (!hasStartGuard) {
    errors.push('startMusicPreset must refuse to start music before userGestureUnlocked is true.');
  }

  const hasUnlockSetter = /unlockFromUserGesture\(\): void \{[\s\S]*?this\.userGestureUnlocked = true;/m.test(source);
  if (!hasUnlockSetter) {
    errors.push('unlockFromUserGesture must set userGestureUnlocked = true.');
  }

  const hasApplyGuard = /else if \(this\.activeMusicPreset && this\.userGestureUnlocked\)/m.test(source);
  if (!hasApplyGuard) {
    errors.push('applySettings must only restart music when userGestureUnlocked is true.');
  }
}

function main(): number {
  const errors: string[] = [];

  validatePresets(errors);
  validateSfx(errors);
  validateCaps(errors);
  validateUserGestureGate(errors);

  if (errors.length > 0) {
    console.error('Audio validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    return 1;
  }

  console.log('Audio validation passed. Procedural preset and SFX contracts are intact.');
  return 0;
}

process.exitCode = main();
