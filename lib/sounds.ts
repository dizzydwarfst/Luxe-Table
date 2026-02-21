// ─── Sound Effects Engine ──────────────────────────────────────────────────
// Uses Web Audio API to generate all sounds procedurally — zero external files.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ── Individual effects ────────────────────────────────────────────────────

/** Short bright "pop" — topping lands on pizza */
export function playPop() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch { /* audio not supported */ }
}

/** Warm "ding" — item added to cart */
export function playDing() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    // Two harmonics for a bell-like tone
    [523.25, 659.25].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(i === 0 ? 0.2 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch { /* audio not supported */ }
}

/** Quick sizzle noise — dish placed in AR */
export function playSizzle() {
  try {
    const ctx  = getCtx();
    const t    = ctx.currentTime;
    const dur  = 0.8;

    // White noise through bandpass for sizzle
    const bufferSize = ctx.sampleRate * dur;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(6000, t);
    bandpass.frequency.exponentialRampToValueAtTime(2000, t + dur);
    bandpass.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    source.connect(bandpass).connect(gain).connect(ctx.destination);
    source.start(t);
  } catch { /* audio not supported */ }
}

/** Soft "whoosh" — page transition */
export function playWhoosh() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;
    const dur = 0.2;

    const bufferSize = ctx.sampleRate * dur;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.linearRampToValueAtTime(2500, t + dur * 0.3);
    lp.frequency.linearRampToValueAtTime(400, t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);

    source.connect(lp).connect(gain).connect(ctx.destination);
    source.start(t);
  } catch { /* audio not supported */ }
}

/** Success chime — order confirmed / sent to kitchen */
export function playSuccess() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch { /* audio not supported */ }
}

/** Gentle notification — chef suggestion / pairing toast */
export function playNotification() {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.setValueAtTime(1000, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch { /* audio not supported */ }
}

/** Layer reveal sound — for animated plating sequence */
export function playLayerReveal(pitch: number = 1) {
  try {
    const ctx = getCtx();
    const t   = ctx.currentTime;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(600 * pitch, t + 0.15);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  } catch { /* audio not supported */ }
}
