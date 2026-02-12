export type SfxKey =
  | 'jump'
  | 'coin'
  | 'stomp'
  | 'hurt'
  | 'power_up'
  | 'shell_kick'
  | 'goal_clear'
  | 'menu_move'
  | 'menu_confirm';

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

export const REQUIRED_SFX_KEYS: SfxKey[] = [
  'jump',
  'coin',
  'stomp',
  'hurt',
  'power_up',
  'shell_kick',
  'goal_clear',
  'menu_move',
  'menu_confirm'
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
  }
};

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
    const osc = this.ctx.createOscillator();
    osc.type = def.wave;
    osc.frequency.setValueAtTime(def.startHz, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, def.endHz), t0 + def.durationSec);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(def.gain, t0 + def.attackSec);
    env.gain.linearRampToValueAtTime(def.gain * def.sustain, t0 + def.attackSec + def.decaySec);
    env.gain.linearRampToValueAtTime(0.0001, t0 + def.durationSec + def.releaseSec);

    osc.connect(env);
    env.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + def.durationSec + def.releaseSec + 0.01);
  }
}
