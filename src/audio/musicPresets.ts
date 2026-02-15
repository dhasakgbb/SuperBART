// Preset keys are legacy internal identifiers. Mapping to current worlds:
// azure=W1(City), pipeline=W2(Tundra), enterprise=W3(Void),
// gpu=W4(Catacombs), graveyard=W5(Graveyard), benchmark=W6(Singularity)
export type MusicPresetKey = 'azure' | 'pipeline' | 'enterprise' | 'gpu' | 'graveyard' | 'benchmark';

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
  azure: {
    key: 'azure',
    tempoBpm: 126,
    rootHz: 196,
    // Major flavor: bright, bouncy world 1 theme
    scale: [0, 2, 4, 5, 7, 9, 11],
    lead: {
      // A section: ascending major melody | B section: call-and-response variation
      steps: [
        // A: bright ascending run
        0, 2, 4, 7, 9, 7, 4, 2, 0, null, 4, 5, 7, 9, 11, 9,
        11, 9, 7, 4, 2, 4, 7, 9, 11, null, 9, 7, 4, 2, 0, null,
        // B: higher register response with new contour
        7, 9, 11, 14, 12, 11, 9, 7, 4, 7, 9, 11, 14, 16, 14, 11,
        9, 7, 4, 2, 4, 7, 9, 11, 7, 4, 2, 0, 2, 4, 7, null
      ],
      noteBeats: 0.5,
      instrument: CHIP_LEAD
    },
    bass: {
      steps: [
        // A
        0, null, 0, null, 5, null, 4, null, 0, null, 7, null, 5, null, 4, null,
        0, null, 4, null, 5, null, 7, null, 4, null, 2, null, 0, null, -2, null,
        // B: walking bass with more movement
        7, null, 5, null, 4, null, 2, null, 0, null, 4, null, 5, null, 7, null,
        9, null, 7, null, 5, null, 4, null, 2, null, 0, null, -2, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: BASS_ROUND
    },
    drums: {
      steps: [
        // A
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        // A'
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'snare', 'kick', 'hat',
        // B: more active
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'hat', 'kick', 'snare', 'kick', 'hat', 'snare', 'hat',
        // B': fill at the end
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'kick',
        'snare', 'hat', 'kick', 'hat', 'snare', 'kick', 'snare', 'kick'
      ],
      noteBeats: 0.5,
      ...DRUMS_STANDARD
    }
  },
  pipeline: {
    key: 'pipeline',
    tempoBpm: 118,
    rootHz: 174.61,
    // Harmonic minor: underground/pipe theme
    scale: [0, 2, 3, 5, 7, 8, 11],
    lead: {
      steps: [
        // A: chromatic tension with harmonic minor flavor
        0, 3, 5, 7, 8, 7, 5, 3, 2, 3, 5, 7, 11, 8, 7, 5,
        7, 8, 11, 8, 7, 5, 3, 2, 0, null, 3, 5, 8, 7, 5, 3,
        // B: darker variation, descending patterns
        11, 8, 7, 5, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2,
        0, 2, 3, 5, 8, 11, 8, 5, 3, null, 2, 0, null, 3, 5, null
      ],
      noteBeats: 0.5,
      instrument: { ...CHIP_LEAD, filterHz: 3600, gain: 0.16, vibratoDepth: 14 }
    },
    bass: {
      steps: [
        // A
        0, null, 0, null, 5, null, 3, null, 0, null, 7, null, 8, null, 5, null,
        0, null, 3, null, 5, null, 8, null, 7, null, 5, null, 3, null, 0, null,
        // B: descending chromatic bass movement
        8, null, 7, null, 5, null, 3, null, 0, null, -2, null, 0, null, 3, null,
        5, null, 7, null, 8, null, 5, null, 3, null, 2, null, 0, null, -2, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 950, gain: 0.22 }
    },
    drums: {
      steps: [
        // A: sparse and groovy
        'kick', null, 'hat', null, 'snare', null, 'hat', null,
        'kick', null, 'hat', 'hat', 'snare', null, 'hat', null,
        'kick', null, 'hat', null, 'snare', null, 'hat', null,
        'kick', 'kick', 'hat', null, 'snare', null, 'kick', null,
        // B: builds intensity
        'kick', 'hat', 'snare', null, 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'kick', 'hat', 'snare', null, 'kick', null,
        'kick', 'hat', 'snare', 'hat', 'kick', null, 'snare', 'hat',
        'kick', 'kick', 'snare', 'kick', 'snare', 'hat', 'kick', null
      ],
      noteBeats: 0.5,
      ...DRUMS_TIGHT
    }
  },
  enterprise: {
    key: 'enterprise',
    tempoBpm: 136,
    rootHz: 220,
    // Lydian sparkle: icy, floating corporate theme
    scale: [0, 2, 4, 6, 7, 9, 11],
    lead: {
      steps: [
        // A: sparkling arpeggios
        0, 4, 6, 7, 11, 9, 7, 6, 4, 6, 7, 9, 11, 14, 11, 9,
        14, 11, 9, 7, 6, 4, 6, 7, 9, 11, 9, 7, 4, 2, 0, null,
        // B: lydian shimmer, higher register with rests
        2, 4, 7, 11, 14, null, 11, 9, 7, 11, 14, 16, 14, 11, 9, 7,
        4, null, 7, 9, 11, 14, 11, 9, 7, 6, 4, 2, 0, null, 2, null
      ],
      noteBeats: 0.5,
      instrument: SPARKLE_LEAD
    },
    bass: {
      steps: [
        // A
        0, null, 0, null, 6, null, 4, null, 0, null, 7, null, 9, null, 7, null,
        0, null, 4, null, 6, null, 9, null, 7, null, 4, null, 2, null, 0, null,
        // B: ascending stepwise bass
        2, null, 4, null, 6, null, 7, null, 9, null, 11, null, 9, null, 7, null,
        6, null, 4, null, 2, null, 0, null, -2, null, 0, null, 2, null, 4, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, filterHz: 1300, gain: 0.18 }
    },
    drums: {
      steps: [
        // A: driving 16th hats
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'kick', 'hat',
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'hat', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        // B: broken pattern for contrast
        'kick', null, 'hat', 'hat', 'snare', 'hat', null, 'hat',
        'kick', 'hat', null, 'hat', 'snare', null, 'kick', 'hat',
        'kick', 'hat', 'hat', 'hat', 'snare', 'hat', 'kick', 'hat',
        'kick', 'snare', 'hat', 'kick', 'snare', 'hat', 'snare', 'kick'
      ],
      noteBeats: 0.5,
      ...DRUMS_TIGHT
    }
  },
  gpu: {
    key: 'gpu',
    tempoBpm: 124,
    rootHz: 164.81,
    // Natural minor: heavy, brooding factory theme
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: {
      steps: [
        // A: grinding minor riff
        0, 3, 5, 3, 7, 5, 3, 2, 0, -2, 0, 3, 5, 7, 8, 10,
        8, 7, 5, 3, 2, 0, -2, 0, 3, 5, 7, 10, 8, 7, 5, 3,
        // B: aggressive ascending with octave jump
        0, 2, 3, 5, 8, 10, 12, 10, 8, 5, 3, 2, 0, null, -2, 0,
        10, 8, 7, 5, 3, 5, 7, 8, 10, 12, 10, 8, 5, 3, 0, null
      ],
      noteBeats: 0.5,
      instrument: FACTORY_LEAD
    },
    bass: {
      steps: [
        // A
        0, null, 0, null, 5, null, 3, null, -2, null, 0, null, 7, null, 5, null,
        0, null, 3, null, 5, null, 7, null, 5, null, 3, null, 0, null, -2, null,
        // B: pounding root movement
        0, 0, null, null, 5, 5, null, null, 3, 3, null, null, 7, 7, null, null,
        8, null, 7, null, 5, null, 3, null, 2, null, 0, null, -2, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: { ...BASS_ROUND, wave: 'sawtooth', filterHz: 820, gain: 0.22 }
    },
    drums: {
      steps: [
        // A: heavy industrial
        'kick', null, 'snare', null, 'kick', 'kick', 'snare', null,
        'kick', null, 'snare', 'hat', 'kick', null, 'snare', null,
        'kick', null, 'snare', null, 'kick', null, 'snare', 'hat',
        'kick', 'kick', 'snare', null, 'kick', 'snare', 'kick', null,
        // B: double-time feel
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'kick', 'snare', 'hat', 'kick', 'hat', 'snare', 'kick',
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'snare', 'kick', 'snare', 'kick', 'hat', 'snare', 'kick'
      ],
      noteBeats: 0.5,
      ...DRUMS_HEAVY
    }
  },
  graveyard: {
    key: 'graveyard',
    tempoBpm: 108,
    rootHz: 146.83,
    // Natural minor: sparse, ghostly graveyard theme (World 5)
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: {
      steps: [
        // A: sparse descending motif with rests
        0, null, null, 3, null, 5, null, 3, 0, null, null, null, 5, null, 3, null,
        0, null, null, 5, null, 8, null, 5, 3, null, null, null, 0, null, -2, null,
        // B: sustained notes with longer rests, more ethereal
        0, null, null, null, 3, null, null, 5, 7, null, null, 8, 7, null, 5, null,
        3, null, 0, null, null, null, -2, 0, null, 3, null, 5, null, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: {
        wave: 'sine',
        attack: 0.02,
        decay: 0.15,
        sustain: 0.4,
        release: 0.2,
        gain: 0.12,
        filterHz: 2200,
        filterQ: 0.8,
        octaveShift: 0,
        vibratoHz: 3,
        vibratoDepth: 8
      }
    },
    bass: {
      steps: [
        // A: slow root movement, lots of rests
        0, null, null, null, 3, null, null, null, 0, null, null, null, 5, null, null, null,
        0, null, null, null, 3, null, null, null, 5, null, null, null, 0, null, null, null,
        // B: sustained notes under sparse melody
        0, 0, 0, null, 3, null, null, null, 5, 5, null, null, 0, null, null, null,
        -2, null, 0, null, null, null, 3, null, 0, null, null, null, -2, null, 0, null
      ],
      noteBeats: 0.5,
      instrument: {
        wave: 'sine',
        attack: 0.01,
        decay: 0.12,
        sustain: 0.5,
        release: 0.18,
        gain: 0.14,
        filterHz: 1100,
        filterQ: 0.9,
        octaveShift: -1
      }
    },
    drums: {
      steps: [
        // A: very sparse, minimal percussion
        'kick', null, null, null, 'snare', null, null, null,
        'kick', null, null, null, 'snare', null, 'kick', null,
        'kick', null, null, null, 'snare', null, null, null,
        'kick', null, 'snare', null, 'kick', null, 'snare', null,
        // B: slightly more active but still sparse
        'kick', null, 'hat', null, 'snare', null, 'hat', null,
        'kick', null, null, 'hat', 'snare', null, 'kick', null,
        'kick', 'hat', null, null, 'snare', null, 'hat', 'kick',
        'snare', null, 'kick', null, 'snare', null, 'kick', null
      ],
      noteBeats: 0.5,
      kick: { filterHz: 160, gain: 0.1 },
      hat: { filterHz: 6500, gain: 0.035 },
      snare: { filterHz: 3200, gain: 0.08 }
    }
  },
  benchmark: {
    key: 'benchmark',
    tempoBpm: 152,
    rootHz: 146.83,
    // Tense / dissonant: final castle
    scale: [0, 1, 3, 5, 6, 8, 10],
    lead: {
      steps: [
        // A: relentless chromatic tension
        0, 1, 3, 6, 8, 6, 3, 1, 0, 3, 6, 8, 10, 8, 6, 3,
        10, 8, 6, 3, 1, 0, 1, 3, 6, 8, 10, 13, 10, 8, 6, 3,
        // B: climactic phrase with peak and fall
        1, 3, 6, 8, 10, 13, 15, 13, 10, 8, 6, 3, 1, 0, null, 1,
        13, 10, 8, 6, 3, 1, 0, 1, 3, 6, 8, 10, 8, 6, 3, null
      ],
      noteBeats: 0.5,
      instrument: CASTLE_LEAD
    },
    bass: {
      steps: [
        // A
        0, null, 0, null, 6, null, 3, null, 1, null, 0, null, 8, null, 6, null,
        0, null, 3, null, 6, null, 8, null, 6, null, 3, null, 1, null, 0, null,
        // B: aggressive syncopated bass
        0, 0, null, 6, null, 3, null, 1, 0, null, 8, null, 6, null, 3, null,
        1, null, 0, null, 6, null, 8, null, 6, null, 3, null, 1, 0, null, null
      ],
      noteBeats: 0.5,
      instrument: CASTLE_BASS
    },
    drums: {
      steps: [
        // A: intense driving beat
        'kick', 'hat', 'snare', 'hat', 'kick', 'hat', 'snare', 'hat',
        'kick', 'hat', 'kick', 'hat', 'snare', 'hat', 'kick', 'hat',
        'kick', 'hat', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'hat', 'snare', 'kick', 'kick', 'hat', 'snare', 'hat',
        // B: relentless double kicks
        'kick', 'kick', 'snare', 'hat', 'kick', 'kick', 'snare', 'hat',
        'kick', 'hat', 'kick', 'kick', 'snare', 'hat', 'kick', 'hat',
        'kick', 'kick', 'snare', 'kick', 'kick', 'hat', 'snare', 'hat',
        'kick', 'snare', 'kick', 'kick', 'snare', 'kick', 'snare', 'kick'
      ],
      noteBeats: 0.5,
      ...DRUMS_HEAVY
    }
  }
};

export function presetForWorld(world: number): MusicPresetKey {
  if (world === 1) return 'azure';      // The City (Prologue)
  if (world === 2) return 'pipeline';    // Cryo-Server Tundra
  if (world === 3) return 'enterprise';  // Quantum Void
  if (world === 4) return 'gpu';         // Deep Web Catacombs
  if (world === 5) return 'graveyard';   // Digital Graveyard
  return 'benchmark';                    // Singularity Core
}
