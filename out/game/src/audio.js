// Procedural WebAudio sound generator: gunshots, reload, explosion, hitmarker, sting, bomb beeps.
let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audio = {
  init() {
    getContext();
  },

  playGunshot(type = 'rifle') {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Noise buffer for gunshot blast
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'sniper' ? 1200 : type === 'pistol' ? 2400 : 1800, now);

    const gain = ctx.createGain();
    const vol = type === 'sniper' ? 0.9 : type === 'pistol' ? 0.5 : 0.7;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.3);

    // Add low thud / body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'sniper' ? 90 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    oscGain.gain.setValueAtTime(vol * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  },

  playReload() {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(400, now + 0.1);
    osc.frequency.setValueAtTime(800, now + 0.5);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  },

  playExplosion() {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(80, now + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 2.0);
  },

  playHitmarker(kill = false) {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(kill ? 1200 : 880, now);
    if (kill) osc.frequency.setValueAtTime(1600, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (kill ? 0.2 : 0.08));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (kill ? 0.22 : 0.09));
  },

  playSting() {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [220, 277.18, 329.63, 440];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.9);
    });
  },

  playBeep() {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
};
