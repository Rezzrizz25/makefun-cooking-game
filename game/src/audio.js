// Sizzle & Serve — audio.js
// All sounds are synthesized with WebAudio at run time: no audio files, no
// network. A tiny helper builds short blips, sizzles and jingles.

export function createSoundEngine() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensureContext() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, filterFreq) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  return {
    unlock() { ensureContext(); },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    isMuted() { return muted; },
    pickup() { tone(520, 0.09, 'triangle', 0.18); tone(780, 0.08, 'triangle', 0.12, 0.05); },
    drop() { tone(300, 0.08, 'triangle', 0.14); },
    chop() { noiseBurst(0.07, 0.5, 2400); tone(180, 0.06, 'square', 0.1); },
    chopDone() { tone(660, 0.1, 'triangle', 0.18); tone(880, 0.12, 'triangle', 0.16, 0.07); },
    grillOn() { tone(220, 0.12, 'sawtooth', 0.08); },
    grillDone() { tone(880, 0.1, 'sine', 0.2); tone(1174, 0.14, 'sine', 0.18, 0.09); },
    burn() { tone(140, 0.3, 'sawtooth', 0.16); },
    serve() {
      tone(523, 0.12, 'triangle', 0.2);
      tone(659, 0.12, 'triangle', 0.2, 0.09);
      tone(784, 0.2, 'triangle', 0.22, 0.18);
    },
    bad() { tone(220, 0.18, 'square', 0.12); tone(165, 0.25, 'square', 0.12, 0.12); },
    tick() { tone(980, 0.05, 'sine', 0.1); },
    startSizzle() {
      if (muted || sizzleNodes) return;
      const ac = ensureContext();
      if (!ac) return;
      const len = ac.sampleRate;
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const gain = ac.createGain();
      gain.gain.value = 0.035;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      src.start();
      sizzleNodes = { src, gain };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch (e) { /* already stopped */ }
      sizzleNodes = null;
    },
  };
}
