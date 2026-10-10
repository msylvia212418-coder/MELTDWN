// ── Audio system ──
// Lightweight procedural sound effects via Web Audio API.

let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function resumeAudio() {
  const c = ctx();
  if (c && c.state === 'suspended') {
    c.resume();
  }
}

export function isMuted() {
  return muted;
}

function play(fn) {
  if (muted) return;
  try { fn(ctx()); } catch(e) { /* silent fail */ }
}

export function sfxJump() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.linearRampToValueAtTime(600, c.currentTime + 0.1);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.15);
  });
}

export function sfxGear() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(800, c.currentTime);
    o.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.12);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.12);
  });
}

export function sfxDeny() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.linearRampToValueAtTime(100, c.currentTime + 0.25);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.3);
  });
}

export function sfxPermit() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, c.currentTime);
    o.frequency.linearRampToValueAtTime(880, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.2);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.2);
  });
}

export function sfxValve() {
  play((c) => {
    // White noise burst
    const buf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
    src.connect(g).connect(c.destination);
    src.start();
  });
}

export function sfxExplosion() {
  play((c) => {
    const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - (i / data.length) ** 0.5);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(0.25, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
    src.connect(g).connect(c.destination);
    src.start();
  });
}

export function sfxVictory() {
  play((c) => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, c.currentTime + i * 0.15);
      g.gain.linearRampToValueAtTime(0, c.currentTime + i * 0.15 + 0.3);
      o.connect(g).connect(c.destination);
      o.start(c.currentTime + i * 0.15);
      o.stop(c.currentTime + i * 0.15 + 0.3);
    });
  });
}

export function sfxActivate() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.linearRampToValueAtTime(440, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.25);
  });
}

export function sfxHurt() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.linearRampToValueAtTime(80, c.currentTime + 0.3);
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.35);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + 0.35);
  });
}
