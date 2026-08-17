/**
 * v6Sounds — synthesized TV navigation audio for V6 "Connected Hub".
 *
 * No audio assets exist in the project, so every cue is generated with
 * WebAudio: short filtered sine blips for navigation, soft glissandi for the
 * hub open/close reveal, and a tiny 3-note arpeggio for pinning. Everything
 * is deliberately quiet (peak gains ≤ 0.09) and lowpassed — system-feedback
 * quality, never game-like.
 *
 * A persisted dev toggle (localStorage) turns the whole engine off; the
 * AudioContext is created lazily on the first user gesture so autoplay
 * policies are respected.
 */

const SFX_STORAGE_KEY = 'glance-v6-sfx';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function loadEnabled(): boolean {
  try { return localStorage.getItem(SFX_STORAGE_KEY) !== 'off'; } catch { return true; }
}

let enabled = loadEnabled();

export function sfxEnabled(): boolean { return enabled; }
export function setSfxEnabled(on: boolean) {
  enabled = on;
  try { localStorage.setItem(SFX_STORAGE_KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
}

type ToneSpec = {
  freq: number;
  /** glide target, if the tone should sweep */
  to?: number;
  type?: OscillatorType;
  /** seconds */
  dur: number;
  /** seconds after call */
  at?: number;
  gain: number;
  /** lowpass cutoff */
  cutoff?: number;
  pan?: number;
  attack?: number;
};

function tone(spec: ToneSpec) {
  const c = ensureCtx();
  if (!c || !master) return;
  const { freq, to, type = 'sine', dur, at = 0, gain, cutoff = 4200, pan = 0, attack = 0.004 } = spec;
  const t0 = c.currentTime + at;

  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  lp.Q.value = 0.6;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const p = c.createStereoPanner();
  p.pan.value = pan;

  osc.connect(lp); lp.connect(g); g.connect(p); p.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Soft airy sweep — a bandpassed noise breath under the open/close gliss. */
function breath(at: number, dur: number, from: number, to: number, gain: number) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(from, t0);
  bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// ─── Public cues ──────────────────────────────────────────────────────────────

export const v6sfx = {
  /** LEFT / RIGHT — soft spatial tick, panned slightly toward the direction */
  navH(dir: -1 | 1 = 1) {
    if (!enabled) return;
    tone({ freq: 1680, to: 1450, dur: 0.055, gain: 0.045, cutoff: 3600, pan: dir * 0.22 });
  },
  /** UP / DOWN — slightly different, lower cue for row navigation */
  navV() {
    if (!enabled) return;
    tone({ freq: 1180, to: 1040, dur: 0.06, gain: 0.045, cutoff: 3000 });
  },
  /** OPEN HUB — subtle expanding spatial reveal */
  open() {
    if (!enabled) return;
    breath(0, 0.55, 320, 1400, 0.035);
    tone({ freq: 296, to: 442, dur: 0.5, gain: 0.055, cutoff: 1800, attack: 0.05 });
    tone({ freq: 444, to: 660, dur: 0.46, at: 0.07, gain: 0.04, cutoff: 2200, attack: 0.06 });
  },
  /** CLOSE HUB — the reverse, resolving back to Ambient */
  close() {
    if (!enabled) return;
    breath(0, 0.42, 1200, 340, 0.028);
    tone({ freq: 442, to: 294, dur: 0.42, gain: 0.05, cutoff: 1700, attack: 0.05 });
    tone({ freq: 660, to: 440, dur: 0.36, at: 0.04, gain: 0.032, cutoff: 2100, attack: 0.05 });
  },
  /** OK — soft two-note confirmation */
  select() {
    if (!enabled) return;
    tone({ freq: 620, dur: 0.09, gain: 0.055, cutoff: 2600 });
    tone({ freq: 930, dur: 0.12, at: 0.06, gain: 0.05, cutoff: 2800 });
  },
  /** PIN — small satisfying lock-in sparkle (quick ascending triad) */
  pin() {
    if (!enabled) return;
    tone({ freq: 523, dur: 0.09, gain: 0.05, cutoff: 3200 });
    tone({ freq: 659, dur: 0.09, at: 0.055, gain: 0.05, cutoff: 3400 });
    tone({ freq: 784, dur: 0.16, at: 0.11, gain: 0.055, cutoff: 3800 });
    tone({ freq: 1568, dur: 0.14, at: 0.13, gain: 0.02, cutoff: 5200 });
  },
  /** UNPIN — soft release, two falling notes */
  unpin() {
    if (!enabled) return;
    tone({ freq: 740, dur: 0.09, gain: 0.045, cutoff: 3000 });
    tone({ freq: 494, dur: 0.15, at: 0.07, gain: 0.045, cutoff: 2600 });
  },
  /** blocked / edge — the quietest possible thud */
  deny() {
    if (!enabled) return;
    tone({ freq: 220, dur: 0.07, gain: 0.035, cutoff: 900, type: 'triangle' });
  },
};
