export type SfxKey =
  | 'jump'
  | 'coin'
  | 'stomp'
  | 'hurt'
  | 'power_up'
  | 'shell_kick'
  | 'goal_clear'
  | 'block_hit'
  | 'menu_move'
  | 'menu_confirm'
  | 'game_over'
  | 'one_up'
  | 'pipe_warp'
  | 'fireball'
  | 'time_warning'
  | 'pause';

export interface SfxDefinition {
  wave: OscillatorType;
  startHz: number;
  endHz: number;
  durationSec: number;
  attackSec: number;
  decaySec: number;
  sustain: number;
  releaseSec: number;
  gain: number;
}

/** Extra layers played alongside the primary oscillator for richer SFX. */
export interface SfxLayer {
  wave: OscillatorType;
  startHz: number;
  endHz: number;
  delaySec: number;
  durationSec: number;
  attackSec: number;
  releaseSec: number;
  gain: number;
}

/** Noise burst mixed into percussive SFX (stomp, shell_kick, hurt, etc.). */
export interface NoiseBurst {
  durationSec: number;
  attackSec: number;
  releaseSec: number;
  gain: number;
  filterHz: number;
}

export const REQUIRED_SFX_KEYS: SfxKey[] = [
  'jump',
  'coin',
  'stomp',
  'hurt',
  'power_up',
  'shell_kick',
  'goal_clear',
  'menu_move',
  'menu_confirm',
  'block_hit',
  'game_over',
  'pause',
  'one_up',
  'fireball'
];

export const SFX_DEFINITIONS: Record<SfxKey, SfxDefinition> = {
  jump: {
    wave: 'square',
    startHz: 300,
    endHz: 520,
    durationSec: 0.1,
    attackSec: 0.003,
    decaySec: 0.03,
    sustain: 0.24,
    releaseSec: 0.04,
    gain: 0.22
  },
  coin: {
    wave: 'triangle',
    startHz: 900,
    endHz: 1280,
    durationSec: 0.08,
    attackSec: 0.002,
    decaySec: 0.02,
    sustain: 0.2,
    releaseSec: 0.03,
    gain: 0.2
  },
  stomp: {
    wave: 'square',
    startHz: 200,
    endHz: 140,
    durationSec: 0.09,
    attackSec: 0.002,
    decaySec: 0.03,
    sustain: 0.25,
    releaseSec: 0.04,
    gain: 0.24
  },
  hurt: {
    wave: 'sawtooth',
    startHz: 250,
    endHz: 110,
    durationSec: 0.16,
    attackSec: 0.002,
    decaySec: 0.04,
    sustain: 0.22,
    releaseSec: 0.08,
    gain: 0.2
  },
  power_up: {
    wave: 'triangle',
    startHz: 440,
    endHz: 990,
    durationSec: 0.18,
    attackSec: 0.004,
    decaySec: 0.05,
    sustain: 0.28,
    releaseSec: 0.06,
    gain: 0.2
  },
  shell_kick: {
    wave: 'square',
    startHz: 320,
    endHz: 240,
    durationSec: 0.11,
    attackSec: 0.002,
    decaySec: 0.03,
    sustain: 0.2,
    releaseSec: 0.05,
    gain: 0.22
  },
  block_hit: {
    wave: 'square',
    startHz: 600,
    endHz: 420,
    durationSec: 0.08,
    attackSec: 0.002,
    decaySec: 0.025,
    sustain: 0.3,
    releaseSec: 0.04,
    gain: 0.22
  },
  goal_clear: {
    wave: 'triangle',
    startHz: 520,
    endHz: 880,
    durationSec: 0.22,
    attackSec: 0.004,
    decaySec: 0.05,
    sustain: 0.3,
    releaseSec: 0.08,
    gain: 0.2
  },
  menu_move: {
    wave: 'square',
    startHz: 520,
    endHz: 600,
    durationSec: 0.05,
    attackSec: 0.001,
    decaySec: 0.02,
    sustain: 0.2,
    releaseSec: 0.02,
    gain: 0.16
  },
  menu_confirm: {
    wave: 'triangle',
    startHz: 660,
    endHz: 980,
    durationSec: 0.09,
    attackSec: 0.002,
    decaySec: 0.025,
    sustain: 0.25,
    releaseSec: 0.04,
    gain: 0.18
  },
  game_over: {
    wave: 'sawtooth',
    startHz: 220,
    endHz: 80,
    durationSec: 0.35,
    attackSec: 0.003,
    decaySec: 0.06,
    sustain: 0.18,
    releaseSec: 0.15,
    gain: 0.2
  },
  one_up: {
    wave: 'triangle',
    startHz: 660,
    endHz: 1320,
    durationSec: 0.14,
    attackSec: 0.002,
    decaySec: 0.03,
    sustain: 0.3,
    releaseSec: 0.05,
    gain: 0.2
  },
  pipe_warp: {
    wave: 'square',
    startHz: 600,
    endHz: 200,
    durationSec: 0.25,
    attackSec: 0.003,
    decaySec: 0.05,
    sustain: 0.3,
    releaseSec: 0.1,
    gain: 0.18
  },
  fireball: {
    wave: 'sawtooth',
    startHz: 900,
    endHz: 400,
    durationSec: 0.07,
    attackSec: 0.001,
    decaySec: 0.02,
    sustain: 0.2,
    releaseSec: 0.03,
    gain: 0.16
  },
  time_warning: {
    wave: 'square',
    startHz: 880,
    endHz: 880,
    durationSec: 0.06,
    attackSec: 0.001,
    decaySec: 0.015,
    sustain: 0.25,
    releaseSec: 0.02,
    gain: 0.2
  },
  pause: {
    wave: 'triangle',
    startHz: 800,
    endHz: 520,
    durationSec: 0.08,
    attackSec: 0.001,
    decaySec: 0.02,
    sustain: 0.2,
    releaseSec: 0.03,
    gain: 0.16
  }
};

/** Secondary oscillator layers for richer SFX. Keyed to SfxKey, absent = no layer. */
const SFX_LAYERS: Partial<Record<SfxKey, SfxLayer[]>> = {
  coin: [
    // Shimmering perfect-5th harmonic
    { wave: 'triangle', startHz: 1350, endHz: 1920, delaySec: 0.015, durationSec: 0.06, attackSec: 0.002, releaseSec: 0.025, gain: 0.1 }
  ],
  hurt: [
    // Detuned dissonant layer
    { wave: 'sawtooth', startHz: 265, endHz: 100, delaySec: 0, durationSec: 0.14, attackSec: 0.002, releaseSec: 0.06, gain: 0.08 }
  ],
  power_up: [
    // Rapid 3-note arpeggio overtone
    { wave: 'triangle', startHz: 550, endHz: 660, delaySec: 0, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.1 },
    { wave: 'triangle', startHz: 660, endHz: 830, delaySec: 0.06, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.1 },
    { wave: 'triangle', startHz: 830, endHz: 1050, delaySec: 0.12, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.1 }
  ],
  goal_clear: [
    // 4-note celebratory fanfare layers
    { wave: 'square', startHz: 520, endHz: 520, delaySec: 0, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.08 },
    { wave: 'square', startHz: 660, endHz: 660, delaySec: 0.055, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.08 },
    { wave: 'square', startHz: 780, endHz: 780, delaySec: 0.11, durationSec: 0.05, attackSec: 0.002, releaseSec: 0.02, gain: 0.08 },
    { wave: 'triangle', startHz: 1040, endHz: 1040, delaySec: 0.165, durationSec: 0.06, attackSec: 0.003, releaseSec: 0.04, gain: 0.1 }
  ],
  game_over: [
    // Descending minor 3rd layer for somber feel
    { wave: 'square', startHz: 180, endHz: 65, delaySec: 0.08, durationSec: 0.25, attackSec: 0.003, releaseSec: 0.1, gain: 0.08 },
    { wave: 'sawtooth', startHz: 160, endHz: 55, delaySec: 0.16, durationSec: 0.2, attackSec: 0.003, releaseSec: 0.1, gain: 0.06 }
  ],
  one_up: [
    // Bright arpeggio shimmer
    { wave: 'square', startHz: 880, endHz: 1320, delaySec: 0.04, durationSec: 0.08, attackSec: 0.002, releaseSec: 0.03, gain: 0.1 },
    { wave: 'triangle', startHz: 1320, endHz: 1760, delaySec: 0.09, durationSec: 0.06, attackSec: 0.002, releaseSec: 0.03, gain: 0.08 }
  ]
};

/** Noise burst configs for percussive SFX. Keyed to SfxKey, absent = no noise. */
const SFX_NOISE: Partial<Record<SfxKey, NoiseBurst>> = {
  stomp: { durationSec: 0.04, attackSec: 0.001, releaseSec: 0.03, gain: 0.1, filterHz: 3000 },
  shell_kick: { durationSec: 0.035, attackSec: 0.001, releaseSec: 0.025, gain: 0.08, filterHz: 2500 },
  hurt: { durationSec: 0.05, attackSec: 0.001, releaseSec: 0.04, gain: 0.06, filterHz: 2000 },
  fireball: { durationSec: 0.03, attackSec: 0.001, releaseSec: 0.02, gain: 0.08, filterHz: 4000 },
  game_over: { durationSec: 0.06, attackSec: 0.002, releaseSec: 0.05, gain: 0.05, filterHz: 1500 }
};

/** Shared white noise buffer (1 second at 44100). Created lazily. */
let sharedNoiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

export class SfxSynth {
  constructor(
    private readonly ctx: AudioContext,
    private readonly sfxBus: GainNode
  ) {}

  play(key: SfxKey): void {
    const def = SFX_DEFINITIONS[key];
    if (!def) {
      return;
    }

    const t0 = this.ctx.currentTime;

    // Primary oscillator
    this.playVoice(def.wave, def.startHz, def.endHz, t0, def.durationSec, def.attackSec, def.decaySec, def.sustain, def.releaseSec, def.gain);

    // Secondary layers
    const layers = SFX_LAYERS[key];
    if (layers) {
      for (const layer of layers) {
        const lt = t0 + layer.delaySec;
        this.playVoice(layer.wave, layer.startHz, layer.endHz, lt, layer.durationSec, layer.attackSec, 0, 1, layer.releaseSec, layer.gain);
      }
    }

    // Noise burst
    const noise = SFX_NOISE[key];
    if (noise) {
      this.playNoiseBurst(t0, noise);
    }
  }

  private playVoice(
    wave: OscillatorType,
    startHz: number,
    endHz: number,
    atTime: number,
    durationSec: number,
    attackSec: number,
    decaySec: number,
    sustain: number,
    releaseSec: number,
    gain: number
  ): void {
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(startHz, atTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), atTime + durationSec);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, atTime);
    env.gain.linearRampToValueAtTime(gain, atTime + attackSec);
    env.gain.linearRampToValueAtTime(gain * sustain, atTime + attackSec + decaySec);
    env.gain.linearRampToValueAtTime(0.0001, atTime + durationSec + releaseSec);

    osc.connect(env);
    env.connect(this.sfxBus);
    osc.start(atTime);
    osc.stop(atTime + durationSec + releaseSec + 0.01);
  }

  private playNoiseBurst(atTime: number, burst: NoiseBurst): void {
    const source = this.ctx.createBufferSource();
    source.buffer = getNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = burst.filterHz;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, atTime);
    env.gain.linearRampToValueAtTime(burst.gain, atTime + burst.attackSec);
    env.gain.linearRampToValueAtTime(0.0001, atTime + burst.durationSec + burst.releaseSec);

    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    source.start(atTime);
    source.stop(atTime + burst.durationSec + burst.releaseSec + 0.01);
  }
}
