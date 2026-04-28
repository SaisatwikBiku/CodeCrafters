/**
 * Procedural background music engine — Web Audio API, no files.
 *
 * Three states:
 *   'waiting'  → sparse, dreamy (BPM 52) — waiting room
 *   'coding'   → flowing arpeggios (BPM 70) — normal gameplay
 *   'pressure' → denser, no rests (BPM 90) — partner already finished
 *
 * Uses lookahead scheduling so timing is rock-solid regardless of JS jank.
 */

export type MusicState = "waiting" | "coding" | "pressure";

// ── Shared mute key (same as SFX uses) ─────────────────────────────────────
function isMuted(): boolean {
  try { return localStorage.getItem("sound_muted") === "1"; } catch { return false; }
}

// ── A natural-minor pentatonic across 2 octaves ─────────────────────────────
// A3  C4     D4     E4     G4    A4    C5     E5
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 659.25];

// -1 = rest
const PATTERNS: Record<MusicState, number[]> = {
  //          sparse notes + long rests → calm, dreamy
  waiting:  [0, -1, -1, 4, -1, -1, 2, -1, -1, 5, -1, -1, 1, -1, -1, 3],
  //          flowing arpeggios with breathing room
  coding:   [0, 2, 4, -1, 5, 4, 2, -1, 3, 5, 4, -1, 2, 4, 5, -1],
  //          no rests, continuous drive
  pressure: [0, 3, 5, 4, 3, 5, 4, 3, 2, 4, 5, 4, 3, 5, 4, 5],
};

const TARGET_BPM: Record<MusicState, number> = {
  waiting:  52,
  coding:   70,
  pressure: 90,
};

// Volume of the melodic arpeggio notes (the master gain scales this further)
const NOTE_PEAK = 0.28;
const BASS_PEAK = 0.12;

// ── Engine state ────────────────────────────────────────────────────────────
let _ctx:    AudioContext | null = null;
let _master: GainNode     | null = null;   // master volume for music only
let _drone:  OscillatorNode | null = null;
let _droneGain: GainNode   | null = null;

let _running        = false;
let _timer:   ReturnType<typeof setTimeout> | null = null;
let _nextNoteTime   = 0;
let _beatIndex      = 0;
let _state:   MusicState = "coding";
let _curBpm         = 70;
let _tgtBpm         = 70;

const LOOKAHEAD  = 0.18; // seconds to look ahead when scheduling
const TICK_MS    = 80;   // how often the scheduler wakes up (ms)
const MASTER_VOL = 0.55; // overall music volume (keep low — background only)

// ── Helpers ─────────────────────────────────────────────────────────────────

function acquireCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _master = _ctx.createGain();
    _master.gain.value = 0; // start silent; fade in on play()
    _master.connect(_ctx.destination);
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

function scheduleNote(
  freq: number,
  startTime: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
) {
  if (!_ctx || !_master) return;
  const osc  = _ctx.createOscillator();
  const gain = _ctx.createGain();
  osc.connect(gain);
  gain.connect(_master);
  osc.type = type;
  osc.frequency.value = freq;
  const attack = Math.min(0.05, duration * 0.15);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.88);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.04);
}

function startDrone(ac: AudioContext) {
  if (_drone) return; // already running
  _droneGain = ac.createGain();
  _droneGain.gain.value = 0;
  _droneGain.connect(_master!);

  _drone = ac.createOscillator();
  _drone.type = "sine";
  _drone.frequency.value = 110; // A2 — warm low anchor
  _drone.connect(_droneGain);
  _drone.start();

  // Fade drone in slowly
  _droneGain.gain.linearRampToValueAtTime(BASS_PEAK, ac.currentTime + 3);
}

function updateDrone() {
  if (!_droneGain || !_ctx) return;
  // Shift drone pitch subtly for pressure state
  const freq = _state === "pressure" ? 146.83 : 110; // D2 vs A2
  if (_drone) {
    _drone.frequency.setTargetAtTime(freq, _ctx.currentTime, 1.5);
  }
}

function tick() {
  if (!_ctx || !_running) return;

  // Smooth BPM interpolation
  const diff = _tgtBpm - _curBpm;
  _curBpm = Math.abs(diff) < 0.3 ? _tgtBpm : _curBpm + diff * 0.04;

  const beatDur = 60 / _curBpm;
  const pattern = PATTERNS[_state];
  const muted   = isMuted();

  while (_nextNoteTime < _ctx.currentTime + LOOKAHEAD) {
    const idx      = _beatIndex % pattern.length;
    const scaleIdx = pattern[idx];

    if (scaleIdx >= 0 && !muted) {
      const freq = SCALE[scaleIdx];
      scheduleNote(freq, _nextNoteTime, beatDur * 0.72, NOTE_PEAK);

      // Low octave accent every 4 beats (adds warmth without being busy)
      if (idx % 4 === 0 && _state !== "waiting") {
        scheduleNote(freq / 2, _nextNoteTime, beatDur * 1.4, BASS_PEAK * 0.7, "triangle");
      }
    }

    _nextNoteTime += beatDur;
    _beatIndex++;
  }

  _timer = setTimeout(tick, TICK_MS);
}

// ── Public API ───────────────────────────────────────────────────────────────

export const Music = {
  /** Start music. Safe to call multiple times — only starts once. */
  play(state: MusicState = "coding") {
    const ac = acquireCtx();
    if (!ac || !_master) return;

    _state  = state;
    _tgtBpm = TARGET_BPM[state];

    if (!_running) {
      _running       = true;
      _nextNoteTime  = ac.currentTime + 0.1;
      _beatIndex     = 0;
      _curBpm        = _tgtBpm;

      // Fade master in (2 s ramp so it doesn't startle)
      if (!isMuted()) {
        _master.gain.cancelScheduledValues(ac.currentTime);
        _master.gain.setValueAtTime(0, ac.currentTime);
        _master.gain.linearRampToValueAtTime(MASTER_VOL, ac.currentTime + 2.5);
      }

      startDrone(ac);
      tick();
    }
  },

  /** Smooth state transition — tempo and pattern change gradually. */
  setState(state: MusicState) {
    if (_state === state || !_running) return;
    _state  = state;
    _tgtBpm = TARGET_BPM[state];
    updateDrone();
  },

  /** Fade out and stop the scheduler. */
  stop() {
    _running = false;
    if (_timer) { clearTimeout(_timer); _timer = null; }

    const ac = _ctx;
    const m  = _master;
    if (!ac || !m) return;

    // Fade out over 1.5 s
    m.gain.cancelScheduledValues(ac.currentTime);
    m.gain.setValueAtTime(m.gain.value, ac.currentTime);
    m.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);

    // Stop drone after fade
    const drone = _drone;
    const dg    = _droneGain;
    if (drone && dg) {
      dg.gain.cancelScheduledValues(ac.currentTime);
      dg.gain.setValueAtTime(dg.gain.value, ac.currentTime);
      dg.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
      setTimeout(() => { try { drone.stop(); } catch { /* ignore */ } _drone = null; _droneGain = null; }, 1600);
    }

    // Reset beat so next play() starts cleanly
    _beatIndex = 0;
  },

  /** Mute/unmute music without stopping the scheduler. */
  setMuted(muted: boolean) {
    const ac = _ctx;
    const m  = _master;
    if (!ac || !m) return;
    m.gain.cancelScheduledValues(ac.currentTime);
    m.gain.setValueAtTime(m.gain.value, ac.currentTime);
    m.gain.linearRampToValueAtTime(muted ? 0 : MASTER_VOL, ac.currentTime + 0.4);

    const dg = _droneGain;
    if (dg) {
      dg.gain.cancelScheduledValues(ac.currentTime);
      dg.gain.setValueAtTime(dg.gain.value, ac.currentTime);
      dg.gain.linearRampToValueAtTime(muted ? 0 : BASS_PEAK, ac.currentTime + 0.4);
    }
  },

  isMuted,
};
