import type { GameSettings } from '../types/game';
import { CAMPAIGN_WORLD_LAYOUT } from '../core/constants';
import { PatternMusicSynth } from './music';
import { type MusicPresetKey } from './musicPresets';
import { AI_MUSIC_ENABLED_DEFAULT, getAiMusicTrack, type AiMusicTrackConfig, type AiMusicTrackKey } from './aiMusic';
import { type SfxKey, SfxSynth } from './sfx';

export const AUDIO_CAPS = {
  masterMax: 0.85,
  musicBusMax: 0.74,
  sfxBusMax: 0.72,
  limiterThresholdDb: -4
} as const;
const WORLD_BOSS_MIN_DURATION_SECONDS = 47;
const TITLE_WORLD_MAP_MIN_DURATION_SECONDS = 50;

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
  private aiAudio: HTMLAudioElement | null = null;
  private aiAudioSource: MediaElementAudioSourceNode | null = null;
  private aiTransitionId = 0;
  private useAiMusic = AI_MUSIC_ENABLED_DEFAULT;
  private activeMusicPreset: MusicPresetKey | AiMusicTrackKey | null = null;
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
      this.startMusicTrack(this.activeMusicPreset);
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
    const safeWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world)));
    return this.startMusicTrack(`world-${safeWorld}` as AiMusicTrackKey);
  }

  startBossMusic(world: number): boolean {
    const safeWorld = Math.min(CAMPAIGN_WORLD_LAYOUT.length, Math.max(1, Math.floor(world)));
    return this.startMusicTrack(`boss-${safeWorld}` as AiMusicTrackKey);
  }

  startTitleMusic(): boolean {
    return this.startMusicTrack('title');
  }

  startWorldMapMusic(): boolean {
    return this.startMusicTrack('world-map');
  }

  startMusicPreset(preset: MusicPresetKey): boolean {
    if (!this.userGestureUnlocked) {
      return false;
    }
    return this.startMusicTrack(preset);
  }

  private startMusicTrack(track: MusicPresetKey | AiMusicTrackKey): boolean {
    this.activeMusicPreset = track;
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

    this.aiTransitionId += 1;
    const requestId = this.aiTransitionId;
    this.musicSynth?.stop();
    this.stopAiMusic();

    if (this.useAiMusic && this.startAiMusic(track, requestId)) {
      return true;
    }

    return false;
  }

  stopMusic(): void {
    this.aiTransitionId += 1;
    this.musicSynth?.stop();
    this.stopAiMusic();
  }

  private startAiMusic(track: MusicPresetKey | AiMusicTrackKey, requestId: number): boolean {
    const trackCandidates = this.getAiMusicTrackWithFallback(track);
    if (trackCandidates.length === 0 || !this.ctx || !this.musicGain) {
      return false;
    }

    void this.startAiMusicFromCandidates(track, trackCandidates, requestId, 0);

    return true;
  }

  private startAiMusicFromCandidates(
    track: MusicPresetKey | AiMusicTrackKey,
    trackCandidates: readonly AiMusicTrackConfig[],
    requestId: number,
    index: number
  ): void {
    if (requestId !== this.aiTransitionId || index >= trackCandidates.length || !this.ctx || !this.musicGain) {
      return;
    }

    const trackConfig = trackCandidates[index];
    if (!trackConfig) {
      this.stopAiMusic();
      return;
    }

    const minimumDuration = this.getAiTrackMinimumDuration(track);

    try {
      const audio = new Audio(trackConfig.url);
      audio.loop = true;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      const source = this.ctx.createMediaElementSource(audio);
      source.connect(this.musicGain);

      const handleFailure = (): void => {
        if (requestId !== this.aiTransitionId) {
          return;
        }
        this.stopAiMusic();
        if (index + 1 < trackCandidates.length) {
          this.startAiMusicFromCandidates(track, trackCandidates, requestId, index + 1);
          return;
        }
        this.startAiMusicFallback(track, requestId);
      };

      const handleMetadata = (): void => {
        if (requestId !== this.aiTransitionId || !Number.isFinite(audio.duration)) {
          return;
        }
        if (audio.duration + 0.25 < minimumDuration) {
          handleFailure();
        }
      };

      audio.addEventListener('loadedmetadata', handleMetadata, { once: true });
      audio.addEventListener('error', handleFailure, { once: true });
      this.aiAudio = audio;
      this.aiAudioSource = source;
      const playback = audio.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(handleFailure);
      }
    } catch (_error) {
      if (requestId === this.aiTransitionId && index + 1 < trackCandidates.length) {
        this.startAiMusicFromCandidates(track, trackCandidates, requestId, index + 1);
        return;
      }
      this.startAiMusicFallback(track, requestId);
    }
  }

  private startAiMusicFallback(track: MusicPresetKey | AiMusicTrackKey, requestId: number): void {
    if (requestId !== this.aiTransitionId || !this.musicSynth) {
      return;
    }

    const fallback = this.getAiTrackFallbackPreset(track);
    if (!fallback) {
      return;
    }

    this.musicSynth.start(fallback);
  }

  private getAiTrackMinimumDuration(track: MusicPresetKey | AiMusicTrackKey): number {
    if (track === 'title' || track === 'world-map') {
      return TITLE_WORLD_MAP_MIN_DURATION_SECONDS;
    }
    return WORLD_BOSS_MIN_DURATION_SECONDS;
  }

  private getAiTrackFallbackPreset(track: MusicPresetKey | AiMusicTrackKey): MusicPresetKey | null {
    const worldPresetMap: Record<number, MusicPresetKey> = {
      1: 'azure',
      2: 'pipeline',
      3: 'enterprise',
      4: 'gpu',
      5: 'graveyard',
      6: 'benchmark',
      7: 'benchmark',
    };

    if (track === 'title' || track === 'world-map') {
      return 'azure';
    }
    if (track.startsWith('world-')) {
      const world = Number(track.slice('world-'.length));
      if (Number.isInteger(world)) {
        return worldPresetMap[world] ?? 'azure';
      }
      return 'azure';
    }
    if (track.startsWith('boss-')) {
      const world = Number(track.slice('boss-'.length));
      if (Number.isInteger(world)) {
        return worldPresetMap[world] ?? 'azure';
      }
      return 'azure';
    }

    return 'azure';
  }

  private getAiMusicTrackWithFallback(track: MusicPresetKey | AiMusicTrackKey): AiMusicTrackConfig[] {
    const fallbackTrackCandidates: AiMusicTrackConfig[] = [];
    const seen = new Set<string>();

    const addCandidate = (candidate: AiMusicTrackConfig | null): void => {
      if (candidate && !seen.has(candidate.id)) {
        fallbackTrackCandidates.push(candidate);
        seen.add(candidate.id);
      }
    };

    addCandidate(getAiMusicTrack(track));
    const fallbackKeys = this.getAiTrackFallbackKeys(track);
    for (const fallbackKey of fallbackKeys) {
      addCandidate(getAiMusicTrack(fallbackKey));
    }

    return fallbackTrackCandidates;
  }

  private getAiTrackFallbackKeys(track: MusicPresetKey | AiMusicTrackKey): readonly AiMusicTrackKey[] {
    if (!this.isAiTrackKey(track)) {
      return [];
    }

    if (track === 'title' || track === 'world-map') {
      return ['world-1', 'boss-1'];
    }

    if (track.startsWith('world-')) {
      const world = Number(track.slice('world-'.length));
      if (Number.isInteger(world)) {
        return [`boss-${world}` as AiMusicTrackKey, 'world-1', 'boss-1'];
      }
      return [];
    }

    if (track.startsWith('boss-')) {
      const world = Number(track.slice('boss-'.length));
      if (Number.isInteger(world)) {
        return [`world-${world}` as AiMusicTrackKey, 'world-1', 'boss-1'];
      }
      return [];
    }

    return [];
  }

  private isAiTrackKey(track: MusicPresetKey | AiMusicTrackKey): track is AiMusicTrackKey {
    return track.startsWith('world-') || track.startsWith('boss-') || track === 'title' || track === 'world-map';
  }

  private stopAiMusic(): void {
    if (this.aiAudioSource) {
      this.aiAudioSource.disconnect();
      this.aiAudioSource = null;
    }
    if (this.aiAudio) {
      this.aiAudio.pause();
      this.aiAudio.src = '';
      this.aiAudio.load();
      this.aiAudio = null;
    }
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
      this.startMusicTrack(this.activeMusicPreset);
    }
  }
}
