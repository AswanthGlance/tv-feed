import gsap from 'gsap';

/* ─────────────────────────────────────────────────────────────────────────────
   Mascot Face Animation Engine — 4 core emotions × 4 variants
   ─────────────────────────────────────────────────────────────────────────────
   LOOP PRINCIPLE:
   Every timeline is a complete physical cycle. The last 20% is dedicated to
   returning to the resting state with near-zero velocity so the repeat()
   restart is imperceptible. Think: Action → Overshoot → Settle → Rest → [loop]
   ───────────────────────────────────────────────────────────────────────────── */

export type FaceRefs = {
  wrap:      HTMLElement | null;
  body:      HTMLElement | null;
  glow:      HTMLElement | null;
  shadow:    HTMLElement | null;
  particles: HTMLElement | null;
  eyeL:      HTMLElement | null;
  eyeR:      HTMLElement | null;
  lidL:      HTMLElement | null;
  lidR:      HTMLElement | null;
  browL:     HTMLElement | null;
  browR:     HTMLElement | null;
  cheekL:    HTMLElement | null;
  cheekR:    HTMLElement | null;
  smile:     HTMLElement | null;
  mouth:     HTMLElement | null;
  floatA:    HTMLElement | null;  // ♥ heart
  floatB:    HTMLElement | null;  // ? mark 1
  floatC:    HTMLElement | null;  // ? mark 2
  floatD:    HTMLElement | null;  // ? mark 3
  // Temporary acting props — used only during specific state animations
  waveL:    HTMLElement | null;  // sound-wave arc left  (listening)
  waveR:    HTMLElement | null;  // sound-wave arc right (listening)
  magGlass: HTMLElement | null;  // magnifying glass     (searching)
  scanRing: HTMLElement | null;  // concentric scan ring (processing)
  zFloat1:  HTMLElement | null;  // Z drift 1            (sleep)
  zFloat2:  HTMLElement | null;  // Z drift 2            (sleep)
  zFloat3:  HTMLElement | null;  // Z drift 3            (sleep)
  hand:     HTMLElement | null;  // wave hand            (happy/listening/waiting/wake)
};

/* ─── REST STATE ──────────────────────────────────────────────────────────────
   These are the exact values every loop must return to.
   Treat this as ground truth. */
const REST = {
  wrap:  { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  body:  { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  glow:  { scale: 1, opacity: 0.55 },
  shadow:{ scaleX: 1, opacity: 0.38 },
  eyeL:  { scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0, opacity: 1 },
  eyeR:  { scaleX: 1, scaleY: 1, x: 0, y: 0, rotation: 0, opacity: 1 },
} as const;

/* ─── HELPERS ─────────────────────────────────────────────────────────────────*/

export function faceReset(r: FaceRefs) {
  const all = [
    r.wrap, r.body, r.glow, r.shadow,
    r.eyeL, r.eyeR,
    r.browL, r.browR,
    r.cheekL, r.cheekR,
    r.smile, r.mouth,
    r.floatA, r.floatB, r.floatC, r.floatD,
    r.waveL, r.waveR, r.magGlass, r.scanRing,
    r.zFloat1, r.zFloat2, r.zFloat3,
    r.hand,
  ].filter(Boolean) as HTMLElement[];

  gsap.killTweensOf(all);
  if (r.particles) {
    gsap.killTweensOf(r.particles.children);
    Array.from(r.particles.children).forEach(c =>
      gsap.set(c, { opacity: 0, scale: 0, x: 0, y: 0 })
    );
  }

  gsap.set([r.wrap, r.body, r.glow, r.shadow].filter(Boolean), {
    x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, scale: 1, opacity: 1,
  });
  gsap.set([r.eyeL, r.eyeR].filter(Boolean), {
    x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, rotation: 0,
  });
  gsap.set([r.browL, r.browR, r.cheekL, r.cheekR, r.smile, r.mouth,
            r.floatA, r.floatB, r.floatC, r.floatD,
            r.waveL, r.waveR, r.magGlass, r.scanRing,
            r.zFloat1, r.zFloat2, r.zFloat3,
            r.hand].filter(Boolean), {
    opacity: 0, scale: 1, scaleX: 1, scaleY: 1, y: 0, x: 0, rotation: 0,
  });
}

/* Return a set of props to REST with a slow, sine ease — the "exhale" phase */
function returnToRest(
  r: FaceRefs, t: gsap.core.Timeline, at: number, dur = 0.9
) {
  const e = 'sine.inOut';
  t.to(r.wrap,   { ...REST.wrap,   duration: dur, ease: e }, at);
  t.to(r.body,   { ...REST.body,   duration: dur, ease: e }, at);
  t.to(r.glow,   { ...REST.glow,   duration: dur, ease: e }, at);
  t.to(r.shadow, { ...REST.shadow, duration: dur, ease: e }, at);
  t.to(r.eyeL,   { ...REST.eyeL,   duration: dur, ease: e }, at);
  t.to(r.eyeR,   { ...REST.eyeR,   duration: dur, ease: e }, at);
  // fade out any optional layers including acting props
  t.to([r.browL, r.browR, r.cheekL, r.cheekR, r.smile, r.mouth,
        r.waveL, r.waveR, r.magGlass, r.scanRing,
        r.zFloat1, r.zFloat2, r.zFloat3].filter(Boolean),
    { opacity: 0, duration: dur * 0.7, ease: 'power2.out' }, at);
}

function showBrows(
  r: FaceRefs, tl: gsap.core.Timeline, at: string | number,
  opts: { yL?: number; yR?: number; rotL?: number; rotR?: number; opacity?: number } = {}
) {
  const op = opts.opacity ?? 1;
  if (r.browL) tl.to(r.browL, { opacity: op, y: opts.yL ?? 0, rotation: opts.rotL ?? 0, duration: 0.25, ease: 'power2.out' }, at);
  if (r.browR) tl.to(r.browR, { opacity: op, y: opts.yR ?? 0, rotation: opts.rotR ?? 0, duration: 0.25, ease: 'power2.out' }, at);
}

function burst(r: FaceRefs, color: string, count = 6) {
  if (!r.particles) return;
  const items = Array.from(r.particles.children).slice(0, count) as HTMLElement[];
  items.forEach((p, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist  = 55 + (i % 3) * 15;
    gsap.set(p, { backgroundColor: color, opacity: 1, scale: 1, x: 0, y: 0 });
    gsap.to(p, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: 0, scale: 0.3,
      duration: 0.7 + (i % 3) * 0.1,
      ease: 'power2.out',
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. IDLE — calm alive breathing. The base rhythm all emotions return to.
   REST state throughout. Loop is a pure sine wave; no hard edges.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: pure breathing sine — inhale → blink → exhale → rest. No snap at any point. */
export function faceIdle_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  // Total: 7.2 s. Breathing is the entire loop.
  const t = gsap.timeline({ repeat: -1 });

  // Inhale (0 → 1.8)
  t.to(r.body,   { scaleX: 1.022, scaleY: 1.028, duration: 1.8, ease: 'sine.inOut' }, 0)
   .to(r.glow,   { scale: 1.07,   opacity: 0.68,  duration: 1.8, ease: 'sine.inOut' }, 0)
   .to(r.shadow, { scaleX: 1.04,  opacity: 0.44,  duration: 1.8, ease: 'sine.inOut' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 1.05, duration: 1.8, ease: 'sine.inOut' }, 0);

  // Blink at the inhale peak (1.8) — quick, back to scaleY=1.05 mid-breath
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' },  1.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.05, duration: 0.1, ease: 'power2.out' }, 1.87);

  // Exhale (2.0 → 3.8) — body returns exactly to REST.body, glow to REST.glow
  t.to(r.body,   { scaleX: 1, scaleY: 1, duration: 1.8, ease: 'sine.inOut' }, 2.0)
   .to(r.glow,   { scale: 1,  opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 2.0)
   .to(r.shadow, { scaleX: 1, opacity: 0.38, duration: 1.8, ease: 'sine.inOut' }, 2.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.8, ease: 'sine.inOut' }, 2.0);

  // Tiny settle pause (3.8 → 4.5) — hold at rest before second breath
  // Second inhale (4.5 → 5.9) — shallower
  t.to(r.body,   { scaleX: 1.014, scaleY: 1.018, duration: 1.4, ease: 'sine.inOut' }, 4.5)
   .to(r.glow,   { scale: 1.04,   opacity: 0.62,  duration: 1.4, ease: 'sine.inOut' }, 4.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1.03, duration: 1.4, ease: 'sine.inOut' }, 4.5);

  // Second exhale + return to REST (5.9 → 7.2)
  t.to(r.body,   { scaleX: 1, scaleY: 1, duration: 1.3, ease: 'sine.inOut' }, 5.9)
   .to(r.glow,   { scale: 1,  opacity: 0.55, duration: 1.3, ease: 'sine.inOut' }, 5.9)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.3, ease: 'sine.inOut' }, 5.9);
  // At t=7.2 all values = REST → seamless loop restart

  return t;
}

/** B: breathing + gentle side sway. Eyes and body return to REST before loop. */
export function faceIdle_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  // Total: 8 s. One full sway left → right → centre.
  const t = gsap.timeline({ repeat: -1 });

  // Breathing layer (continuous 0 → 8)
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0)
   .to(r.glow, { scale: 1.06, opacity: 0.65,  duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0);

  // Sway: 0→left (0–2s), left→right (2–6s), right→centre (6–8s)
  // Eyes lead the head slightly — wider travel than before to match Rive reference
  t.to(r.wrap, { rotation: -5, y: -2, duration: 2.0, ease: 'sine.inOut' }, 0)
   .to([r.eyeL, r.eyeR], { x: -8, duration: 2.0, ease: 'sine.inOut' }, 0);

  t.to(r.wrap, { rotation: 5, y: -2, duration: 4.0, ease: 'sine.inOut' }, 2.0)
   .to([r.eyeL, r.eyeR], { x: 8, duration: 4.0, ease: 'sine.inOut' }, 2.0);

  // Blink mid-sway
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 4.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 4.07);

  // Return to REST: rotation=0, y=0, eyes x=0 (6→8s, sine so velocity→0 at end)
  t.to(r.wrap, { rotation: 0, y: 0, duration: 2.0, ease: 'sine.inOut' }, 6.0)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 6.0);
  // At 8.0s: all values = REST → seamless

  return t;
}

/** C: breathing + one aware eye-dart, returns to neutral before loop. */
export function faceIdle_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  // Total: 8 s. Breathing → dart → return.
  const t = gsap.timeline({ repeat: -1 });

  // Breathing (0→4, yoyo)
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
   .to(r.glow, { scale: 1.06,  opacity: 0.65,  duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);

  // Blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1,  ease: 'power2.out' }, 1.87);

  // Dart right — wide travel to match Rive reference, head follows
  t.to([r.eyeL, r.eyeR], { x: 18, scaleY: 0.9, duration: 0.12, ease: 'power3.out' }, 4.2)
   .to(r.wrap,   { rotation: 5, duration: 0.12, ease: 'power2.out' }, 4.22)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1, duration: 0.45, ease: 'back.out(1.5)' }, 4.5)
   .to(r.wrap,   { rotation: 0, duration: 0.4,  ease: 'sine.inOut' }, 4.5);

  // Breathing continues (4→8, yoyo)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 4.0)
   .to(r.glow, { scale: 1.05,   opacity: 0.62,  duration: 2.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 4.0);

  // Final exhale to REST (7→8)
  t.to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0)
   .to(r.glow, { scale: 1,  opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 7.0)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** D: relaxed half-height eyes — slow sway, deep blink, back to REST. */
export function faceIdle_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  gsap.set([r.eyeL, r.eyeR], { scaleY: 0.75 });
  // Total: 10 s. Very slow cycle.
  const t = gsap.timeline({ repeat: -1 });

  // Breathing (continuous)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
   .to(r.glow, { scale: 1.05,   opacity: 0.62,  duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);

  // Slow sway: 0→left (0–3.5), left→right (3.5–7), right→REST (7–10)
  t.to(r.wrap, { rotation: -3, y: -2, duration: 3.5, ease: 'sine.inOut' }, 0);
  t.to(r.wrap, { rotation:  3, y: -2, duration: 3.5, ease: 'sine.inOut' }, 3.5);

  // Long sincere blink at 4s
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.3, ease: 'power2.in' }, 4.0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.75, duration: 0.4, ease: 'back.out(2)' }, 4.3);

  // Return to REST over last 3s (7→10)
  t.to(r.wrap, { rotation: 0, y: 0, duration: 3.0, ease: 'sine.inOut' }, 7.0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.75, x: 0, duration: 2.0, ease: 'sine.inOut' }, 8.0);
  // Note: eyes stay at 0.75 (this variant's "rest" scaleY) — that IS its base state

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. THINKING — active processing. Cycle: rest → narrow → scan/nod → glow →
   settle → exhale → REST. Every variant ends at zero velocity in REST.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: tilt + eye scan + brows. 8s cycle. */
export function faceThinking_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle into thinking (0→0.8) ──
  t.to(r.wrap,   { rotation: -10, duration: 0.7, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.55, duration: 0.45, ease: 'power2.out' }, 0.1)
   .to(r.glow,   { scale: 0.88, opacity: 0.38, duration: 0.6, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.1, { yL: -2, yR: -2, rotL: 10, rotR: -10, opacity: 1 });

  // ── PHASE 2: Eyes scan left — eyes lead, head follows (wider travel) ──
  t.to([r.eyeL, r.eyeR], { x: -20, duration: 0.38, ease: 'power2.out' }, 0.8)
   .to(r.wrap,   { rotation: -17, duration: 0.48, ease: 'sine.inOut' }, 0.8)
   .to(r.browL,  { rotation: 15, x: -3, duration: 0.42, ease: 'sine.inOut' }, 0.8)
   .to(r.browR,  { rotation: -10, x: -3, duration: 0.42, ease: 'sine.inOut' }, 0.8);

  // ── PHASE 3: Scan right (eyes lead, head chases) ──
  t.to([r.eyeL, r.eyeR], { x: 16, duration: 0.6, ease: 'power1.inOut' }, 1.4)
   .to(r.wrap,   { rotation: -5, duration: 0.7, ease: 'sine.inOut' }, 1.45)
   .to(r.browL,  { rotation: 9, x: 3, duration: 0.65, ease: 'sine.inOut' }, 1.4)
   .to(r.browR,  { rotation: -15, x: 3, duration: 0.65, ease: 'sine.inOut' }, 1.4);

  // ── PHASE 4: Centre + blink (2.3→2.8) ──
  t.to([r.eyeL, r.eyeR], { x: 0, duration: 0.35, ease: 'back.out(1.5)' }, 2.3)
   .to(r.wrap,   { rotation: -10, duration: 0.35, ease: 'sine.inOut' }, 2.3)
   .to(r.browL,  { rotation: 10, x: 0, y: -2, duration: 0.3, ease: 'sine.inOut' }, 2.3)
   .to(r.browR,  { rotation: -10, x: 0, y: -2, duration: 0.3, ease: 'sine.inOut' }, 2.3);
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 2.8)
   .to([r.eyeL, r.eyeR], { scaleY: 0.55, duration: 0.12, ease: 'power2.out' }, 2.88);

  // ── PHASE 5: Glow pulse (3.0→3.8) ──
  t.to(r.glow, { scale: 1.08, opacity: 0.65, duration: 0.45, ease: 'sine.inOut' }, 3.0)
   .to(r.glow, { scale: 0.88, opacity: 0.38, duration: 0.45, ease: 'sine.inOut' }, 3.5);

  // ── PHASE 6: Return to REST (3.8→5.5) ~~20% of total~~
  // Eyes ease open, brows fade, body untilts, glow comes back to resting level
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.2, ease: 'sine.inOut' }, 3.8)
   .to(r.wrap,   { rotation: 0, y: 0, duration: 1.5, ease: 'sine.inOut' }, 3.8)
   .to(r.glow,   { scale: 1, opacity: 0.55, duration: 1.4, ease: 'sine.inOut' }, 3.9)
   .to(r.body,   { scaleX: 1, scaleY: 1, duration: 1.2, ease: 'sine.inOut' }, 3.8);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 4.0);

  // ── PHASE 7: Idle breath at REST (5.5→7.0) — zero velocity into loop ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.8, ease: 'sine.inOut' }, 5.5)
   .to(r.glow, { scale: 1.06, opacity: 0.65,  duration: 0.8, ease: 'sine.inOut' }, 5.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 6.3)
   .to(r.glow, { scale: 1,  opacity: 0.55, duration: 0.8, ease: 'sine.inOut' }, 6.3);
  // At 7.1s: every value = REST, velocity = 0 (sine ends flat)

  return t;
}

/** B: head bob + asymmetric eyes + brow flips. 8s cycle. */
export function faceThinking_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→0.7) ──
  t.to(r.wrap,  { rotation: -6, y: -2, duration: 0.55, ease: 'power2.out' }, 0)
   .to(r.eyeL,  { scaleY: 0.48, duration: 0.35, ease: 'power2.out' }, 0.1)
   .to(r.eyeR,  { scaleY: 0.75, duration: 0.35, ease: 'power2.out' }, 0.1)
   .to(r.glow,  { scale: 0.9, opacity: 0.4, duration: 0.5, ease: 'power2.in' }, 0);
  t.to(r.browR, { opacity: 1, y: -5, rotation: -7, duration: 0.28, ease: 'power2.out' }, 0.18);

  // ── PHASE 2: Bob down (0.7→1.7) ──
  t.to(r.wrap,  { y: 4, rotation: -4, duration: 0.9, ease: 'sine.inOut' }, 0.7)
   .to(r.eyeL,  { scaleY: 0.58, duration: 0.7, ease: 'sine.inOut' }, 0.7)
   .to(r.eyeR,  { scaleY: 0.52, duration: 0.7, ease: 'sine.inOut' }, 0.7)
   .to(r.browR, { y: -3, rotation: -5, duration: 0.6, ease: 'sine.inOut' }, 0.7);

  // Blink (1.7)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 1.8)
   .to(r.eyeL,  { scaleY: 0.58, duration: 0.12, ease: 'power2.out' }, 1.88)
   .to(r.eyeR,  { scaleY: 0.52, duration: 0.12, ease: 'power2.out' }, 1.88)
   .to(r.browR, { y: -3, duration: 0.1, ease: 'power2.out' }, 1.88);

  // ── PHASE 3: Bob up, flip asymmetry (2.0→3.0) ──
  t.to(r.wrap,  { y: -3, rotation: -8, duration: 0.85, ease: 'sine.inOut' }, 2.0)
   .to(r.eyeL,  { scaleY: 0.76, duration: 0.6, ease: 'sine.inOut' }, 2.0)
   .to(r.eyeR,  { scaleY: 0.42, duration: 0.6, ease: 'sine.inOut' }, 2.0)
   .to(r.browR, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 2.0)
   .to(r.browL, { opacity: 1, y: -5, rotation: 7, duration: 0.35, ease: 'power2.out' }, 2.2);

  // ── PHASE 4: Glow pulse (3.0→4.0) ──
  t.to(r.glow, { scale: 1.1, opacity: 0.65, duration: 0.55, ease: 'sine.inOut' }, 3.0)
   .to(r.glow, { scale: 0.9, opacity: 0.42, duration: 0.55, ease: 'sine.inOut' }, 3.6);

  // ── PHASE 5: Return to REST (4.0→6.0) ──
  t.to(r.eyeL,  { scaleY: 1, duration: 1.4, ease: 'sine.inOut' }, 4.0)
   .to(r.eyeR,  { scaleY: 1, duration: 1.4, ease: 'sine.inOut' }, 4.0)
   .to(r.wrap,  { y: 0, rotation: 0, duration: 1.6, ease: 'sine.inOut' }, 4.0)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 4.1);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 4.2);

  // ── PHASE 6: Idle breath (6.0→7.8) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.85, ease: 'sine.inOut' }, 6.0)
   .to(r.glow, { scale: 1.06, opacity: 0.65,  duration: 0.85, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.85, ease: 'sine.inOut' }, 6.9)
   .to(r.glow, { scale: 1,  opacity: 0.55, duration: 0.85, ease: 'sine.inOut' }, 6.9);

  return t;
}

/** C: eye scan with brow lean. 7.5s cycle. */
export function faceThinking_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→0.65) ──
  t.to(r.wrap,   { rotation: -5, duration: 0.5, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.6, duration: 0.35, ease: 'power2.out' }, 0.1)
   .to(r.glow,   { scale: 0.9, opacity: 0.4, duration: 0.5, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.1, { yL: -2, yR: -2, rotL: 9, rotR: -9, opacity: 0.9 });

  // ── PHASE 2: Scan L — eyes lead, head follows with delay ──
  t.to([r.eyeL, r.eyeR], { x: -22, duration: 0.35, ease: 'power2.out' }, 0.65)
   .to(r.wrap,   { rotation: -12, duration: 0.45, ease: 'sine.inOut' }, 0.68)
   .to(r.browL,  { rotation: 14, x: -3, duration: 0.38, ease: 'sine.inOut' }, 0.65)
   .to(r.browR,  { rotation: -9, x: -3, duration: 0.38, ease: 'sine.inOut' }, 0.65);

  // ── PHASE 3: Scan R — eyes dart first, head catches up ──
  t.to([r.eyeL, r.eyeR], { x: 18, duration: 0.55, ease: 'power2.out' }, 1.2)
   .to(r.wrap,   { rotation: 3, duration: 0.65, ease: 'sine.inOut' }, 1.25)
   .to(r.browL,  { rotation: 8, x: 3, duration: 0.6, ease: 'sine.inOut' }, 1.2)
   .to(r.browR,  { rotation: -14, x: 3, duration: 0.6, ease: 'sine.inOut' }, 1.2);

  // ── PHASE 4: Centre (2.2→2.75) ──
  t.to([r.eyeL, r.eyeR], { x: 0, duration: 0.4, ease: 'back.out(1.5)' }, 2.2)
   .to(r.wrap,   { rotation: -5, duration: 0.4, ease: 'sine.inOut' }, 2.2)
   .to(r.browL,  { rotation: 9, x: 0, y: -2, duration: 0.38, ease: 'sine.inOut' }, 2.2)
   .to(r.browR,  { rotation: -9, x: 0, y: -2, duration: 0.38, ease: 'sine.inOut' }, 2.2);

  // Blink (2.8)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 2.8)
   .to([r.eyeL, r.eyeR], { scaleY: 0.6, duration: 0.12, ease: 'power2.out' }, 2.88);

  // ── PHASE 5: Return to REST (3.1→5.1) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.4, ease: 'sine.inOut' }, 3.1)
   .to(r.wrap,   { rotation: 0, y: 0, duration: 1.5, ease: 'sine.inOut' }, 3.1)
   .to(r.glow,   { scale: 1, opacity: 0.55, duration: 1.4, ease: 'sine.inOut' }, 3.2)
   .to(r.body,   { scaleX: 1, scaleY: 1, duration: 1.2, ease: 'sine.inOut' }, 3.1);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 3.3);

  // ── PHASE 6: Idle breath (5.1→7.0) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.85, ease: 'sine.inOut' }, 5.1)
   .to(r.glow, { scale: 1.06, opacity: 0.65,  duration: 0.85, ease: 'sine.inOut' }, 5.1)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.85, ease: 'sine.inOut' }, 5.95)
   .to(r.glow, { scale: 1,  opacity: 0.55, duration: 0.85, ease: 'sine.inOut' }, 5.95);

  return t;
}

/** D: deep nod + brows. 8.5s cycle. */
export function faceThinking_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→0.8) ──
  t.to(r.wrap,   { rotation: -8, y: 0, duration: 0.55, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.52, duration: 0.35, ease: 'power2.out' }, 0.1)
   .to(r.glow,   { scale: 0.88, opacity: 0.38, duration: 0.6, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.1, { yL: -2, yR: -2, rotL: 9, rotR: -9, opacity: 1 });

  // ── PHASE 2: Nod down (0.8→2.0) ──
  t.to(r.wrap,   { rotation: -12, y: 7, duration: 1.1, ease: 'sine.inOut' }, 0.8)
   .to([r.eyeL, r.eyeR], { scaleY: 0.42, duration: 0.8, ease: 'sine.inOut' }, 0.8)
   .to(r.browL,  { rotation: 12, y: -1, duration: 0.9, ease: 'sine.inOut' }, 0.8)
   .to(r.browR,  { rotation: -12, y: -1, duration: 0.9, ease: 'sine.inOut' }, 0.8);

  // ── PHASE 3: Glow pulse at nod depth (2.0→3.0) ──
  t.to(r.glow, { scale: 1.1, opacity: 0.65, duration: 0.55, ease: 'sine.inOut' }, 2.0)
   .to(r.glow, { scale: 0.88, opacity: 0.38, duration: 0.55, ease: 'sine.inOut' }, 2.6);

  // ── PHASE 4: Nod back up (2.3→3.5) ──
  t.to(r.wrap,   { rotation: -6, y: -2, duration: 1.1, ease: 'sine.inOut' }, 2.3)
   .to([r.eyeL, r.eyeR], { scaleY: 0.56, duration: 0.8, ease: 'sine.inOut' }, 2.3)
   .to(r.browL,  { rotation: 8, y: -2, duration: 0.9, ease: 'sine.inOut' }, 2.3)
   .to(r.browR,  { rotation: -8, y: -2, duration: 0.9, ease: 'sine.inOut' }, 2.3);

  // Blink (3.5)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.09, ease: 'power3.in' }, 3.5)
   .to([r.eyeL, r.eyeR], { scaleY: 0.52, duration: 0.14, ease: 'power2.out' }, 3.59);

  // ── PHASE 5: Return to REST (3.8→6.0) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, y: 0, duration: 1.5, ease: 'sine.inOut' }, 3.8)
   .to(r.wrap,   { rotation: 0, y: 0, duration: 1.8, ease: 'sine.inOut' }, 3.8)
   .to(r.glow,   { scale: 1, opacity: 0.55, duration: 1.6, ease: 'sine.inOut' }, 3.9)
   .to(r.body,   { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 3.8);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, 4.0);

  // ── PHASE 6: Idle breath (6.0→8.0) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.95, ease: 'sine.inOut' }, 6.0)
   .to(r.glow, { scale: 1.06, opacity: 0.65,  duration: 0.95, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.95, ease: 'sine.inOut' }, 6.95)
   .to(r.glow, { scale: 1,  opacity: 0.55, duration: 0.95, ease: 'sine.inOut' }, 6.95);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. HAPPY — Cycle: idle → anticipation squash → jump → land → overshoot →
   settle → one relaxed breath → back to REST → loop.
   Eyes slightly open (1.06–1.08), NOT exaggerated.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: float + eye shimmer. Full breathing cycle before loop. */
export function faceHappy_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Anticipation (0→0.25) — slight inhale/squash ──
  t.to(r.body, { scaleX: 1.03, scaleY: 0.97, duration: 0.25, ease: 'power2.in' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.25, ease: 'power2.in' }, 0);

  // ── PHASE 2: Rise + open eyes (0.25→1.1) ──
  t.to(r.wrap, { y: -9, duration: 0.55, ease: 'power2.out' }, 0.25)
   .to(r.body, { scaleX: 0.97, scaleY: 1.04, duration: 0.45, ease: 'power2.out' }, 0.25)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, scaleX: 1.03, duration: 0.4, ease: 'back.out(2)' }, 0.3)
   .to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.5, ease: 'power2.out' }, 0.25);
  burst(r, '#a78bfa', 5);

  // ── PHASE 3: Float sway (1.1→2.8) ──
  t.to(r.wrap, { y: -7, rotation: 2, duration: 0.9, ease: 'sine.inOut' }, 1.1)
   .to(r.body, { scaleX: 1.01, scaleY: 1.015, duration: 0.85, ease: 'sine.inOut' }, 1.1)
   .to(r.glow, { scale: 1.12, opacity: 0.74, duration: 0.85, ease: 'sine.inOut' }, 1.1);

  // Hand wave — greet/celebrate with 3 waves during float
  handWave(t, r.hand, 1.2, 3, 0.36, 20);

  // Eye shimmer
  t.to([r.eyeL, r.eyeR], { scaleY: 1.15, duration: 0.14, ease: 'power2.out' }, 1.7)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.2, ease: 'back.out(2)' }, 1.84);

  t.to(r.wrap, { y: -5, rotation: -2, duration: 1.0, ease: 'sine.inOut' }, 2.0)
   .to(r.glow, { scale: 1.08, opacity: 0.7, duration: 0.9, ease: 'sine.inOut' }, 2.0);

  // Blink (2.8)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.12, ease: 'back.out(2)' }, 2.87);

  // ── PHASE 4: Overshoot land (3.1→3.6) ──
  t.to(r.wrap, { y: 2, rotation: 0, duration: 0.4, ease: 'power2.in' }, 3.1)
   .to(r.body, { scaleX: 1.05, scaleY: 0.96, duration: 0.18, ease: 'power3.in' }, 3.4)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'back.out(2)' }, 3.58)
   .to(r.wrap, { y: 0, duration: 0.35, ease: 'back.out(2)' }, 3.5);

  // ── PHASE 5: Return to REST (3.8→5.5) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 1.2, ease: 'sine.inOut' }, 3.8)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.3, ease: 'sine.inOut' }, 3.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 3.9)
   .to(r.wrap, { y: 0, rotation: 0, duration: 1.0, ease: 'sine.inOut' }, 3.9);

  // ── PHASE 6: Relaxed breath (5.5→7.2) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.85, ease: 'sine.inOut' }, 5.5)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.85, ease: 'sine.inOut' }, 5.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.85, ease: 'sine.inOut' }, 6.35)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.85, ease: 'sine.inOut' }, 6.35);
  // At 7.2 → REST, velocity = 0

  return t;
}

/** B: hop + smile + return. 8.5s cycle. */
export function faceHappy_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Anticipation squash (0→0.22) ──
  t.to(r.body, { scaleX: 1.1, scaleY: 0.91, duration: 0.2, ease: 'power2.in' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.85, duration: 0.2, ease: 'power2.in' }, 0);

  // ── PHASE 2: Jump stretch (0.22→0.65) ──
  t.to(r.wrap, { y: -22, duration: 0.3, ease: 'power3.out' }, 0.22)
   .to(r.body, { scaleX: 0.93, scaleY: 1.1, duration: 0.25, ease: 'power3.out' }, 0.22)
   .to([r.eyeL, r.eyeR], { scaleY: 1.12, scaleX: 1.04, duration: 0.2, ease: 'back.out(2)' }, 0.28)
   .to(r.glow, { scale: 1.25, opacity: 0.82, duration: 0.28, ease: 'power3.out' }, 0.22);
  burst(r, '#a78bfa', 5);

  // Smile fades in at peak
  t.to(r.smile, { opacity: 1, duration: 0.22, ease: 'back.out(2)' }, 0.35);
  showBrows(r, t, 0.28, { yL: -3, yR: -3, rotL: -4, rotR: 4, opacity: 0.8 });

  // ── PHASE 3: Land + overshoot (0.65→1.15) ──
  t.to(r.wrap, { y: 0, duration: 0.22, ease: 'power3.in' }, 0.65)
   .to(r.body, { scaleX: 1.12, scaleY: 0.9, duration: 0.12, ease: 'power3.in' }, 0.8)
   .to(r.shadow, { scaleX: 1.18, opacity: 0.52, duration: 0.12 }, 0.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.38, ease: 'elastic.out(1, 0.5)' }, 0.92)
   .to(r.shadow, { scaleX: 1, opacity: 0.38, duration: 0.3 }, 0.92)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, scaleX: 1.02, duration: 0.3, ease: 'back.out(2)' }, 0.88);

  // ── PHASE 4: Happy float (1.2→3.5) ──
  t.to(r.wrap, { y: -6, rotation: 2, duration: 1.1, ease: 'sine.inOut' }, 1.2)
   .to(r.glow, { scale: 1.1, opacity: 0.72, duration: 1.0, ease: 'sine.inOut' }, 1.2)
   .to(r.wrap, { y: -3, rotation: -2, duration: 1.2, ease: 'sine.inOut' }, 2.3)
   .to(r.glow, { scale: 1.06, opacity: 0.68, duration: 1.1, ease: 'sine.inOut' }, 2.3);

  // Hand waves enthusiastically during float — 4 waves
  handWave(t, r.hand, 1.3, 4, 0.33, 22);

  // Second blink (3.5)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, duration: 0.12, ease: 'back.out(2)' }, 3.57);

  // ── PHASE 5: Return to REST (3.8→6.2) ──
  t.to(r.wrap, { y: 0, rotation: 0, duration: 1.7, ease: 'sine.inOut' }, 3.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 1.4, ease: 'sine.inOut' }, 3.9)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.6, ease: 'sine.inOut' }, 3.9)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.3, ease: 'sine.inOut' }, 4.0);
  t.to([r.smile, r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, 4.2);

  // ── PHASE 6: Relaxed breath (6.2→8.0) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 6.2)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.9, ease: 'sine.inOut' }, 6.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.1)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 7.1);

  return t;
}

/** C: cheeks + smile + sway. 9s cycle. */
export function faceHappy_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Anticipation (0→0.3) ──
  t.to(r.body, { scaleX: 1.04, scaleY: 0.96, duration: 0.28, ease: 'power2.in' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.28, ease: 'power2.in' }, 0);

  // ── PHASE 2: Open up (0.3→1.0) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1.07, scaleX: 1.03, duration: 0.45, ease: 'back.out(2.2)' }, 0.3)
   .to(r.body, { scaleX: 0.98, scaleY: 1.03, duration: 0.4, ease: 'back.out(1.5)' }, 0.3)
   .to(r.smile, { opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0.4)
   .to([r.cheekL, r.cheekR], { opacity: 0.45, duration: 0.45, ease: 'power2.out' }, 0.35)
   .to(r.glow, { scale: 1.14, opacity: 0.76, duration: 0.4, ease: 'power2.out' }, 0.3);
  showBrows(r, t, 0.32, { yL: -3, yR: -3, rotL: -4, rotR: 4, opacity: 0.78 });
  burst(r, '#c4b5fd', 5);

  // ── PHASE 3: Warm sway (1.0→3.8) ──
  t.to(r.wrap, { rotation: 3.5, y: -6, duration: 1.2, ease: 'sine.inOut' }, 1.0)
   .to(r.glow, { scale: 1.18, opacity: 0.8, duration: 1.1, ease: 'sine.inOut' }, 1.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1.1, duration: 0.7, ease: 'sine.inOut' }, 1.3);

  t.to(r.wrap, { rotation: -3.5, y: -4, duration: 1.5, ease: 'sine.inOut' }, 2.2)
   .to(r.glow, { scale: 1.1, opacity: 0.72, duration: 1.3, ease: 'sine.inOut' }, 2.2)
   .to([r.eyeL, r.eyeR], { scaleY: 1.05, duration: 0.8, ease: 'sine.inOut' }, 2.5);

  // Blink (3.8)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, duration: 0.12, ease: 'back.out(2)' }, 3.87);

  // ── PHASE 4: Return to REST (4.1→6.8) ──
  t.to(r.wrap, { rotation: 0, y: 0, duration: 1.9, ease: 'sine.inOut' }, 4.1)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 1.6, ease: 'sine.inOut' }, 4.2)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 4.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 4.2);
  t.to([r.smile, r.cheekL, r.cheekR, r.browL, r.browR].filter(Boolean),
    { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 4.5);

  // ── PHASE 5: Relaxed breath (6.8→8.7) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.95, ease: 'sine.inOut' }, 6.8)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.95, ease: 'sine.inOut' }, 6.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.95, ease: 'sine.inOut' }, 7.75)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.95, ease: 'sine.inOut' }, 7.75);

  return t;
}

/** D: confident float + glow breathe. 8s cycle. */
export function faceHappy_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Anticipation (0→0.25) ──
  t.to(r.body, { scaleX: 1.03, scaleY: 0.97, duration: 0.24, ease: 'power2.in' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.24, ease: 'power2.in' }, 0);

  // ── PHASE 2: Float up + glow bloom (0.25→1.2) ──
  t.to(r.wrap, { y: -11, duration: 0.65, ease: 'back.out(1.5)' }, 0.25)
   .to(r.body, { scaleX: 0.97, scaleY: 1.04, duration: 0.5, ease: 'back.out(1.5)' }, 0.25)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, scaleX: 1.02, duration: 0.4, ease: 'back.out(2)' }, 0.32)
   .to(r.glow, { scale: 1.22, opacity: 0.82, duration: 0.5, ease: 'power3.out' }, 0.25)
   .to(r.glow, { scale: 1.12, opacity: 0.74, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 0.75);
  burst(r, '#c4b5fd', 4);

  // ── PHASE 3: Float sway (1.2→3.8) ──
  t.to(r.wrap, { y: -7, rotation: 2.5, duration: 1.2, ease: 'sine.inOut' }, 1.2)
   .to(r.wrap, { y: -10, rotation: -2, duration: 1.2, ease: 'sine.inOut' }, 2.4);

  // Eye pulse
  t.to([r.eyeL, r.eyeR], { scaleY: 1.13, scaleX: 1.04, duration: 0.18, ease: 'power2.out' }, 1.9)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, scaleX: 1.02, duration: 0.24, ease: 'back.out(2)' }, 2.08)
   .to(r.glow, { scale: 1.14, opacity: 0.77, duration: 0.24, ease: 'power2.out' }, 1.9)
   .to(r.glow, { scale: 1.1, opacity: 0.72, duration: 0.35, ease: 'sine.inOut' }, 2.14);

  // Blink (3.8)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.07, duration: 0.12, ease: 'back.out(2)' }, 3.87);

  // ── PHASE 4: Return to REST (4.1→6.2) ──
  t.to(r.wrap, { y: 0, rotation: 0, duration: 1.6, ease: 'sine.inOut' }, 4.1)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 1.4, ease: 'sine.inOut' }, 4.2)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 4.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.3, ease: 'sine.inOut' }, 4.2);

  // ── PHASE 5: Relaxed breath (6.2→8.0) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 6.2)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.9, ease: 'sine.inOut' }, 6.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.1)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 7.1);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. CONFUSED — active search. Cycle: idle → tilt/narrow → darts/nod/wiggle →
   unwind → settle → REST breath → loop.
   Eyes stay asymmetric/narrow during expression, then ease back to REST.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: tilt-left + eye darts. 8s cycle. */
export function faceSorry_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle into confused (0→0.8) ──
  t.to(r.wrap, { rotation: -8, y: 5, duration: 0.6, ease: 'back.out(1.8)' }, 0)
   .to(r.eyeL, { scaleY: 0.45, x: -2, duration: 0.35, ease: 'power2.out' }, 0)
   .to(r.eyeR, { scaleY: 1.05, duration: 0.35, ease: 'power2.out' }, 0)
   .to(r.glow, { scale: 0.85, opacity: 0.3, duration: 0.7, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.15, { yL: -2, yR: -2, rotL: 12, rotR: -12, opacity: 0.9 });

  // ── PHASE 2: Eye dart right (0.9→1.3) ──
  t.to([r.eyeL, r.eyeR], { x: 10, duration: 0.18, ease: 'power3.out' }, 0.9)
   .to(r.browL, { rotation: 9, x: 3, duration: 0.16, ease: 'power2.out' }, 0.9)
   .to(r.browR, { rotation: -14, x: 3, duration: 0.16, ease: 'power2.out' }, 0.9)
   .to([r.eyeL, r.eyeR], { x: -2, duration: 0.28, ease: 'back.out(1.5)' }, 1.2)
   .to(r.browL, { rotation: 12, x: 0, duration: 0.25, ease: 'back.out(1.5)' }, 1.2)
   .to(r.browR, { rotation: -12, x: 0, duration: 0.25, ease: 'back.out(1.5)' }, 1.2);

  // ── PHASE 3: Nod down (1.5→2.3) ──
  t.to(r.wrap, { rotation: -13, y: 10, duration: 0.45, ease: 'power2.in' }, 1.5)
   .to(r.wrap, { rotation: -6,  y: 4,  duration: 0.45, ease: 'back.out(1.5)' }, 1.95);

  // ── PHASE 4: Eye dart left (2.4→2.9) ──
  t.to([r.eyeL, r.eyeR], { x: -12, duration: 0.17, ease: 'power3.out' }, 2.4)
   .to(r.browL, { rotation: 14, x: -3, duration: 0.15, ease: 'power2.out' }, 2.4)
   .to(r.browR, { rotation: -9, x: -3, duration: 0.15, ease: 'power2.out' }, 2.4)
   .to([r.eyeL, r.eyeR], { x: -2, duration: 0.3, ease: 'back.out(1.5)' }, 2.7)
   .to(r.browL, { rotation: 12, x: 0, duration: 0.28, ease: 'back.out(1.5)' }, 2.7)
   .to(r.browR, { rotation: -12, x: 0, duration: 0.28, ease: 'back.out(1.5)' }, 2.7);

  // Blink (3.1)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 3.1)
   .to(r.eyeL, { scaleY: 0.45, duration: 0.14, ease: 'back.out(2)' }, 3.18)
   .to(r.eyeR, { scaleY: 1.05, duration: 0.14, ease: 'back.out(2)' }, 3.18);

  // ── PHASE 5: Return to REST (3.4→5.8) ~~22%~~ ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.7, ease: 'sine.inOut' }, 3.4)
   .to(r.wrap,  { rotation: 0, y: 0, duration: 1.9, ease: 'sine.inOut' }, 3.4)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.7, ease: 'sine.inOut' }, 3.5)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 3.5);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 3.6);

  // ── PHASE 6: Breath (5.8→7.8) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.0, ease: 'sine.inOut' }, 5.8)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 1.0, ease: 'sine.inOut' }, 5.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 6.8)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 6.8);

  return t;
}

/** B: right-tilt + single raised brow + question. 9s cycle. */
export function faceSorry_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→0.8) ──
  t.to(r.wrap, { rotation: 8, y: 4, duration: 0.6, ease: 'back.out(1.8)' }, 0)
   .to(r.eyeR, { scaleY: 0.42, x: 2, duration: 0.32, ease: 'power2.out' }, 0)
   .to(r.eyeL, { scaleY: 1.06, duration: 0.32, ease: 'power2.out' }, 0)
   .to(r.glow, { scale: 0.86, opacity: 0.3, duration: 0.7, ease: 'power2.in' }, 0);
  t.to(r.browR, { opacity: 1, y: -5, rotation: -8, duration: 0.3, ease: 'power2.out' }, 0.2);

  // ── PHASE 2: ? floats (0.6→2.0) ──
  if (r.floatB) {
    t.to(r.floatB, { opacity: 1, y: -12, duration: 0.4, ease: 'back.out(2)' }, 0.6)
     .to(r.floatB, { opacity: 0, y: -36, duration: 0.7, ease: 'power2.in' }, 1.3);
  }

  // ── PHASE 3: Eye dart left (1.0→1.5) ──
  t.to([r.eyeL, r.eyeR], { x: -10, duration: 0.18, ease: 'power3.out' }, 1.0)
   .to(r.browR, { rotation: -11, x: -2, duration: 0.16, ease: 'power2.out' }, 1.0)
   .to([r.eyeL, r.eyeR], { x: 0, duration: 0.28, ease: 'back.out(1.5)' }, 1.3)
   .to(r.browR, { rotation: -8, x: 0, duration: 0.25, ease: 'back.out(1.5)' }, 1.3);

  // ── PHASE 4: Nod (1.7→2.5) ──
  t.to(r.wrap, { rotation: 12, y: 8, duration: 0.38, ease: 'power2.in' }, 1.7)
   .to(r.wrap, { rotation: 7,  y: 3, duration: 0.42, ease: 'back.out(1.5)' }, 2.1);

  // Blink (2.6)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 2.6)
   .to(r.eyeL, { scaleY: 1.06, duration: 0.14, ease: 'back.out(2)' }, 2.68)
   .to(r.eyeR, { scaleY: 0.42, duration: 0.14, ease: 'back.out(2)' }, 2.68);

  // ── PHASE 5: Second ? (3.0→4.2) ──
  if (r.floatB) {
    t.to(r.floatB, { opacity: 1, y: -8, duration: 0.35, ease: 'back.out(2)' }, 3.0)
     .to(r.floatB, { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 3.55);
  }
  t.to(r.browR, { y: -5, rotation: -10, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, 3.1);

  // ── PHASE 6: Return to REST (4.2→6.8) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.8, ease: 'sine.inOut' }, 4.2)
   .to(r.wrap,  { rotation: 0, y: 0, duration: 1.9, ease: 'sine.inOut' }, 4.2)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.7, ease: 'sine.inOut' }, 4.3)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 4.3);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 4.4);

  // ── PHASE 7: Breath (6.8→8.8) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.0, ease: 'sine.inOut' }, 6.8)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 1.0, ease: 'sine.inOut' }, 6.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.8)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 7.8);

  return t;
}

/** C: narrow eyes + head wiggle + 3 question marks. 9.5s cycle. */
export function faceSorry_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→0.7) ──
  t.to(r.wrap, { rotation: -6, duration: 0.48, ease: 'back.out(2)' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.52, duration: 0.32, ease: 'power2.out' }, 0)
   .to(r.glow, { scale: 0.86, opacity: 0.3, duration: 0.55, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.05, { yL: -2, yR: -2, rotL: 10, rotR: -10, opacity: 1 });

  // ── PHASE 2: Dart right + first ? (0.7→1.6) ──
  t.to([r.eyeL, r.eyeR], { x: 14, duration: 0.17, ease: 'power3.out' }, 0.7)
   .to(r.browL, { rotation: 8,  x: 3, duration: 0.15, ease: 'power2.out' }, 0.7)
   .to(r.browR, { rotation: -13, x: 3, duration: 0.15, ease: 'power2.out' }, 0.7);
  if (r.floatC) {
    t.to(r.floatC, { opacity: 1, y: -14, duration: 0.38, ease: 'back.out(2)' }, 0.75)
     .to(r.floatC, { opacity: 0, y: -38, duration: 0.65, ease: 'power2.in' }, 1.35);
  }
  t.to([r.eyeL, r.eyeR], { x: 0, duration: 0.24, ease: 'back.out(1.5)' }, 1.1)
   .to(r.browL, { rotation: 10, x: 0, duration: 0.22, ease: 'back.out(1.5)' }, 1.1)
   .to(r.browR, { rotation: -10, x: 0, duration: 0.22, ease: 'back.out(1.5)' }, 1.1);

  // ── PHASE 3: Head wiggle + second ? (1.7→2.5) ──
  t.to(r.wrap, { x: -7, rotation: -9, duration: 0.11, ease: 'power3.out' }, 1.7)
   .to(r.wrap, { x:  7, rotation:  9, duration: 0.2,  ease: 'power2.inOut' })
   .to(r.wrap, { x: -3, rotation: -5, duration: 0.15, ease: 'power2.inOut' })
   .to(r.wrap, { x:  0, rotation: -6, duration: 0.26, ease: 'back.out(1.5)' });
  if (r.floatB) {
    t.to(r.floatB, { opacity: 1, y: -10, duration: 0.32, ease: 'back.out(2)' }, 1.85)
     .to(r.floatB, { opacity: 0, y: -32, duration: 0.58, ease: 'power2.in' }, 2.4);
  }

  // Blink (2.7)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 2.7)
   .to([r.eyeL, r.eyeR], { scaleY: 0.52, duration: 0.14, ease: 'back.out(2)' }, 2.78);

  // ── PHASE 4: Dart left + third ? (3.0→3.9) ──
  t.to([r.eyeL, r.eyeR], { x: -14, duration: 0.17, ease: 'power3.out' }, 3.0)
   .to(r.browL, { rotation: 13, x: -3, duration: 0.15, ease: 'power2.out' }, 3.0)
   .to(r.browR, { rotation: -8, x: -3, duration: 0.15, ease: 'power2.out' }, 3.0);
  if (r.floatD) {
    t.to(r.floatD, { opacity: 1, y: -10, duration: 0.33, ease: 'back.out(2)' }, 3.1)
     .to(r.floatD, { opacity: 0, y: -32, duration: 0.58, ease: 'power2.in' }, 3.65);
  }
  t.to([r.eyeL, r.eyeR], { x: 0, duration: 0.25, ease: 'back.out(1.5)' }, 3.42)
   .to(r.browL, { rotation: 10, x: 0, duration: 0.22, ease: 'back.out(1.5)' }, 3.42)
   .to(r.browR, { rotation: -10, x: 0, duration: 0.22, ease: 'back.out(1.5)' }, 3.42);

  // ── PHASE 5: Return to REST (4.0→6.5) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.7, ease: 'sine.inOut' }, 4.0)
   .to(r.wrap,  { rotation: 0, x: 0, y: 0, duration: 1.9, ease: 'sine.inOut' }, 4.0)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 4.1)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 4.1);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 4.2);

  // ── PHASE 6: Breath (6.5→8.5) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.0, ease: 'sine.inOut' }, 6.5)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 1.0, ease: 'sine.inOut' }, 6.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.5)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 7.5);

  return t;
}

/** D: slow sincere nod + heavy brows. 10s cycle. */
export function faceSorry_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // ── PHASE 1: Settle (0→1.0) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 0.65, y: 2, duration: 0.7, ease: 'power2.inOut' }, 0)
   .to(r.wrap,  { y: 6, duration: 0.9, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.82, opacity: 0.24, duration: 1.0, ease: 'power2.in' }, 0);
  showBrows(r, t, 0.2, { yL: -2, yR: -2, rotL: 12, rotR: -12, opacity: 0.9 });

  // ── PHASE 2: Slow nod down (1.0→2.2) ──
  t.to(r.wrap,  { rotation: -5, y: 12, duration: 0.7, ease: 'power2.in' }, 1.0)
   .to(r.wrap,  { rotation: 2,  y: 5,  duration: 0.7, ease: 'back.out(1.5)' }, 1.7)
   .to(r.browL, { rotation: 13, y: -1, duration: 0.8, ease: 'sine.inOut' }, 1.0)
   .to(r.browR, { rotation: -13, y: -1, duration: 0.8, ease: 'sine.inOut' }, 1.0);

  // ── PHASE 3: Long sincere blink (2.3) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.35, ease: 'power2.in' }, 2.3)
   .to([r.eyeL, r.eyeR], { scaleY: 0.65, duration: 0.5, ease: 'back.out(2)' }, 2.65);

  // ── PHASE 4: Glow flicker — still processing (3.2→4.0) ──
  t.to(r.glow, { scale: 0.88, opacity: 0.34, duration: 0.4, ease: 'sine.inOut' }, 3.2)
   .to(r.glow, { scale: 0.82, opacity: 0.24, duration: 0.4, ease: 'sine.inOut' }, 3.6);

  // ── PHASE 5: Nod other direction (4.0→5.2) ──
  t.to(r.wrap, { rotation: 4, y: 8, duration: 0.55, ease: 'power2.in' }, 4.0)
   .to(r.wrap, { rotation: 0, y: 5, duration: 0.55, ease: 'back.out(1.5)' }, 4.55)
   .to(r.browL, { rotation: 8,  y: -3, duration: 0.45, ease: 'power2.out' }, 4.2)
   .to(r.browR, { rotation: -16, y: -1, duration: 0.45, ease: 'power2.out' }, 4.2);

  // Second blink (5.2)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.3, ease: 'power2.in' }, 5.2)
   .to([r.eyeL, r.eyeR], { scaleY: 0.65, duration: 0.45, ease: 'back.out(2)' }, 5.5);

  // ── PHASE 6: Return to REST (5.9→8.2) ──
  t.to([r.eyeL, r.eyeR], { scaleY: 1, y: 0, duration: 1.7, ease: 'sine.inOut' }, 5.9)
   .to(r.wrap,  { rotation: 0, y: 0, duration: 1.9, ease: 'sine.inOut' }, 5.9)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 6.0)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 6.0);
  t.to([r.browL, r.browR].filter(Boolean), { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 6.1);

  // ── PHASE 7: Breath (8.2→10.0) ──
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 8.2)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.9, ease: 'sine.inOut' }, 8.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 9.1)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 9.1);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. LISTENING — "incoming sound" behavior. Waves travel INWARD toward mascot
   from outside. Eyes open tall. Glow responds to sound intensity.
   ───────────────────────────────────────────────────────────────────────────── */

// Inward sound wave: appears at far edge, sweeps toward mascot, fades on arrival
function soundWave(
  t: gsap.core.Timeline,
  waveL: HTMLElement | null,
  waveR: HTMLElement | null,
  at: number,
  dur = 0.55
) {
  if (waveL) {
    gsap.set(waveL, { x: -38, opacity: 0, scaleX: 1.2 });
    t.to(waveL, { x: -6, opacity: 0.85, scaleX: 1, duration: dur * 0.55, ease: 'power2.out' }, at)
     .to(waveL, { x: 0, opacity: 0, scaleX: 0.7, duration: dur * 0.45, ease: 'power2.in' }, at + dur * 0.55);
  }
  if (waveR) {
    gsap.set(waveR, { x: 38, opacity: 0, scaleX: 1.2 });
    t.to(waveR, { x: 6, opacity: 0.85, scaleX: 1, duration: dur * 0.55, ease: 'power2.out' }, at)
     .to(waveR, { x: 0, opacity: 0, scaleX: 0.7, duration: dur * 0.45, ease: 'power2.in' }, at + dur * 0.55);
  }
}

/** A: Symmetric incoming sound waves, tall attentive eyes, glow responds. 7s cycle. */
export function faceListening_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes open attentively
  t.to([r.eyeL, r.eyeR], { scaleY: 1.28, duration: 0.32, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.12, opacity: 0.7, duration: 0.38, ease: 'power2.out' }, 0);

  // Sound wave burst ×3 — each wave travels inward and glow responds
  soundWave(t, r.waveL, r.waveR, 0.3, 0.6);
  t.to(r.glow, { scale: 1.2, opacity: 0.82, duration: 0.3, ease: 'power2.out' }, 0.42)
   .to(r.glow, { scale: 1.12, opacity: 0.7, duration: 0.38, ease: 'sine.inOut' }, 0.72);

  soundWave(t, r.waveL, r.waveR, 1.2, 0.6);
  t.to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.3, ease: 'power2.out' }, 1.32)
   .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.38, ease: 'sine.inOut' }, 1.62);

  soundWave(t, r.waveL, r.waveR, 2.1, 0.6);
  t.to(r.glow, { scale: 1.16, opacity: 0.75, duration: 0.3, ease: 'power2.out' }, 2.22)
   .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.4, ease: 'sine.inOut' }, 2.52);

  // Blink at 2.8 — eyes reopen extra tall
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.3, duration: 0.14, ease: 'back.out(2)' }, 2.87);

  // Hand — a subtle raise/hold as if listening attentively, gentle wave at 2nd wave
  handWave(t, r.hand, 1.2, 2, 0.45, 14, 0.28, 0.32);

  // Return to REST (3.2 → 7.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 3.2)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.3, ease: 'sine.inOut' }, 3.3);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.75, ease: 'sine.inOut' }, 5.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.75, ease: 'sine.inOut' }, 6.25);

  return t;
}

/** B: Mascot leans left — leaning in to hear, two waves from the left. 8s cycle. */
export function faceListening_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Lean left — eyes shift toward sound source, head tilts deeper
  t.to(r.wrap,           { rotation: -8, y: -3, duration: 0.5, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 1.25, x: -10, duration: 0.38, ease: 'back.out(2)' }, 0.1)
   .to(r.glow,            { scale: 1.14, opacity: 0.74, duration: 0.42, ease: 'power2.out' }, 0.06);

  // Waves sweep inward ×3 from both sides — stronger on left (sound source side)
  soundWave(t, r.waveL, r.waveR, 0.6, 0.6);
  t.to(r.waveL, { opacity: 0.95, duration: 0.18, ease: 'power3.in' }, 0.6);
  t.to(r.glow, { scale: 1.2, opacity: 0.82, duration: 0.3, ease: 'power2.out' }, 0.72)
   .to(r.glow, { scale: 1.14, opacity: 0.72, duration: 0.4, ease: 'sine.inOut' }, 1.02);

  soundWave(t, r.waveL, r.waveR, 1.5, 0.6);
  t.to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.32, ease: 'power2.out' }, 1.62)
   .to(r.glow, { scale: 1.12, opacity: 0.7, duration: 0.38, ease: 'sine.inOut' }, 1.94);

  // Breathing while leaned
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.5)

  // Blink at 2.5
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1.25, duration: 0.14, ease: 'back.out(2)' }, 2.57);

  soundWave(t, r.waveL, r.waveR, 2.9, 0.55);
  t.to(r.glow, { scale: 1.16, opacity: 0.76, duration: 0.28, ease: 'power2.out' }, 3.02)
   .to(r.glow, { scale: 1.12, opacity: 0.7, duration: 0.38, ease: 'sine.inOut' }, 3.3);

  // Return to REST (4.0 → 8.0)
  t.to(r.wrap,            { rotation: 0, y: 0, duration: 1.8, ease: 'sine.inOut' }, 4.0)
   .to([r.eyeL, r.eyeR],  { scaleY: 1, x: 0, duration: 1.6, ease: 'sine.inOut' }, 4.0)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 4.1);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 6.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.1);

  return t;
}

/** C: Mascot leans right — curious tilt, waves sweep from right. 7s cycle. */
export function faceListening_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Lean right — curious tilt
  t.to(r.wrap,           { rotation: 5, y: -2, duration: 0.48, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 1.22, x: 2, scaleX: 1.05, duration: 0.36, ease: 'back.out(2)' }, 0.1)
   .to(r.glow,            { scale: 1.12, opacity: 0.72, duration: 0.4, ease: 'power2.out' }, 0.06);

  // Waves sweep in ×2 — stronger on right side
  soundWave(t, r.waveL, r.waveR, 0.55, 0.6);
  t.to(r.waveR, { opacity: 0.95, duration: 0.18, ease: 'power3.in' }, 0.55);
  t.to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.3, ease: 'power2.out' }, 0.67)
   .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.4, ease: 'sine.inOut' }, 0.97);

  // Breathing
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.5);

  soundWave(t, r.waveL, r.waveR, 1.5, 0.6);
  t.to(r.glow, { scale: 1.16, opacity: 0.76, duration: 0.3, ease: 'power2.out' }, 1.62)
   .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.4, ease: 'sine.inOut' }, 1.92);

  // Blink at 2.3
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.3)
   .to([r.eyeL, r.eyeR], { scaleY: 1.22, duration: 0.14, ease: 'back.out(2)' }, 2.37);

  soundWave(t, r.waveL, r.waveR, 2.7, 0.6);
  t.to(r.glow, { scale: 1.14, opacity: 0.74, duration: 0.28, ease: 'power2.out' }, 2.82)
   .to(r.glow, { scale: 1.08, opacity: 0.65, duration: 0.4, ease: 'sine.inOut' }, 3.1);

  // Return to REST (3.6 → 7.0)
  t.to(r.wrap,            { rotation: 0, y: 0, duration: 1.6, ease: 'sine.inOut' }, 3.6)
   .to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, scaleX: 1, duration: 1.4, ease: 'sine.inOut' }, 3.6)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.4, ease: 'sine.inOut' }, 3.7);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.7, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'sine.inOut' }, 6.7);

  return t;
}

/** D: Ear-like glow shapes pulse out, then incoming waves — most visible version. 9s cycle. */
export function faceListening_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes open bright
  t.to([r.eyeL, r.eyeR], { scaleY: 1.2, duration: 0.32, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.12, opacity: 0.7, duration: 0.38, ease: 'power2.out' }, 0);

  // Waves appear on sides as "ear-like glow shapes" (scale large→visible, x stable)
  gsap.set([r.waveL, r.waveR], { x: 0, scaleX: 1, scaleY: 1.3, opacity: 0 });
  t.to([r.waveL, r.waveR], { opacity: 0.7, scaleY: 1.6, duration: 0.4, ease: 'back.out(2)' }, 0.3)
   .to([r.waveL, r.waveR], { scaleY: 1.1, opacity: 0.45, duration: 0.5, ease: 'sine.inOut' }, 0.7)
   .to([r.waveL, r.waveR], { scaleY: 1.5, opacity: 0.65, duration: 0.5, ease: 'sine.inOut' }, 1.2)
   .to([r.waveL, r.waveR], { scaleY: 1.1, opacity: 0.4, duration: 0.5, ease: 'sine.inOut' }, 1.7);

  // Glow pulses with ear shapes
  t.to(r.glow, { scale: 1.2, opacity: 0.82, duration: 0.42, ease: 'sine.inOut' }, 0.3)
   .to(r.glow, { scale: 1.1, opacity: 0.66, duration: 0.5, ease: 'sine.inOut' }, 0.72)
   .to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.5, ease: 'sine.inOut' }, 1.22)
   .to(r.glow, { scale: 1.08, opacity: 0.63, duration: 0.5, ease: 'sine.inOut' }, 1.72);

  // Incoming sound waves burst in ×2
  soundWave(t, r.waveL, r.waveR, 2.3, 0.6);
  t.to(r.glow, { scale: 1.22, opacity: 0.86, duration: 0.32, ease: 'power2.out' }, 2.42)
   .to(r.glow, { scale: 1.12, opacity: 0.7, duration: 0.42, ease: 'sine.inOut' }, 2.74);

  // Blink at 3.2
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.2)
   .to([r.eyeL, r.eyeR], { scaleY: 1.22, duration: 0.14, ease: 'back.out(2)' }, 3.27);

  soundWave(t, r.waveL, r.waveR, 3.6, 0.6);
  t.to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.3, ease: 'power2.out' }, 3.72)
   .to(r.glow, { scale: 1.1, opacity: 0.66, duration: 0.4, ease: 'sine.inOut' }, 4.02);

  // Waves + ear shapes fade
  t.to([r.waveL, r.waveR], { opacity: 0, scaleY: 1, duration: 0.6, ease: 'power2.in' }, 4.5);

  // Return to REST (5.0 → 9.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 5.0)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 5.1)
   .to(r.body,            { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 5.2);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 7.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 8.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. SPEAKING — phoneme-style mouth shapes animate through speech rhythm.
   Mouth shapes: A (tall oval), E (wide flat), O (round), U (pursed small).
   Each shape: open → hold → close. Mouth is always invisible at rest.
   ───────────────────────────────────────────────────────────────────────────── */

// Phoneme helpers — shape the mouth element into different vowel shapes
// Mouth base CSS: width 28px height 14px oval. scaleX widens, scaleY tallens.
type PhonemeShape = { sX: number; sY: number };
const PH: Record<string, PhonemeShape> = {
  A: { sX: 0.9, sY: 1.4 },   // tall open oval — "aah"
  E: { sX: 1.5, sY: 0.6 },   // wide flat — "eeh"
  O: { sX: 1.0, sY: 1.0 },   // round neutral — "oh"
  U: { sX: 0.65, sY: 0.8 },  // pursed small — "ooh"
  S: { sX: 1.1, sY: 0.9 },   // smile-talk — "mm/smile"
};

function phoneme(
  t: gsap.core.Timeline,
  mouth: HTMLElement | null,
  body: HTMLElement | null,
  glow: HTMLElement | null,
  at: number,
  shape: PhonemeShape,
  holdDur = 0.12
) {
  const open = 0.08, close = 0.14;
  if (mouth) {
    t.to(mouth, { opacity: 0.82, scaleX: shape.sX, scaleY: shape.sY, duration: open, ease: 'power2.out' }, at)
     .to(mouth, { opacity: 0, scaleX: shape.sX * 0.55, scaleY: 0.4, duration: close, ease: 'power2.in' }, at + open + holdDur);
  }
  if (body) {
    t.to(body, { scaleX: 1.03, scaleY: 0.98, duration: open, ease: 'power2.in' }, at)
     .to(body, { scaleX: 1, scaleY: 1, duration: 0.18, ease: 'back.out(1.5)' }, at + open);
  }
  if (glow) {
    t.to(glow, { scale: 1.12, opacity: 0.72, duration: open, ease: 'power2.out' }, at)
     .to(glow, { scale: 1.04, opacity: 0.6, duration: 0.22, ease: 'sine.inOut' }, at + open);
  }
}

/** A: Calm speech — A/O/E phoneme pattern, small mouth shapes. 6s cycle. */
export function faceSpeaking_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Sentence 1: A–O–E
  phoneme(t, r.mouth, r.body, r.glow, 0.0,  PH.A);
  phoneme(t, r.mouth, r.body, r.glow, 0.46, PH.O);
  phoneme(t, r.mouth, r.body, r.glow, 0.92, PH.E);

  // Pause (breath)
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.36, ease: 'sine.inOut' }, 1.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.36, ease: 'sine.inOut' }, 1.86);

  // Sentence 2: O–A–U
  phoneme(t, r.mouth, r.body, r.glow, 2.1, PH.O);
  phoneme(t, r.mouth, r.body, r.glow, 2.58, PH.A);
  phoneme(t, r.mouth, r.body, r.glow, 3.06, PH.U);

  // Mouth closes fully
  t.to(r.mouth, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 3.45);

  // Blink at 1.3
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.3)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 1.37);

  // Return to REST (3.7 → 6.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.1, ease: 'sine.inOut' }, 3.7);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.8, ease: 'sine.inOut' }, 5.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 6.0);

  return t;
}

/** B: Expressive speech — wider mouth shapes, eye engagement, blinks. 7s cycle. */
export function faceSpeaking_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Sentence 1: wide shapes
  phoneme(t, r.mouth, r.body, r.glow, 0.0,  PH.E, 0.16);
  phoneme(t, r.mouth, r.body, r.glow, 0.5,  PH.A, 0.14);
  phoneme(t, r.mouth, r.body, r.glow, 1.0,  PH.O, 0.12);

  // Blink between sentences
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.6)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 1.67);

  // Eyes shift right (looking at listener), sentence 2
  t.to([r.eyeL, r.eyeR], { x: 3, duration: 0.18, ease: 'power2.out' }, 1.75);
  phoneme(t, r.mouth, r.body, r.glow, 1.85, PH.A, 0.15);
  phoneme(t, r.mouth, r.body, r.glow, 2.38, PH.E, 0.1);

  // Blink, return eyes
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.95)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 3.02)
   .to([r.eyeL, r.eyeR], { x: 0, duration: 0.28, ease: 'back.out(1.5)' }, 3.05);

  // Sentence 3
  phoneme(t, r.mouth, r.body, r.glow, 3.3, PH.O, 0.14);
  phoneme(t, r.mouth, r.body, r.glow, 3.78, PH.U, 0.12);

  t.to(r.mouth, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 4.15);

  // Return to REST (4.4 → 7.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 4.4);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.95, ease: 'sine.inOut' }, 5.05)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.95, ease: 'sine.inOut' }, 6.0);

  return t;
}

/** C: Quick response — fast phoneme timing, eyes track listener, alert. 6.5s cycle. */
export function faceSpeaking_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Fast pace — shorter gaps between phonemes
  phoneme(t, r.mouth, r.body, r.glow, 0.0,  PH.E, 0.08);
  phoneme(t, r.mouth, r.body, r.glow, 0.36, PH.A, 0.1);
  phoneme(t, r.mouth, r.body, r.glow, 0.72, PH.O, 0.08);
  phoneme(t, r.mouth, r.body, r.glow, 1.08, PH.E, 0.09);

  // Eyes look right while speaking
  t.to([r.eyeL, r.eyeR], { x: 4, duration: 0.2, ease: 'power2.out' }, 0.06);

  // Blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 1.57)
   .to([r.eyeL, r.eyeR], { x: 0, duration: 0.28, ease: 'back.out(1.5)' }, 1.6);

  // Second burst
  phoneme(t, r.mouth, r.body, r.glow, 1.9, PH.A, 0.1);
  phoneme(t, r.mouth, r.body, r.glow, 2.28, PH.U, 0.09);
  phoneme(t, r.mouth, r.body, r.glow, 2.64, PH.O, 0.08);

  t.to([r.eyeL, r.eyeR], { x: -3, duration: 0.18, ease: 'power2.out' }, 1.95);
  t.to([r.eyeL, r.eyeR], { x: 0, duration: 0.3, ease: 'back.out(1.5)' }, 3.0);

  t.to(r.mouth, { opacity: 0, duration: 0.22, ease: 'power2.in' }, 3.1);

  // Return to REST (3.4 → 6.5)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 3.4);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.9, ease: 'sine.inOut' }, 4.7)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 5.6);

  return t;
}

/** D: Friendly speech with smile-talk — warm body sway, S phoneme shapes. 7.5s cycle. */
export function faceSpeaking_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Sway layer — conversational warmth
  t.to(r.wrap, { rotation: -1.8, y: -1, duration: 1.8, ease: 'sine.inOut' }, 0)
   .to(r.wrap, { rotation:  1.8, y: -1, duration: 3.6, ease: 'sine.inOut' }, 1.8)
   .to(r.wrap, { rotation:  0,   y:  0, duration: 1.8, ease: 'sine.inOut' }, 5.4);

  // Mix smile-talk with open phonemes
  phoneme(t, r.mouth, r.body, r.glow, 0.0,  PH.S, 0.15);
  phoneme(t, r.mouth, r.body, r.glow, 0.52, PH.A, 0.12);
  phoneme(t, r.mouth, r.body, r.glow, 1.04, PH.S, 0.14);

  // Blink at 1.7
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.7)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.1, ease: 'power2.out' }, 1.77);

  phoneme(t, r.mouth, r.body, r.glow, 1.95, PH.O, 0.13);
  phoneme(t, r.mouth, r.body, r.glow, 2.48, PH.S, 0.15);
  phoneme(t, r.mouth, r.body, r.glow, 3.0,  PH.A, 0.12);

  t.to(r.mouth, { opacity: 0, duration: 0.28, ease: 'power2.in' }, 3.45);

  // Return to REST (3.7 → 7.5)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.4, ease: 'sine.inOut' }, 3.7)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.2, ease: 'sine.inOut' }, 3.7);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 5.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 6.5);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. SEARCHING — active scan, distinct from Thinking.
   Eyes move deliberately; body has a subtle turn energy.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Magnifying glass sweeps L→R, eyes follow, body leans into scan. 8s cycle. */
export function faceSearching_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes settle into scan mode
  t.to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.25, ease: 'power2.out' }, 0)
   .to(r.glow,            { scale: 0.94, opacity: 0.48, duration: 0.35, ease: 'power2.in' }, 0);

  // Magnifying glass appears left side
  t.set(r.magGlass, { x: -55, y: 10, rotation: -15, opacity: 0 }, 0.3)
   .to(r.magGlass,  { opacity: 0.9, duration: 0.28, ease: 'back.out(2)' }, 0.3);

  // Glass sweeps RIGHT — eyes dart ahead of glass (lead then settle)
  t.to(r.magGlass, { x: 55, y: -5, rotation: 15, duration: 0.65, ease: 'power2.inOut' }, 0.6)
   .to([r.eyeL, r.eyeR], { x: 22, scaleY: 0.8, duration: 0.3, ease: 'power3.out' }, 0.62)
   .to(r.wrap,            { rotation: 7, duration: 0.42, ease: 'sine.inOut' }, 0.65);

  // Glow flicker — something found?
  t.to(r.glow, { scale: 1.12, opacity: 0.65, duration: 0.25, ease: 'power2.out' }, 1.2)
   .to(r.glow, { scale: 0.94, opacity: 0.48, duration: 0.25, ease: 'sine.inOut' }, 1.45);

  // Glass sweeps back LEFT — eyes dart ahead of return, head follows
  t.to(r.magGlass, { x: -40, y: 8, rotation: -10, duration: 0.58, ease: 'power2.inOut' }, 1.5)
   .to([r.eyeL, r.eyeR], { x: -18, scaleY: 0.8, duration: 0.38, ease: 'power2.inOut' }, 1.52)
   .to(r.wrap,            { rotation: -6, duration: 0.5, ease: 'sine.inOut' }, 1.55);

  // Centre — settled on spot
  t.to(r.magGlass, { x: 0, y: 5, rotation: 0, duration: 0.42, ease: 'back.out(1.5)' }, 2.1)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 0.9, duration: 0.38, ease: 'back.out(1.5)' }, 2.15)
   .to(r.wrap,            { rotation: 0, duration: 0.42, ease: 'sine.inOut' }, 2.15);

  // Glow acknowledgement
  t.to(r.glow, { scale: 1.1, opacity: 0.64, duration: 0.4, ease: 'power2.out' }, 2.55)
   .to(r.glow, { scale: 0.94, opacity: 0.48, duration: 0.4, ease: 'sine.inOut' }, 2.95);

  // Blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.4)
   .to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.12, ease: 'power2.out' }, 3.47);

  // Glass fades
  t.to(r.magGlass, { opacity: 0, y: 15, duration: 0.5, ease: 'power2.in' }, 3.6);

  // Return to REST (3.8 → 7.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.8, ease: 'sine.inOut' }, 3.8)
   .to(r.wrap,            { rotation: 0, duration: 1.6, ease: 'sine.inOut' }, 3.8)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.6, ease: 'sine.inOut' }, 3.9);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 6.1)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** B: Glass sweeps up-arc pattern, eyes follow diagonal, settle. 7s cycle. */
export function faceSearching_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  t.to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.22, ease: 'power2.out' }, 0)
   .to(r.glow,            { scale: 0.96, opacity: 0.5, duration: 0.3, ease: 'power2.in' }, 0);

  // Glass appears bottom-centre, rises up-right
  t.set(r.magGlass, { x: 0, y: 30, rotation: 0, opacity: 0 }, 0.3)
   .to(r.magGlass,  { opacity: 0.85, duration: 0.25, ease: 'back.out(2)' }, 0.3);

  t.to(r.magGlass, { x: 30, y: -20, rotation: 20, duration: 0.55, ease: 'power2.out' }, 0.55)
   .to([r.eyeL, r.eyeR], { y: -14, x: 16, scaleY: 0.75, duration: 0.3, ease: 'power3.out' }, 0.58)
   .to(r.wrap,            { y: -4, rotation: 5, duration: 0.38, ease: 'sine.inOut' }, 0.6);

  // Glass sweeps down-left — eyes lead the diagonal
  t.to(r.magGlass, { x: -25, y: 15, rotation: -15, duration: 0.55, ease: 'power1.inOut' }, 1.15)
   .to([r.eyeL, r.eyeR], { y: 8, x: -16, scaleY: 0.82, duration: 0.38, ease: 'power2.inOut' }, 1.18)
   .to(r.wrap,            { y: 3, rotation: -4, duration: 0.5, ease: 'sine.inOut' }, 1.2);

  // Return centre — found something
  t.to(r.magGlass, { x: 0, y: 5, rotation: 0, duration: 0.4, ease: 'back.out(1.5)' }, 1.75)
   .to([r.eyeL, r.eyeR], { y: 0, x: 0, scaleY: 0.9, duration: 0.38, ease: 'back.out(1.5)' }, 1.8)
   .to(r.wrap,            { y: 0, rotation: 0, duration: 0.4, ease: 'sine.inOut' }, 1.8);

  t.to(r.glow, { scale: 1.1, opacity: 0.66, duration: 0.38, ease: 'power2.out' }, 2.2)
   .to(r.glow, { scale: 0.96, opacity: 0.5, duration: 0.38, ease: 'sine.inOut' }, 2.58);

  // Blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.9)
   .to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.12, ease: 'power2.out' }, 2.97);

  // Glass fades
  t.to(r.magGlass, { opacity: 0, y: 20, duration: 0.45, ease: 'power2.in' }, 3.1);

  // Return to REST (3.3 → 6.2)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, y: 0, x: 0, duration: 1.6, ease: 'sine.inOut' }, 3.3)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 3.4)
   .to(r.body,            { scaleX: 1, scaleY: 1, duration: 1.2, ease: 'sine.inOut' }, 3.5);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.85, ease: 'sine.inOut' }, 5.35)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.85, ease: 'sine.inOut' }, 6.2);

  return t;
}

/** C: Glass held out while body rotates — deliberate full-body scan. 7.5s cycle. */
export function faceSearching_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Glass appears, body rotates right — eyes lag (resistance)
  t.set(r.magGlass, { x: 30, y: 0, rotation: 20, opacity: 0 }, 0)
   .to(r.magGlass,  { opacity: 0.85, duration: 0.3, ease: 'power2.out' }, 0.1)
   .to(r.wrap,            { rotation: 8, duration: 0.65, ease: 'power2.out' }, 0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.86, x: -5, duration: 0.45, ease: 'power2.out' }, 0.14)
   .to(r.glow,            { scale: 0.92, opacity: 0.45, duration: 0.6, ease: 'power2.in' }, 0);

  // Glow sweep right
  t.to(r.glow, { scale: 1.16, opacity: 0.72, duration: 0.45, ease: 'power2.out' }, 0.7)
   .to(r.glow, { scale: 0.9, opacity: 0.44, duration: 0.5, ease: 'sine.inOut' }, 1.15);

  // Rotate left, glass swings left, eyes lag right
  t.to(r.wrap,    { rotation: -6, duration: 1.15, ease: 'sine.inOut' }, 1.0)
   .to(r.magGlass,{ x: -32, rotation: -20, duration: 1.0, ease: 'sine.inOut' }, 1.05)
   .to([r.eyeL, r.eyeR], { x: 5, duration: 0.9, ease: 'power1.inOut' }, 1.1);

  // Second glow sweep
  t.to(r.glow, { scale: 1.14, opacity: 0.7, duration: 0.4, ease: 'power2.out' }, 1.85)
   .to(r.glow, { scale: 0.92, opacity: 0.45, duration: 0.42, ease: 'sine.inOut' }, 2.25);

  // Centre — glass settles forward
  t.to(r.wrap,    { rotation: 0, duration: 0.55, ease: 'back.out(1.5)' }, 2.25)
   .to(r.magGlass,{ x: 0, y: 5, rotation: 0, duration: 0.5, ease: 'back.out(1.5)' }, 2.28)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 0.9, duration: 0.45, ease: 'back.out(1.5)' }, 2.32);

  // Blink — eyes look through glass
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.95)
   .to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.12, ease: 'power2.out' }, 3.02);

  // Glass fades out
  t.to(r.magGlass, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.in' }, 3.2);

  // Return to REST (3.4 → 6.5)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.8, ease: 'sine.inOut' }, 3.4)
   .to(r.wrap,            { rotation: 0, duration: 1.6, ease: 'sine.inOut' }, 3.4)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 3.5);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 5.6)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 6.5);

  return t;
}

/** D: Glass flicks right, blink, flicks left, settles — precise targeted scan. 7s cycle. */
export function faceSearching_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  t.to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.22, ease: 'power2.out' }, 0)
   .to(r.glow,            { scale: 0.95, opacity: 0.5, duration: 0.3, ease: 'power2.in' }, 0);

  // Glass appears centre
  t.set(r.magGlass, { x: 0, y: 5, rotation: 0, opacity: 0 }, 0.2)
   .to(r.magGlass,  { opacity: 0.8, duration: 0.25, ease: 'back.out(2)' }, 0.2);

  // Flick right — glass and eyes together
  t.to(r.magGlass, { x: 48, y: -3, rotation: 18, duration: 0.25, ease: 'power3.out' }, 0.5)
   .to([r.eyeL, r.eyeR], { x: 12, scaleY: 0.8, duration: 0.26, ease: 'power3.out' }, 0.5)
   .to(r.wrap,            { rotation: 2.5, duration: 0.3, ease: 'sine.inOut' }, 0.5);

  // Blink at right
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 0.78)
   .to([r.eyeL, r.eyeR], { scaleY: 0.8, duration: 0.12, ease: 'power2.out' }, 0.85);

  // Return centre
  t.to(r.magGlass, { x: 0, y: 5, rotation: 0, duration: 0.3, ease: 'back.out(1.5)' }, 0.97)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 0.88, duration: 0.3, ease: 'back.out(1.5)' }, 0.97)
   .to(r.wrap,            { rotation: 0, duration: 0.35, ease: 'sine.inOut' }, 0.97);

  // Glow pulse — considering
  t.to(r.glow, { scale: 1.1, opacity: 0.65, duration: 0.32, ease: 'power2.out' }, 1.4)
   .to(r.glow, { scale: 0.95, opacity: 0.5, duration: 0.35, ease: 'sine.inOut' }, 1.72);

  // Flick left — glass and eyes
  t.to(r.magGlass, { x: -50, y: -2, rotation: -18, duration: 0.25, ease: 'power3.out' }, 2.1)
   .to([r.eyeL, r.eyeR], { x: -12, scaleY: 0.8, duration: 0.26, ease: 'power3.out' }, 2.1)
   .to(r.wrap,            { rotation: -2.5, duration: 0.3, ease: 'sine.inOut' }, 2.1);

  // Blink at left
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.38)
   .to([r.eyeL, r.eyeR], { scaleY: 0.8, duration: 0.12, ease: 'power2.out' }, 2.45);

  // Return centre — lock on
  t.to(r.magGlass, { x: 0, y: 5, rotation: 0, duration: 0.35, ease: 'back.out(1.5)' }, 2.65)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 0.9, duration: 0.35, ease: 'back.out(1.5)' }, 2.65)
   .to(r.wrap,            { rotation: 0, duration: 0.38, ease: 'sine.inOut' }, 2.65);

  // Glass fades
  t.to(r.magGlass, { opacity: 0, y: 20, duration: 0.45, ease: 'power2.in' }, 3.1);

  // Return to REST (3.2 → 6.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.6, ease: 'sine.inOut' }, 3.2)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 3.3);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.9, ease: 'sine.inOut' }, 5.1)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 6.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. PROCESSING — calm, steady work. Glow pulses; eyes still.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Scanning ring pulses outward while glow breathes — intelligent processing. 7s cycle. */
export function faceProcessing_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes settle focused, ring fades in
  t.to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.4, ease: 'power2.out' }, 0)
   .to(r.scanRing,        { opacity: 0.6, scale: 0.85, duration: 0.6, ease: 'power2.out' }, 0.2);

  // Ring pulses outward (like data ripple) ×3
  t.to(r.scanRing, { scale: 1.0, opacity: 0.75, duration: 0.9, ease: 'power2.out' }, 0.8)
   .to(r.scanRing, { scale: 0.88, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 1.7)
   .to(r.scanRing, { scale: 1.05, opacity: 0.8, duration: 1.0, ease: 'power2.out' }, 2.6)
   .to(r.scanRing, { scale: 0.86, opacity: 0.5, duration: 1.0, ease: 'sine.inOut' }, 3.6);

  // Glow breathes with ring
  t.to(r.glow, { scale: 1.16, opacity: 0.72, duration: 1.0, ease: 'sine.inOut' }, 0.8)
   .to(r.glow, { scale: 0.94, opacity: 0.44, duration: 1.0, ease: 'sine.inOut' }, 1.8)
   .to(r.glow, { scale: 1.14, opacity: 0.7, duration: 1.0, ease: 'sine.inOut' }, 2.8)
   .to(r.glow, { scale: 0.94, opacity: 0.44, duration: 1.0, ease: 'sine.inOut' }, 3.8);

  // Blink at 3.0
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.0)
   .to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.12, ease: 'power2.out' }, 3.07);

  // Ring fades before REST
  t.to(r.scanRing, { opacity: 0, scale: 1.15, duration: 0.8, ease: 'power2.in' }, 4.8);

  // Return to REST (5.0 → 7.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 5.0)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 5.0);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.75, ease: 'sine.inOut' }, 6.25)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.75, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** B: Eyes transform into 3 loading dots → staggered blink → return to eyes. 8s cycle. */
export function faceProcessing_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Dim slightly before transition
  t.to(r.glow, { scale: 0.92, opacity: 0.4, duration: 0.5, ease: 'power2.in' }, 0);

  // Eyes compress into tiny dots — left eye first, right eye, then center scanRing dot
  t.to(r.eyeL, { scaleX: 0.35, scaleY: 0.18, duration: 0.3, ease: 'power2.inOut' }, 0.4)
   .to(r.eyeR, { scaleX: 0.35, scaleY: 0.18, duration: 0.3, ease: 'power2.inOut' }, 0.55);

  // Scan ring appears as center dot (small scale)
  t.to(r.scanRing, { opacity: 0.8, scale: 0.22, duration: 0.3, ease: 'back.out(2)' }, 0.7);

  // Staggered dot pulse — classic loading pattern (L → Center → R → L…)
  const dotPulse = (at: number) => {
    t.to(r.eyeL,     { scaleY: 0.28, scaleX: 0.42, duration: 0.18, ease: 'power2.out' }, at)
     .to(r.eyeL,     { scaleY: 0.18, scaleX: 0.35, duration: 0.2, ease: 'power2.in' }, at + 0.18)
     .to(r.scanRing, { scale: 0.30, opacity: 1, duration: 0.18, ease: 'power2.out' }, at + 0.22)
     .to(r.scanRing, { scale: 0.22, opacity: 0.7, duration: 0.2, ease: 'power2.in' }, at + 0.4)
     .to(r.eyeR,     { scaleY: 0.28, scaleX: 0.42, duration: 0.18, ease: 'power2.out' }, at + 0.44)
     .to(r.eyeR,     { scaleY: 0.18, scaleX: 0.35, duration: 0.2, ease: 'power2.in' }, at + 0.62);
  };
  dotPulse(1.0);
  dotPulse(1.9);
  dotPulse(2.8);

  // Glow slowly breathes during loading
  t.to(r.glow, { scale: 1.05, opacity: 0.58, duration: 1.8, ease: 'sine.inOut' }, 0.8)
   .to(r.glow, { scale: 0.9, opacity: 0.4, duration: 1.8, ease: 'sine.inOut' }, 2.6);

  // Dots transform back to eyes
  t.to(r.scanRing, { opacity: 0, scale: 0.15, duration: 0.35, ease: 'power2.in' }, 4.0)
   .to(r.eyeL,     { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'back.out(2)' }, 4.1)
   .to(r.eyeR,     { scaleX: 1, scaleY: 1, duration: 0.45, ease: 'back.out(2)' }, 4.22);

  // Return to REST (4.8 → 8.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 4.8);
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.0, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** C: Eyes spin like loading indicators — rotation while narrowed, then return. 6.5s cycle. */
export function faceProcessing_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes narrow, glow dims
  t.to([r.eyeL, r.eyeR], { scaleY: 0.55, duration: 0.4, ease: 'power2.out' }, 0)
   .to(r.glow,            { scale: 0.92, opacity: 0.42, duration: 0.5, ease: 'power2.in' }, 0);

  // Eyes rotate slowly (spinner feel) — left clockwise, right counter
  t.to(r.eyeL, { rotation: 180, duration: 1.4, ease: 'none' }, 0.5)
   .to(r.eyeL, { rotation: 360, duration: 1.4, ease: 'none' }, 1.9)
   .to(r.eyeR, { rotation: -180, duration: 1.4, ease: 'none' }, 0.5)
   .to(r.eyeR, { rotation: -360, duration: 1.4, ease: 'none' }, 1.9);

  // Glow pulses with rotation cycle
  t.to(r.glow, { scale: 1.1, opacity: 0.66, duration: 0.7, ease: 'sine.inOut' }, 0.5)
   .to(r.glow, { scale: 0.92, opacity: 0.42, duration: 0.7, ease: 'sine.inOut' }, 1.2)
   .to(r.glow, { scale: 1.08, opacity: 0.62, duration: 0.7, ease: 'sine.inOut' }, 1.9)
   .to(r.glow, { scale: 0.94, opacity: 0.45, duration: 0.7, ease: 'sine.inOut' }, 2.6);

  // Brief hold, then snap back to normal eyes
  t.to([r.eyeL, r.eyeR], { scaleY: 0.55, rotation: 0, duration: 0.22, ease: 'power3.in' }, 3.4)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.3, ease: 'back.out(2)' }, 3.62);

  // Return to REST (4.0 → 6.5)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 4.0);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.8, ease: 'sine.inOut' }, 5.7)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 6.5);

  return t;
}

/** D: Scanning light — bright glow stripe sweeps across eyes and body, then settles. 7s cycle. */
export function faceProcessing_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes slightly narrowed — focused
  t.to([r.eyeL, r.eyeR], { scaleY: 0.82, duration: 0.35, ease: 'power2.out' }, 0)
   .to(r.glow,            { scale: 0.9, opacity: 0.38, duration: 0.45, ease: 'power2.in' }, 0);

  // Scanning light: glow sweeps from left edge → right edge (represented as scaleX stretch + x shift)
  // This simulates a scan line across the face
  t.to(r.glow, { scaleX: 1.6, scaleY: 0.5, x: -40, opacity: 0.6, duration: 0.08, ease: 'none' }, 0.55)
   .to(r.glow, { x: 40, duration: 0.55, ease: 'none' }, 0.63)
   .to(r.glow, { scaleX: 1, scaleY: 1, x: 0, opacity: 0.88, duration: 0.25, ease: 'power2.out' }, 1.18);

  // Eye brightens as scan passes
  t.to([r.eyeL, r.eyeR], { scaleY: 1.1, opacity: 1, duration: 0.18, ease: 'power2.out' }, 0.9)
   .to([r.eyeL, r.eyeR], { scaleY: 0.82, opacity: 0.9, duration: 0.25, ease: 'sine.inOut' }, 1.1);

  // Second scan pass (slower)
  t.to(r.glow, { scaleX: 1.5, scaleY: 0.55, x: -35, opacity: 0.55, duration: 0.08, ease: 'none' }, 2.0)
   .to(r.glow, { x: 35, duration: 0.7, ease: 'none' }, 2.08)
   .to(r.glow, { scaleX: 1, scaleY: 1, x: 0, opacity: 0.82, duration: 0.25, ease: 'power2.out' }, 2.78);

  t.to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.18, ease: 'power2.out' }, 2.5)
   .to([r.eyeL, r.eyeR], { scaleY: 0.85, duration: 0.22, ease: 'sine.inOut' }, 2.7);

  // Blink — "scan complete"
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.09, ease: 'power3.in' }, 3.3)
   .to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.14, ease: 'power2.out' }, 3.39);

  // Glow settles to resting brightness
  t.to(r.glow, { scale: 1.06, opacity: 0.65, duration: 0.5, ease: 'sine.inOut' }, 3.6)
   .to(r.glow, { scale: 0.98, opacity: 0.55, duration: 0.5, ease: 'sine.inOut' }, 4.1);

  // Return to REST (4.4 → 7.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.4, ease: 'sine.inOut' }, 4.4)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 4.5);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.9, ease: 'sine.inOut' }, 6.1)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. WAITING — attentive calm. Almost idle but more present.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Alert calm breathing + double blink — clearly alive, not idle. 8s cycle. */
/** A: Long slow blink (weighted patience) + double-blink recovery + gentle sway. 9s cycle. */
export function faceWaiting_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Alert eyes, slight glow up
  t.to([r.eyeL, r.eyeR], { scaleY: 1.1, duration: 0.35, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.07, opacity: 0.63, duration: 0.4, ease: 'power2.out' }, 0);

  // Breathe
  t.to(r.body, { scaleX: 1.022, scaleY: 1.028, duration: 2.0, ease: 'sine.inOut' }, 0.4)
   .to(r.glow, { scale: 1.11, opacity: 0.67, duration: 2.0, ease: 'sine.inOut' }, 0.4)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 2.4)
   .to(r.glow, { scale: 1.07, opacity: 0.63, duration: 2.0, ease: 'sine.inOut' }, 2.4);

  // Slow weighted blink — eyes close over 0.28s (heavier than idle), open over 0.4s
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.28, ease: 'power2.in' }, 3.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1.1, duration: 0.4, ease: 'back.out(1.8)' }, 3.28);

  // After blink — tiny side sway (patient body language)
  t.to(r.wrap, { rotation: -1.8, y: -1, duration: 1.6, ease: 'sine.inOut' }, 3.9)
   .to(r.wrap, { rotation: 1.8, y: -1, duration: 3.0, ease: 'sine.inOut' }, 5.5)
   .to(r.wrap, { rotation: 0, y: 0, duration: 1.5, ease: 'sine.inOut' }, 7.5);

  // Impatient "hurry up" hand wave mid-sway
  handWave(t, r.hand, 4.8, 3, 0.32, 18, 0.22, 0.26);

  // Double blink mid-sway — "still checking"
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.2)
   .to([r.eyeL, r.eyeR], { scaleY: 1.1, duration: 0.1, ease: 'power2.out' }, 5.27)
   .to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1.1, duration: 0.12, ease: 'back.out(2)' }, 5.57);

  // Return to REST (7.5 → 9.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 1.3, ease: 'sine.inOut' }, 7.7)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 7.8)
   .to(r.body,            { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 8.2);

  return t;
}

/** B: Look left → look right → front — environmental scan while waiting. 9s cycle. */
export function faceWaiting_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  t.to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.3, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.06, opacity: 0.61, duration: 0.34, ease: 'power2.out' }, 0);

  // Breathe
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.8, ease: 'sine.inOut' }, 0.4)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.8, ease: 'sine.inOut' }, 2.2);

  // Look LEFT — eyes dart first, head follows (wider Rive-level travel)
  t.to([r.eyeL, r.eyeR],  { x: -22, scaleY: 0.93, duration: 0.2, ease: 'power3.out' }, 1.8)
   .to(r.wrap,             { rotation: -8, duration: 0.38, ease: 'power2.out' }, 1.82);

  // Hold looking left
  t.to([r.eyeL, r.eyeR], { scaleY: 1.04, duration: 0.4, ease: 'sine.inOut' }, 2.2);

  // Blink while looking left
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.9)
   .to([r.eyeL, r.eyeR], { scaleY: 1.04, duration: 0.12, ease: 'back.out(2)' }, 2.97);

  // Look RIGHT — eyes dart across, head catches up
  t.to([r.eyeL, r.eyeR],  { x: 22, scaleY: 0.93, duration: 0.32, ease: 'power2.out' }, 3.5)
   .to(r.wrap,             { rotation: 8, duration: 0.55, ease: 'sine.inOut' }, 3.55);

  // Hold looking right
  t.to([r.eyeL, r.eyeR], { scaleY: 1.06, duration: 0.4, ease: 'sine.inOut' }, 4.1);

  // Blink while looking right
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 4.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.06, duration: 0.12, ease: 'back.out(2)' }, 4.87);

  // Return to front — settle
  t.to(r.wrap,            { rotation: 0, duration: 0.55, ease: 'sine.inOut' }, 5.5)
   .to([r.eyeL, r.eyeR],  { x: 0, scaleY: 1.08, duration: 0.45, ease: 'back.out(1.5)' }, 5.55);

  // Breathe after scan
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.5, ease: 'sine.inOut' }, 6.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 8.0);

  // Return to REST (8.0 → 9.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 8.1)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 8.1);

  return t;
}

/** C: Eye stretch spike + squish + impatient tiny bounce — fidgety energy. 8s cycle. */
export function faceWaiting_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  t.to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.28, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.06, opacity: 0.61, duration: 0.32, ease: 'power2.out' }, 0);

  // Breathe
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3);

  // Blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 1.7)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.12, ease: 'back.out(2)' }, 1.77);

  // Eye STRETCH spike — impatient curiosity (tall eyes → squish → recover)
  t.to([r.eyeL, r.eyeR], { scaleY: 1.35, duration: 0.14, ease: 'back.out(3)' }, 2.4)
   .to([r.eyeL, r.eyeR], { scaleY: 0.85, duration: 0.16, ease: 'power2.in' }, 2.54)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.22, ease: 'back.out(2)' }, 2.7);

  // Glance left — eyes dart far, head follows
  t.to([r.eyeL, r.eyeR], { x: -20, scaleY: 0.9, duration: 0.16, ease: 'power3.out' }, 3.2)
   .to(r.wrap,            { rotation: -6, duration: 0.22, ease: 'sine.inOut' }, 3.22)
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1.08, duration: 0.35, ease: 'back.out(1.5)' }, 3.55)
   .to(r.wrap,            { rotation: 0, duration: 0.38, ease: 'sine.inOut' }, 3.55);

  // Impatient tiny bounce — 2 mini hops
  t.to(r.wrap, { y: -5, duration: 0.18, ease: 'power2.out' }, 4.5)
   .to(r.wrap, { y: 0, duration: 0.22, ease: 'bounce.out' }, 4.68)
   .to(r.wrap, { y: -3, duration: 0.14, ease: 'power2.out' }, 5.0)
   .to(r.wrap, { y: 0, duration: 0.2, ease: 'bounce.out' }, 5.14);

  // Body squish on each landing
  t.to(r.body, { scaleX: 1.05, scaleY: 0.95, duration: 0.12, ease: 'power2.out' }, 4.68)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.22, ease: 'back.out(1.5)' }, 4.8)
   .to(r.body, { scaleX: 1.04, scaleY: 0.97, duration: 0.1, ease: 'power2.out' }, 5.14)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.2, ease: 'back.out(1.5)' }, 5.24);

  // Blink after bounce (recovered)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1.08, duration: 0.12, ease: 'back.out(2)' }, 5.87);

  // Return to REST (6.5 → 8.0)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, duration: 1.4, ease: 'sine.inOut' }, 6.6)
   .to(r.glow,            { scale: 1, opacity: 0.55, duration: 1.3, ease: 'sine.inOut' }, 6.7)
   .to(r.body,            { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** D: Awkward glance up + micro body shift + deflate exhale — subtle discomfort of waiting. 10s cycle. */
export function faceWaiting_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  t.to([r.eyeL, r.eyeR], { scaleY: 1.06, duration: 0.3, ease: 'back.out(2)' }, 0)
   .to(r.glow,            { scale: 1.06, opacity: 0.6, duration: 0.34, ease: 'power2.out' }, 0);

  // Sway left — settling in
  t.to(r.wrap, { rotation: -2.2, y: -1, duration: 2.4, ease: 'sine.inOut' }, 0.3)
   .to([r.eyeL, r.eyeR], { x: -1.5, duration: 2.4, ease: 'sine.inOut' }, 0.3);

  // Breathe during sway
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3)
   .to(r.glow, { scale: 1.09, opacity: 0.64, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.3);

  // Glance UP — wide Rive-level vertical travel, head tilts back
  t.to([r.eyeL, r.eyeR], { y: -14, scaleY: 0.85, duration: 0.2, ease: 'power3.out' }, 2.8)
   .to(r.wrap,            { y: -6, rotation: -4, duration: 0.28, ease: 'power2.out' }, 2.8);

  // Hold glance up — brief
  t.to([r.eyeL, r.eyeR], { y: -12, scaleY: 0.92, duration: 0.4, ease: 'sine.inOut' }, 3.1);

  // Eyes come back down — snap with overshoot
  t.to([r.eyeL, r.eyeR], { y: 0, scaleY: 1.06, duration: 0.38, ease: 'back.out(1.5)' }, 3.7)
   .to(r.wrap,            { y: 0, rotation: 0, duration: 0.45, ease: 'sine.inOut' }, 3.7);

  // Sway right
  t.to(r.wrap,            { rotation: 2.2, y: -1, duration: 4.4, ease: 'sine.inOut' }, 4.5)
   .to([r.eyeL, r.eyeR],  { x: 1.5, duration: 4.4, ease: 'sine.inOut' }, 4.5);

  // Mid-sway double blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.2)
   .to([r.eyeL, r.eyeR], { scaleY: 1.06, duration: 0.1, ease: 'power2.out' }, 5.27)
   .to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.48)
   .to([r.eyeL, r.eyeR], { scaleY: 1.06, duration: 0.12, ease: 'back.out(2)' }, 5.55);

  // Sigh deflate — body gently sinks, glow dims slightly
  t.to(r.body, { scaleX: 1.03, scaleY: 0.97, duration: 0.4, ease: 'sine.out' }, 6.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 6.9)
   .to(r.glow, { scale: 0.96, opacity: 0.52, duration: 0.5, ease: 'sine.in' }, 6.5)
   .to(r.glow, { scale: 1.06, opacity: 0.6, duration: 0.6, ease: 'sine.out' }, 7.0);

  // Return to REST (7.7 → 10.0)
  t.to(r.wrap,            { rotation: 0, y: 0, duration: 2.2, ease: 'sine.inOut' }, 7.7)
   .to([r.eyeL, r.eyeR],  { scaleY: 1, x: 0, y: 0, duration: 2.0, ease: 'sine.inOut' }, 7.7)
   .to(r.glow,             { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 7.9)
   .to(r.body,             { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 8.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   10. SLEEP — resting state. Eyes closed. Slow breath. Dim glow.
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Eyes become thin glowing lines, Z floats rise, slow breathing. 10s cycle. */
/** Helper: close eyes to curved sleep-line (narrow slit that reads as "closed eyes"). */
function closeThinLine(t: gsap.core.Timeline, eyeL: HTMLElement | null, eyeR: HTMLElement | null, at: number, dur = 0.65) {
  if (eyeL) t.to(eyeL, { scaleY: 0.07, scaleX: 1.15, duration: dur, ease: 'power2.inOut' }, at);
  if (eyeR) t.to(eyeR, { scaleY: 0.07, scaleX: 1.15, duration: dur, ease: 'power2.inOut' }, at);
}

/** Helper: open eyes from sleep-line back to normal. */
function openFromSleep(t: gsap.core.Timeline, eyeL: HTMLElement | null, eyeR: HTMLElement | null, at: number, dur = 0.85) {
  if (eyeL) t.to(eyeL, { scaleY: 1, scaleX: 1, duration: dur, ease: 'back.out(1.6)' }, at);
  if (eyeR) t.to(eyeR, { scaleY: 1, scaleX: 1, duration: dur, ease: 'back.out(1.6)' }, at + 0.08);
}

/** Helper: float one Z up and fade. at=start time, which ref to use. */
function floatZ(
  t: gsap.core.Timeline,
  el: HTMLElement | null,
  at: number,
  riseY = -70, driftX = 10, riseDur = 2.2
) {
  if (!el) return;
  t.set(el,  { opacity: 0, y: 0, x: 0, scale: 1 }, at)
   .to(el,   { opacity: 1,  duration: 0.35, ease: 'power2.out' }, at)
   .to(el,   { y: riseY, x: driftX, opacity: 0, duration: riseDur, ease: 'power1.in' }, at + 0.35);
}

/**
 * Animate the hand element in a waving oscillation.
 * The hand enters (fades up from behind body), waves `waveCount` times,
 * then exits (fades back down). Total gesture duration ~= enterDur + waveCount * wavePeriod + exitDur.
 */
function handWave(
  t: gsap.core.Timeline,
  hand: HTMLElement | null,
  at: number,
  waveCount = 3,
  wavePeriod = 0.38,
  amp = 22,        // degrees of rotation per wave
  enterDur = 0.22,
  exitDur  = 0.28,
) {
  if (!hand) return;
  const waveTotal = waveCount * wavePeriod;
  // Enter: pop up from opacity:0, slight upward
  t.set(hand,  { opacity: 0, y: 14, rotation: 0, scale: 1 }, at)
   .to(hand,   { opacity: 1, y: 0,  duration: enterDur, ease: 'back.out(2)' }, at);
  // Wave oscillation
  for (let i = 0; i < waveCount; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    t.to(hand, { rotation: sign * amp, duration: wavePeriod * 0.5, ease: 'sine.inOut' }, at + enterDur + i * wavePeriod);
    t.to(hand, { rotation: sign * amp * -0.4, duration: wavePeriod * 0.5, ease: 'sine.inOut' }, at + enterDur + i * wavePeriod + wavePeriod * 0.5);
  }
  // Exit: tuck back
  t.to(hand, { rotation: 0, opacity: 0, y: 14, duration: exitDur, ease: 'power2.in' }, at + enterDur + waveTotal);
}

/** A: Symmetric closed-eye sleep with staggered large Zs. 10s cycle. */
export function faceSleep_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes close to curved thin lines, mascot droops slightly
  closeThinLine(t, r.eyeL, r.eyeR, 0);
  t.to(r.wrap, { y: 7, duration: 0.9, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.72, opacity: 0.18, duration: 1.0, ease: 'power2.in' }, 0);

  // Sleep breathing — very slow
  t.to(r.body, { scaleX: 1.025, scaleY: 1.032, duration: 2.2, ease: 'sine.inOut' }, 1.0)
   .to(r.glow, { scale: 0.8, opacity: 0.24, duration: 2.2, ease: 'sine.inOut' }, 1.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.2, ease: 'sine.inOut' }, 3.2)
   .to(r.glow, { scale: 0.72, opacity: 0.18, duration: 2.2, ease: 'sine.inOut' }, 3.2);

  // First Z — medium (smallest)
  floatZ(t, r.zFloat1, 1.5, -58, 9, 2.0);
  // Second Z — larger, slightly later
  floatZ(t, r.zFloat2, 4.2, -72, 13, 2.5);

  t.to(r.body, { scaleX: 1.022, scaleY: 1.028, duration: 2.0, ease: 'sine.inOut' }, 5.5)
   .to(r.glow, { scale: 0.78, opacity: 0.22, duration: 2.0, ease: 'sine.inOut' }, 5.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 7.5)
   .to(r.glow, { scale: 0.72, opacity: 0.18, duration: 2.0, ease: 'sine.inOut' }, 7.5);

  // Third Z — biggest
  floatZ(t, r.zFloat3, 6.8, -82, 15, 2.8);

  // Eyes slowly open, rise back to REST (8.5 → 10.0)
  openFromSleep(t, r.eyeL, r.eyeR, 8.5);
  t.to(r.wrap,  { y: 0, duration: 1.2, ease: 'sine.inOut' }, 8.5)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 8.6)
   .to(r.body,  { scaleX: 1.018, scaleY: 1.022, duration: 0.5, ease: 'sine.inOut' }, 9.5)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'sine.inOut' }, 10.0);

  return t;
}

/** B: One-side lean into sleep, slow drift, Zs rise diagonally, lazy open. 9s cycle. */
export function faceSleep_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Slight lean right as eyes close
  closeThinLine(t, r.eyeL, r.eyeR, 0);
  t.to(r.wrap, { y: 6, rotation: 3, duration: 1.0, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.74, opacity: 0.2, duration: 1.0, ease: 'power2.in' }, 0.1);

  // Slow drift breathing
  t.to(r.body, { scaleX: 1.026, scaleY: 1.033, duration: 2.3, ease: 'sine.inOut' }, 1.0)
   .to(r.glow, { scale: 0.82, opacity: 0.27, duration: 2.3, ease: 'sine.inOut' }, 1.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.3, ease: 'sine.inOut' }, 3.3)
   .to(r.glow, { scale: 0.74, opacity: 0.2, duration: 2.3, ease: 'sine.inOut' }, 3.3);

  // Zs drift diagonally (matching body lean)
  floatZ(t, r.zFloat2, 1.8, -62, 16, 2.2);
  floatZ(t, r.zFloat1, 4.5, -78, 18, 2.6);

  t.to(r.body, { scaleX: 1.022, scaleY: 1.028, duration: 2.0, ease: 'sine.inOut' }, 5.6)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 7.6);

  // Lazy open — lean straightens, eyes open slowly
  t.to(r.wrap, { y: 0, rotation: 0, duration: 1.1, ease: 'sine.inOut' }, 7.6)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 7.7);
  openFromSleep(t, r.eyeL, r.eyeR, 7.9, 0.8);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.4, ease: 'sine.inOut' }, 8.6)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 9.0);

  return t;
}

/** C: Deep sleep — eyes stay closed the whole cycle, three Zs in ascending size. 11s cycle. */
export function faceSleep_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  closeThinLine(t, r.eyeL, r.eyeR, 0);
  t.to(r.wrap, { y: 8, duration: 1.0, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.68, opacity: 0.15, duration: 1.1, ease: 'power2.in' }, 0);

  // Three breathing cycles
  const breathe = (at: number, dur: number) => {
    t.to(r.body, { scaleX: 1.026, scaleY: 1.034, duration: dur, ease: 'sine.inOut' }, at)
     .to(r.glow, { scale: 0.78, opacity: 0.22, duration: dur, ease: 'sine.inOut' }, at)
     .to(r.body, { scaleX: 1, scaleY: 1, duration: dur, ease: 'sine.inOut' }, at + dur)
     .to(r.glow, { scale: 0.68, opacity: 0.15, duration: dur, ease: 'sine.inOut' }, at + dur);
  };
  breathe(1.0, 2.2);
  breathe(5.5, 2.0);

  // Three Zs in ascending size — staggered throughout cycle
  floatZ(t, r.zFloat1, 1.6, -55, 8, 1.9);    // small Z
  floatZ(t, r.zFloat2, 4.0, -75, 13, 2.4);   // medium Z
  floatZ(t, r.zFloat3, 7.5, -90, 18, 3.0);   // big Z

  // Eyes slowly creep open (9.5 → 11.0)
  t.to(r.eyeL, { scaleY: 0.3, duration: 0.5, ease: 'sine.out' }, 9.5)
   .to(r.eyeR, { scaleY: 0.3, duration: 0.5, ease: 'sine.out' }, 9.6);
  openFromSleep(t, r.eyeL, r.eyeR, 10.0, 0.9);
  t.to(r.wrap, { y: 0, duration: 1.2, ease: 'sine.inOut' }, 9.6)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 9.7)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'sine.inOut' }, 10.5)
   .to(r.body,  { scaleX: 1.018, scaleY: 1.022, duration: 0.25, ease: 'sine.inOut' }, 11.0)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'sine.inOut' }, 11.25);

  return t;
}

/** D: Drift sleep — body slowly sways L/R while sleeping, continuous small Zs. 10s cycle. */
export function faceSleep_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  closeThinLine(t, r.eyeL, r.eyeR, 0);
  t.to(r.glow, { scale: 0.74, opacity: 0.2, duration: 0.9, ease: 'power2.in' }, 0);

  // Slow rocking drift L → R → center
  t.to(r.wrap, { x: -5, y: 5, rotation: -2, duration: 2.8, ease: 'sine.inOut' }, 0.6)
   .to(r.body, { scaleX: 1.025, scaleY: 1.03, duration: 2.4, ease: 'sine.inOut' }, 0.6)
   .to(r.glow, { scale: 0.8, opacity: 0.24, duration: 2.4, ease: 'sine.inOut' }, 0.6);

  floatZ(t, r.zFloat1, 1.2, -55, 7, 1.9);

  t.to(r.wrap, { x: 4, y: 5, rotation: 2, duration: 3.0, ease: 'sine.inOut' }, 3.4)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.5, ease: 'sine.inOut' }, 3.4)
   .to(r.glow, { scale: 0.74, opacity: 0.2, duration: 2.5, ease: 'sine.inOut' }, 3.4);

  floatZ(t, r.zFloat2, 4.0, -70, 14, 2.4);

  t.to(r.body, { scaleX: 1.022, scaleY: 1.026, duration: 2.0, ease: 'sine.inOut' }, 6.4)
   .to(r.glow, { scale: 0.78, opacity: 0.22, duration: 2.0, ease: 'sine.inOut' }, 6.4);

  floatZ(t, r.zFloat3, 6.8, -62, 10, 2.1);

  // Return to center, eyes open (8.0 → 10.0)
  t.to(r.wrap, { x: 0, y: 0, rotation: 0, duration: 1.5, ease: 'sine.inOut' }, 8.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 8.0)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.3, ease: 'sine.inOut' }, 8.2);
  openFromSleep(t, r.eyeL, r.eyeR, 8.4);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.5, ease: 'sine.inOut' }, 9.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'sine.inOut' }, 10.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. YAWN — cartoon wide yawn mouth, eyes squeeze, body stretch
   ───────────────────────────────────────────────────────────────────────────── */

/** Helper: cartoon yawn — body stretch up + inhale, mouth snap open, hold, exhale close. */
function doYawn(
  t: gsap.core.Timeline,
  r: FaceRefs,
  at: number,
  opts: { eyeCloseSpeed?: number; mouthW?: number; mouthH?: number; tiltY?: number } = {}
) {
  const mW = opts.mouthW ?? 2.2;
  const mH = opts.mouthH ?? 2.0;
  const tY = opts.tiltY ?? -5;
  const eyeSpd = opts.eyeCloseSpeed ?? 0.5;

  // Anticipation inhale — body squeezes narrow/tall
  t.to(r.body, { scaleX: 0.94, scaleY: 1.08, duration: 0.55, ease: 'power2.out' }, at)
   .to(r.wrap,  { y: tY, duration: 0.55, ease: 'power2.out' }, at)
   .to(r.glow,  { scale: 0.88, opacity: 0.36, duration: 0.5, ease: 'power2.in' }, at);

  // Eyes squeeze as yawn peaks
  t.to([r.eyeL, r.eyeR], { scaleY: 0.1, scaleX: 1.1, duration: eyeSpd, ease: 'power2.in' }, at + 0.3);

  // Mouth snaps open (cartoon-wide oval)
  t.set(r.mouth, { opacity: 0, scaleX: 0.5, scaleY: 0.5 }, at + 0.45)
   .to(r.mouth,  { opacity: 0.95, scaleX: mW, scaleY: mH, duration: 0.25, ease: 'back.out(2.5)' }, at + 0.5);

  // Hold the yawn
  const holdEnd = at + 0.5 + 0.7;
  t.to(r.mouth, { scaleX: mW * 0.85, scaleY: mH * 0.9, duration: 0.7, ease: 'sine.inOut' }, at + 0.5);

  // Close mouth — exhale settle
  t.to(r.mouth, { opacity: 0, scaleX: 0.3, scaleY: 0.3, duration: 0.4, ease: 'power2.in' }, holdEnd)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'back.out(1.4)' }, holdEnd)
   .to(r.wrap,  { y: 0, duration: 0.8, ease: 'sine.inOut' }, holdEnd)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, holdEnd);
}

/** A: Simple forward yawn, eyes squeeze open again. 6s cycle. */
export function faceYawn_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Brief rest before yawn
  t.to(r.body, { scaleX: 1.01, scaleY: 1.015, duration: 0.8, ease: 'sine.inOut' }, 0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 0.8);

  doYawn(t, r, 1.4);

  // Eyes recover (after doYawn close at ~3.05)
  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.65, ease: 'back.out(2)' }, 3.1);

  // Settle breathing (4.0 → 6.0)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 5.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 6.0);

  return t;
}

/** B: Side-lean yawn — tilts right, yawns, slowly straightens. 7s cycle. */
export function faceYawn_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Lean right before yawning
  t.to(r.wrap, { rotation: 6, x: 4, y: 2, duration: 1.0, ease: 'power2.inOut' }, 0.5);

  doYawn(t, r, 1.5, { mouthW: 2.5, mouthH: 2.2 });

  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'back.out(2)' }, 3.2)
   .to(r.wrap,            { rotation: 0, x: 0, y: 0, duration: 1.2, ease: 'sine.inOut' }, 3.3);

  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** C: Glow dims at yawn peak — energy draining visually. 6.5s cycle. */
export function faceYawn_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  doYawn(t, r, 0.6, { mouthW: 2.0, mouthH: 1.8, tiltY: -4 });

  // Extra glow drain at yawn peak
  t.to(r.glow, { scale: 0.6, opacity: 0.12, duration: 0.4, ease: 'power3.in' }, 1.05)
   .to(r.glow, { scale: 0.95, opacity: 0.5, duration: 1.2, ease: 'sine.inOut' }, 2.1);

  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'back.out(2)' }, 3.0);

  // Glow recovers slowly (energy coming back)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 3.8);
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.8, ease: 'sine.inOut' }, 5.7)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 6.5);

  return t;
}

/** D: Head-drop yawn — drops forward (scaleY squish), snaps back after. 7s cycle. */
export function faceYawn_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Anticipation — tiny bounce up
  t.to(r.wrap, { y: -3, duration: 0.3, ease: 'power2.out' }, 0.8)
   .to(r.wrap, { y: 0, duration: 0.2, ease: 'power2.in' }, 1.1);

  // Head drops forward — body squishes down
  t.to(r.wrap, { y: 8, duration: 0.6, ease: 'power2.in' }, 1.3)
   .to(r.body, { scaleX: 1.08, scaleY: 0.92, duration: 0.6, ease: 'power2.in' }, 1.3);

  // Eyes squeeze at drop
  t.to([r.eyeL, r.eyeR], { scaleY: 0.12, scaleX: 1.08, duration: 0.4, ease: 'power2.in' }, 1.5);

  // Mouth opens at bottom
  t.set(r.mouth, { opacity: 0, scaleX: 0.4, scaleY: 0.4 }, 1.7)
   .to(r.mouth, { opacity: 0.9, scaleX: 2.4, scaleY: 2.1, duration: 0.3, ease: 'back.out(2)' }, 1.8);

  // Hold at bottom
  t.to(r.body, { scaleX: 1.1, scaleY: 0.9, duration: 0.4, ease: 'sine.inOut' }, 2.0)
   .to(r.body, { scaleX: 1.08, scaleY: 0.92, duration: 0.4, ease: 'sine.inOut' }, 2.4);

  // Snap back up — follow-through overshoot
  t.to(r.mouth, { opacity: 0, scaleX: 0.3, scaleY: 0.3, duration: 0.3, ease: 'power2.in' }, 2.6)
   .to(r.wrap,  { y: -4, duration: 0.35, ease: 'power2.out' }, 2.6)
   .to(r.body,  { scaleX: 0.96, scaleY: 1.06, duration: 0.35, ease: 'power2.out' }, 2.6)
   .to(r.wrap,  { y: 0, duration: 0.5, ease: 'back.out(1.6)' }, 2.95)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'back.out(1.6)' }, 2.95)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 0.8, ease: 'sine.inOut' }, 2.9);

  // Eyes open after snap
  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'back.out(2)' }, 3.2);

  // Settle (4.5 → 7.0)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   10. WAKE FROM SLEEP — Zzz fades, eyes open from sleep lines, body lifts
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Clean wake — one last Z fades, eyes slowly open, glow blooms. 5s (plays once then idles). */
export function faceWakeFromSleep_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Start in sleep state (thin eyes, drooped, dim glow)
  gsap.set([r.eyeL, r.eyeR], { scaleY: 0.07, scaleX: 1.15 });
  gsap.set(r.wrap,  { y: 7 });
  gsap.set(r.glow,  { scale: 0.72, opacity: 0.18 });

  // Final Z floats up and fades
  floatZ(t, r.zFloat1, 0.2, -65, 11, 2.2);

  // Eyes begin to open — slow and drowsy at first
  t.to(r.eyeL, { scaleY: 0.25, scaleX: 1.05, duration: 0.7, ease: 'sine.out' }, 0.5)
   .to(r.eyeR, { scaleY: 0.25, scaleX: 1.05, duration: 0.7, ease: 'sine.out' }, 0.65);

  // Glow starts to bloom
  t.to(r.glow, { scale: 0.88, opacity: 0.35, duration: 1.0, ease: 'sine.inOut' }, 0.8);

  // Body lifts
  t.to(r.wrap, { y: 0, duration: 1.4, ease: 'sine.inOut' }, 1.0);

  // Eyes open fully — bloom
  openFromSleep(t, r.eyeL, r.eyeR, 1.5, 0.9);
  t.to(r.glow, { scale: 1.1, opacity: 0.72, duration: 0.7, ease: 'power2.out' }, 1.8)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 2.5);

  // Alert blink — "I'm awake"
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.14, ease: 'power2.out' }, 3.07);

  // Greeting hand wave — mascot waves hello after waking up
  handWave(t, r.hand, 3.3, 3, 0.38, 22, 0.24, 0.3);

  // Settle into idle breathing (3.5 → 5.0)
  t.to(r.body, { scaleX: 1.02, scaleY: 1.025, duration: 0.75, ease: 'sine.inOut' }, 4.2)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.75, ease: 'sine.inOut' }, 4.95);

  return t;
}

/** B: Reluctant wake — Z fades, eye opens partway then droops, then fully opens. 7s cycle. */
export function faceWakeFromSleep_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  gsap.set([r.eyeL, r.eyeR], { scaleY: 0.07, scaleX: 1.15 });
  gsap.set(r.wrap,  { y: 7 });
  gsap.set(r.glow,  { scale: 0.72, opacity: 0.18 });

  floatZ(t, r.zFloat2, 0.3, -70, 14, 2.5);

  // Try to open eyes — half-way, droop back down
  t.to([r.eyeL, r.eyeR], { scaleY: 0.4, scaleX: 1.0, duration: 0.8, ease: 'sine.out' }, 0.8)
   .to([r.eyeL, r.eyeR], { scaleY: 0.1, scaleX: 1.12, duration: 0.7, ease: 'power2.in' }, 1.8);

  t.to(r.glow, { scale: 0.82, opacity: 0.28, duration: 1.4, ease: 'sine.inOut' }, 0.8)
   .to(r.glow, { scale: 0.72, opacity: 0.18, duration: 0.8, ease: 'sine.inOut' }, 2.2);

  // Try again — make it this time
  t.to([r.eyeL, r.eyeR], { scaleY: 0.55, scaleX: 1.0, duration: 0.7, ease: 'sine.out' }, 3.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'back.out(1.8)' }, 3.9);

  t.to(r.wrap, { y: 0, duration: 1.8, ease: 'sine.inOut' }, 2.5)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 3.0);

  // Alert blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 5.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.14, ease: 'power2.out' }, 5.07);

  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.9, ease: 'sine.inOut' }, 6.1)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** C: Glow bloom wake — glow expands first, then eyes open inside it. 5.5s cycle. */
export function faceWakeFromSleep_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  gsap.set([r.eyeL, r.eyeR], { scaleY: 0.07, scaleX: 1.15 });
  gsap.set(r.wrap,  { y: 7 });
  gsap.set(r.glow,  { scale: 0.72, opacity: 0.18 });

  floatZ(t, r.zFloat1, 0.2, -58, 10, 2.0);

  // Glow blooms before eyes open
  t.to(r.glow, { scale: 1.3, opacity: 0.88, duration: 1.2, ease: 'power2.out' }, 0.6)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 1.8);

  // Eyes open inside the bloom
  t.to(r.wrap, { y: 0, duration: 1.1, ease: 'sine.inOut' }, 0.9);
  openFromSleep(t, r.eyeL, r.eyeR, 1.2, 0.9);

  // Double blink — fully alert
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.6)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.12, ease: 'power2.out' }, 2.67)
   .to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.1)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.12, ease: 'power2.out' }, 3.17);

  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.8, ease: 'sine.inOut' }, 4.7)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 5.5);

  return t;
}

/** D: Stretch wake — eyes open then body does a full stretch shake before settling. 7s cycle. */
export function faceWakeFromSleep_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  gsap.set([r.eyeL, r.eyeR], { scaleY: 0.07, scaleX: 1.15 });
  gsap.set(r.wrap,  { y: 7 });
  gsap.set(r.glow,  { scale: 0.72, opacity: 0.18 });

  floatZ(t, r.zFloat2, 0.2, -65, 12, 2.3);

  // Eyes open and body lifts
  t.to(r.wrap,  { y: 0, duration: 1.2, ease: 'sine.inOut' }, 0.6);
  openFromSleep(t, r.eyeL, r.eyeR, 0.8);
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 0.7);

  // Big stretch — body squeezes up tall
  t.to(r.body, { scaleX: 0.9, scaleY: 1.14, duration: 0.7, ease: 'power2.out' }, 2.2)
   .to(r.wrap,  { y: -6, duration: 0.7, ease: 'power2.out' }, 2.2)
   .to(r.glow,  { scale: 1.2, opacity: 0.75, duration: 0.5, ease: 'power2.out' }, 2.3);

  // Eyes squeeze with stretch
  t.to([r.eyeL, r.eyeR], { scaleY: 0.5, duration: 0.45, ease: 'power2.in' }, 2.35);

  // Snap back to settled
  t.to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'back.out(1.8)' }, 2.9)
   .to(r.wrap,   { y: 0, duration: 0.6, ease: 'back.out(1.6)' }, 2.9)
   .to(r.glow,   { scale: 1, opacity: 0.55, duration: 0.6, ease: 'sine.inOut' }, 2.9)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'back.out(2)' }, 3.1);

  // Alert blink
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 4.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.14, ease: 'power2.out' }, 4.07);

  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Expression metadata — for the info panel
   ───────────────────────────────────────────────────────────────────────────── */

export type ExpressionInfo = {
  eye: string;
  brow: string;
  mouth: string;
  effect: string;
};

export const EXPRESSION_INFO: Record<string, ExpressionInfo[]> = {
  idle: [
    { eye: 'Eye_Default_Tall', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
    { eye: 'Eye_Default_Tall + sway', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Default_Tall + dart', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Tired_HalfClosed', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
  ],
  thinking: [
    { eye: 'Eye_Thinking_Narrow (both)', brow: 'Brow_ThinkingInward', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
    { eye: 'Eye_Thinking_Asymmetric (L<R)', brow: 'Brow_ConfusedOneRaised (R)', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Thinking_Narrow + scan', brow: 'Brow_ThinkingInward', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Thinking_Narrow (both)', brow: 'Brow_ThinkingInward', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
  ],
  happy: [
    { eye: 'Eye_Happy_Open', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_TinySparkle' },
    { eye: 'Eye_Happy_Open', brow: 'Brow_HappySoft', mouth: 'Mouth_SmallSmile', effect: 'Effect_TinySparkle' },
    { eye: 'Eye_Happy_Open', brow: 'Brow_HappySoft', mouth: 'Mouth_SmallSmile', effect: 'Effect_Blush' },
    { eye: 'Eye_Happy_Open', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
  ],
  sorry: [
    { eye: 'Eye_Confused_Asym (L<R)', brow: 'Brow_ConfusedInward', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Confused_Asym (R<L)', brow: 'Brow_ConfusedOneRaised (R)', mouth: 'Mouth_None', effect: 'Effect_QuestionMark' },
    { eye: 'Eye_Confused_Narrow (both)', brow: 'Brow_ConfusedInward', mouth: 'Mouth_None', effect: 'Effect_QuestionMarks' },
    { eye: 'Eye_Confused_Heavy', brow: 'Brow_ConfusedInward', mouth: 'Mouth_None', effect: 'Effect_None' },
  ],
  listening: [
    { eye: 'Eye_Listening_Tall', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
    { eye: 'Eye_Listening_Wide', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
    { eye: 'Eye_Listening_Wide', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Listening_Tall + sway', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
  ],
  speaking: [
    { eye: 'Eye_Default_Tall', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SpeakPulse' },
    { eye: 'Eye_Default_Tall', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SpeakPulse' },
    { eye: 'Eye_Default_Tall + look', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SpeakPulse' },
    { eye: 'Eye_Default_Tall + sway', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SpeakPulse' },
  ],
  searching: [
    { eye: 'Eye_Searching_Scan (L→R)', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_GlowSweep' },
    { eye: 'Eye_Searching_Scan (up→ctr)', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_GlowSweep' },
    { eye: 'Eye_Searching_Lag', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_GlowSweep' },
    { eye: 'Eye_Searching_Scan (R blink L)', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
  ],
  processing: [
    { eye: 'Eye_Processing_Steady', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_GlowPulse' },
    { eye: 'Eye_Processing_Steady', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Processing_MicroPulse', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_GlowPulse' },
    { eye: 'Eye_Processing_Steady', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_BodyPulse' },
  ],
  waiting: [
    { eye: 'Eye_Waiting_Neutral', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_SoftGlowPulse' },
    { eye: 'Eye_Waiting_Neutral', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Waiting_Neutral + glance', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Waiting_Neutral + sway', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
  ],
  sleep: [
    { eye: 'Eye_Sleep_Closed', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_DimGlow' },
    { eye: 'Eye_Sleep_Closed', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_DimGlow' },
    { eye: 'Eye_Sleep_Closed', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_DimGlow' },
    { eye: 'Eye_Sleep_Closed + drift', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_DimGlow' },
  ],
  'idle-personality': [
    { eye: 'Eye_Down_Reading', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_FloatProp' },
    { eye: 'Eye_Side_Interest', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_FloatProp' },
    { eye: 'Eye_Rhythm_Bob', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_None' },
    { eye: 'Eye_Up_Thinking', brow: 'Brow_None', mouth: 'Mouth_None', effect: 'Effect_FloatProp' },
  ],
  wow: [
    { eye: 'Eye_Star_CounterPhase', brow: 'Brow_Surprised', mouth: 'Mouth_WowOoh', effect: 'Effect_GlowBurst + StarPulse' },
    { eye: 'Eye_Star_CounterPhase', brow: 'Brow_Surprised', mouth: 'Mouth_WowOoh', effect: 'Effect_ParticleBurst' },
    { eye: 'Eye_Star_CounterPhase', brow: 'Brow_Surprised', mouth: 'Mouth_WowOoh', effect: 'Effect_GlowBurst' },
    { eye: 'Eye_Star_CounterPhase', brow: 'Brow_Surprised', mouth: 'Mouth_WowOoh', effect: 'Effect_GlowBurst + Bob' },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   IDLE PERSONALITY — temporary acting props, 4 character moments
   ───────────────────────────────────────────────────────────────────────────── */

/** A: Hobby_Read — floatA (♥) rises as a "book page", eyes drift down as if reading, occasional blink. 9s cycle. */
export function faceIdlePersonality_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Book icon floats up and settles slightly below eye level (acts as reading material)
  t.set(r.floatA,  { opacity: 0, y: 20, x: -8, scale: 0.7 }, 0.2)
   .to(r.floatA,   { opacity: 0.8, y: 6, scale: 1.1, duration: 0.5, ease: 'back.out(2)' }, 0.2);

  // Eyes shift DOWN as if reading — wider vertical travel to match Rive reference
  t.to([r.eyeL, r.eyeR], { y: 12, scaleY: 0.88, duration: 0.45, ease: 'sine.out' }, 0.7)
   .to(r.wrap,   { y: 3, duration: 0.5, ease: 'sine.out' }, 0.75);

  // Breathing — calm absorbed reading
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 2.2, ease: 'sine.inOut' }, 0.8)
   .to(r.glow, { scale: 1.06, opacity: 0.62, duration: 2.2, ease: 'sine.inOut' }, 0.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.2, ease: 'sine.inOut' }, 3.0)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 2.2, ease: 'sine.inOut' }, 3.0);

  // Page-turn micro: float dips slightly then recovers (like flipping a page)
  t.to(r.floatA, { y: 10, rotation: 8, duration: 0.18, ease: 'power2.in' }, 2.8)
   .to(r.floatA, { y: 6, rotation: 0, duration: 0.25, ease: 'back.out(2)' }, 2.98);

  // Blink while reading
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 3.4)
   .to([r.eyeL, r.eyeR], { scaleY: 0.9, duration: 0.14, ease: 'back.out(2)' }, 3.48);

  // Second breathe + second page turn
  t.to(r.body, { scaleX: 1.016, scaleY: 1.02, duration: 2.0, ease: 'sine.inOut' }, 4.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 2.0, ease: 'sine.inOut' }, 6.0);

  t.to(r.floatA, { y: 9, rotation: -5, duration: 0.18, ease: 'power2.in' }, 5.5)
   .to(r.floatA, { y: 6, rotation: 0, duration: 0.22, ease: 'back.out(2)' }, 5.68);

  // Float exits — put book away
  t.to(r.floatA, { opacity: 0, y: 20, scale: 0.7, duration: 0.5, ease: 'power2.in' }, 7.2);

  // Eyes return to normal position + wrap settles
  t.to([r.eyeL, r.eyeR], { y: 0, scaleY: 1, duration: 0.7, ease: 'back.out(1.5)' }, 7.3)
   .to(r.wrap, { y: 0, duration: 0.65, ease: 'sine.inOut' }, 7.3);

  // Return to REST (7.8 → 9.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 8.0)
   .to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.5, ease: 'sine.inOut' }, 8.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'sine.inOut' }, 9.0);

  return t;
}

/** B: FoodAgent — floatB (?) rises as food icon, eyes track it with interest, happy body reaction. 8s cycle. */
export function faceIdlePersonality_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Food float rises from below
  t.set(r.floatB,  { opacity: 0, y: 30, x: 0, scale: 0.5 }, 0.5)
   .to(r.floatB,   { opacity: 0.9, y: -8, scale: 1.3, duration: 0.55, ease: 'back.out(2.5)' }, 0.5);

  // Eyes track it upward with interest — wide vertical travel
  t.to([r.eyeL, r.eyeR], { y: -12, scaleY: 1.18, duration: 0.38, ease: 'power2.out' }, 0.8)
   .to(r.wrap, { y: -4, duration: 0.42, ease: 'sine.out' }, 0.85);

  // Slight lean toward it (curiosity)
  t.to(r.wrap, { y: -3, rotation: -1, duration: 0.5, ease: 'sine.out' }, 0.9);

  // Happy reaction — glow warms, body perks up, hand wave of delight
  t.to(r.glow, { scale: 1.14, opacity: 0.72, duration: 0.7, ease: 'power2.out' }, 1.1)
   .to(r.body, { scaleX: 1.03, scaleY: 1.04, duration: 0.5, ease: 'back.out(1.5)' }, 1.1);
  handWave(t, r.hand, 1.4, 3, 0.35, 20);

  // Float bobs — like a tempting food item
  t.to(r.floatB, { y: -12, duration: 0.5, ease: 'sine.inOut' }, 1.8)
   .to(r.floatB, { y: -8, duration: 0.5, ease: 'sine.inOut' }, 2.3)
   .to(r.floatB, { y: -12, duration: 0.5, ease: 'sine.inOut' }, 2.8)
   .to(r.floatB, { y: -8, duration: 0.5, ease: 'sine.inOut' }, 3.3);

  // Blink — eyes still fixed on float
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.4)
   .to([r.eyeL, r.eyeR], { scaleY: 1.15, duration: 0.12, ease: 'back.out(2)' }, 2.47);

  // Body settles back, glow calms
  t.to(r.glow, { scale: 1.05, opacity: 0.6, duration: 1.2, ease: 'sine.inOut' }, 3.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 3.8)
   .to(r.wrap, { y: 0, rotation: 0, duration: 0.9, ease: 'sine.inOut' }, 3.9);

  // Float drifts away
  t.to(r.floatB, { opacity: 0, y: -30, scale: 0.6, duration: 0.7, ease: 'power2.in' }, 5.5);

  // Eyes come back to neutral
  t.to([r.eyeL, r.eyeR], { y: 0, scaleY: 1, duration: 0.65, ease: 'back.out(1.5)' }, 5.6)
   .to(r.wrap, { y: 0, duration: 0.6, ease: 'sine.inOut' }, 5.65);

  // Return to REST (6.3 → 8.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 6.5)
   .to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.7, ease: 'sine.inOut' }, 7.3)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'sine.inOut' }, 8.0);

  return t;
}

/** C: MusicAgent — body bobs rhythmically to a beat, eyes bounce in sync. 6s cycle. */
export function faceIdlePersonality_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Settle into the beat — first bob
  t.to(r.body, { scaleX: 1.04, scaleY: 0.97, duration: 0.22, ease: 'power2.out' }, 0.3)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.28, ease: 'back.out(1.5)' }, 0.52);

  // Rhythmic bob pattern (120 BPM ≈ 0.5s per beat)
  const beat = (at: number, strength = 1) => {
    const sy = 0.96 - (strength - 1) * 0.01;
    const sx = 1.035 + (strength - 1) * 0.01;
    t.to(r.body, { scaleX: sx, scaleY: sy, duration: 0.15, ease: 'power2.in' }, at)
     .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'back.out(1.8)' }, at + 0.15)
     .to(r.wrap, { y: -3 * strength, duration: 0.15, ease: 'power2.out' }, at)
     .to(r.wrap, { y: 0, duration: 0.28, ease: 'bounce.out' }, at + 0.15)
     .to(r.glow, { scale: 1.06 + strength * 0.02, opacity: 0.62 + strength * 0.02, duration: 0.12, ease: 'power2.out' }, at)
     .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.3, ease: 'sine.inOut' }, at + 0.2);
  };

  // 8 beats at 0.5s intervals — varied strength on accented beats
  beat(0.8, 1.2);
  beat(1.3, 1);
  beat(1.8, 1.2);
  beat(2.3, 1);

  // Blink between phrases
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 2.6)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.12, ease: 'back.out(2)' }, 2.67);

  beat(2.8, 1.3);
  beat(3.3, 1);
  beat(3.8, 1.2);
  beat(4.3, 1);

  // Slight eye bob with the beat (eyes subtly squeeze on downbeats)
  [0.8, 1.8, 2.8, 3.8].forEach(at => {
    t.to([r.eyeL, r.eyeR], { scaleY: 0.88, duration: 0.1, ease: 'power2.in' }, at)
     .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, at + 0.1);
  });

  // Fade out — beat ends (4.8 → 6.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 5.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'sine.inOut' }, 5.2)
   .to(r.wrap, { y: 0, duration: 0.5, ease: 'sine.inOut' }, 5.4);

  return t;
}

/** D: ThinkingAlone — eyes drift up-left, body still, floatC rises as a thought bubble. 9s cycle. */
export function faceIdlePersonality_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Breathe before thought begins
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.5, ease: 'sine.inOut' }, 0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'sine.inOut' }, 1.5);

  // Eyes drift up and left — recalling something (wide Rive-level travel)
  t.to([r.eyeL, r.eyeR], { x: -16, y: -12, scaleY: 0.88, duration: 0.5, ease: 'power2.out' }, 1.8)
   .to(r.wrap,            { rotation: -7, y: -3, duration: 0.6, ease: 'sine.out' }, 1.85)
   .to(r.glow,            { scale: 0.94, opacity: 0.48, duration: 0.6, ease: 'sine.inOut' }, 1.9);

  // Thought bubble rises (floatC = ?)
  t.set(r.floatC,  { opacity: 0, y: 0, x: 10, scale: 0.4 }, 2.0)
   .to(r.floatC,   { opacity: 0.7, y: -15, scale: 0.9, duration: 0.55, ease: 'back.out(2)' }, 2.1);

  // Hold in thought — slow body breathe
  t.to(r.body, { scaleX: 1.015, scaleY: 1.018, duration: 1.8, ease: 'sine.inOut' }, 2.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.8, ease: 'sine.inOut' }, 4.3);

  // Thought bubble gently bobs
  t.to(r.floatC, { y: -20, duration: 1.0, ease: 'sine.inOut' }, 2.5)
   .to(r.floatC, { y: -15, duration: 1.0, ease: 'sine.inOut' }, 3.5)
   .to(r.floatC, { y: -18, duration: 0.8, ease: 'sine.inOut' }, 4.5);

  // Eyes stay drifted — wander between two thought positions
  t.to([r.eyeL, r.eyeR], { x: -8, y: -8, duration: 1.0, ease: 'sine.inOut' }, 3.0)
   .to([r.eyeL, r.eyeR], { x: -12, y: -6, duration: 1.2, ease: 'sine.inOut' }, 4.0);
  t.to(r.wrap,            { rotation: -5, y: -2, duration: 2.5, ease: 'sine.inOut' }, 3.0);

  // Blink — eyes close and re-open to neutral (thought resolved)
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 5.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1, x: 0, y: 0, duration: 0.4, ease: 'back.out(2)' }, 5.58);
  t.to(r.wrap, { rotation: 0, y: 0, duration: 0.8, ease: 'sine.inOut' }, 5.5);

  // Thought bubble fades
  t.to(r.floatC, { opacity: 0, y: -30, scale: 0.5, duration: 0.6, ease: 'power2.in' }, 5.5);

  // Glow returns to normal with the resolution
  t.to(r.glow, { scale: 1.06, opacity: 0.62, duration: 0.6, ease: 'power2.out' }, 5.8)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 6.4);

  // Return to REST (6.8 → 9.0)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 8.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 9.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LAUGHING — squinted eyes, body shakes, glow pulses warm, 4 variants
   ───────────────────────────────────────────────────────────────────────────── */

/** Helper: rapid horizontal shiver — core of the laugh. */
function shiver(
  t: gsap.core.Timeline,
  wrap: HTMLElement | null,
  body: HTMLElement | null,
  at: number,
  count = 5,
  amp = 4
) {
  if (!wrap && !body) return;
  const step = 0.09;
  for (let i = 0; i < count; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    const decay = 1 - i * 0.12;
    if (wrap) {
      t.to(wrap, { x: sign * amp * decay, duration: step * 0.5, ease: 'none' }, at + i * step)
       .to(wrap, { x: 0, duration: step * 0.5, ease: 'none' }, at + i * step + step * 0.5);
    }
    if (body) {
      t.to(body, { scaleX: 1 + 0.03 * decay, scaleY: 1 - 0.025 * decay, duration: step * 0.5, ease: 'none' }, at + i * step)
       .to(body, { scaleX: 1, scaleY: 1, duration: step * 0.5, ease: 'none' }, at + i * step + step * 0.5);
    }
  }
}

/** Helper: squint eyes to laugh-crescent shape. */
function squintLaugh(t: gsap.core.Timeline, eyeL: HTMLElement | null, eyeR: HTMLElement | null, at: number, dur = 0.22) {
  if (eyeL) t.to(eyeL, { scaleY: 0.28, scaleX: 1.2, duration: dur, ease: 'power2.in' }, at);
  if (eyeR) t.to(eyeR, { scaleY: 0.28, scaleX: 1.2, duration: dur, ease: 'power2.in' }, at);
}

/** A: Small contained giggle — body shivers ×5, eyes squint, glow flickers. 6s cycle. */
export function faceLaughing_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Brief anticipation — tiny inhale
  t.to(r.body, { scaleX: 0.98, scaleY: 1.03, duration: 0.2, ease: 'power2.out' }, 0.3)
   .to(r.glow,  { scale: 1.08, opacity: 0.68, duration: 0.25, ease: 'power2.out' }, 0.3);

  // Eyes squint
  squintLaugh(t, r.eyeL, r.eyeR, 0.5);

  // Shiver burst
  shiver(t, r.wrap, r.body, 0.6, 5, 3.5);

  // Glow flicker on shiver
  t.to(r.glow, { scale: 1.14, opacity: 0.76, duration: 0.12, ease: 'power2.out' }, 0.6)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.25, ease: 'sine.inOut' }, 0.72)
   .to(r.glow, { scale: 1.12, opacity: 0.72, duration: 0.12, ease: 'power2.out' }, 0.97)
   .to(r.glow, { scale: 1.04, opacity: 0.6, duration: 0.2, ease: 'sine.inOut' }, 1.1);

  // Eyes open after giggle
  t.to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'back.out(2)' }, 1.8);

  // Warm glow settle
  t.to(r.glow, { scale: 1.08, opacity: 0.66, duration: 0.6, ease: 'sine.inOut' }, 2.0)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.2, ease: 'sine.inOut' }, 2.6);

  // Return to REST (3.5 → 6.0)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 5.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 6.0);

  return t;
}

/** B: Full body shake — eyes squint hard, body shakes ×8, wrap sways with the laugh. 7s cycle. */
export function faceLaughing_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Anticipation — body squashes down before erupting
  t.to(r.body, { scaleX: 1.06, scaleY: 0.94, duration: 0.22, ease: 'power3.in' }, 0.2)
   .to(r.wrap,  { y: 2, duration: 0.22, ease: 'power3.in' }, 0.2);

  // Eyes squint
  squintLaugh(t, r.eyeL, r.eyeR, 0.38, 0.18);

  // Body lift + shake erupts
  t.to(r.body, { scaleX: 0.96, scaleY: 1.06, duration: 0.18, ease: 'power2.out' }, 0.42)
   .to(r.wrap,  { y: -6, duration: 0.18, ease: 'power2.out' }, 0.42)
   .to(r.glow,  { scale: 1.22, opacity: 0.82, duration: 0.25, ease: 'power2.out' }, 0.4);

  // Long shiver — ×8 beats
  shiver(t, r.wrap, r.body, 0.65, 8, 5);

  // Glow pulses with each shiver beat
  for (let i = 0; i < 4; i++) {
    t.to(r.glow, { scale: 1.18 - i * 0.02, opacity: 0.78 - i * 0.03, duration: 0.12, ease: 'none' }, 0.65 + i * 0.18)
     .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.12, ease: 'none' }, 0.77 + i * 0.18);
  }

  // Body settles from shake
  t.to(r.wrap, { y: 0, x: 0, duration: 0.4, ease: 'back.out(1.5)' }, 2.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'back.out(1.5)' }, 2.0)
   .to(r.glow, { scale: 1.1, opacity: 0.7, duration: 0.5, ease: 'sine.inOut' }, 2.1);

  // Eyes open — still amused
  t.to([r.eyeL, r.eyeR], { scaleY: 0.7, scaleX: 1.1, duration: 0.28, ease: 'sine.out' }, 2.2)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'back.out(2)' }, 2.7);

  // Trailing chuckle shiver — smaller
  shiver(t, r.wrap, null, 3.2, 3, 2.5);

  // Glow calms (3.5 → 7.0)
  t.to(r.glow, { scale: 1.06, opacity: 0.64, duration: 0.8, ease: 'sine.inOut' }, 3.6)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.5, ease: 'sine.inOut' }, 4.4);

  // Return to REST
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 6.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** C: Squint + bounce + warm glow — joyful hops with crescent eyes. 7s cycle. */
export function faceLaughing_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Eyes squint to crescent shape
  squintLaugh(t, r.eyeL, r.eyeR, 0.2);
  t.to(r.glow, { scale: 1.1, opacity: 0.7, duration: 0.35, ease: 'power2.out' }, 0.2);

  // Three bouncing hops — each one with squash on landing
  const hop = (at: number, height = 10, glowScale = 1.2) => {
    t.to(r.wrap, { y: -height, duration: 0.22, ease: 'power2.out' }, at)
     .to(r.body, { scaleX: 0.95, scaleY: 1.08, duration: 0.2, ease: 'power2.out' }, at)
     .to(r.glow, { scale: glowScale, opacity: 0.82, duration: 0.18, ease: 'power2.out' }, at + 0.05)
     .to(r.wrap, { y: 0, duration: 0.28, ease: 'bounce.out' }, at + 0.22)
     .to(r.body, { scaleX: 1.06, scaleY: 0.94, duration: 0.14, ease: 'power3.in' }, at + 0.22)
     .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.22, ease: 'back.out(2)' }, at + 0.36)
     .to(r.glow, { scale: 1.06, opacity: 0.64, duration: 0.3, ease: 'sine.inOut' }, at + 0.28);
  };
  hop(0.5, 12, 1.24);
  hop(1.2, 10, 1.2);
  hop(1.85, 8, 1.16);

  // Eyes still squinted through all 3 hops — they open slowly after
  t.to([r.eyeL, r.eyeR], { scaleY: 0.55, scaleX: 1.1, duration: 0.3, ease: 'sine.out' }, 2.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.55, ease: 'back.out(2)' }, 2.9);

  // Warm glow bloom — laugh afterglow
  t.to(r.glow, { scale: 1.14, opacity: 0.74, duration: 0.5, ease: 'sine.inOut' }, 3.1)
   .to(r.glow, { scale: 1.05, opacity: 0.62, duration: 0.8, ease: 'sine.inOut' }, 3.6)
   .to(r.glow, { scale: 1, opacity: 0.55, duration: 1.0, ease: 'sine.inOut' }, 4.4);

  // Blink — content
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.07, ease: 'power3.in' }, 3.8)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.14, ease: 'power2.out' }, 3.87);

  // Return to REST (5.5 → 7.0)
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 0.7, ease: 'sine.inOut' }, 6.3)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'sine.inOut' }, 7.0);

  return t;
}

/** D: Big laugh then settle — explosive eruption, full glow bloom, slow exhale, final chuckle. 9s cycle. */
export function faceLaughing_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  // Anticipation — deep inhale squash
  t.to(r.body, { scaleX: 1.08, scaleY: 0.92, duration: 0.32, ease: 'power2.in' }, 0.2)
   .to(r.wrap,  { y: 2, duration: 0.32, ease: 'power2.in' }, 0.2)
   .to(r.glow,  { scale: 0.92, opacity: 0.45, duration: 0.3, ease: 'power2.in' }, 0.2);

  // Eyes squeeze shut before eruption
  t.to([r.eyeL, r.eyeR], { scaleY: 0.12, scaleX: 1.25, duration: 0.25, ease: 'power3.in' }, 0.35);

  // ERUPTION — body leaps, glow explodes
  t.to(r.body, { scaleX: 0.9, scaleY: 1.12, duration: 0.22, ease: 'power3.out' }, 0.55)
   .to(r.wrap,  { y: -12, duration: 0.22, ease: 'power3.out' }, 0.55)
   .to(r.glow,  { scale: 1.35, opacity: 0.92, duration: 0.3, ease: 'power3.out' }, 0.55);

  burst(r, '#a78bfa', 6);

  // Intense full-body shiver ×10
  shiver(t, r.wrap, r.body, 0.8, 10, 6);

  // Glow pulses hard with the shake
  t.to(r.glow, { scale: 1.28, opacity: 0.88, duration: 0.1, ease: 'none' }, 0.8)
   .to(r.glow, { scale: 1.18, opacity: 0.78, duration: 0.2, ease: 'none' }, 0.9)
   .to(r.glow, { scale: 1.24, opacity: 0.84, duration: 0.1, ease: 'none' }, 1.1)
   .to(r.glow, { scale: 1.12, opacity: 0.72, duration: 0.2, ease: 'none' }, 1.2)
   .to(r.glow, { scale: 1.2, opacity: 0.8, duration: 0.1, ease: 'none' }, 1.4)
   .to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.2, ease: 'none' }, 1.5);

  // Peak shake ends — body floats up a moment
  t.to(r.wrap, { y: -8, x: 0, duration: 0.3, ease: 'power2.out' }, 1.8)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'sine.inOut' }, 1.8);

  // Eyes half-open, still squinted with residual laughter
  t.to([r.eyeL, r.eyeR], { scaleY: 0.38, scaleX: 1.15, duration: 0.4, ease: 'sine.out' }, 2.0);

  // Slow exhale — body descends, glow dims to warm
  t.to(r.wrap, { y: 0, duration: 1.2, ease: 'power2.inOut' }, 2.2)
   .to(r.glow,  { scale: 1.12, opacity: 0.72, duration: 0.8, ease: 'sine.inOut' }, 2.2)
   .to(r.glow,  { scale: 1.04, opacity: 0.62, duration: 1.0, ease: 'sine.inOut' }, 3.0);

  // Eyes slowly open — still a smile-squint at 0.6 height
  t.to([r.eyeL, r.eyeR], { scaleY: 0.7, scaleX: 1.08, duration: 0.6, ease: 'sine.out' }, 2.5)
   .to([r.eyeL, r.eyeR], { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'back.out(1.5)' }, 3.4);

  // Final chuckle shiver — small, affectionate
  shiver(t, r.wrap, null, 4.2, 3, 2.5);
  t.to(r.glow, { scale: 1.1, opacity: 0.68, duration: 0.15, ease: 'power2.out' }, 4.2)
   .to(r.glow, { scale: 1.04, opacity: 0.62, duration: 0.35, ease: 'sine.inOut' }, 4.35);

  // Blink — satisfied
  t.to([r.eyeL, r.eyeR], { scaleY: 0, duration: 0.08, ease: 'power3.in' }, 5.0)
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.16, ease: 'back.out(2)' }, 5.08);

  // Glow fades to rest warmth (5.3 → 9.0)
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 5.3);

  // Return to REST
  t.to(r.body, { scaleX: 1.018, scaleY: 1.022, duration: 1.0, ease: 'sine.inOut' }, 8.0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 1.0, ease: 'sine.inOut' }, 9.0);

  return t;
}

/* ─────────────────────────────────────────────────────────────────────────────
   WOW — star-struck eyes (counter-phase pulse), OOH mouth, warm glow bloom.
   Reverse-engineered from Noto star_struck.json (fr=60, 2000ms loop).

   Star eyes: the .mp-eye-pill inside each eye-group is reshaped into a
   5-point star via clip-path, then pulsed counter-phase (L 84%→114%,
   R 117%→91%, period 530ms). Color cycles gold→pink→purple via GSAP ticker.
   ───────────────────────────────────────────────────────────────────────────── */

const STAR_CLIP = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
const STAR_COLORS = ['#FFD700', '#FF9FBB', '#D4BBFF'];

/** Set both eye-pills to star shape. Returns the pill elements for cleanup. */
function toStarEyes(eyeL: HTMLElement | null, eyeR: HTMLElement | null): [HTMLElement | null, HTMLElement | null] {
  const pillL = eyeL?.querySelector<HTMLElement>('.mp-eye-pill') ?? null;
  const pillR = eyeR?.querySelector<HTMLElement>('.mp-eye-pill') ?? null;
  for (const p of [pillL, pillR]) {
    if (!p) continue;
    gsap.set(p, {
      width: 44, height: 44,
      left: 5, top: 13,
      borderRadius: 0,
      clipPath: STAR_CLIP,
      backgroundColor: STAR_COLORS[0],
    });
  }
  return [pillL, pillR];
}

/** Restore eye-pills back to default pill shape. */
function restoreEyePills(pillL: HTMLElement | null, pillR: HTMLElement | null) {
  for (const p of [pillL, pillR]) {
    if (!p) continue;
    gsap.set(p, {
      width: 19, height: 45,
      left: 17, top: 12,
      borderRadius: 10,
      clipPath: 'none',
      backgroundColor: '#ffffff',
    });
  }
}

/** Run the gold→pink→purple→gold color cycle on the star pills. */
function starColorCycle(pillL: HTMLElement | null, pillR: HTMLElement | null): gsap.core.Timeline {
  const ct = gsap.timeline({ repeat: -1 });
  const seg = 2 / 3;
  const cols = [...STAR_COLORS, STAR_COLORS[0]];
  cols.slice(0, 3).forEach((from, i) => {
    ct.fromTo(
      [pillL, pillR].filter(Boolean),
      { backgroundColor: from },
      { backgroundColor: cols[i + 1], duration: seg, ease: 'none' },
      i * seg,
    );
  });
  return ct;
}

/** Counter-phase star scale pulse: L 0.84↔1.14, R 1.17↔0.91, period 530ms. */
function starPulseLoop(
  eyeL: HTMLElement | null,
  eyeR: HTMLElement | null,
  pillL: HTMLElement | null,
  pillR: HTMLElement | null,
): gsap.core.Timeline {
  const pt = gsap.timeline({ repeat: -1 });
  const half = 0.265;
  pt.to(eyeL,  { scaleX: 1.14, scaleY: 1.14, duration: half, ease: 'power1.inOut', yoyo: true, repeat: -1 }, 0);
  pt.to(eyeR,  { scaleX: 0.91, scaleY: 0.91, duration: half, ease: 'power1.inOut', yoyo: true, repeat: -1 }, 0);
  pt.to(pillL, { rotation: -6, duration: half, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  pt.to(pillR, { rotation: 7,  duration: half, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return pt;
}

/** A: Full entry sequence — OOH mouth snap, eye anticipation lift, body squash-rebound, star eyes, steady bob. 9s cycle. */
export function faceWow_A(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  const [pillL, pillR] = toStarEyes(r.eyeL, r.eyeR);
  gsap.set([r.eyeL, r.eyeR], { scaleX: 0.01, scaleY: 0.01 });

  // Warm glow entry
  t.to(r.glow, { scale: 1.2, opacity: 0.75, duration: 0.3, ease: 'power2.out' }, 0);
  showBrows(r, t, 0.05, { yL: -4, yR: -4, rotL: -8, rotR: 8, opacity: 0.9 });

  // ── 67ms: OOH mouth SNAPS in (wide-flat squash)
  t.set(r.mouth, { opacity: 0.92, scaleX: 1.5, scaleY: 0.4, width: 20, height: 30 }, 0.067)
   .to(r.mouth,  { scaleX: 1, scaleY: 1, duration: 0.133, ease: 'power2.out' }, 0.067);

  // ── 267ms: eye group ANTICIPATION LIFT
  t.to([r.eyeL, r.eyeR], { y: -11.5, duration: 0.083, ease: 'power3.out' }, 0.267);

  // ── 350ms: body SQUASH + eyes return from lift
  t.to(r.body, { scaleX: 1.06, scaleY: 0.90, duration: 0.08, ease: 'power2.out' }, 0.35)
   .to(r.wrap,  { y: 10, duration: 0.08, ease: 'power2.out' }, 0.35);
  t.to([r.eyeL, r.eyeR], { y: 3.5, duration: 0.15, ease: 'sine.inOut' }, 0.35);

  // ── 500ms: body REBOUND — stars arrive
  t.to(r.body, { scaleX: 1, scaleY: 0.96, duration: 0.22, ease: 'back.out(2)' }, 0.5)
   .to(r.wrap,  { y: -5, duration: 0.22, ease: 'back.out(2)' }, 0.5);
  t.to([r.eyeL, r.eyeR], { scaleX: 0.8, scaleY: 0.8, duration: 0.1, ease: 'power2.out' }, 0.5);

  // ── 600ms: stars SNAP, glow burst, sparkle
  t.to([r.eyeL, r.eyeR], { scaleX: 1.14, scaleY: 1.14, duration: 0.08, ease: 'back.out(2)' }, 0.6)
   .to(r.glow,            { scale: 1.35,  opacity: 0.85, duration: 0.12, ease: 'power2.out' }, 0.6);
  burst(r, '#FFD700', 8);

  // ── 660ms: body Y overshoot
  t.to(r.wrap, { y: -10, duration: 0.06, ease: 'power2.in' }, 0.66)
   .to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, duration: 0.22, ease: 'back.out(2)' }, 0.66);

  // ── 717ms: settle, counter-phase loop begins
  t.to(r.body, { scaleY: 1.0, duration: 0.35, ease: 'back.out(1.4)' }, 0.717)
   .to(r.wrap,  { y: 0, duration: 0.35, ease: 'back.out(1.4)' }, 0.717)
   .to(r.glow,  { scale: 1.2, opacity: 0.75, duration: 0.3, ease: 'sine.inOut' }, 0.717);

  const colorTl = starColorCycle(pillL, pillR);
  const pulseTl = starPulseLoop(r.eyeL, r.eyeR, pillL, pillR);
  t.add(colorTl, 0.6);
  t.add(pulseTl, 0.66);

  // Steady-state body bob (period 1200ms)
  t.to(r.wrap, { y: -4, duration: 0.6, ease: 'sine.inOut' }, 1.1)
   .to(r.wrap,  { y: 4,  duration: 0.6, ease: 'sine.inOut' }, 1.7)
   .to(r.wrap,  { y: -4, duration: 0.6, ease: 'sine.inOut' }, 2.3)
   .to(r.wrap,  { y: 4,  duration: 0.6, ease: 'sine.inOut' }, 2.9)
   .to(r.wrap,  { y: -4, duration: 0.6, ease: 'sine.inOut' }, 3.5)
   .to(r.wrap,  { y: 4,  duration: 0.6, ease: 'sine.inOut' }, 4.1)
   .to(r.wrap,  { y: 0,  duration: 0.8, ease: 'sine.inOut' }, 4.7);

  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 2.0, ease: 'sine.inOut' }, 6.0);

  t.call(() => restoreEyePills(pillL, pillR), [], 8.5);
  t.to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, y: 0, duration: 0.4, ease: 'sine.inOut' }, 8.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 8.5)
   .to(r.wrap,  { y: 0, duration: 0.4, ease: 'sine.inOut' }, 8.5);

  return t;
}

/** B: Continuous loop — stars always visible, fast counter-phase heartbeat, joyful hop every 2s. */
export function faceWow_B(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  const [pillL, pillR] = toStarEyes(r.eyeL, r.eyeR);
  gsap.set([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1 });

  t.to(r.glow, { scale: 1.28, opacity: 0.80, duration: 0.25, ease: 'power2.out' }, 0);
  showBrows(r, t, 0, { yL: -4, yR: -4, rotL: -8, rotR: 8, opacity: 0.85 });
  t.set(r.mouth, { opacity: 0.92, scaleX: 1, scaleY: 1, width: 20, height: 30 }, 0);

  const colorTl = starColorCycle(pillL, pillR);
  const pulseTl = starPulseLoop(r.eyeL, r.eyeR, pillL, pillR);
  t.add(colorTl, 0);
  t.add(pulseTl, 0);

  const hop = (at: number) => {
    t.to(r.wrap, { y: -12, duration: 0.22, ease: 'power2.out' }, at)
     .to(r.body, { scaleX: 1.04, scaleY: 0.94, duration: 0.22, ease: 'power2.out' }, at)
     .to(r.wrap, { y: 0, duration: 0.32, ease: 'bounce.out' }, at + 0.22)
     .to(r.body, { scaleX: 1.0,  scaleY: 1.0,  duration: 0.32, ease: 'back.out(1.5)' }, at + 0.22);
  };
  hop(0.5); hop(2.5); hop(4.5); hop(6.5);

  [0.5, 2.5, 4.5, 6.5].forEach(at => {
    t.to(r.glow, { scale: 1.45, opacity: 0.92, duration: 0.18, ease: 'power2.out' }, at)
     .to(r.glow, { scale: 1.28, opacity: 0.80, duration: 0.35, ease: 'sine.inOut' }, at + 0.18);
  });

  t.call(() => restoreEyePills(pillL, pillR), [], 7.9);
  t.to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 7.9)
   .to(r.wrap,  { y: 0, scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 7.9)
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 0.9, ease: 'sine.inOut' }, 7.6);

  return t;
}

/** C: Glow bloom entry — glow expands first, then stars snap in with sparkle burst. 7s cycle. */
export function faceWow_C(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  const [pillL, pillR] = toStarEyes(r.eyeL, r.eyeR);
  gsap.set([r.eyeL, r.eyeR], { scaleX: 0.01, scaleY: 0.01 });

  t.to(r.glow, { scale: 1.6, opacity: 0.92, duration: 0.45, ease: 'power3.out' }, 0);
  t.to([r.eyeL, r.eyeR], { scaleX: 1.2, scaleY: 1.2, duration: 0.15, ease: 'back.out(3)' }, 0.35);
  burst(r, '#FFD700', 10);
  showBrows(r, t, 0.35, { yL: -5, yR: -5, rotL: -10, rotR: 10, opacity: 1 });

  t.set(r.mouth, { opacity: 0, scaleX: 0.6, scaleY: 0.6, width: 20, height: 30 }, 0.3)
   .to(r.mouth,  { opacity: 0.92, scaleX: 1, scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, 0.3);

  t.to(r.glow,           { scale: 1.3, opacity: 0.82, duration: 0.35, ease: 'sine.inOut' }, 0.5)
   .to([r.eyeL, r.eyeR], { scaleX: 1,  scaleY: 1,    duration: 0.25, ease: 'back.out(1.5)' }, 0.5);

  const colorTl = starColorCycle(pillL, pillR);
  const pulseTl = starPulseLoop(r.eyeL, r.eyeR, pillL, pillR);
  t.add(colorTl, 0.35);
  t.add(pulseTl, 0.5);

  t.to(r.wrap, { y: -5, duration: 0.8, ease: 'sine.inOut' }, 1.2)
   .to(r.wrap,  { y: 3,  duration: 0.8, ease: 'sine.inOut' }, 2.0)
   .to(r.wrap,  { y: -5, duration: 0.8, ease: 'sine.inOut' }, 2.8)
   .to(r.wrap,  { y: 0,  duration: 0.7, ease: 'sine.inOut' }, 3.6);

  t.call(() => burst(r, '#D4BBFF', 6), [], 3.0);
  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 2.0, ease: 'sine.inOut' }, 5.0);

  t.call(() => restoreEyePills(pillL, pillR), [], 6.6);
  t.to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 6.6);

  return t;
}

/** D: Tilt-and-twinkle — body leans into the wow, stars twinkle with rotation, colour-swipe burst. 8s cycle. */
export function faceWow_D(r: FaceRefs): gsap.core.Timeline {
  faceReset(r);
  const t = gsap.timeline({ repeat: -1 });

  const [pillL, pillR] = toStarEyes(r.eyeL, r.eyeR);
  gsap.set([r.eyeL, r.eyeR], { scaleX: 0.01, scaleY: 0.01 });

  t.to(r.wrap, { rotation: 8, y: -4, duration: 0.38, ease: 'back.out(1.6)' }, 0)
   .to(r.body, { scaleX: 1.04, scaleY: 0.96, duration: 0.35, ease: 'power2.out' }, 0)
   .to(r.glow, { scale: 1.32, opacity: 0.82, duration: 0.35, ease: 'power2.out' }, 0);

  showBrows(r, t, 0.1, { yL: -5, yR: -3, rotL: -12, rotR: 4, opacity: 0.9 });

  t.to([r.eyeL, r.eyeR], { scaleX: 1.1, scaleY: 1.1, duration: 0.12, ease: 'back.out(3)' }, 0.3);
  burst(r, '#FFD700', 7);

  t.set(r.mouth, { opacity: 0.92, scaleX: 1.3, scaleY: 0.5, width: 20, height: 30 }, 0.25)
   .to(r.mouth,  { scaleX: 1, scaleY: 1, duration: 0.15, ease: 'power2.out' }, 0.25);

  const colorTl = starColorCycle(pillL, pillR);
  const pulseTl = starPulseLoop(r.eyeL, r.eyeR, pillL, pillR);
  t.add(colorTl, 0.3);
  t.add(pulseTl, 0.42);

  // Sway: tilt right → left → right → center
  t.to(r.wrap, { rotation: -5, y: -6, duration: 1.6, ease: 'sine.inOut' }, 1.0)
   .to(r.wrap,  { rotation: 6,  y: -3, duration: 1.6, ease: 'sine.inOut' }, 2.6)
   .to(r.wrap,  { rotation: -4, y: -5, duration: 1.6, ease: 'sine.inOut' }, 4.2)
   .to(r.wrap,  { rotation: 0,  y: 0,  duration: 1.2, ease: 'sine.inOut' }, 5.8);

  t.call(() => burst(r, '#FF9FBB', 5), [], 1.8);
  t.call(() => burst(r, '#D4BBFF', 5), [], 3.4);

  t.to(r.glow, { scale: 1, opacity: 0.55, duration: 2.0, ease: 'sine.inOut' }, 6.0);

  t.call(() => restoreEyePills(pillL, pillR), [], 7.5);
  t.to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, rotation: 0, duration: 0.4, ease: 'sine.inOut' }, 7.5)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'sine.inOut' }, 7.5)
   .to(r.wrap,  { rotation: 0, y: 0, duration: 0.4, ease: 'sine.inOut' }, 7.5);

  return t;
}
