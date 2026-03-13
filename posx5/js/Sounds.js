// ── js/sounds.js ── Web Audio Sound Engine
// Generates sounds programmatically via Web Audio API.
// No external files required — plays instantly with zero latency.

const SOUNDS = (() => {
  // Lazily create AudioContext on first user interaction (browser policy)
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Shared helpers ─────────────────────────────────────────────
  function createGain(audioCtx, volume, startTime, duration) {
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    gain.connect(audioCtx.destination);
    return gain;
  }

  function playOscillator(audioCtx, type, freq, gainNode, startTime, duration) {
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(gainNode);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // ── CLICK SOUND ────────────────────────────────────────────────
  // Warm, short "tap" — a sine blip with a quick decay (60ms)
  function playClick() {
    try {
      const audioCtx = getCtx();
      const now = audioCtx.currentTime;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      gain.connect(audioCtx.destination);

      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) { /* silently ignore if audio unavailable */ }
  }

  // ── SUCCESS SOUND ──────────────────────────────────────────────
  // Warm three-note ascending chime (C5 → E5 → G5), total ~0.6s
  function playSuccess() {
    try {
      const audioCtx = getCtx();
      const now = audioCtx.currentTime;

      const notes = [
        { freq: 523.25, start: 0.00 },   // C5
        { freq: 659.25, start: 0.18 },   // E5
        { freq: 783.99, start: 0.34 },   // G5
      ];

      notes.forEach(({ freq, start }) => {
        const t = now + start;
        const dur = 0.32;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.015);  // quick attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        gain.connect(audioCtx.destination);

        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';  // softer/warmer than sine
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } catch (e) { /* silently ignore */ }
  }

  // ── ERROR SOUND ────────────────────────────────────────────────
  // Short low buzz for out-of-stock / insufficient cash
  function playError() {
    try {
      const audioCtx = getCtx();
      const now = audioCtx.currentTime;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      gain.connect(audioCtx.destination);

      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) { /* silently ignore */ }
  }

  // ── LOGIN SOUND ────────────────────────────────────────────────
  // Two gentle ascending sine notes — distinct from click & success.
  // Feels like a soft "welcome chime" (A4 → D5), total ~0.45s
  function playLogin() {
    try {
      const audioCtx = getCtx();
      const now = audioCtx.currentTime;

      const notes = [
        { freq: 440.00, start: 0.00, dur: 0.22 },  // A4 — first note
        { freq: 587.33, start: 0.20, dur: 0.28 },  // D5 — rising resolve
      ];

      notes.forEach(({ freq, start, dur }) => {
        const t = now + start;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.0,  t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.012); // soft attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        gain.connect(audioCtx.destination);

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';   // purest, cleanest tone for login
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } catch (e) { /* silently ignore */ }
  }

  return { playClick, playSuccess, playError, playLogin };
})();