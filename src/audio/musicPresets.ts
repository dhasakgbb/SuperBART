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
}

export interface MusicTrackPattern {
  steps: Array<number | null>;
  noteBeats: number;
  instrument: InstrumentPreset;
}

export interface MusicPreset {
  key: MusicPresetKey;
  tempoBpm: number;
  rootHz: number;
  scale: number[];
  lead: MusicTrackPattern;
  bass: MusicTrackPattern;
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
  octaveShift: 1
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
  octaveShift: 2
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
  octaveShift: 1
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
  octaveShift: 1
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
  octaveShift: -1
};

export const MUSIC_PRESETS: Record<MusicPresetKey, MusicPreset> = {
  world1: {
    key: 'world1',
    tempoBpm: 126,
    rootHz: 196,
    // Major flavor.
    scale: [0, 2, 4, 5, 7, 9, 11],
    lead: {
      steps: [0, 2, 4, 7, 9, 7, 4, 2, 0, null, 4, 5, 7, 9, 11, 9],
      noteBeats: 0.5,
      instrument: CHIP_LEAD
    },
    bass: {
      steps: [0, null, 0, null, 5, null, 4, null, 0, null, 7, null, 5, null, 4, null],
      noteBeats: 0.5,
      instrument: BASS_ROUND
    }
  },
  world2: {
    key: 'world2',
    tempoBpm: 118,
    rootHz: 174.61,
    // Harmonic minor-ish.
    scale: [0, 2, 3, 5, 7, 8, 11],
    lead: {
      steps: [0, 3, 5, 7, 8, 7, 5, 3, 2, 3, 5, 7, 11, 8, 7, 5],
      noteBeats: 0.5,
      instrument: { ...CHIP_LEAD, filterHz: 3600, gain: 0.16 }
    },
    bass: {
      steps: [0, null, 0, null, 5, null, 3, null, 0, null, 7, null, 8, null, 5, null],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 950, gain: 0.22 }
    }
  },
  world3: {
    key: 'world3',
    tempoBpm: 136,
    rootHz: 220,
    // Lydian-ish sparkle.
    scale: [0, 2, 4, 6, 7, 9, 11],
    lead: {
      steps: [0, 4, 6, 7, 11, 9, 7, 6, 4, 6, 7, 9, 11, 14, 11, 9],
      noteBeats: 0.5,
      instrument: SPARKLE_LEAD
    },
    bass: {
      steps: [0, null, 0, null, 6, null, 4, null, 0, null, 7, null, 9, null, 7, null],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 1300, gain: 0.18 }
    }
  },
  world4: {
    key: 'world4',
    tempoBpm: 124,
    rootHz: 164.81,
    // Natural minor.
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: {
      steps: [0, 3, 5, 3, 7, 5, 3, 2, 0, -2, 0, 3, 5, 7, 8, 10],
      noteBeats: 0.5,
      instrument: FACTORY_LEAD
    },
    bass: {
      steps: [0, null, 0, null, 5, null, 3, null, -2, null, 0, null, 7, null, 5, null],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, wave: 'sawtooth', filterHz: 820, gain: 0.22 }
    }
  },
  castle: {
    key: 'castle',
    tempoBpm: 152,
    rootHz: 146.83,
    // Tense / dissonant.
    scale: [0, 1, 3, 5, 6, 8, 10],
    lead: {
      steps: [0, 1, 3, 6, 8, 6, 3, 1, 0, 3, 6, 8, 10, 8, 6, 3],
      noteBeats: 0.5,
      instrument: CASTLE_LEAD
    },
    bass: {
      steps: [0, null, 0, null, 6, null, 3, null, 1, null, 0, null, 8, null, 6, null],
      noteBeats: 0.5,
      instrument: CASTLE_BASS
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
