/**
 * 80s Synthwave Web Audio Synthesizer & Sequencer
 * Synthesizes retro synthwave music and arcade sound effects entirely in the browser.
 */

import { Track } from '../types';

export const TRACKS: Track[] = [
  {
    id: 'track-1',
    title: "Neon Sunset '84",
    artist: 'Vektor Dreams',
    album: 'Outrun Horizon',
    durationSeconds: 168,
    bpm: 110,
    key: 'D Minor',
    themeColor: '#ec4899', // pink
    description: 'Nostalgic analog pads, rolling 16th-note bassline, and 80s electro drums.',
  },
  {
    id: 'track-2',
    title: 'Cyber Highway Drift',
    artist: 'Outrun Protocol',
    album: 'Neon Accelerate',
    durationSeconds: 192,
    bpm: 126,
    key: 'A Minor',
    themeColor: '#06b6d4', // cyan
    description: 'High-octane arpeggios, pumping sidechained synth bass, and laser leads.',
  },
  {
    id: 'track-3',
    title: 'Midnight Laser Dreams',
    artist: 'Retro Skyline',
    album: 'Vapor Memories',
    durationSeconds: 154,
    bpm: 96,
    key: 'F Minor',
    themeColor: '#a855f7', // purple
    description: 'Chill dreamy chorus chords, lush retro reverbs, and nocturnal synth bells.',
  },
];

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isPlaying: boolean = false;
  private currentTrackIndex: number = 0;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private volume: number = 0.7;
  private isMuted: boolean = false;
  private sfxEnabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  // Track playback time emulation
  private trackStartTime: number = 0;
  private trackPausedTime: number = 0;

  // Listeners for UI state updates
  private onStateChangeCallbacks: Array<() => void> = [];

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    // Audio routing graph:
    // musicGain -> analyser -> masterGain -> destination
    // sfxGain -> masterGain -> destination
    this.musicGain.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Build white noise buffer for retro explosions & snares
    const bufferSize = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public subscribe(cb: () => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach((cb) => cb());
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack: TRACKS[this.currentTrackIndex],
      volume: this.volume,
      isMuted: this.isMuted,
      sfxEnabled: this.sfxEnabled,
      currentTime: this.getElapsedSeconds(),
    };
  }

  public getElapsedSeconds(): number {
    if (!this.isPlaying) {
      return this.trackPausedTime;
    }
    if (!this.ctx) return 0;
    const dur = TRACKS[this.currentTrackIndex].durationSeconds;
    const elapsed = (this.ctx.currentTime - this.trackStartTime) % dur;
    return elapsed;
  }

  public async play() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    if (this.ctx) {
      this.trackStartTime = this.ctx.currentTime - this.trackPausedTime;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.currentStep = 0;
    this.startScheduler();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.ctx) {
      this.trackPausedTime = this.getElapsedSeconds();
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACKS.length;
    this.trackPausedTime = 0;
    if (this.ctx) {
      this.trackStartTime = this.ctx.currentTime;
    }
    this.currentStep = 0;
    this.notify();
  }

  public prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    this.trackPausedTime = 0;
    if (this.ctx) {
      this.trackStartTime = this.ctx.currentTime;
    }
    this.currentStep = 0;
    this.notify();
  }

  public selectTrack(index: number) {
    if (index >= 0 && index < TRACKS.length) {
      this.currentTrackIndex = index;
      this.trackPausedTime = 0;
      if (this.ctx) {
        this.trackStartTime = this.ctx.currentTime;
      }
      this.currentStep = 0;
      if (!this.isPlaying) {
        this.play();
      } else {
        this.notify();
      }
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    this.notify();
  }

  public seek(targetSeconds: number) {
    const dur = TRACKS[this.currentTrackIndex].durationSeconds;
    this.trackPausedTime = Math.max(0, Math.min(dur, targetSeconds));
    if (this.ctx) {
      this.trackStartTime = this.ctx.currentTime - this.trackPausedTime;
    }
    this.notify();
  }

  // --- Step Sequencer Loop ---
  private startScheduler() {
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // seconds

    const scheduler = () => {
      if (!this.isPlaying || !this.ctx) return;

      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleStep(this.currentStep, this.nextNoteTime);
        this.advanceStep();
      }

      this.timerId = window.setTimeout(scheduler, lookahead);
    };

    scheduler();
  }

  private advanceStep() {
    const track = TRACKS[this.currentTrackIndex];
    // 16th notes: 4 steps per beat
    const secondsPerBeat = 60.0 / track.bpm;
    const stepDuration = secondsPerBeat / 4;
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 32; // 2 bars of 16 steps
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const trackIndex = this.currentTrackIndex;

    // Trigger drums, bass, chords, arpeggio based on active track pattern
    if (trackIndex === 0) {
      this.scheduleTrack1(step, time);
    } else if (trackIndex === 1) {
      this.scheduleTrack2(step, time);
    } else {
      this.scheduleTrack3(step, time);
    }
  }

  // Track 1: "Neon Sunset '84" (110 BPM, D minor)
  private scheduleTrack1(step: number, time: number) {
    // Drums
    // Kick on steps 0, 8, 16, 24
    if (step % 8 === 0) {
      this.synthKick(time, 140, 45, 0.28);
    }
    // Snare on steps 4, 12, 20, 28
    if (step % 8 === 4) {
      this.synthSnare(time, 0.22);
    }
    // Hi-hat on every odd step
    if (step % 2 === 1) {
      this.synthHiHat(time, step % 4 === 1 ? 0.08 : 0.04);
    }

    // 16th-note rolling synth bass in D minor: D -> Bb -> G -> C
    // 8 steps per chord
    const chordIdx = Math.floor(step / 8);
    const bassNotes = [73.42, 58.27, 49.0, 65.41]; // D2, Bb1, G1, C2 (Hz)
    const root = bassNotes[chordIdx];
    // Plucked synth bass pattern
    if (step % 2 === 0 || step % 4 === 3) {
      const freq = step % 4 === 3 ? root * 2 : root;
      this.synthBass(time, freq, 0.12, 0.22);
    }

    // Chords / Pad on step 0, 8, 16, 24
    if (step % 8 === 0) {
      const chords = [
        [146.83, 220.0, 261.63, 329.63], // Dm9: D3, A3, C4, E4
        [116.54, 174.61, 220.0, 261.63], // Bbmaj7: Bb2, F3, A3, C4
        [98.0, 146.83, 174.61, 220.0],   // Gm7: G2, D3, F3, A3
        [130.81, 164.81, 196.0, 246.94], // C7: C3, E3, G3, B3
      ];
      this.synthPad(time, chords[chordIdx], 1.4, 0.15);
    }

    // Lead melody riff
    const leadRiff = [
      { step: 0, freq: 587.33 },  // D5
      { step: 3, freq: 659.25 },  // E5
      { step: 6, freq: 698.46 },  // F5
      { step: 10, freq: 587.33 }, // D5
      { step: 14, freq: 523.25 }, // C5
      { step: 16, freq: 440.0 },  // A4
      { step: 20, freq: 523.25 }, // C5
      { step: 24, freq: 587.33 }, // D5
      { step: 28, freq: 659.25 }, // E5
    ];
    const match = leadRiff.find((n) => n.step === step);
    if (match) {
      this.synthLead(time, match.freq, 0.24, 0.16);
    }
  }

  // Track 2: "Cyber Highway Drift" (126 BPM, A minor)
  private scheduleTrack2(step: number, time: number) {
    // Four on the floor driving kick
    if (step % 4 === 0) {
      this.synthKick(time, 160, 50, 0.22);
    }
    // Clap / Snare on 4, 12, 20, 28
    if (step % 8 === 4) {
      this.synthSnare(time, 0.25);
    }
    // Rapid hi-hats
    this.synthHiHat(time, step % 2 === 0 ? 0.05 : 0.08);

    // Fast pumping bass
    const bassProgression = [55.0, 43.65, 65.41, 48.99]; // A1, F1, C2, G1
    const chordIdx = Math.floor(step / 8);
    const root = bassProgression[chordIdx];
    this.synthBass(time, root, 0.09, 0.25);

    // High energy 16th Arpeggiator
    const arpChords = [
      [220.0, 261.63, 329.63, 440.0], // Am
      [174.61, 220.0, 261.63, 349.23], // F
      [261.63, 329.63, 392.0, 523.25], // C
      [196.0, 246.94, 293.66, 392.0],  // G
    ];
    const chord = arpChords[chordIdx];
    const note = chord[step % 4];
    this.synthPluck(time, note * 2, 0.1, 0.14);

    // Brassy synth stabs
    if (step % 8 === 2 || step % 8 === 6) {
      this.synthLead(time, chord[2] * 2, 0.15, 0.18);
    }
  }

  // Track 3: "Midnight Laser Dreams" (96 BPM, F minor)
  private scheduleTrack3(step: number, time: number) {
    // Mellow beat
    if (step === 0 || step === 10 || step === 16 || step === 26) {
      this.synthKick(time, 120, 40, 0.35);
    }
    if (step === 8 || step === 24) {
      this.synthSnare(time, 0.28);
    }
    if (step % 4 === 2) {
      this.synthHiHat(time, 0.06);
    }

    // Deep sub bass
    const chordIdx = Math.floor(step / 8);
    const bass = [43.65, 34.65, 38.89, 32.7]; // F1, Db1, Eb1, C1
    if (step % 4 === 0) {
      this.synthBass(time, bass[chordIdx], 0.24, 0.28);
    }

    // Celestial bell lead
    const bells = [
      { step: 0, freq: 698.46 }, // F5
      { step: 4, freq: 830.61 }, // Ab5
      { step: 8, freq: 1046.5 }, // C6
      { step: 14, freq: 932.33 }, // Bb5
      { step: 18, freq: 830.61 }, // Ab5
      { step: 24, freq: 698.46 }, // F5
      { step: 28, freq: 622.25 }, // Eb5
    ];
    const b = bells.find((n) => n.step === step);
    if (b) {
      this.synthBell(time, b.freq, 0.5, 0.2);
    }

    // Lush warm pad on 0 and 16
    if (step % 16 === 0) {
      const padChords = [
        [174.61, 261.63, 311.13, 392.0], // Fm9
        [155.56, 233.08, 277.18, 349.23], // Dbmaj7
      ];
      this.synthPad(time, padChords[Math.floor(step / 16)], 2.5, 0.18);
    }
  }

  // --- Synthesis Instrument Helpers ---

  private synthKick(time: number, startFreq: number, endFreq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthSnare(time: number, duration: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;

    // Noise component
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + duration * 0.5);

    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + duration);
    osc.start(time);
    osc.stop(time + duration * 0.5);
  }

  private synthHiHat(time: number, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const dur = 0.05;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + dur);
  }

  private synthBass(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + duration);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthPad(time: number, freqs: number[], duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      // Subtle detune for rich vintage analog chorus
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.015), time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.linearRampToValueAtTime(1600, time + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(700, time + duration);

      // Smooth envelope attack and release
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol / freqs.length, time + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  private synthLead(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthPluck(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthBell(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // --- Retro Game Sound Effects (Web Audio API) ---

  public playLaserSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const duration = 0.14;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + duration);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playExplosionSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const duration = 0.28;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  public playInvaderStepSfx(stepNote: number) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [105, 95, 87, 80]; // Classic 4-note descending arcade march
    const freq = notes[stepNote % 4];
    const now = this.ctx.currentTime;
    const duration = 0.08;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playUfoSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.18;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);
    lfoGain.gain.setValueAtTime(60, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    lfo.stop(now + duration);
  }

  public playPlayerDeathSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + duration);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playPowerupSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.05;
      const dur = 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  public playShieldHitSfx() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const dur = 0.06;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + dur);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + dur);
  }
}

export const synthEngine = new SynthEngine();
