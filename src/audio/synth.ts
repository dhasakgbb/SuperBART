export class AudioSynth {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private musicInterval: number | null = null;

  init(volume: number): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = volume;
    this.gain.connect(this.ctx.destination);
  }

  setVolume(volume: number): void {
    if (this.gain) this.gain.gain.value = volume;
  }

  beep(freq: number, duration = 0.09, type: OscillatorType = 'square'): void {
    if (!this.ctx || !this.gain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.value = 0.001;
    osc.connect(env);
    env.connect(this.gain);
    const t = this.ctx.currentTime;
    env.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playSfx(name: 'jump' | 'coin' | 'stomp' | 'hurt' | 'power' | 'shell' | 'flag' | 'gameover'): void {
    const map: Record<typeof name, [number, number, OscillatorType]> = {
      jump: [440, 0.08, 'square'],
      coin: [880, 0.05, 'triangle'],
      stomp: [220, 0.08, 'square'],
      hurt: [160, 0.15, 'sawtooth'],
      power: [660, 0.12, 'triangle'],
      shell: [330, 0.08, 'square'],
      flag: [520, 0.2, 'triangle'],
      gameover: [130, 0.35, 'sawtooth']
    };
    const [f, d, t] = map[name];
    this.beep(f, d, t);
  }

  startMusic(tempo: number, scale: number[]): void {
    if (!this.ctx || this.musicInterval) return;
    let step = 0;
    const base = 196;
    const stepMs = Math.round((60_000 / tempo) / 2);
    this.musicInterval = window.setInterval(() => {
      const note = scale[step % scale.length] ?? 0;
      this.beep(base * Math.pow(2, note / 12), 0.12, 'square');
      step += 1;
    }, stepMs);
  }

  stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
