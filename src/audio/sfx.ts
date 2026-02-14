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
  | 'pause'
  | 'enemy_kill'
  | 'chain_extend'
  | 'spit_attack'
  | 'charge_warning'
  | 'land'
  | 'skid'
  | 'death_jingle'
  | 'victory_fanfare';

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
  'fireball',
  'enemy_kill',
  'chain_extend',
  'spit_attack',
  'charge_warning',
  'land',
  'skid',
  'death_jingle',
  'victory_fanfare'
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
  },
  enemy_kill: {
    wave: 'sawtooth',
    startHz: 150,
    endHz: 50,
    durationSec: 0.12,
    attackSec: 0.002,
    decaySec: 0.04,
    sustain: 0.2,
    releaseSec: 0.06,
    gain: 0.22
  },
  chain_extend: {
    wave: 'square',
    startHz: 220,
    endHz: 200,
    durationSec: 0.08,
    attackSec: 0.01,
    decaySec: 0.02,
    sustain: 0.1,
    releaseSec: 0.05,
    gain: 0.12
  },
  spit_attack: {
    wave: 'triangle',
    startHz: 330,
    endHz: 110,
    durationSec: 0.15,
    attackSec: 0.005,
    decaySec: 0.05,
    sustain: 0.2,
    releaseSec: 0.05,
    gain: 0.18
  },
  charge_warning: {
    wave: 'sawtooth',
    startHz: 440,
    endHz: 880,
    durationSec: 0.4,
    attackSec: 0.1,
    decaySec: 0.1,
    sustain: 0.5,
    releaseSec: 0.1,
    gain: 0.15
  },
  land: {
    wave: 'square',
    startHz: 140,
    endHz: 90,
    durationSec: 0.06,
    attackSec: 0.001,
    decaySec: 0.02,
    sustain: 0.15,
    releaseSec: 0.03,
    gain: 0.12
  },
  skid: {
    wave: 'sawtooth',
    startHz: 260,
    endHz: 180,
    durationSec: 0.08,
    attackSec: 0.001,
    decaySec: 0.025,
    sustain: 0.18,
    releaseSec: 0.04,
    gain: 0.1
  },
  /** Multi-note death melody: descending minor phrase, ~1.8 seconds total. */
  death_jingle: {
    wave: 'triangle',
    startHz: 440,
    endHz: 330,
    durationSec: 0.3,
    attackSec: 0.005,
    decaySec: 0.06,
    sustain: 0.35,
    releaseSec: 0.12,
    gain: 0.2
  },
  /** Multi-note victory fanfare: ascending major phrase, ~2.5 seconds total. */
  victory_fanfare: {
    wave: 'square',
    startHz: 392,
    endHz: 392,
    durationSec: 0.2,
    attackSec: 0.004,
    decaySec: 0.04,
    sustain: 0.4,
    releaseSec: 0.06,
    gain: 0.18
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
  ],
  land: [
    // Subtle thump undertone
    { wave: 'sine', startHz: 80, endHz: 50, delaySec: 0, durationSec: 0.04, attackSec: 0.001, releaseSec: 0.02, gain: 0.08 }
  ],
  skid: [
    // Gritty friction overtone
    { wave: 'square', startHz: 350, endHz: 200, delaySec: 0.01, durationSec: 0.06, attackSec: 0.001, releaseSec: 0.03, gain: 0.06 }
  ],
  death_jingle: [
    // Note 2: Eb (311 Hz) - step down
    { wave: 'triangle', startHz: 311, endHz: 311, delaySec: 0.35, durationSec: 0.25, attackSec: 0.004, releaseSec: 0.1, gain: 0.18 },
    // Note 3: D (294 Hz) - another step
    { wave: 'triangle', startHz: 294, endHz: 294, delaySec: 0.65, durationSec: 0.25, attackSec: 0.004, releaseSec: 0.1, gain: 0.18 },
    // Note 4: Db (277 Hz) - chromatic descent
    { wave: 'triangle', startHz: 277, endHz: 277, delaySec: 0.95, durationSec: 0.25, attackSec: 0.004, releaseSec: 0.1, gain: 0.16 },
    // Note 5: C (262 Hz) - penultimate
    { wave: 'triangle', startHz: 262, endHz: 262, delaySec: 1.25, durationSec: 0.3, attackSec: 0.004, releaseSec: 0.12, gain: 0.14 },
    // Note 6: low Ab (208 Hz) - final somber resolution
    { wave: 'square', startHz: 208, endHz: 208, delaySec: 1.6, durationSec: 0.4, attackSec: 0.006, releaseSec: 0.2, gain: 0.12 },
    // Harmony: minor 3rd underneath notes 4-6
    { wave: 'square', startHz: 165, endHz: 156, delaySec: 0.95, durationSec: 1.0, attackSec: 0.01, releaseSec: 0.3, gain: 0.06 }
  ],
  victory_fanfare: [
    // G4 (392) already plays as primary. Layer the full fanfare:
    // Note 2: C5 (523 Hz)
    { wave: 'square', startHz: 523, endHz: 523, delaySec: 0.22, durationSec: 0.18, attackSec: 0.004, releaseSec: 0.05, gain: 0.18 },
    // Note 3: E5 (659 Hz)
    { wave: 'square', startHz: 659, endHz: 659, delaySec: 0.42, durationSec: 0.18, attackSec: 0.004, releaseSec: 0.05, gain: 0.18 },
    // Note 4: G5 (784 Hz) - octave arrival
    { wave: 'square', startHz: 784, endHz: 784, delaySec: 0.62, durationSec: 0.25, attackSec: 0.004, releaseSec: 0.06, gain: 0.2 },
    // Hold: E5 (659 Hz) - held note under
    { wave: 'triangle', startHz: 659, endHz: 659, delaySec: 0.9, durationSec: 0.35, attackSec: 0.005, releaseSec: 0.1, gain: 0.14 },
    // Finale: high C6 (1047 Hz) - triumphant peak
    { wave: 'square', startHz: 1047, endHz: 1047, delaySec: 1.28, durationSec: 0.35, attackSec: 0.005, releaseSec: 0.15, gain: 0.16 },
    // Bass: C major root motion underneath
    { wave: 'triangle', startHz: 262, endHz: 262, delaySec: 0.42, durationSec: 0.5, attackSec: 0.008, releaseSec: 0.15, gain: 0.1 },
    // Bass: G resolution
    { wave: 'triangle', startHz: 196, endHz: 196, delaySec: 1.0, durationSec: 0.7, attackSec: 0.008, releaseSec: 0.2, gain: 0.1 },
    // Shimmer: octave doubling on the peak note
    { wave: 'triangle', startHz: 2093, endHz: 2093, delaySec: 1.28, durationSec: 0.2, attackSec: 0.003, releaseSec: 0.1, gain: 0.06 }
  ]
};

/** Noise burst configs for percussive SFX. Keyed to SfxKey, absent = no noise. */
const SFX_NOISE: Partial<Record<SfxKey, NoiseBurst>> = {
  stomp: { durationSec: 0.04, attackSec: 0.001, releaseSec: 0.03, gain: 0.1, filterHz: 3000 },
  shell_kick: { durationSec: 0.035, attackSec: 0.001, releaseSec: 0.025, gain: 0.08, filterHz: 2500 },
  hurt: { durationSec: 0.05, attackSec: 0.001, releaseSec: 0.04, gain: 0.06, filterHz: 2000 },
  fireball: { durationSec: 0.03, attackSec: 0.001, releaseSec: 0.02, gain: 0.08, filterHz: 4000 },
  game_over: { durationSec: 0.06, attackSec: 0.002, releaseSec: 0.05, gain: 0.05, filterHz: 1500 },
  enemy_kill: { durationSec: 0.08, attackSec: 0.001, releaseSec: 0.04, gain: 0.1, filterHz: 1200 },
  chain_extend: { durationSec: 0.02, attackSec: 0.001, releaseSec: 0.01, gain: 0.05, filterHz: 3000 },
  land: { durationSec: 0.04, attackSec: 0.001, releaseSec: 0.025, gain: 0.07, filterHz: 1800 },
  skid: { durationSec: 0.06, attackSec: 0.001, releaseSec: 0.035, gain: 0.06, filterHz: 2200 }
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
