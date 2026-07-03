import gsap from 'gsap';

/* ─────────────────────────────────────────────────────────────────────────────
   Mascot Animation Engine
   Each exported function receives a Refs object and returns a GSAP timeline.
   The caller is responsible for killing the previous timeline before calling.

   Refs:
     body    – the main circle element
     eyeL    – left eye dot
     eyeR    – right eye dot
     glow    – radial glow ring (larger than body)
     shadow  – ground shadow oval
     wrap    – outermost wrapper (translate/rotate the whole mascot)
     particles – container; children are individual particle divs
   ───────────────────────────────────────────────────────────────────────────── */

export type MascotRefs = {
  wrap:      HTMLElement | null;
  body:      HTMLElement | null;
  eyeL:      HTMLElement | null;
  eyeR:      HTMLElement | null;
  brow:      HTMLElement | null;  // eyebrow hint element
  glow:      HTMLElement | null;
  shadow:    HTMLElement | null;
  particles: HTMLElement | null;
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

function clearParts(r: MascotRefs) {
  const targets = [r.wrap, r.body, r.eyeL, r.eyeR, r.brow, r.glow, r.shadow];
  gsap.killTweensOf(targets.filter(Boolean));
  if (r.particles) {
    gsap.killTweensOf(r.particles.children);
    Array.from(r.particles.children).forEach(c => gsap.set(c, { opacity: 0, scale: 0 }));
  }
}

function resetToIdle(r: MascotRefs, delay = 0) {
  const t = gsap.timeline({ delay });
  t.to([r.wrap, r.body, r.eyeL, r.eyeR, r.brow, r.glow, r.shadow].filter(Boolean), {
    x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1,
    duration: 0.5, ease: 'power2.inOut', overwrite: false,
  });
  return t;
}

function burstParticles(r: MascotRefs, color: string, count = 6) {
  if (!r.particles) return;
  const items = Array.from(r.particles.children).slice(0, count) as HTMLElement[];
  items.forEach((p, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist  = 55 + Math.random() * 30;
    gsap.set(p, { backgroundColor: color, opacity: 1, scale: 1, x: 0, y: 0 });
    gsap.to(p, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: 0,
      scale: 0.2,
      duration: 0.7 + Math.random() * 0.3,
      ease: 'power2.out',
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   CORE AI STATES
═══════════════════════════════════════════════════════════════════════════ */

export function animIdle_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // slow organic breathing — body scale, shadow scale, glow breathe
  t.to(r.body,   { scaleX: 1.025, scaleY: 1.035, duration: 1.6, ease: 'sine.inOut' })
   .to(r.shadow, { scaleX: 1.04,  scaleY: 0.8,   duration: 1.6, ease: 'sine.inOut' }, '<')
   .to(r.glow,   { scale: 1.08,   opacity: 0.9,  duration: 1.6, ease: 'sine.inOut' }, '<')
   .to(r.body,   { scaleX: 1,     scaleY: 1,     duration: 1.6, ease: 'sine.inOut' })
   .to(r.shadow, { scaleX: 1,     scaleY: 1,     duration: 1.6, ease: 'sine.inOut' }, '<')
   .to(r.glow,   { scale: 1,      opacity: 0.55, duration: 1.6, ease: 'sine.inOut' }, '<');
  return t;
}

export function animIdle_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // breathing + lazy left–right sway
  t.to(r.wrap, { rotation: -2,  y: -3, duration: 1.8, ease: 'sine.inOut' })
   .to(r.wrap, { rotation:  2,  y: -3, duration: 3.6, ease: 'sine.inOut' })
   .to(r.wrap, { rotation:  0,  y:  0, duration: 1.8, ease: 'sine.inOut' });
  t.to(r.glow, { scale: 1.1, opacity: 0.85, duration: 1.8, ease: 'sine.inOut' }, 0)
   .to(r.glow, { scale: 1,   opacity: 0.55, duration: 1.8, ease: 'sine.inOut' }, 1.8);
  return t;
}

export function animIdle_C(r: MascotRefs) {
  clearParts(r);
  // breathing + eye dart every 3s
  const t = gsap.timeline({ repeat: -1, repeatDelay: 3 });
  t.to(r.eyeL, { x: -5, duration: 0.12, ease: 'power2.out' })
   .to(r.eyeR, { x: -5, duration: 0.12, ease: 'power2.out' }, '<')
   .to([r.eyeL, r.eyeR], { x: 0, duration: 0.18, ease: 'power2.inOut', delay: 0.5 });
  t.to(r.body, { scaleX: 1.02, scaleY: 1.03, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
  return t;
}

export function animIdle_D(r: MascotRefs) {
  clearParts(r);
  // breathing + slow gentle tilt
  const t = gsap.timeline({ repeat: -1 });
  t.to(r.wrap, { rotation: -3, duration: 3.5, ease: 'sine.inOut' })
   .to(r.wrap, { rotation:  3, duration: 7,   ease: 'sine.inOut' })
   .to(r.wrap, { rotation:  0, duration: 3.5, ease: 'sine.inOut' });
  t.to(r.body, { scaleX: 1.022, scaleY: 1.03, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

// ── Listening ────────────────────────────────────────────────────────────────

export function animListening_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // anticipate (tiny squash), perk up fast, eyes widen, hold alert posture
  t.to(r.body,   { scaleX: 1.06, scaleY: 0.95, duration: 0.1, ease: 'power2.in' })
   .to(r.body,   { scaleX: 0.96, scaleY: 1.08, y: -8, duration: 0.22, ease: 'power3.out' })
   .to(r.body,   { scaleX: 1.04, scaleY: 1.04, y: -6, duration: 0.18, ease: 'back.out(2)' })
   .to(r.eyeL,   { scaleX: 1.4, scaleY: 1.4, duration: 0.18, ease: 'back.out(2)' }, '-=0.18')
   .to(r.eyeR,   { scaleX: 1.4, scaleY: 1.4, duration: 0.18, ease: 'back.out(2)' }, '<')
   .to(r.glow,   { scale: 1.3, opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2')
   // hold the perked-up pose and breathe gently
   .to(r.body,   { scaleX: 1.045, scaleY: 1.055, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

export function animListening_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // two small hops then hold
  t.to(r.body,   { scaleX: 1.08, scaleY: 0.9, duration: 0.08, ease: 'power2.in' })
   .to(r.wrap,   { y: -12, duration: 0.18, ease: 'power2.out' }, '<')
   .to(r.body,   { scaleX: 0.94, scaleY: 1.1, duration: 0.1,  ease: 'power3.out' }, '-=0.05')
   .to(r.wrap,   { y: 0,   duration: 0.14, ease: 'bounce.out' })
   .to(r.body,   { scaleX: 1.08, scaleY: 0.9, duration: 0.07, ease: 'power2.in' }, '-=0.05')
   .to(r.wrap,   { y: -8,  duration: 0.14, ease: 'power2.out' }, '<')
   .to(r.body,   { scaleX: 0.95, scaleY: 1.08, duration: 0.08, ease: 'power3.out' })
   .to(r.wrap,   { y: 0,   duration: 0.12, ease: 'bounce.out' })
   .to(r.body,   { scaleX: 1.03, scaleY: 1.03, duration: 0.2, ease: 'back.out(1.5)' })
   .to(r.eyeL,   { scaleX: 1.3, scaleY: 1.3, duration: 0.2, ease: 'back.out(2)' }, '-=0.2')
   .to(r.eyeR,   { scaleX: 1.3, scaleY: 1.3, duration: 0.2, ease: 'back.out(2)' }, '<')
   .to(r.glow,   { scale: 1.25, opacity: 0.9, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

export function animListening_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // lean toward user: forward tilt + scale up + eyes open
  t.to(r.wrap,   { rotation: 5, y: -4, duration: 0.45, ease: 'back.out(1.7)' })
   .to(r.body,   { scaleX: 1.05, scaleY: 1.05, duration: 0.3, ease: 'back.out(2)' }, '-=0.3')
   .to(r.eyeL,   { scaleX: 1.35, scaleY: 1.35, x: 2, duration: 0.25, ease: 'back.out(2)' }, '-=0.2')
   .to(r.eyeR,   { scaleX: 1.35, scaleY: 1.35, x: 2, duration: 0.25, ease: 'back.out(2)' }, '<')
   .to(r.glow,   { scale: 1.28, opacity: 1, duration: 0.4, ease: 'sine.inOut' }, '-=0.3')
   .to(r.glow,   { scale: 1.22, opacity: 0.85, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

export function animListening_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // eyes widen dramatically + slow glow expand
  t.to(r.eyeL, { scaleX: 1.5, scaleY: 1.6, y: -1, duration: 0.35, ease: 'back.out(2)' })
   .to(r.eyeR, { scaleX: 1.5, scaleY: 1.6, y: -1, duration: 0.35, ease: 'back.out(2)' }, '<')
   .to(r.body, { scaleX: 1.05, scaleY: 1.07, y: -5, duration: 0.4, ease: 'back.out(1.5)' }, '<')
   .to(r.glow, { scale: 1.4, opacity: 1, duration: 0.5, ease: 'power2.out' }, '<')
   .to(r.glow, { scale: 1.3, opacity: 0.8, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

// ── Thinking ─────────────────────────────────────────────────────────────────

export function animThinking_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // tilt left, brow furrow, glow slow pulse
  t.to(r.wrap,  { rotation: -10, duration: 0.55, ease: 'back.out(1.8)' })
   .to(r.eyeL,  { x: -3, scaleY: 0.75, duration: 0.3, ease: 'power2.out' }, '-=0.3')
   .to(r.eyeR,  { x: -3, scaleY: 0.75, duration: 0.3, ease: 'power2.out' }, '<')
   .to(r.brow,  { y: -3, scaleX: 0.85, opacity: 1, duration: 0.3, ease: 'power2.out' }, '<')
   .to(r.glow,  { scale: 0.9, opacity: 0.45, duration: 0.6, ease: 'sine.inOut' }, '<')
   // slow glow pulse to signal processing
   .to(r.glow,  { scale: 1.15, opacity: 0.85, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

export function animThinking_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // eyes scan left → right → centre, loop
  t.to(r.wrap,  { rotation: -6, y: -3, duration: 0.4, ease: 'power2.out' })
   .to(r.eyeL,  { x: -8, duration: 0.35, ease: 'power2.inOut' })
   .to(r.eyeR,  { x: -8, duration: 0.35, ease: 'power2.inOut' }, '<')
   .to(r.eyeL,  { x:  8, duration: 0.7,  ease: 'power1.inOut', delay: 0.3 })
   .to(r.eyeR,  { x:  8, duration: 0.7,  ease: 'power1.inOut' }, '<')
   .to(r.eyeL,  { x:  0, duration: 0.35, ease: 'power2.inOut', delay: 0.3 })
   .to(r.eyeR,  { x:  0, duration: 0.35, ease: 'power2.inOut' }, '<')
   .to(r.glow,  { scale: 1.1, opacity: 0.8, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 2 }, '<');
  // repeat the scan loop
  t.to(r.eyeL,  { x: -8, duration: 0.35, ease: 'power2.inOut' })
   .to(r.eyeR,  { x: -8, duration: 0.35, ease: 'power2.inOut' }, '<')
   .to(r.eyeL,  { x:  8, duration: 0.7,  ease: 'power1.inOut', delay: 0.3 })
   .to(r.eyeR,  { x:  8, duration: 0.7,  ease: 'power1.inOut' }, '<')
   .to(r.eyeL,  { x:  0, duration: 0.35, ease: 'power2.inOut', delay: 0.3 })
   .to(r.eyeR,  { x:  0, duration: 0.35, ease: 'power2.inOut' }, '<');
  return t;
}

export function animThinking_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // lean forward, slow blink, glow pulse
  t.to(r.wrap,  { rotation: 5, y: -3, scaleX: 1.04, scaleY: 1.04, duration: 0.5, ease: 'power2.out' })
   .to(r.eyeL,  { scaleY: 0, duration: 0.18, ease: 'power3.in' })
   .to(r.eyeR,  { scaleY: 0, duration: 0.18, ease: 'power3.in' }, '<')
   .to(r.eyeL,  { scaleY: 1, duration: 0.22, ease: 'power2.out' })
   .to(r.eyeR,  { scaleY: 1, duration: 0.22, ease: 'power2.out' }, '<')
   .to(r.glow,  { scale: 1.2, opacity: 0.9, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: 2 }, 0.2)
   // pause thoughtfully, lean back to neutral
   .to(r.wrap,  { rotation: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power2.inOut', delay: 0.5 });
  return t;
}

export function animThinking_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // tiny bounce up then hold tilt with glow
  t.to(r.body,  { scaleX: 1.07, scaleY: 0.92, duration: 0.1,  ease: 'power2.in' })
   .to(r.wrap,  { y: -10, duration: 0.2, ease: 'power2.out' }, '<')
   .to(r.body,  { scaleX: 0.94, scaleY: 1.1,  duration: 0.15, ease: 'power3.out' })
   .to(r.wrap,  { y: 0, duration: 0.22, ease: 'bounce.out' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.2, ease: 'power2.out' })
   .to(r.wrap,  { rotation: -8, duration: 0.4, ease: 'back.out(1.5)' })
   .to(r.eyeL,  { x: -4, scaleY: 0.8, duration: 0.25, ease: 'power2.out' })
   .to(r.eyeR,  { x: -4, scaleY: 0.8, duration: 0.25, ease: 'power2.out' }, '<')
   .to(r.glow,  { scale: 1.1, opacity: 0.75, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

// ── Speaking ──────────────────────────────────────────────────────────────────

export function animSpeaking_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  t.to(r.body, { scaleX: 1.04, scaleY: 1.04, duration: 0.28, ease: 'sine.inOut' })
   .to(r.body, { scaleX: 1,    scaleY: 1,    duration: 0.22, ease: 'sine.inOut' });
  t.to(r.glow, { scale: 1.14, opacity: 0.9, duration: 0.28, ease: 'sine.inOut' }, 0)
   .to(r.glow, { scale: 1,    opacity: 0.6, duration: 0.22, ease: 'sine.inOut' }, 0.28);
  return t;
}

export function animSpeaking_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  t.to(r.body, { scaleX: 1.05, scaleY: 1.05, duration: 0.25, ease: 'sine.inOut' })
   .to(r.body, { scaleX: 1,    scaleY: 1,    duration: 0.25, ease: 'sine.inOut' });
  // blink mid-speech
  t.to(r.eyeL, { scaleY: 0.1, duration: 0.1, ease: 'power3.in', delay: 0.15 }, 0)
   .to(r.eyeR, { scaleY: 0.1, duration: 0.1, ease: 'power3.in' }, 0.15)
   .to(r.eyeL, { scaleY: 1,   duration: 0.12, ease: 'power2.out' }, 0.25)
   .to(r.eyeR, { scaleY: 1,   duration: 0.12, ease: 'power2.out' }, 0.25);
  t.to(r.glow, { scale: 1.12, opacity: 0.85, duration: 0.25, ease: 'sine.inOut' }, 0)
   .to(r.glow, { scale: 1,    opacity: 0.6,  duration: 0.25, ease: 'sine.inOut' }, 0.25);
  return t;
}

export function animSpeaking_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // body pulse + eyes move with speech cadence
  t.to(r.body, { scaleX: 1.04, scaleY: 1.04, duration: 0.24, ease: 'sine.inOut' })
   .to(r.body, { scaleX: 1,    scaleY: 1,    duration: 0.24, ease: 'sine.inOut' });
  t.to(r.eyeL, { x: 3,  duration: 0.24, ease: 'sine.inOut' }, 0)
   .to(r.eyeR, { x: 3,  duration: 0.24, ease: 'sine.inOut' }, 0)
   .to(r.eyeL, { x: -3, duration: 0.24, ease: 'sine.inOut' }, 0.24)
   .to(r.eyeR, { x: -3, duration: 0.24, ease: 'sine.inOut' }, 0.24)
   .to(r.eyeL, { x: 0,  duration: 0.24, ease: 'sine.inOut' }, 0.48)
   .to(r.eyeR, { x: 0,  duration: 0.24, ease: 'sine.inOut' }, 0.48);
  return t;
}

export function animSpeaking_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // pulse + gentle sway
  t.to(r.body, { scaleX: 1.045, scaleY: 1.045, duration: 0.26, ease: 'sine.inOut' })
   .to(r.body, { scaleX: 1,     scaleY: 1,     duration: 0.26, ease: 'sine.inOut' });
  t.to(r.wrap, { rotation: 2, duration: 0.52, ease: 'sine.inOut' }, 0)
   .to(r.wrap, { rotation: -2, duration: 1.04, ease: 'sine.inOut' }, 0.52)
   .to(r.wrap, { rotation: 0,  duration: 0.52, ease: 'sine.inOut' }, 1.56);
  t.to(r.glow, { scale: 1.12, opacity: 0.9, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0);
  return t;
}

// ── Searching / Processing ────────────────────────────────────────────────────

export function animSearching_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  t.to([r.eyeL, r.eyeR], { x: -10, duration: 0.3, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x:  10, duration: 0.6, ease: 'power1.inOut', delay: 0.2 })
   .to([r.eyeL, r.eyeR], { x:   0, duration: 0.3, ease: 'power2.inOut', delay: 0.2 });
  t.to(r.glow, { scale: 1.1, opacity: 0.8, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

export function animSearching_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  t.to(r.wrap,  { rotation: -5, duration: 0.5, ease: 'sine.inOut' })
   .to([r.eyeL, r.eyeR], { x: -8, duration: 0.3, ease: 'power2.inOut' }, '-=0.3')
   .to(r.wrap,  { rotation:  5, duration: 1,   ease: 'sine.inOut' })
   .to([r.eyeL, r.eyeR], { x:  8, duration: 0.5, ease: 'power2.inOut' }, '-=0.7')
   .to(r.wrap,  { rotation:  0, duration: 0.5, ease: 'sine.inOut' })
   .to([r.eyeL, r.eyeR], { x:  0, duration: 0.3, ease: 'power2.inOut' }, '-=0.3');
  return t;
}

export function animProcessing_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // glow rotates / orbits; body very slow breathing
  t.to(r.glow,  { rotation: 360, duration: 3, ease: 'none' });
  t.to(r.body,  { scaleX: 1.02, scaleY: 1.02, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

export function animProcessing_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // glow pulse ring expand
  t.to(r.glow,  { scale: 1.4, opacity: 0.1, duration: 1.2, ease: 'power1.out' })
   .to(r.glow,  { scale: 1,   opacity: 0.8, duration: 0, ease: 'none' });
  t.to(r.body,  { scaleX: 1.015, scaleY: 1.015, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

// ── Wake-up ───────────────────────────────────────────────────────────────────

export function animWakeUp(r: MascotRefs) {
  clearParts(r);
  gsap.set([r.wrap, r.body, r.eyeL, r.eyeR, r.glow, r.shadow], { opacity: 0, scale: 0.4 });
  const t = gsap.timeline();
  t.to(r.glow,  { opacity: 1, scale: 1.6, duration: 0.4, ease: 'power2.out' })
   .to(r.body,  { opacity: 1, scale: 1.12, duration: 0.35, ease: 'back.out(2)' }, '-=0.15')
   .to(r.wrap,  { opacity: 1, duration: 0.2 }, '<')
   .to(r.eyeL,  { opacity: 1, scaleY: 0, duration: 0 })
   .to(r.eyeR,  { opacity: 1, scaleY: 0, duration: 0 })
   .to(r.eyeL,  { scaleY: 1, duration: 0.28, ease: 'back.out(3)' })
   .to(r.eyeR,  { scaleY: 1, duration: 0.28, ease: 'back.out(3)' }, '<')
   .to(r.body,  { scale: 1,  duration: 0.35, ease: 'elastic.out(1, 0.5)' }, '-=0.15')
   .to(r.glow,  { scale: 1, opacity: 0.7, duration: 0.5, ease: 'power2.out' }, '-=0.3')
   .to(r.shadow,{ opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2');
  return t;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

export function animSleep_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // body slowly sinks, eyes close, glow dims
  t.to(r.wrap,  { y: 8, duration: 2, ease: 'power1.inOut' })
   .to(r.eyeL,  { scaleY: 0.08, duration: 1.2, ease: 'power2.in' }, 0.3)
   .to(r.eyeR,  { scaleY: 0.08, duration: 1.2, ease: 'power2.in' }, 0.3)
   .to(r.glow,  { scale: 0.7, opacity: 0.15, duration: 2, ease: 'power2.in' }, 0)
   .to(r.body,  { scaleX: 1.04, scaleY: 0.97, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 1.8) // slow breathing
   .to(r.shadow,{ scaleX: 0.8, opacity: 0.3, duration: 2, ease: 'power2.in' }, 0);
  return t;
}

export function animSleep_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap,  { y: 6, rotation: -4, duration: 1.8, ease: 'power1.inOut' })
   .to(r.eyeL,  { scaleY: 0.1, duration: 1, ease: 'power2.in' }, 0.4)
   .to(r.eyeR,  { scaleY: 0.1, duration: 1, ease: 'power2.in' }, 0.4)
   .to(r.glow,  { scale: 0.65, opacity: 0.12, duration: 1.8, ease: 'power2.in' }, 0)
   .to(r.body,  { scaleX: 1.03, scaleY: 0.98, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 2);
  return t;
}

// ── Goodbye ───────────────────────────────────────────────────────────────────

export function animGoodbye(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // wave then fade out
  t.to(r.wrap,  { x: -12, duration: 0.18, ease: 'power2.out' })
   .to(r.wrap,  { x:  12, duration: 0.36, ease: 'power2.inOut' })
   .to(r.wrap,  { x:  -8, duration: 0.28, ease: 'power2.inOut' })
   .to(r.wrap,  { x:   0, duration: 0.22, ease: 'power2.out' })
   .to(r.wrap,  { y: -12, opacity: 0, scale: 0.7, duration: 0.8, ease: 'power2.in', delay: 0.3 });
  t.to(r.glow,  { scale: 2, opacity: 0, duration: 0.8, ease: 'power2.in' }, '-=0.8');
  return t;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMOTIONAL STATES
═══════════════════════════════════════════════════════════════════════════ */

export function animHappy_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // anticipate squash → jump → land squash → settle → glow burst
  t.to(r.body,  { scaleX: 1.14, scaleY: 0.88, duration: 0.1, ease: 'power2.in' })    // anticipate squash
   .to(r.shadow,{ scaleX: 1.15, duration: 0.1, ease: 'power2.in' }, '<')
   .to(r.wrap,  { y: -28, duration: 0.28, ease: 'power3.out' })                        // JUMP
   .to(r.body,  { scaleX: 0.92, scaleY: 1.14, duration: 0.18, ease: 'power3.out' }, '-=0.28')
   .to(r.shadow,{ scaleX: 0.7, opacity: 0.3, duration: 0.28, ease: 'power2.out' }, '-=0.28')
   .to(r.wrap,  { y: 0,   duration: 0.22, ease: 'power3.in' })                         // FALL
   .to(r.body,  { scaleX: 1.16, scaleY: 0.86, duration: 0.1, ease: 'power3.in' })     // land squash
   .to(r.shadow,{ scaleX: 1.2, opacity: 0.6, duration: 0.1, ease: 'power3.in' }, '<')
   .to(r.body,  { scaleX: 1.06, scaleY: 1.04, duration: 0.22, ease: 'back.out(2)' })  // settle
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.28, ease: 'elastic.out(1, 0.4)' })
   .to(r.shadow,{ scaleX: 1, opacity: 0.5, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.28')
   .to(r.eyeL,  { scaleY: 0.3, duration: 0.12, ease: 'power2.in' }, '-=0.2')          // happy squint
   .to(r.eyeR,  { scaleY: 0.3, duration: 0.12, ease: 'power2.in' }, '<')
   .to(r.eyeL,  { scaleY: 1, duration: 0.18, ease: 'back.out(2)' })
   .to(r.eyeR,  { scaleY: 1, duration: 0.18, ease: 'back.out(2)' }, '<')
   .to(r.glow,  { scale: 1.7, opacity: 1, duration: 0.22, ease: 'power3.out' }, '-=0.5')
   .to(r.glow,  { scale: 1.1, opacity: 0.7, duration: 0.5, ease: 'power2.inOut' });
  burstParticles(r, '#facc15', 6);
  return t;
}

export function animHappy_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // double bounce
  const hop = (h: number, dur: number) => {
    t.to(r.body,  { scaleX: 1.12, scaleY: 0.9, duration: 0.08, ease: 'power2.in' })
     .to(r.wrap,  { y: -h, duration: dur * 0.45, ease: 'power2.out' }, '<')
     .to(r.body,  { scaleX: 0.93, scaleY: 1.12, duration: dur * 0.3, ease: 'power3.out' })
     .to(r.wrap,  { y: 0,  duration: dur * 0.25, ease: 'bounce.out' })
     .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.15, ease: 'back.out(1.5)' });
  };
  hop(22, 0.48);
  hop(16, 0.38);
  t.to(r.glow, { scale: 1.5, opacity: 1, duration: 0.18, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1.1, opacity: 0.7, duration: 0.5, ease: 'power2.out' }, 0.18);
  burstParticles(r, '#facc15', 5);
  return t;
}

export function animHappy_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // spin of joy
  t.to(r.body,  { scaleX: 1.08, scaleY: 0.94, duration: 0.1, ease: 'power2.in' })
   .to(r.wrap,  { rotation: 360, y: -10, duration: 0.5, ease: 'power2.inOut' })
   .to(r.body,  { scaleX: 0.94, scaleY: 1.1,  duration: 0.12, ease: 'power3.out' }, '-=0.1')
   .to(r.wrap,  { y: 0, duration: 0.3, ease: 'bounce.out' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'elastic.out(1, 0.5)' })
   .to(r.glow,  { scale: 1.6, opacity: 1, duration: 0.15, ease: 'power3.out' }, 0.2)
   .to(r.glow,  { scale: 1,   opacity: 0.7, duration: 0.55, ease: 'power2.out' }, 0.35);
  burstParticles(r, '#facc15', 7);
  return t;
}

export function animHappy_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // glow burst + upward float + happy squint
  t.to(r.glow,  { scale: 2, opacity: 1, duration: 0.2, ease: 'power3.out' })
   .to(r.glow,  { scale: 1.2, opacity: 0.8, duration: 0.6, ease: 'power2.inOut' })
   .to(r.wrap,  { y: -8, duration: 0.4, ease: 'back.out(1.5)' }, 0)
   .to(r.wrap,  { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }, 0.4)
   .to(r.eyeL,  { scaleY: 0.25, duration: 0.15, ease: 'power3.in' }, 0.1)
   .to(r.eyeR,  { scaleY: 0.25, duration: 0.15, ease: 'power3.in' }, 0.1)
   .to(r.eyeL,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, 0.4)
   .to(r.eyeR,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, 0.4);
  burstParticles(r, '#fbbf24', 5);
  return t;
}

// ── Celebrate ────────────────────────────────────────────────────────────────

export function animCelebrate_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  for (let i = 0; i < 3; i++) {
    const h = [28, 20, 14][i];
    t.to(r.body,  { scaleX: 1.14, scaleY: 0.87, duration: 0.09, ease: 'power2.in' })
     .to(r.wrap,  { y: -h, duration: 0.22, ease: 'power2.out' }, '<')
     .to(r.body,  { scaleX: 0.91, scaleY: 1.13, duration: 0.15, ease: 'power3.out' })
     .to(r.wrap,  { y: 0,  duration: 0.18, ease: 'bounce.out' })
     .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.14, ease: 'back.out(2)' });
  }
  t.to(r.glow, { scale: 1.8, opacity: 1, duration: 0.2, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1.2, opacity: 0.8, duration: 0.8, ease: 'power2.out' }, 0.2);
  burstParticles(r, '#f59e0b', 8);
  return t;
}

export function animCelebrate_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 1.12, scaleY: 0.9, duration: 0.1, ease: 'power2.in' })
   .to(r.wrap,  { y: -20, duration: 0.2, ease: 'power2.out' }, '<')
   .to(r.wrap,  { rotation: 360, y: 0, duration: 0.5, ease: 'power2.inOut' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
   .to(r.glow,  { scale: 1.9, opacity: 1, duration: 0.2, ease: 'power3.out' }, 0.2)
   .to(r.glow,  { scale: 1.15, opacity: 0.8, duration: 0.6, ease: 'power2.out' });
  burstParticles(r, '#fb923c', 8);
  return t;
}

export function animCelebrate_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // glow bloom explosion + body scale pulse
  t.to(r.glow, { scale: 2.5, opacity: 1, duration: 0.25, ease: 'power3.out' })
   .to(r.glow, { scale: 1.3, opacity: 0.8, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
   .to(r.body, { scaleX: 1.18, scaleY: 1.18, duration: 0.18, ease: 'power3.out' }, 0)
   .to(r.body, { scaleX: 1,    scaleY: 1,    duration: 0.5,  ease: 'elastic.out(1, 0.4)' }, 0.18)
   .to(r.wrap, { y: -14, duration: 0.25, ease: 'power3.out' }, 0)
   .to(r.wrap, { y: 0, duration: 0.4, ease: 'bounce.out' }, 0.25);
  burstParticles(r, '#fde68a', 10);
  return t;
}

// ── Sorry / Sad ───────────────────────────────────────────────────────────────

export function animSorry_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // body slowly droops, glow dims, eyes partially close downward
  t.to(r.wrap,  { y: 10, duration: 1.2, ease: 'power2.inOut' })
   .to(r.eyeL,  { scaleY: 0.45, y: 2, duration: 0.8, ease: 'power2.inOut' }, 0.3)
   .to(r.eyeR,  { scaleY: 0.45, y: 2, duration: 0.8, ease: 'power2.inOut' }, 0.3)
   .to(r.glow,  { scale: 0.75, opacity: 0.18, duration: 1.5, ease: 'power2.in' }, 0)
   .to(r.body,  { scaleX: 1.02, scaleY: 0.97, duration: 1.2, ease: 'power2.inOut' }, 0)
   .to(r.shadow,{ opacity: 0.25, scaleX: 0.85, duration: 1.2, ease: 'power2.in' }, 0)
   // slow blink
   .to(r.eyeL,  { scaleY: 0.05, duration: 0.35, ease: 'power3.in', delay: 0.6 })
   .to(r.eyeR,  { scaleY: 0.05, duration: 0.35, ease: 'power3.in' }, '-=0.35')
   .to(r.eyeL,  { scaleY: 0.45, duration: 0.4, ease: 'power2.out' })
   .to(r.eyeR,  { scaleY: 0.45, duration: 0.4, ease: 'power2.out' }, '<')
   // recover gently
   .to(r.wrap,  { y: 4, duration: 1, ease: 'power2.inOut', delay: 0.5 })
   .to(r.glow,  { scale: 0.9, opacity: 0.4, duration: 1, ease: 'power2.inOut' }, '-=1');
  return t;
}

export function animSorry_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // deliberate apologetic nod
  t.to(r.wrap,  { rotation: -5, y: 3, duration: 0.6, ease: 'power2.inOut' })
   .to(r.eyeL,  { scaleY: 0.5, y: 1, duration: 0.5, ease: 'power2.inOut' }, '<')
   .to(r.eyeR,  { scaleY: 0.5, y: 1, duration: 0.5, ease: 'power2.inOut' }, '<')
   .to(r.glow,  { scale: 0.8, opacity: 0.25, duration: 0.8, ease: 'power2.inOut' }, '<')
   .to(r.wrap,  { rotation: 5, duration: 0.7, ease: 'power2.inOut' })
   .to(r.wrap,  { rotation: 0, y: 0, duration: 0.5, ease: 'power2.inOut' })
   .to(r.eyeL,  { scaleY: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4')
   .to(r.eyeR,  { scaleY: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '<')
   .to(r.glow,  { scale: 1, opacity: 0.55, duration: 0.7, ease: 'power2.out' }, '-=0.5');
  return t;
}

export function animSorry_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // very long sincere blink + glow dim
  t.to(r.glow,  { scale: 0.8, opacity: 0.2, duration: 0.7, ease: 'power2.in' })
   .to(r.eyeL,  { scaleY: 0.05, duration: 0.45, ease: 'power3.in' }, 0.2)
   .to(r.eyeR,  { scaleY: 0.05, duration: 0.45, ease: 'power3.in' }, 0.2)
   .to(r.wrap,  { y: 5, duration: 0.7, ease: 'power2.inOut' }, 0)
   // eyes stay closed 800ms
   .to(r.eyeL,  { scaleY: 1, duration: 0.5, ease: 'power2.out', delay: 0.8 })
   .to(r.eyeR,  { scaleY: 1, duration: 0.5, ease: 'power2.out' }, '-=0.5')
   .to(r.glow,  { scale: 1, opacity: 0.5, duration: 0.8, ease: 'power2.out' }, '-=0.5')
   .to(r.wrap,  { y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.7');
  return t;
}

export function animSorry_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // glow fades way down, eyes heavy
  t.to(r.glow,  { scale: 0.6, opacity: 0.08, duration: 2, ease: 'power2.inOut' })
   .to(r.eyeL,  { scaleY: 0.35, y: 3, duration: 1, ease: 'power2.inOut' }, 0.3)
   .to(r.eyeR,  { scaleY: 0.35, y: 3, duration: 1, ease: 'power2.inOut' }, 0.3)
   .to(r.body,  { scaleX: 0.97, scaleY: 0.97, duration: 1.5, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.9, opacity: 0.35, duration: 1.2, ease: 'power2.out', delay: 1 })
   .to(r.eyeL,  { scaleY: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.8')
   .to(r.eyeR,  { scaleY: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '<');
  return t;
}

// ── Confused ──────────────────────────────────────────────────────────────────

export function animConfused_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // tilt left, pause, tilt right, blink mid, wiggle, centre
  t.to(r.wrap,  { rotation: -11, duration: 0.45, ease: 'back.out(2)' })
   .to(r.eyeL,  { x: -4, scaleY: 0.8, duration: 0.3, ease: 'power2.out' }, '-=0.3')
   .to(r.eyeR,  { x: -4, scaleY: 0.8, duration: 0.3, ease: 'power2.out' }, '<')
   .to(r.wrap,  { rotation:  11, duration: 0.65, ease: 'sine.inOut' }, '+=0.3')
   .to(r.eyeL,  { x: 4, duration: 0.4, ease: 'power2.inOut' }, '-=0.4')
   .to(r.eyeR,  { x: 4, duration: 0.4, ease: 'power2.inOut' }, '<')
   .to(r.eyeL,  { scaleY: 0.05, duration: 0.12, ease: 'power3.in' })       // blink
   .to(r.eyeR,  { scaleY: 0.05, duration: 0.12, ease: 'power3.in' }, '<')
   .to(r.eyeL,  { scaleY: 0.8,  duration: 0.15, ease: 'power2.out' })
   .to(r.eyeR,  { scaleY: 0.8,  duration: 0.15, ease: 'power2.out' }, '<')
   // gentle wiggle
   .to(r.wrap,  { x: -5, duration: 0.1, ease: 'power2.out' })
   .to(r.wrap,  { x:  5, duration: 0.2, ease: 'power2.inOut' })
   .to(r.wrap,  { x: -3, duration: 0.15, ease: 'power2.inOut' })
   .to(r.wrap,  { x:  0, rotation: 0, duration: 0.3, ease: 'back.out(1.5)' })
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2');
  return t;
}

export function animConfused_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // look around — eyes scan all corners
  t.to(r.wrap,  { rotation: -8, duration: 0.4, ease: 'back.out(1.5)' })
   .to([r.eyeL, r.eyeR], { x: -7, y: -4, duration: 0.25, ease: 'power2.out' }, '-=0.25')
   .to([r.eyeL, r.eyeR], { x:  7, y: -4, duration: 0.5,  ease: 'power2.inOut', delay: 0.3 })
   .to([r.eyeL, r.eyeR], { x:  7, y:  4, duration: 0.35, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x: -7, y:  4, duration: 0.5,  ease: 'power2.inOut', delay: 0.2 })
   .to([r.eyeL, r.eyeR], { x:  0, y:  0, duration: 0.3,  ease: 'back.out(1.5)' })
   .to(r.wrap,  { rotation: 0, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.3');
  return t;
}

export function animConfused_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // rapid head wobble — endearing confusion
  t.to(r.wrap, { rotation: -10, duration: 0.2, ease: 'power2.out' })
   .to(r.wrap, { rotation:  10, duration: 0.35, ease: 'power2.inOut' })
   .to(r.wrap, { rotation:  -7, duration: 0.28, ease: 'power2.inOut' })
   .to(r.wrap, { rotation:   7, duration: 0.24, ease: 'power2.inOut' })
   .to(r.wrap, { rotation:   0, duration: 0.3,  ease: 'back.out(1.5)' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.7, duration: 0.15, ease: 'power2.in' }, 0.3)
   .to([r.eyeL, r.eyeR], { scaleY: 1,   duration: 0.2,  ease: 'back.out(2)' }, 0.6);
  return t;
}

export function animConfused_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // tilt + glow dims = uncertain
  t.to(r.wrap, { rotation: -9, y: 2, duration: 0.5, ease: 'back.out(1.5)' })
   .to(r.glow, { scale: 0.85, opacity: 0.3, duration: 0.5, ease: 'power2.out' }, '<')
   .to([r.eyeL, r.eyeR], { x: -4, scaleY: 0.75, duration: 0.35, ease: 'power2.out' }, '-=0.4')
   .to(r.wrap, { rotation: 0, y: 0, duration: 0.5, ease: 'back.out(1.5)', delay: 0.8 })
   .to(r.glow, { scale: 1, opacity: 0.6, duration: 0.5, ease: 'power2.out' }, '-=0.5')
   .to([r.eyeL, r.eyeR], { x: 0, scaleY: 1, duration: 0.35, ease: 'back.out(1.5)' }, '-=0.4');
  return t;
}

// ── Curious ───────────────────────────────────────────────────────────────────

export function animCurious_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // lean forward, eyes toward content
  t.to(r.wrap,  { rotation: 6, y: -5, scale: 1.04, duration: 0.6, ease: 'back.out(1.8)' })
   .to([r.eyeL, r.eyeR], { x: 5, y: -2, scaleX: 1.2, scaleY: 1.2, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow,  { scale: 1.2, opacity: 0.8, duration: 0.5, ease: 'power2.out' }, '-=0.4')
   // subtle breathing hold
   .to(r.body,  { scaleX: 1.02, scaleY: 1.03, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: 2 });
  return t;
}

export function animCurious_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // double-take: glance away, snap back
  t.to([r.eyeL, r.eyeR], { x: -8, duration: 0.18, ease: 'power3.out' })
   .to([r.eyeL, r.eyeR], { x: 0,  duration: 0.12, ease: 'power3.out', delay: 0.15 })
   .to([r.eyeL, r.eyeR], { x: 9, scaleX: 1.2, scaleY: 1.2, duration: 0.22, ease: 'power3.out', delay: 0.1 })
   .to(r.wrap,  { rotation: 5, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.2')
   .to(r.glow,  { scale: 1.18, opacity: 0.85, duration: 0.4, ease: 'power2.out' }, '-=0.3');
  return t;
}

export function animCurious_C(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // very slow lean, deep interest
  t.to(r.wrap, { rotation: 8, y: -4, scale: 1.05, duration: 1.4, ease: 'power1.inOut' })
   .to([r.eyeL, r.eyeR], { x: 6, scaleX: 1.15, scaleY: 1.15, duration: 0.8, ease: 'power2.inOut' }, 0.4)
   .to(r.glow, { scale: 1.22, opacity: 0.9, duration: 1.2, ease: 'sine.inOut' }, 0);
  return t;
}

export function animCurious_D(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // gentle head tilt with glow pulse
  t.to(r.wrap, { rotation: 9, duration: 0.55, ease: 'back.out(2)' })
   .to(r.glow, { scale: 1.25, opacity: 0.9, duration: 0.4, ease: 'power2.out' }, '-=0.3')
   .to([r.eyeL, r.eyeR], { x: 5, y: -3, scaleX: 1.1, scaleY: 1.15, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow, { scale: 1.15, opacity: 0.75, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 2 });
  return t;
}

// ── Love / Heart ──────────────────────────────────────────────────────────────

export function animLove_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.glow, { scale: 1.8, opacity: 1, duration: 0.22, ease: 'power3.out' })
   .to(r.glow, { scale: 1.2, opacity: 0.8, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
   .to(r.wrap, { y: -8, duration: 0.4, ease: 'back.out(1.5)' }, 0)
   .to(r.wrap, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }, 0.4)
   .to(r.eyeL, { scaleY: 0.3, duration: 0.15, ease: 'power3.in' }, 0.15)
   .to(r.eyeR, { scaleY: 0.3, duration: 0.15, ease: 'power3.in' }, 0.15)
   .to(r.eyeL, { scaleY: 1, duration: 0.22, ease: 'back.out(2)' }, 0.45)
   .to(r.eyeR, { scaleY: 1, duration: 0.22, ease: 'back.out(2)' }, 0.45)
   .to(r.glow, { scale: 1.4, opacity: 0.9, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 });
  burstParticles(r, '#f472b6', 6);
  return t;
}

// ── Dislike ───────────────────────────────────────────────────────────────────

export function animDislike_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // thoughtful nod: not sad — calm and resolute
  t.to(r.wrap,  { rotation: -4, y: 3, duration: 0.5, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.7, y: 1, duration: 0.4, ease: 'power2.inOut' }, 0)
   .to(r.glow,  { scale: 0.9, opacity: 0.5, duration: 0.5, ease: 'power2.inOut' }, 0)
   .to(r.wrap,  { rotation: 3, y: 0, duration: 0.4, ease: 'power2.inOut' }, '+=0.4')
   .to(r.wrap,  { rotation: 0, duration: 0.3, ease: 'power2.out' })
   // transition to thinking: eyes scan
   .to([r.eyeL, r.eyeR], { scaleY: 1, y: 0, duration: 0.3, ease: 'back.out(2)' })
   .to([r.eyeL, r.eyeR], { x: -7, duration: 0.3, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x:  7, duration: 0.5, ease: 'power2.inOut', delay: 0.2 })
   .to([r.eyeL, r.eyeR], { x:  0, duration: 0.3, ease: 'power2.inOut' })
   .to(r.glow,  { scale: 1.1, opacity: 0.75, duration: 0.6, ease: 'power2.out' });
  return t;
}

export function animDislike_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // brief shrink of understanding → expand with determination
  t.to(r.body,  { scaleX: 0.92, scaleY: 0.92, duration: 0.3, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.6, duration: 0.3, ease: 'power2.inOut' }, '<')
   .to(r.glow,  { scale: 0.8, opacity: 0.35, duration: 0.4, ease: 'power2.in' }, '<')
   .to(r.body,  { scaleX: 1.06, scaleY: 1.06, duration: 0.4, ease: 'back.out(2)', delay: 0.3 })
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow,  { scale: 1.18, opacity: 0.85, duration: 0.4, ease: 'power2.out' }, '-=0.3')
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'power2.out' });
  return t;
}

// ── Like ──────────────────────────────────────────────────────────────────────

export function animLike_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // happy hop + glow pop
  t.to(r.body,  { scaleX: 1.12, scaleY: 0.9, duration: 0.09, ease: 'power2.in' })
   .to(r.wrap,  { y: -22, duration: 0.24, ease: 'power2.out' }, '<')
   .to(r.body,  { scaleX: 0.93, scaleY: 1.12, duration: 0.16, ease: 'power3.out' })
   .to(r.wrap,  { y: 0, duration: 0.2, ease: 'bounce.out' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.2, ease: 'elastic.out(1, 0.4)' })
   .to(r.eyeL,  { scaleY: 0.28, duration: 0.14, ease: 'power3.in' }, 0.35)
   .to(r.eyeR,  { scaleY: 0.28, duration: 0.14, ease: 'power3.in' }, 0.35)
   .to(r.eyeL,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, 0.52)
   .to(r.eyeR,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, 0.52)
   .to(r.glow,  { scale: 1.9, opacity: 1, duration: 0.18, ease: 'power3.out' }, 0.2)
   .to(r.glow,  { scale: 1.1, opacity: 0.7, duration: 0.55, ease: 'power2.out' }, 0.38);
  burstParticles(r, '#fbbf24', 6);
  return t;
}

export function animLike_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // scale pop + double pulse
  t.to(r.body, { scaleX: 1.18, scaleY: 1.18, duration: 0.18, ease: 'power3.out' })
   .to(r.body, { scaleX: 1.02, scaleY: 1.02, duration: 0.25, ease: 'back.out(2)' })
   .to(r.body, { scaleX: 1.1,  scaleY: 1.1,  duration: 0.14, ease: 'power3.out' })
   .to(r.body, { scaleX: 1,    scaleY: 1,    duration: 0.3,  ease: 'elastic.out(1, 0.5)' })
   .to(r.glow, { scale: 1.7, opacity: 1, duration: 0.18, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1.4, opacity: 0.8, duration: 0.2, ease: 'power2.out' }, 0.18)
   .to(r.glow, { scale: 1.6, opacity: 1,   duration: 0.14, ease: 'power3.out' }, 0.38)
   .to(r.glow, { scale: 1.1, opacity: 0.65, duration: 0.4, ease: 'power2.out' }, 0.52);
  burstParticles(r, '#f59e0b', 5);
  return t;
}

// ── Excited ───────────────────────────────────────────────────────────────────

export function animExcited_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // rapid shimmy + eye pop
  t.to(r.wrap, { x: -6, duration: 0.08, ease: 'power2.out' })
   .to(r.wrap, { x:  6, duration: 0.14, ease: 'power2.inOut' })
   .to(r.wrap, { x: -5, duration: 0.12, ease: 'power2.inOut' })
   .to(r.wrap, { x:  5, duration: 0.12, ease: 'power2.inOut' })
   .to(r.wrap, { x: -3, duration: 0.1,  ease: 'power2.inOut' })
   .to(r.wrap, { x:  0, duration: 0.14, ease: 'back.out(2)' })
   .to([r.eyeL, r.eyeR], { scaleX: 1.3, scaleY: 1.3, duration: 0.22, ease: 'back.out(3)' }, 0)
   .to([r.eyeL, r.eyeR], { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'back.out(1.5)' }, 0.5)
   .to(r.glow, { scale: 1.5, opacity: 1, duration: 0.2, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1.1, opacity: 0.7, duration: 0.5, ease: 'power2.out' });
  return t;
}

// ── Wave ──────────────────────────────────────────────────────────────────────

export function animWave_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap, { x: -14, duration: 0.18, ease: 'power2.out' })
   .to(r.wrap, { x:  14, duration: 0.32, ease: 'power2.inOut' })
   .to(r.wrap, { x: -10, duration: 0.24, ease: 'power2.inOut' })
   .to(r.wrap, { x:  10, duration: 0.24, ease: 'power2.inOut' })
   .to(r.wrap, { x:   0, duration: 0.22, ease: 'back.out(1.5)' })
   .to(r.glow, { scale: 1.25, opacity: 0.85, duration: 0.3, ease: 'power2.out' }, 0)
   .to(r.glow, { scale: 1, opacity: 0.6, duration: 0.5, ease: 'power2.out' }, 0.5);
  return t;
}

export function animWave_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // big enthusiastic wave + tiny hop
  t.to(r.wrap, { y: -8, x: -16, duration: 0.2, ease: 'power2.out' })
   .to(r.wrap, { y:  0, x:  16, duration: 0.3, ease: 'power2.inOut' })
   .to(r.wrap, { y: -6, x: -12, duration: 0.22, ease: 'power2.inOut' })
   .to(r.wrap, { y:  0, x:  12, duration: 0.22, ease: 'power2.inOut' })
   .to(r.wrap, { y:  0, x:   0, duration: 0.3,  ease: 'back.out(1.5)' })
   .to(r.body, { scaleX: 1.06, scaleY: 1.06, duration: 0.2, ease: 'back.out(2)' }, 0)
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, 0.2)
   .to(r.glow, { scale: 1.35, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1, opacity: 0.65, duration: 0.6, ease: 'power2.out' });
  return t;
}

// ── Spin ──────────────────────────────────────────────────────────────────────

export function animSpin_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body, { scaleX: 1.08, scaleY: 0.94, duration: 0.1, ease: 'power2.in' })
   .to(r.wrap, { rotation: 360, duration: 0.5, ease: 'power2.inOut' })
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
   .to(r.glow, { scale: 1.4, opacity: 1, duration: 0.2, ease: 'power3.out' }, 0.1)
   .to(r.glow, { scale: 1, opacity: 0.6, duration: 0.45, ease: 'power2.out' }, 0.3);
  return t;
}

export function animSpin_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // double spin
  t.to(r.body, { scaleX: 1.1, scaleY: 0.92, duration: 0.1, ease: 'power2.in' })
   .to(r.wrap, { rotation: 720, duration: 0.85, ease: 'power2.inOut' })
   .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.35)' })
   .to(r.glow, { scale: 1.6, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0.1)
   .to(r.glow, { scale: 1, opacity: 0.6, duration: 0.6, ease: 'power2.out' }, 0.35);
  burstParticles(r, '#c084fc', 6);
  return t;
}

// ── Dance ─────────────────────────────────────────────────────────────────────

export function animDance_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  t.to(r.wrap, { x: -12, rotation: -5, duration: 0.28, ease: 'sine.inOut' })
   .to(r.wrap, { x:  12, rotation:  5, duration: 0.56, ease: 'sine.inOut' })
   .to(r.wrap, { x:   0, rotation:  0, duration: 0.28, ease: 'sine.inOut' });
  t.to(r.body, { scaleX: 1.04, scaleY: 0.97, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

export function animDance_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline({ repeat: -1 });
  // bounce dance
  t.to(r.body,  { scaleX: 1.1, scaleY: 0.9, duration: 0.1, ease: 'power2.in' })
   .to(r.wrap,  { y: -12, duration: 0.18, ease: 'power2.out' })
   .to(r.body,  { scaleX: 0.93, scaleY: 1.1, duration: 0.12, ease: 'power3.out' })
   .to(r.wrap,  { y: 0, duration: 0.15, ease: 'bounce.out' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'back.out(2)' });
  t.to(r.glow, { scale: 1.2, opacity: 0.9, duration: 0.18, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
  return t;
}

// ── Giggle ────────────────────────────────────────────────────────────────────

export function animGiggle_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap, { x: -4, duration: 0.06, ease: 'power2.out' })
   .to(r.wrap, { x:  4, duration: 0.1,  ease: 'power2.inOut' })
   .to(r.wrap, { x: -3, duration: 0.08, ease: 'power2.inOut' })
   .to(r.wrap, { x:  3, duration: 0.08, ease: 'power2.inOut' })
   .to(r.wrap, { x: -2, duration: 0.07, ease: 'power2.inOut' })
   .to(r.wrap, { x:  0, duration: 0.1,  ease: 'back.out(2)' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.2, duration: 0.1, ease: 'power3.in' }, 0.1)
   .to([r.eyeL, r.eyeR], { scaleY: 1,   duration: 0.15, ease: 'back.out(2)' }, 0.3)
   .to(r.glow, { scale: 1.35, opacity: 0.9, duration: 0.15, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1,    opacity: 0.6, duration: 0.4,  ease: 'power2.out' }, 0.15);
  return t;
}

export function animGiggle_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // three rapid mini-hops
  for (let i = 0; i < 3; i++) {
    t.to(r.body,  { scaleX: 1.1, scaleY: 0.92, duration: 0.07, ease: 'power2.in' })
     .to(r.wrap,  { y: -8, duration: 0.13, ease: 'power2.out' }, '<')
     .to(r.body,  { scaleX: 0.94, scaleY: 1.08, duration: 0.09, ease: 'power3.out' })
     .to(r.wrap,  { y: 0,  duration: 0.11, ease: 'bounce.out' })
     .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.08, ease: 'power2.out' });
  }
  t.to(r.glow, { scale: 1.4, opacity: 1, duration: 0.15, ease: 'power3.out' }, 0)
   .to(r.glow, { scale: 1, opacity: 0.65, duration: 0.5, ease: 'power2.out' }, 0.15);
  burstParticles(r, '#a78bfa', 5);
  return t;
}

// ── Shy ───────────────────────────────────────────────────────────────────────

export function animShy_A(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 0.9, scaleY: 0.9, duration: 0.5, ease: 'power2.inOut' })
   .to(r.wrap,  { x: -8, rotation: 4, duration: 0.5, ease: 'power2.inOut' }, '<')
   .to([r.eyeL, r.eyeR], { y: 3, scaleY: 0.6, duration: 0.4, ease: 'power2.inOut' }, '<')
   .to(r.glow,  { scale: 0.75, opacity: 0.25, duration: 0.6, ease: 'power2.in' }, 0);
  return t;
}

export function animShy_B(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // peek: shrink down, wait, slowly come back
  t.to(r.wrap,  { scale: 0.75, y: 12, duration: 0.5, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.15, duration: 0.35, ease: 'power3.in' }, 0.1)
   .to(r.glow,  { scale: 0.6, opacity: 0.15, duration: 0.5, ease: 'power2.in' }, 0)
   .to(r.wrap,  { scale: 1, y: 0, duration: 1, ease: 'back.out(1.5)', delay: 0.5 })
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.7')
   .to(r.glow,  { scale: 1, opacity: 0.5, duration: 0.8, ease: 'power2.out' }, '-=0.8');
  return t;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SAMSUNG TV STATES
═══════════════════════════════════════════════════════════════════════════ */

export function animQRReady(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 1.06, scaleY: 1.06, y: -5, duration: 0.5, ease: 'back.out(1.8)' })
   .to([r.eyeL, r.eyeR], { scaleX: 1.35, scaleY: 1.35, duration: 0.35, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow,  { scale: 1.4, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
   // pulse loop
   .to(r.glow,  { scale: 1.25, opacity: 0.75, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return t;
}

export function animPurchaseComplete(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  for (let i = 0; i < 3; i++) {
    const h = [30, 22, 15][i];
    t.to(r.body, { scaleX: 1.14, scaleY: 0.87, duration: 0.09, ease: 'power2.in' })
     .to(r.wrap, { y: -h, duration: 0.22, ease: 'power2.out' }, '<')
     .to(r.body, { scaleX: 0.91, scaleY: 1.13, duration: 0.15, ease: 'power3.out' })
     .to(r.wrap, { y: 0, duration: 0.18, ease: 'bounce.out' })
     .to(r.body, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'back.out(2)' });
  }
  t.to(r.wrap, { rotation: 360, duration: 0.5, ease: 'power2.inOut' }, 0.3)
   .to(r.glow, { scale: 2.2, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0.3)
   .to(r.glow, { scale: 1.2, opacity: 0.8, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
  burstParticles(r, '#fde68a', 10);
  return t;
}

export function animNoResults(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap,  { y: 8, duration: 1.2, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x: -8, duration: 0.3, ease: 'power2.inOut' }, 0.4)
   .to([r.eyeL, r.eyeR], { x:  8, duration: 0.6, ease: 'power2.inOut', delay: 0.3 }, '>0')
   .to([r.eyeL, r.eyeR], { x:  0, duration: 0.3, ease: 'power2.inOut' })
   .to(r.glow,  { scale: 0.75, opacity: 0.2, duration: 1.5, ease: 'power2.in' }, 0)
   .to(r.wrap,  { y: 3, duration: 0.8, ease: 'power2.out', delay: 0.5 })
   .to(r.glow,  { scale: 0.9, opacity: 0.4, duration: 0.8, ease: 'power2.out' }, '-=0.8');
  return t;
}

export function animRetry(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // determined: lean back (anticipate) → surge forward → scan ready
  t.to(r.wrap,  { rotation: -8, y: 4, scale: 0.95, duration: 0.3, ease: 'power2.in' })
   .to(r.glow,  { scale: 0.7, opacity: 0.3, duration: 0.3, ease: 'power2.in' }, '<')
   .to(r.wrap,  { rotation: 3, y: -6, scale: 1.06, duration: 0.45, ease: 'back.out(2)' })
   .to(r.glow,  { scale: 1.6, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.3')
   .to(r.wrap,  { rotation: 0, y: 0, scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' })
   .to(r.glow,  { scale: 1.1, opacity: 0.75, duration: 0.4, ease: 'power2.out' })
   .to([r.eyeL, r.eyeR], { x: -6, duration: 0.3, ease: 'power2.inOut' }, 0.5)
   .to([r.eyeL, r.eyeR], { x:  6, duration: 0.5, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x:  0, duration: 0.3, ease: 'back.out(2)' });
  return t;
}

/* ─── Stretch & Yawn ────────────────────────────────────────────────────── */

export function animStretch(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 0.87, scaleY: 1.22, duration: 0.8, ease: 'power1.inOut' })
   .to(r.shadow,{ scaleX: 0.82, opacity: 0.3, duration: 0.8, ease: 'power1.inOut' }, '<')
   .to(r.body,  { scaleX: 1.15, scaleY: 0.88, duration: 0.5, ease: 'power2.inOut' })
   .to(r.body,  { scaleX: 1,    scaleY: 1,    duration: 0.6, ease: 'elastic.out(1, 0.5)' })
   .to(r.shadow,{ scaleX: 1, opacity: 0.5, duration: 0.6, ease: 'power2.out' }, '-=0.5');
  return t;
}

export function animYawn(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 1.08, scaleY: 1.12, duration: 1.2, ease: 'power1.inOut' })
   .to(r.wrap,  { rotation: -5, duration: 1.2, ease: 'power1.inOut' }, '<')
   .to([r.eyeL, r.eyeR], { scaleY: 0.1, duration: 0.8, ease: 'power2.inOut' }, 0.3)
   .to(r.glow,  { scale: 0.8, opacity: 0.2, duration: 1.2, ease: 'power2.inOut' }, 0)
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 1, ease: 'power2.inOut' }, '+=0.4')
   .to(r.wrap,  { rotation: 0, duration: 0.8, ease: 'power2.inOut' }, '<')
   .to([r.eyeL, r.eyeR], { scaleY: 0.85, duration: 0.5, ease: 'power2.out' }, '-=0.6')
   .to(r.glow,  { scale: 0.9, opacity: 0.4, duration: 0.8, ease: 'power2.out' }, '-=0.7');
  return t;
}

/* ─── Peek ──────────────────────────────────────────────────────────────── */

export function animPeek(r: MascotRefs) {
  clearParts(r);
  gsap.set(r.wrap, { y: 40, opacity: 0, scale: 0.7 });
  const t = gsap.timeline();
  t.to(r.wrap,  { y: -6, opacity: 1, scale: 1.04, duration: 0.7, ease: 'back.out(2)' })
   .to(r.wrap,  { y: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
   .to([r.eyeL, r.eyeR], { x: 5, scaleX: 1.2, scaleY: 1.2, duration: 0.35, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow,  { scale: 1.25, opacity: 0.85, duration: 0.5, ease: 'power2.out' }, '-=0.4');
  return t;
}

/* ─── Proud ─────────────────────────────────────────────────────────────── */

export function animProud(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 1.08, scaleY: 1.08, y: -6, duration: 0.6, ease: 'back.out(1.8)' })
   .to(r.wrap,  { rotation: -3, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.4')
   .to(r.glow,  { scale: 1.4, opacity: 1, duration: 0.55, ease: 'power2.out' }, '-=0.4')
   .to([r.eyeL, r.eyeR], { scaleX: 1.15, scaleY: 1.1, duration: 0.35, ease: 'back.out(2)' }, '-=0.3')
   // hold and breathe with satisfaction
   .to(r.body,  { scaleX: 1.04, scaleY: 1.05, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 1 });
  return t;
}

/* ─── Encouraging ───────────────────────────────────────────────────────── */

export function animEncouraging(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap,  { rotation: 5, y: -4, scale: 1.05, duration: 0.55, ease: 'back.out(1.8)' })
   .to([r.eyeL, r.eyeR], { scaleX: 1.3, scaleY: 1.3, x: 3, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
   .to(r.glow,  { scale: 1.35, opacity: 1, duration: 0.45, ease: 'power2.out' }, '-=0.35')
   // gentle bob loop
   .to(r.wrap,  { y: -8, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 3 });
  return t;
}

/* ─── Wink ──────────────────────────────────────────────────────────────── */

export function animWink(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.eyeR, { scaleY: 0.05, duration: 0.1, ease: 'power3.in' })
   .to(r.wrap,  { rotation: 4, duration: 0.2, ease: 'back.out(1.5)' }, '<')
   .to(r.eyeR, { scaleY: 1,    duration: 0.16, ease: 'back.out(3)' }, '+=0.25')
   .to(r.wrap,  { rotation: 0, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.15')
   .to(r.glow,  { scale: 1.3, opacity: 0.9, duration: 0.2, ease: 'power2.out' }, 0.15)
   .to(r.glow,  { scale: 1, opacity: 0.6, duration: 0.4, ease: 'power2.out' }, 0.35);
  return t;
}

/* ─── Kiss ──────────────────────────────────────────────────────────────── */

export function animKiss(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.wrap,  { scale: 1.07, y: -5, rotation: -6, duration: 0.55, ease: 'back.out(1.8)' })
   .to(r.glow,  { scale: 1.6, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.3')
   .to([r.eyeL, r.eyeR], { scaleY: 0.2, duration: 0.18, ease: 'power3.in' }, '-=0.2')
   .to(r.glow,  { scale: 1.8, opacity: 0.9, duration: 0.3, ease: 'sine.inOut' })
   .to(r.glow,  { scale: 1.2, opacity: 0.75, duration: 0.5, ease: 'power2.out' })
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.22, ease: 'back.out(2)' }, '-=0.3')
   .to(r.wrap,  { scale: 1, y: 0, rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, '-=0.2');
  burstParticles(r, '#f9a8d4', 5);
  return t;
}

/* ─── RecoAccepted / RecoRejected ───────────────────────────────────────── */

export function animRecoAccepted(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  t.to(r.body,  { scaleX: 1.1, scaleY: 1.1, y: -8, duration: 0.45, ease: 'back.out(1.8)' })
   .to(r.glow,  { scale: 1.55, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.3')
   .to(r.eyeL,  { scaleY: 0.3, duration: 0.14, ease: 'power3.in' }, '-=0.2')
   .to(r.eyeR,  { scaleY: 0.3, duration: 0.14, ease: 'power3.in' }, '<')
   .to(r.wrap,  { y: 0, duration: 0.35, ease: 'bounce.out' })
   .to(r.body,  { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' })
   .to(r.eyeL,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, '-=0.25')
   .to(r.eyeR,  { scaleY: 1, duration: 0.2, ease: 'back.out(2)' }, '<')
   .to(r.glow,  { scale: 1.1, opacity: 0.7, duration: 0.5, ease: 'power2.out' });
  burstParticles(r, '#86efac', 5);
  return t;
}

export function animRecoRejected(r: MascotRefs) {
  clearParts(r);
  const t = gsap.timeline();
  // "Okay, recalibrating" — calm determined pivot
  t.to(r.wrap,  { rotation: -5, y: 2, duration: 0.4, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { scaleY: 0.65, duration: 0.35, ease: 'power2.inOut' }, '<')
   .to(r.glow,  { scale: 0.85, opacity: 0.4, duration: 0.45, ease: 'power2.in' }, '<')
   .to(r.wrap,  { rotation:  5, duration: 0.45, ease: 'power2.inOut' })
   .to(r.wrap,  { rotation:  0, y: 0, duration: 0.35, ease: 'back.out(1.5)' })
   .to([r.eyeL, r.eyeR], { scaleY: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.3')
   // scan ready to try again
   .to([r.eyeL, r.eyeR], { x: -6, duration: 0.28, ease: 'power2.inOut' })
   .to([r.eyeL, r.eyeR], { x:  6, duration: 0.45, ease: 'power2.inOut', delay: 0.15 })
   .to([r.eyeL, r.eyeR], { x:  0, duration: 0.28, ease: 'back.out(1.5)' })
   .to(r.glow,  { scale: 1.15, opacity: 0.8, duration: 0.5, ease: 'power2.out' }, '-=0.5');
  return t;
}
