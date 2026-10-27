/**
 * Gerador Procedural de Áudio Ambiente & Lo-Fi Beats para Sessões de Foco do Pokémoro.
 * Utiliza Web Audio API nativa: 100% offline, áudio cristalino, mais animado com bateria Lo-Fi e volume encorpado.
 */

export type AmbientSoundType = 'off' | 'rain' | 'fire' | 'lofi';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'off';
  private masterGain: GainNode | null = null;
  private makeupGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private loopInterval: ReturnType<typeof setInterval> | null = null;
  private melodyInterval: ReturnType<typeof setInterval> | null = null;
  private volume = 1.0; // Volume alto por padrão
  private isPaused = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1.5, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public play(type: AmbientSoundType): void {
    if (this.currentType === type && !this.isPaused) return;
    this.stop();
    if (type === 'off') {
      this.currentType = 'off';
      return;
    }

    try {
      const ctx = this.getContext();

      // Master Gain para controle suave de volume
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(Math.max(0.2, this.volume), ctx.currentTime);

      // Compressor suave para dar pegada de rádio Lo-Fi sem achatar o volume
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-10, ctx.currentTime);
      this.compressor.knee.setValueAtTime(6, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(2.5, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, ctx.currentTime);

      // Makeup Gain: garante volume alto, nítido e presente
      this.makeupGain = ctx.createGain();
      this.makeupGain.gain.setValueAtTime(1.5, ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.makeupGain);
      this.makeupGain.connect(ctx.destination);

      if (type === 'rain') {
        this.startRain(ctx, this.masterGain);
      } else if (type === 'fire') {
        this.startCampfire(ctx, this.masterGain);
      } else if (type === 'lofi') {
        this.startUpbeatLoFiBeats(ctx, this.masterGain);
      }

      this.currentType = type;
      this.isPaused = false;
    } catch {
      this.currentType = 'off';
    }
  }

  public pause(): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.masterGain && this.ctx && this.currentType !== 'off') {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
      this.isPaused = false;
    }
  }

  public stop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    if (this.melodyInterval) {
      clearInterval(this.melodyInterval);
      this.melodyInterval = null;
    }

    if (this.activeNodes.length > 0) {
      for (const node of this.activeNodes) {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch {}
      }
      this.activeNodes = [];
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }

    if (this.makeupGain) {
      try {
        this.makeupGain.disconnect();
      } catch {}
      this.makeupGain = null;
    }

    if (this.compressor) {
      try {
        this.compressor.disconnect();
      } catch {}
      this.compressor = null;
    }

    this.currentType = 'off';
    this.isPaused = false;
  }

  // 1. Chuva Suave com volume encorpado
  private startRain(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.35;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1300, ctx.currentTime);

    noise.connect(filter);
    filter.connect(destination);
    noise.start();

    this.activeNodes.push(noise, filter);
  }

  // 2. Fogueira Aconchegante com estalos e graves
  private startCampfire(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const isPop = Math.random() < 0.005;
      data[i] = isPop ? (Math.random() * 2 - 1) * 1.2 : (Math.random() * 2 - 1) * 0.18;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    source.connect(filter);
    filter.connect(destination);
    source.start();

    this.activeNodes.push(source, filter);
  }

  // 3. Lo-Fi Beats Animado, Dançante & Encorpado (90 BPM Boom-Bap Hip Hop + Teclado Rhodes + Baixo com Harmônicos + Melodia Pokémon)
  private startUpbeatLoFiBeats(ctx: AudioContext, destination: GainNode): void {
    const bpm = 90; // Ritmo mais animado e gostoso de ouvir
    const beatSec = 60 / bpm; // ~0.666s
    const barSec = beatSec * 4; // ~2.666s

    // Progressão vibrante e alegre no estilo de cidade Pokémon (Fmaj7 -> Em7 -> Dm7 -> G7/Cmaj7)
    const chords = [
      { freqs: [174.61, 220.00, 261.63, 329.63], bass: 87.31, fifth: 130.81 }, // Fmaj7
      { freqs: [164.81, 196.00, 246.94, 293.66], bass: 82.41, fifth: 123.47 }, // Em7
      { freqs: [146.83, 174.61, 220.00, 261.63], bass: 73.42, fifth: 110.00 }, // Dm7
      { freqs: [130.81, 164.81, 196.00, 246.94], bass: 65.41, fifth: 98.00 },  // Cmaj7
    ];

    // Melodia animada e acolhedora em notas de piano Rhodes
    const melodyLines = [
      [329.63, 392.0, 440.0, 523.25], // E4, G4, A4, C5
      [493.88, 440.0, 392.0, 329.63], // B4, A4, G4, E4
      [293.66, 349.23, 440.0, 392.0], // D4, F4, A4, G4
      [329.63, 392.0, 523.25, 440.0], // E4, G4, C5, A4
    ];

    let chordIdx = 0;

    // Vinil / Fita Cassete de fundo com textura suave
    const vinylBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const vData = vinylBuffer.getChannelData(0);
    for (let i = 0; i < vData.length; i++) {
      const crackle = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.25 : 0;
      vData[i] = (Math.random() * 2 - 1) * 0.025 + crackle;
    }
    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = vinylBuffer;
    vinylSource.loop = true;
    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.setValueAtTime(2400, ctx.currentTime);
    const vinylGain = ctx.createGain();
    vinylGain.gain.setValueAtTime(0.12, ctx.currentTime);
    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(destination);
    vinylSource.start();
    this.activeNodes.push(vinylSource, vinylFilter, vinylGain);

    // BUMBO (Kick Drum): Punchy & Redondo
    const triggerKick = (time: number, isGhost = false) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGhost ? 110 : 160, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + (isGhost ? 0.08 : 0.18));

      gain.gain.setValueAtTime(isGhost ? 0.45 : 0.95, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (isGhost ? 0.1 : 0.25));

      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.26);
      this.activeNodes.push(osc, gain);
    };

    // CAIXA / RIMSHOT (Snare): Estalo seco e vibrante
    const triggerSnare = (time: number) => {
      // Corpo sonoro da caixa
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(140, time + 0.1);
      oscGain.gain.setValueAtTime(0.45, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.15);

      // Esteira crocante da caixa
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, time);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.55, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      noise.start(time);
      noise.stop(time + 0.18);

      this.activeNodes.push(osc, oscGain, noise, filter, noiseGain);
    };

    // HI-HAT (Prato de condução): Com Swing Lo-Fi
    const triggerHiHat = (time: number, isAccent = false, isOpen = false) => {
      const dur = isOpen ? 0.15 : 0.05;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isOpen ? 6500 : 8500, time);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isOpen ? 0.35 : isAccent ? 0.28 : 0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      noise.start(time);
      noise.stop(time + dur + 0.01);
      this.activeNodes.push(noise, filter, gain);
    };

    // NOTA DE MELODIA (Rhodes Bell)
    const triggerMelodyNote = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.22, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + 0.65);
      this.activeNodes.push(osc, gain);
    };

    const playMeasure = () => {
      if (this.currentType !== 'lofi' || this.isPaused) return;

      const now = ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      const currentMelody = melodyLines[chordIdx % melodyLines.length];
      chordIdx++;

      // 1. Acordes Encorpados de Piano Rhodes (com filtro quente)
      for (const freq of currentChord.freqs) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + barSec - 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + barSec);
        this.activeNodes.push(osc, filter, gain);
      }

      // 2. Baixo Groovado com Harmônicos (ouvível perfeitamente em celular e fone)
      // Fundamental (Sub) + 2º Harmônico (Punch)
      const bassRoots = [
        { time: now, freq: currentChord.bass },
        { time: now + beatSec * 2, freq: currentChord.bass },
        { time: now + beatSec * 3, freq: currentChord.fifth },
      ];

      for (const note of bassRoots) {
        const bassOsc = ctx.createOscillator();
        const bassHarmonic = ctx.createOscillator();
        const bassGain = ctx.createGain();

        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(note.freq, note.time);

        bassHarmonic.type = 'triangle';
        bassHarmonic.frequency.setValueAtTime(note.freq * 2, note.time);

        bassGain.gain.setValueAtTime(0.42, note.time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, note.time + beatSec * 0.95);

        bassOsc.connect(bassGain);
        bassHarmonic.connect(bassGain);
        bassGain.connect(destination);

        bassOsc.start(note.time);
        bassHarmonic.start(note.time);
        bassOsc.stop(note.time + beatSec);
        bassHarmonic.stop(note.time + beatSec);
        this.activeNodes.push(bassOsc, bassHarmonic, bassGain);
      }

      // 3. Batida de Bateria Boom-Bap Animada
      // Tempo 1: Kick
      triggerKick(now);
      // Tempo 1.75: Ghost Kick sutil com swing
      triggerKick(now + beatSec * 0.75, true);
      // Tempo 2: Snare estalado
      triggerSnare(now + beatSec);
      // Tempo 2.5: Open Hi-Hat
      triggerHiHat(now + beatSec * 1.5, true, true);
      // Tempo 3: Kick duplo sincopado
      triggerKick(now + beatSec * 2);
      triggerKick(now + beatSec * 2.5);
      // Tempo 4: Snare estalado
      triggerSnare(now + beatSec * 3);

      // Hi-Hats em semicolcheias com swing lo-fi autêntico
      for (let step = 0; step < 8; step++) {
        if (step === 3) continue; // Pula o tempo do open-hat
        const swing = step % 2 === 1 ? 0.035 : 0;
        triggerHiHat(now + step * (beatSec / 2) + swing, step % 2 === 0);
      }

      // 4. Frase Melódica Lo-Fi alegre
      for (let i = 0; i < currentMelody.length; i++) {
        triggerMelodyNote(now + i * (beatSec * 0.8), currentMelody[i]);
      }
    };

    playMeasure();
    this.loopInterval = setInterval(playMeasure, barSec * 1000);
  }
}

export const ambientSound = new AmbientSoundEngine();
