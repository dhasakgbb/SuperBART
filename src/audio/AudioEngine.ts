import type { GameSettings } from '../types/game';
import { PatternMusicSynth } from './music';
import { presetForWorld, type MusicPresetKey } from './musicPresets';
import { type SfxKey, SfxSynth } from './sfx';

export const AUDIO_CAPS = {
  masterMax: 0.85,
  musicBusMax: 0.74,
  sfxBusMax: 0.72,
  limiterThresholdDb: -4
} as const;

export class AudioEngine {
  private static singleton: AudioEngine | null = null;

  static shared(): AudioEngine {
    if (!AudioEngine.singleton) {
      AudioEngine.singleton = new AudioEngine();
    }
    return AudioEngine.singleton;
  }

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private sfxLimiter: DynamicsCompressorNode | null = null;
  private sfxSynth: SfxSynth | null = null;
  private musicSynth: PatternMusicSynth | null = null;
  private activeMusicPreset: MusicPresetKey | null = null;
  private userGestureUnlocked = false;
  private settings: GameSettings | null = null;

  private constructor() {}

  isUserGestureUnlocked(): boolean {
    return this.userGestureUnlocked;
  }

  configureFromSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    if (!this.ensureGraph()) {
      return;
    }
    this.applySettings();
  }

  unlockFromUserGesture(): void {
    this.userGestureUnlocked = true;
    if (!this.ensureGraph()) {
      return;
    }
    void this.ctx?.resume();

    if (this.activeMusicPreset && this.settings && !this.settings.musicMuted) {
      this.musicSynth?.start(this.activeMusicPreset);
    }
  }

  playSfx(key: SfxKey): void {
    if (!this.ensureGraph()) {
      return;
    }
    if (!this.settings || this.settings.sfxMuted) {
      return;
    }
    if (this.ctx?.state === 'suspended') {
      if (!this.userGestureUnlocked) {
        return;
      }
      void this.ctx.resume();
    }
    this.sfxSynth?.play(key);
  }

  startWorldMusic(world: number): boolean {
    return this.startMusicPreset(presetForWorld(world));
  }

  startMusicPreset(preset: MusicPresetKey): boolean {
    this.activeMusicPreset = preset;
    if (!this.ensureGraph()) {
      return false;
    }
    if (!this.settings || this.settings.musicMuted) {
      return false;
    }
    if (!this.userGestureUnlocked) {
      return false;
    }
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
    this.musicSynth?.start(preset);
    return true;
  }

  stopMusic(): void {
    this.musicSynth?.stop();
  }

  /** Override music tempo (for time-warning speedup). Pass null to revert. */
  setMusicTempoOverride(bpm: number | null): void {
    this.musicSynth?.setTempoOverride(bpm);
  }

  private ensureGraph(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    if (this.ctx && this.masterGain && this.musicGain && this.sfxGain && this.sfxSynth && this.musicSynth) {
      return true;
    }

    this.ctx = new AudioContext({ latencyHint: 'interactive' });

    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.limiter = this.ctx.createDynamicsCompressor();
    this.sfxLimiter = this.ctx.createDynamicsCompressor();

    this.limiter.threshold.value = AUDIO_CAPS.limiterThresholdDb;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.09;

    this.sfxLimiter.threshold.value = -8;
    this.sfxLimiter.knee.value = 0;
    this.sfxLimiter.ratio.value = 18;
    this.sfxLimiter.attack.value = 0.002;
    this.sfxLimiter.release.value = 0.08;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.sfxLimiter);
    this.sfxLimiter.connect(this.masterGain);
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.ctx.destination);

    this.sfxSynth = new SfxSynth(this.ctx, this.sfxGain);
    this.musicSynth = new PatternMusicSynth(this.ctx, this.musicGain);

    if (this.settings) {
      this.applySettings();
    }
    return true;
  }

  private applySettings(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.settings) {
      return;
    }
    this.masterGain.gain.value = Math.min(AUDIO_CAPS.masterMax, Math.max(0, this.settings.masterVolume));
    this.musicGain.gain.value = this.settings.musicMuted
      ? 0
      : Math.min(AUDIO_CAPS.musicBusMax, Math.max(0, this.settings.musicVolume));
    this.sfxGain.gain.value = this.settings.sfxMuted
      ? 0
      : Math.min(AUDIO_CAPS.sfxBusMax, Math.max(0, this.settings.sfxVolume));

    if (this.settings.musicMuted) {
      this.musicSynth?.stop();
    } else if (this.activeMusicPreset && this.userGestureUnlocked) {
      this.musicSynth?.start(this.activeMusicPreset);
    }
  }
}
