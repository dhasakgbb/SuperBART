import { MUSIC_PRESETS, type DrumHit, type DrumTrackPattern, type InstrumentPreset, type MusicPresetKey, type MusicTrackPattern } from './musicPresets';

const SUBDIVISION_BEATS = 0.5;

function degreeToSemitone(degree: number, scale: number[]): number {
  const scaleLen = Math.max(1, scale.length);
  const octave = Math.floor(degree / scaleLen);
  const idx = ((degree % scaleLen) + scaleLen) % scaleLen;
  return (scale[idx] ?? 0) + octave * 12;
}

function semitoneToHz(rootHz: number, semitone: number): number {
  return rootHz * Math.pow(2, semitone / 12);
}

/** Cache for PeriodicWave objects used to simulate NES pulse widths. */
const pulseWaveCache = new Map<string, PeriodicWave>();

/**
 * Build a PeriodicWave that approximates a pulse wave with the given duty cycle.
 * Uses Fourier series: for a pulse of width d, harmonic k has coefficient (2/(k*pi)) * sin(k*pi*d).
 */
function getPulseWave(ctx: AudioContext, width: number): PeriodicWave {
  const key = `${width}`;
  const cached = pulseWaveCache.get(key);
  if (cached) return cached;

  const harmonics = 32;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  real[0] = 0;
  imag[0] = 0;
  for (let k = 1; k <= harmonics; k++) {
    real[k] = 0;
    imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * width);
  }
  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  pulseWaveCache.set(key, wave);
  return wave;
}

/** Shared white noise buffer for drums. Created lazily. */
let drumNoiseBuffer: AudioBuffer | null = null;

function getDrumNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (drumNoiseBuffer && drumNoiseBuffer.sampleRate === ctx.sampleRate) {
    return drumNoiseBuffer;
  }
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  drumNoiseBuffer = buffer;
  return buffer;
}

export class PatternMusicSynth {
  private timerId: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private currentPreset: MusicPresetKey | null = null;
  private tempoOverrideBpm: number | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly musicBus: GainNode
  ) {}

  /** Override the current preset's tempo. Pass null to revert to preset default. */
  setTempoOverride(bpm: number | null): void {
    this.tempoOverrideBpm = bpm;
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }

  start(presetKey: MusicPresetKey): void {
    if (this.currentPreset === presetKey && this.isRunning()) {
      return;
    }

    this.stop();
    this.currentPreset = presetKey;
    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.03;

    this.timerId = window.setInterval(() => this.tick(), 50);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentPreset = null;
  }

  private tick(): void {
    if (!this.currentPreset) {
      return;
    }

    const preset = MUSIC_PRESETS[this.currentPreset];
    const effectiveBpm = this.tempoOverrideBpm ?? preset.tempoBpm;
    const beatSec = 60 / effectiveBpm;
    const stepSec = beatSec * SUBDIVISION_BEATS;
    const lookAheadSec = 0.2;

    while (this.nextStepTime < this.ctx.currentTime + lookAheadSec) {
      this.scheduleTrack(preset.rootHz, preset.scale, preset.lead, this.stepIndex, this.nextStepTime, beatSec);
      this.scheduleTrack(preset.rootHz, preset.scale, preset.bass, this.stepIndex, this.nextStepTime, beatSec);
      this.scheduleDrumTrack(preset.drums, this.stepIndex, this.nextStepTime, beatSec);
      this.stepIndex += 1;
      this.nextStepTime += stepSec;
    }
  }

  private scheduleTrack(
    rootHz: number,
    scale: number[],
    track: MusicTrackPattern,
    globalStep: number,
    atTime: number,
    beatSec: number
  ): void {
    const stepStride = Math.max(1, Math.round(track.noteBeats / SUBDIVISION_BEATS));
    if (globalStep % stepStride !== 0) {
      return;
    }

    const noteIndex = Math.floor(globalStep / stepStride) % track.steps.length;
    const degree = track.steps[noteIndex];
    if (degree === null) {
      return;
    }

    const semitone = degreeToSemitone(degree, scale) + track.instrument.octaveShift * 12;
    const hz = semitoneToHz(rootHz, semitone);
    this.scheduleVoice(hz, atTime, Math.max(0.06, track.noteBeats * beatSec * 0.92), track.instrument);
  }

  private scheduleDrumTrack(
    drums: DrumTrackPattern,
    globalStep: number,
    atTime: number,
    beatSec: number
  ): void {
    const stepStride = Math.max(1, Math.round(drums.noteBeats / SUBDIVISION_BEATS));
    if (globalStep % stepStride !== 0) {
      return;
    }

    const noteIndex = Math.floor(globalStep / stepStride) % drums.steps.length;
    const hit = drums.steps[noteIndex];
    if (hit === null) {
      return;
    }

    const durationSec = drums.noteBeats * beatSec * 0.5;
    this.scheduleDrumHit(hit, atTime, durationSec, drums);
  }

  private scheduleDrumHit(hit: DrumHit, atTime: number, durationSec: number, drums: DrumTrackPattern): void {
    if (hit === null) return;

    const source = this.ctx.createBufferSource();
    source.buffer = getDrumNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    if (hit === 'kick') {
      // Low-pass filtered noise burst for kick
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(drums.kick.filterHz, atTime);
      filter.frequency.exponentialRampToValueAtTime(60, atTime + durationSec);
      env.gain.setValueAtTime(0.0001, atTime);
      env.gain.linearRampToValueAtTime(drums.kick.gain, atTime + 0.002);
      env.gain.exponentialRampToValueAtTime(0.0001, atTime + durationSec + 0.02);
    } else if (hit === 'hat') {
      // High-pass filtered noise for hi-hat
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(drums.hat.filterHz, atTime);
      env.gain.setValueAtTime(0.0001, atTime);
      env.gain.linearRampToValueAtTime(drums.hat.gain, atTime + 0.001);
      env.gain.exponentialRampToValueAtTime(0.0001, atTime + durationSec * 0.4);
    } else {
      // Band-pass noise for snare
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(drums.snare.filterHz, atTime);
      filter.Q.setValueAtTime(1.5, atTime);
      env.gain.setValueAtTime(0.0001, atTime);
      env.gain.linearRampToValueAtTime(drums.snare.gain, atTime + 0.002);
      env.gain.exponentialRampToValueAtTime(0.0001, atTime + durationSec + 0.01);
    }

    source.connect(filter);
    filter.connect(env);
    env.connect(this.musicBus);
    source.start(atTime);
    source.stop(atTime + durationSec + 0.05);
  }

  private scheduleVoice(frequencyHz: number, atTime: number, durationSec: number, inst: InstrumentPreset): void {
    const osc = this.ctx.createOscillator();

    // Use PeriodicWave for custom pulse widths on square waves
    if (inst.wave === 'square' && inst.pulseWidth !== undefined && inst.pulseWidth !== 0.5) {
      osc.setPeriodicWave(getPulseWave(this.ctx, inst.pulseWidth));
    } else {
      osc.type = inst.wave;
    }

    osc.frequency.setValueAtTime(Math.max(40, frequencyHz), atTime);

    // Vibrato LFO
    if (inst.vibratoHz && inst.vibratoDepth) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(inst.vibratoHz, atTime);
      // Convert cents to frequency deviation: depth_cents / 1200 * freq
      lfoGain.gain.setValueAtTime(frequencyHz * (inst.vibratoDepth / 1200), atTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(atTime);
      const releaseStart = Math.max(atTime + inst.attack + inst.decay, atTime + durationSec * 0.7);
      lfo.stop(releaseStart + inst.release + 0.02);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(inst.filterHz, atTime);
    filter.Q.setValueAtTime(inst.filterQ, atTime);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, atTime);
    env.gain.linearRampToValueAtTime(inst.gain, atTime + inst.attack);
    env.gain.linearRampToValueAtTime(inst.gain * inst.sustain, atTime + inst.attack + inst.decay);

    const releaseStart = Math.max(atTime + inst.attack + inst.decay, atTime + durationSec * 0.7);
    env.gain.setValueAtTime(inst.gain * inst.sustain, releaseStart);
    env.gain.linearRampToValueAtTime(0.0001, releaseStart + inst.release);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.musicBus);

    osc.start(atTime);
    osc.stop(releaseStart + inst.release + 0.01);
  }
}
