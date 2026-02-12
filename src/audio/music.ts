import { MUSIC_PRESETS, type InstrumentPreset, type MusicPresetKey, type MusicTrackPattern } from './musicPresets';

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

export class PatternMusicSynth {
  private timerId: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private currentPreset: MusicPresetKey | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly musicBus: GainNode
  ) {}

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
    const beatSec = 60 / preset.tempoBpm;
    const stepSec = beatSec * SUBDIVISION_BEATS;
    const lookAheadSec = 0.2;

    while (this.nextStepTime < this.ctx.currentTime + lookAheadSec) {
      this.scheduleTrack(preset.rootHz, preset.scale, preset.lead, this.stepIndex, this.nextStepTime, beatSec);
      this.scheduleTrack(preset.rootHz, preset.scale, preset.bass, this.stepIndex, this.nextStepTime, beatSec);
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

  private scheduleVoice(frequencyHz: number, atTime: number, durationSec: number, inst: InstrumentPreset): void {
    const osc = this.ctx.createOscillator();
    osc.type = inst.wave;
    osc.frequency.setValueAtTime(Math.max(40, frequencyHz), atTime);

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
