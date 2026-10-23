type Tone = { freq: number; dur: number; delay?: number; type?: OscillatorType; gain?: number };

let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };
export const isMuted = () => muted;

function play(tones: Tone[]) {
  if (muted) return;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    tones.forEach(({ freq, dur, delay = 0, type = 'sine', gain = 0.08 }) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(gain, now + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(g).connect(ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch { /* áudio indisponível */ }
}

const haptic = (ms: number | number[]) => { if ('vibrate' in navigator) navigator.vibrate(ms); };

export const sfx = {
  tap: () => { play([{ freq: 660, dur: 0.08, type: 'triangle' }]); haptic(10); },
  start: () => { play([{ freq: 523, dur: 0.15 }, { freq: 659, dur: 0.15, delay: 0.12 }, { freq: 784, dur: 0.25, delay: 0.24 }]); haptic(20); },
  bell: () => { play([{ freq: 880, dur: 0.9, gain: 0.1 }, { freq: 1318, dur: 0.9, delay: 0.05, gain: 0.05 }]); haptic([60, 40, 60]); },
  munch: () => { play([{ freq: 220, dur: 0.07, type: 'square', gain: 0.05 }, { freq: 196, dur: 0.07, delay: 0.1, type: 'square', gain: 0.05 }, { freq: 247, dur: 0.07, delay: 0.2, type: 'square', gain: 0.05 }]); haptic(15); },
  camera: () => { play([{ freq: 1100, dur: 0.04, type: 'square', gain: 0.07 }, { freq: 750, dur: 0.1, delay: 0.05, type: 'triangle', gain: 0.09 }]); haptic([30, 20]); },
  fanfare: () => { play([523, 659, 784, 1047].map((f, i) => ({ freq: f, dur: 0.22, delay: i * 0.13, type: 'triangle' as OscillatorType, gain: 0.09 })).concat([{ freq: 1319, dur: 0.6, delay: 0.55, type: 'triangle', gain: 0.09 }])); haptic([40, 30, 40, 30, 80]); },
  warn: () => { play([{ freq: 300, dur: 0.2, type: 'sawtooth', gain: 0.04 }]); haptic(30); },
};
