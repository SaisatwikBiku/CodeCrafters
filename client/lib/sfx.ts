// Web Audio API sound effects — no external files needed.
// All sounds are synthesised from scratch.

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browsers require a user gesture first)
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function isMuted(): boolean {
  try { return localStorage.getItem("sound_muted") === "1"; } catch { return false; }
}

/** Play a single oscillator tone. */
function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gainPeak: number = 0.22,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(gainPeak, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const SFX = {
  /** Two-note rising ding — correct answer. */
  correct() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 523, t,        0.14, 0.18); // C5
    tone(ac, 784, t + 0.12, 0.22, 0.22); // G5
  },

  /** Descending soft buzz — wrong output (not a crash, just "try again"). */
  wrong() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 320, t,        0.15, 0.18, "triangle");
    tone(ac, 220, t + 0.13, 0.18, 0.14, "triangle");
  },

  /** Short harsh blip — code threw an error / exception. */
  error() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    tone(ac, 180, ac.currentTime, 0.18, 0.2, "sawtooth");
  },

  /** 4-note ascending fanfare — stage complete. */
  stageComplete() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => tone(ac, freq, t + i * 0.11, 0.22, 0.2));
  },

  /** 5-note run + final triumphant chord — game complete. */
  gameComplete() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    [523, 659, 784, 1047, 1319].forEach((freq, i) =>
      tone(ac, freq, t + i * 0.09, 0.25, 0.18),
    );
    // Sustain chord at the end
    [1047, 1319, 1568].forEach((freq) =>
      tone(ac, freq, t + 0.55, 0.6, 0.12),
    );
  },

  /** Two soft pings — partner just joined. */
  partnerJoined() {
    if (isMuted()) return;
    const ac = getCtx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 880,  t,        0.12, 0.16);
    tone(ac, 1100, t + 0.1,  0.16, 0.16);
  },

  /** Toggle mute. Returns the new muted state (true = now muted). */
  toggleMute(): boolean {
    const next = !isMuted();
    try { localStorage.setItem("sound_muted", next ? "1" : "0"); } catch { /* ignore */ }
    return next;
  },

  isMuted,
};
