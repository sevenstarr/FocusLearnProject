'use client';

export type AmbientSoundType = 'rain' | 'lofi' | 'white-noise' | 'library';

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSource: AudioNode | null = null;
  private secondaryNodes: AudioNode[] = [];
  private isPlaying = false;
  private currentSound: AmbientSoundType = 'rain';
  private volume = 0.65;

  private ensureContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private createNoiseBuffer(seconds = 3): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-weighted noise for warmer, natural study acoustics
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private stopCurrentNodes() {
    if (this.activeSource && 'stop' in this.activeSource) {
      try {
        (this.activeSource as AudioBufferSourceNode).stop();
      } catch {
        // Ignore already stopped
      }
    }
    this.activeSource?.disconnect();
    this.activeSource = null;

    this.secondaryNodes.forEach((node) => {
      if ('stop' in node) {
        try {
          (node as OscillatorNode).stop();
        } catch {
          // Ignore already stopped
        }
      }
      node.disconnect();
    });
    this.secondaryNodes = [];
  }

  start(sound: AmbientSoundType = this.currentSound) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    this.stopCurrentNodes();
    this.currentSound = sound;

    const buffer = this.createNoiseBuffer(4);
    if (!buffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();

    if (sound === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 0.65;
      src.connect(filter);
      filter.connect(this.masterGain);
      this.secondaryNodes.push(filter);
    } else if (sound === 'lofi') {
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      src.connect(filter);
      filter.connect(this.masterGain);

      // Gentle warm chord pad (Caj7 subtle drone)
      const freqs = [130.81, 164.81, 196.0, 246.94];
      freqs.forEach((f) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        oscGain.gain.value = 0.035;
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start();
        this.secondaryNodes.push(osc, oscGain);
      });
      this.secondaryNodes.push(filter);
    } else if (sound === 'white-noise') {
      filter.type = 'lowpass';
      filter.frequency.value = 3400;
      src.connect(filter);
      filter.connect(this.masterGain);
      this.secondaryNodes.push(filter);
    } else {
      // Library quiet room tone
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      const libraryGain = this.ctx.createGain();
      libraryGain.gain.value = 0.55;
      src.connect(filter);
      filter.connect(libraryGain);
      libraryGain.connect(this.masterGain);
      this.secondaryNodes.push(filter, libraryGain);
    }

    src.start();
    this.activeSource = src;
    this.isPlaying = true;
  }

  stop() {
    this.stopCurrentNodes();
    this.isPlaying = false;
  }

  toggle(sound?: AmbientSoundType): boolean {
    if (sound && sound !== this.currentSound) {
      this.start(sound);
      return true;
    }
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    this.start(sound ?? this.currentSound);
    return true;
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val / 100));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, this.ctx.currentTime, 0.05);
    }
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      currentSound: this.currentSound,
      volume: Math.round(this.volume * 100),
    };
  }

  playCompletionChime() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
