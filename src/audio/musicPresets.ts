export type MusicPresetKey = 'world1' | 'world2' | 'world3' | 'world4' | 'castle';

export interface InstrumentPreset {
  wave: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  gain: number;
  filterHz: number;
  filterQ: number;
  octaveShift: number;
  /** Vibrato rate in Hz (0 = disabled). */
  vibratoHz?: number;
  /** Vibrato depth in cents (0 = disabled). */
  vibratoDepth?: number;
  /** Pulse width for 'square' wave: 0.5 = 50%, 0.25 = 25%, 0.125 = 12.5%. Only used when wave is 'square'. */
  pulseWidth?: number;
}

/** Drum hit types for the percussion track. */
export type DrumHit = 'kick' | 'hat' | 'snare' | null;

export interface DrumPreset {
  filterHz: number;
  gain: number;
}

export interface MusicTrackPattern {
  steps: Array<number | null>;
  noteBeats: number;
  instrument: InstrumentPreset;
}

export interface DrumTrackPattern {
  steps: DrumHit[];
  noteBeats: number;
  kick: DrumPreset;
  hat: DrumPreset;
  snare: DrumPreset;
}

export interface MusicPreset {
  key: MusicPresetKey;
  tempoBpm: number;
  rootHz: number;
  scale: number[];
  lead: MusicTrackPattern;
  bass: MusicTrackPattern;
  drums: DrumTrackPattern;
}

const CHIP_LEAD: InstrumentPreset = {
  wave: 'square',
  attack: 0.004,
  decay: 0.06,
  sustain: 0.5,
  release: 0.05,
  gain: 0.18,
  filterHz: 5400,
  filterQ: 0.5,
  octaveShift: 1,
  vibratoHz: 5.5,
  vibratoDepth: 12,
  pulseWidth: 0.25
};

const BASS_ROUND: InstrumentPreset = {
  wave: 'triangle',
  attack: 0.005,
  decay: 0.09,
  sustain: 0.58,
  release: 0.08,
  gain: 0.2,
  filterHz: 1200,
  filterQ: 1.2,
  octaveShift: -1
};

const SPARKLE_LEAD: InstrumentPreset = {
  wave: 'triangle',
  attack: 0.003,
  decay: 0.05,
  sustain: 0.45,
  release: 0.04,
  gain: 0.15,
  filterHz: 7600,
  filterQ: 0.65,
  octaveShift: 2,
  vibratoHz: 6,
  vibratoDepth: 10
};

const FACTORY_LEAD: InstrumentPreset = {
  wave: 'sawtooth',
  attack: 0.006,
  decay: 0.08,
  sustain: 0.42,
  release: 0.09,
  gain: 0.14,
  filterHz: 2800,
  filterQ: 1.8,
  octaveShift: 1,
  vibratoHz: 4.5,
  vibratoDepth: 15
};

const CASTLE_LEAD: InstrumentPreset = {
  wave: 'sawtooth',
  attack: 0.003,
  decay: 0.07,
  sustain: 0.36,
  release: 0.11,
  gain: 0.15,
  filterHz: 2400,
  filterQ: 2.2,
  octaveShift: 1,
  vibratoHz: 5,
  vibratoDepth: 18,
  pulseWidth: 0.125
};

const CASTLE_BASS: InstrumentPreset = {
  wave: 'square',
  attack: 0.004,
  decay: 0.1,
  sustain: 0.45,
  release: 0.1,
  gain: 0.2,
  filterHz: 900,
  filterQ: 2,
  octaveShift: -1,
  pulseWidth: 0.5
};

// Standard drum presets
const DRUMS_STANDARD: Pick<DrumTrackPattern, 'kick' | 'hat' | 'snare'> = {
  kick: { filterHz: 200, gain: 0.14 },
  hat: { filterHz: 8000, gain: 0.06 },
  snare: { filterHz: 3500, gain: 0.1 }
};

const DRUMS_TIGHT: Pick<DrumTrackPattern, 'kick' | 'hat' | 'snare'> = {
  kick: { filterHz: 180, gain: 0.12 },
  hat: { filterHz: 9000, gain: 0.05 },
  snare: { filterHz: 4000, gain: 0.09 }
};

const DRUMS_HEAVY: Pick<DrumTrackPattern, 'kick' | 'hat' | 'snare'> = {
  kick: { filterHz: 160, gain: 0.16 },
  hat: { filterHz: 6000, gain: 0.05 },
  snare: { filterHz: 3000, gain: 0.12 }
};

export const MUSIC_PRESETS: Record<MusicPresetKey, MusicPreset> = {
  world1: {
    key: 'world1',
    tempoBpm: 126,
    rootHz: 196,
    // Major flavor.
    scale: [0, 2, 4, 5, 7, 9, 11],
    lead: {
      // A section: ascending run → B section: descending variation
      steps: [
        0, 2, 4, 7, 9, 7, 4, 2, 0, null, 4, 5, 7, 9, 11, 9,
        11, 9, 7, 4, 2, 4, 7, 9, 11, null, 9, 7, 4, 2, 0, null
      ],
      noteBeats: 0.5,
      instrument: CHIP_LEAD
    },
    bass: {
      steps: [
        0, null, 0, null, 5, null, 4, null, 0, null, 7, null, 5, null, 4, null,
        0, null, 4, null, 5, null, 7, null, 4, null, 2, null, 0, null, -2, null
      ],
      noteBeats: 0.5,
      instrument: BASS_ROUND
    },
    drums: {
      steps: [
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'snare', 'kick', 'hat'
      ],
      noteBeats: 0.5,
      ...DRUMS_STANDARD
    }
  },
  world2: {
    key: 'world2',
    tempoBpm: 118,
    rootHz: 174.61,
    // Harmonic minor-ish.
    scale: [0, 2, 3, 5, 7, 8, 11],
    lead: {
      steps: [
        0, 3, 5, 7, 8, 7, 5, 3, 2, 3, 5, 7, 11, 8, 7, 5,
        7, 8, 11, 8, 7, 5, 3, 2, 0, null, 3, 5, 8, 7, 5, 3
      ],
      noteBeats: 0.5,
      instrument: { ...CHIP_LEAD, filterHz: 3600, gain: 0.16, vibratoDepth: 14 }
    },
    bass: {
      steps: [
        0, null, 0, null, 5, null, 3, null, 0, null, 7, null, 8, null, 5, null,
        0, null, 3, null, 5, null, 8, null, 7, null, 5, null, 3, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 950, gain: 0.22 }
    },
    drums: {
      steps: [
        'kick', null, 'hat', null, 'snare', null, 'hat', null,
        'kick', null, 'hat', 'hat', 'snare', null, 'hat', null,
        'kick', null, 'hat', null, 'snare', null, 'hat', null,
        'kick', 'kick', 'hat', null, 'snare', null, 'kick', null
      ],
      noteBeats: 0.5,
      ...DRUMS_TIGHT
    }
  },
  world3: {
    key: 'world3',
    tempoBpm: 136,
    rootHz: 220,
    // Lydian-ish sparkle.
    scale: [0, 2, 4, 6, 7, 9, 11],
    lead: {
      steps: [
        0, 4, 6, 7, 11, 9, 7, 6, 4, 6, 7, 9, 11, 14, 11, 9,
        14, 11, 9, 7, 6, 4, 6, 7, 9, 11, 9, 7, 4, 2, 0, null
      ],
      noteBeats: 0.5,
      instrument: SPARKLE_LEAD
    },
    bass: {
      steps: [
        0, null, 0, null, 6, null, 4, null, 0, null, 7, null, 9, null, 7, null,
        0, null, 4, null, 6, null, 9, null, 7, null, 4, null, 2, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 1300, gain: 0.18 }
    },
    drums: {
      steps: [
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'kick', 'hat',
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat'
      ],
      noteBeats: 0.5,
      ...DRUMS_TIGHT
    }
  },
  world4: {
    key: 'world4',
    tempoBpm: 124,
    rootHz: 164.81,
    // Natural minor.
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: {
      steps: [
        0, 3, 5, 3, 7, 5, 3, 2, 0, -2, 0, 3, 5, 7, 8, 10,
        8, 7, 5, 3, 2, 0, -2, 0, 3, 5, 7, 10, 8, 7, 5, 3
      ],
      noteBeats: 0.5,
      instrument: FACTORY_LEAD
    },
    bass: {
      steps: [
        0, null, 0, null, 5, null, 3, null, -2, null, 0, null, 7, null, 5, null,
        0, null, 3, null, 5, null, 7, null, 5, null, 3, null, 0, null, -2, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, wave: 'sawtooth', filterHz: 820, gain: 0.22 }
    },
    drums: {
      steps: [
        'kick', null, 'snare', null, 'kick', 'kick', 'snare', null,
        'kick', null, 'snare', 'hat', 'kick', null, 'snare', null,
        'kick', null, 'snare', null, 'kick', null, 'snare', 'hat',
        'kick', 'kick', 'snare', null, 'kick', 'snare', 'kick', null
      ],
      noteBeats: 0.5,
      ...DRUMS_HEAVY
    }
  },
  castle: {
    key: 'castle',
    tempoBpm: 152,
    rootHz: 146.83,
    // Tense / dissonant.
    scale: [0, 1, 3, 5, 6, 8, 10],
    lead: {
      steps: [
        0, 1, 3, 6, 8, 6, 3, 1, 0, 3, 6, 8, 10, 8, 6, 3,
        10, 8, 6, 3, 1, 0, 1, 3, 6, 8, 10, 13, 10, 8, 6, 3
      ],
      noteBeats: 0.5,
      instrument: CASTLE_LEAD
    },
    bass: {
      steps: [
        0, null, 0, null, 6, null, 3, null, 1, null, 0, null, 8, null, 6, null,
        0, null, 3, null, 6, null, 8, null, 6, null, 3, null, 1, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: CASTLE_BASS
    },
    drums: {
      steps: [
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'hat', 'snare', 'kick', 'kick', 'hat', 'snare', 'hat'
      ],
      noteBeats: 0.5,
      ...DRUMS_HEAVY
    }
  }
};

export function presetForWorld(world: number): MusicPresetKey {
  if (world === 1) return 'world1';
  if (world === 2) return 'world2';
  if (world === 3) return 'world3';
  if (world === 4) return 'world4';
  return 'castle';
}
