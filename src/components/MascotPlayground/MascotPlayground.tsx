import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MASCOT_STATES, CATEGORY_META, type MascotState } from './mascotStates';
import { faceReset, type FaceRefs, EXPRESSION_INFO } from './mascotFace';
import * as F from './mascotFace';
import './MascotPlayground.css';

/* ─── Animation dispatch ────────────────────────────────────────────────────── */
type AnimFn = (r: FaceRefs) => gsap.core.Timeline | void;

const ANIM_MAP: Record<string, [AnimFn, AnimFn, AnimFn, AnimFn]> = {
  'idle':       [F.faceIdle_A,       F.faceIdle_B,       F.faceIdle_C,       F.faceIdle_D],
  'thinking':   [F.faceThinking_A,   F.faceThinking_B,   F.faceThinking_C,   F.faceThinking_D],
  'happy':      [F.faceHappy_A,      F.faceHappy_B,      F.faceHappy_C,      F.faceHappy_D],
  'sorry':      [F.faceSorry_A,      F.faceSorry_B,      F.faceSorry_C,      F.faceSorry_D],
  'listening':  [F.faceListening_A,  F.faceListening_B,  F.faceListening_C,  F.faceListening_D],
  'speaking':   [F.faceSpeaking_A,   F.faceSpeaking_B,   F.faceSpeaking_C,   F.faceSpeaking_D],
  'searching':  [F.faceSearching_A,  F.faceSearching_B,  F.faceSearching_C,  F.faceSearching_D],
  'processing': [F.faceProcessing_A, F.faceProcessing_B, F.faceProcessing_C, F.faceProcessing_D],
  'waiting':    [F.faceWaiting_A,    F.faceWaiting_B,    F.faceWaiting_C,    F.faceWaiting_D],
  'sleep':            [F.faceSleep_A,            F.faceSleep_B,            F.faceSleep_C,            F.faceSleep_D],
  'yawn':             [F.faceYawn_A,             F.faceYawn_B,             F.faceYawn_C,             F.faceYawn_D],
  'wake-from-sleep':  [F.faceWakeFromSleep_A,    F.faceWakeFromSleep_B,    F.faceWakeFromSleep_C,    F.faceWakeFromSleep_D],
  'idle-personality': [F.faceIdlePersonality_A,  F.faceIdlePersonality_B,  F.faceIdlePersonality_C,  F.faceIdlePersonality_D],
  'laughing':         [F.faceLaughing_A,          F.faceLaughing_B,          F.faceLaughing_C,          F.faceLaughing_D],
  'wow':              [F.faceWow_A,               F.faceWow_B,               F.faceWow_C,               F.faceWow_D],
};

const CORE_STATE_IDS = ['idle', 'thinking', 'happy', 'sorry', 'listening', 'speaking', 'searching', 'processing', 'waiting', 'sleep', 'yawn', 'wake-from-sleep', 'idle-personality', 'laughing', 'wow'];
const DEMO_STATES = MASCOT_STATES.filter(s => CORE_STATE_IDS.includes(s.id));

/* ─── Small size readability notes ──────────────────────────────────────────── */
const SMALL_NOTES: Record<string, Array<{ rating: 'excellent' | 'good' | 'fair'; text: string }>> = {
  idle: [
    { rating: 'excellent', text: 'Glow pulse + breath read clearly at 90px. Blink is visible.' },
    { rating: 'good',      text: 'Body sway scales well. Lateral eye shift still legible.' },
    { rating: 'good',      text: 'Eye dart registers as a position change. Clear at 90px.' },
    { rating: 'fair',      text: 'Half-height eyes may look flat — increase to 80% for small size.' },
  ],
  thinking: [
    { rating: 'excellent', text: 'Head tilt + narrow eyes are a clear signal. Brows optional.' },
    { rating: 'good',      text: 'Eye asymmetry reads strongly at 90px. One brow is a bonus.' },
    { rating: 'good',      text: 'Scan motion + tilt readable. No brows needed at small size.' },
    { rating: 'good',      text: 'Nod + narrow eyes work well. Stronger glow dim adds clarity.' },
  ],
  happy: [
    { rating: 'excellent', text: 'Glow burst is the dominant signal. Works perfectly without mouth.' },
    { rating: 'good',      text: 'Jump + squint are clear. Smile arc may be too small — hide it.' },
    { rating: 'good',      text: 'Cheeks unreadable at 90px. Glow bloom + squint is sufficient.' },
    { rating: 'excellent', text: 'Glow bloom dominates. No mouth or brows needed.' },
  ],
  sorry: [
    { rating: 'good',      text: 'Eye asymmetry reads at 90px. Brows strengthen the signal.' },
    { rating: 'fair',      text: 'Question mark is unreadable at 90px — hide effects for small.' },
    { rating: 'fair',      text: 'Question marks invisible at 90px — use glow dim as the cue instead.' },
    { rating: 'good',      text: 'Heavy eyes + sincere nod are readable. Brows add weight.' },
  ],
  listening: [
    { rating: 'excellent', text: 'Tall eyes + glow pulse read clearly at 90px. Strong attentive signal.' },
    { rating: 'excellent', text: 'Bounce + wide eyes are a clear "perked up" signal at any size.' },
    { rating: 'good',      text: 'Forward lean is subtle at 90px — rely on eye scale for the signal.' },
    { rating: 'good',      text: 'Sway + eye tracking reads well. Clean at 90px.' },
  ],
  speaking: [
    { rating: 'good',      text: 'Body pulse is visible at 90px. Glow pulse adds clarity.' },
    { rating: 'good',      text: 'Pulse + blink combination reads clearly. Clean signal.' },
    { rating: 'fair',      text: 'Eye movement may be too subtle at 90px — glow pulse carries the state.' },
    { rating: 'excellent', text: 'Sway + glow pulse is the clearest speaking signal at small size.' },
  ],
  searching: [
    { rating: 'excellent', text: 'Eye scan L→R is strong at 90px. Body rotation adds dynamism.' },
    { rating: 'good',      text: 'Vertical sweep reads at 90px. Body follow helps.' },
    { rating: 'good',      text: 'Body rotation + glow sweep is readable. Eyes lag is a bonus.' },
    { rating: 'excellent', text: 'Scan + blink + return is the clearest scanning pattern at small size.' },
  ],
  processing: [
    { rating: 'excellent', text: 'Glow pulse alone is the most readable processing signal at 90px.' },
    { rating: 'good',      text: 'Slow breathing reads as calm patience. Clear at 90px.' },
    { rating: 'fair',      text: 'Eye contraction is barely visible at 90px — reinforce with glow.' },
    { rating: 'good',      text: 'Body heartbeat is readable at 90px. Glow burst confirms state.' },
  ],
  waiting: [
    { rating: 'excellent', text: 'Calm breathing with slightly taller eyes reads as attentive at 90px.' },
    { rating: 'good',      text: 'Long blink reads as patient waiting. Clear and readable.' },
    { rating: 'good',      text: 'Tiny glance is readable at 90px. Subtle but present.' },
    { rating: 'good',      text: 'Gentle sway with breathing reads as comfortable waiting.' },
  ],
  sleep: [
    { rating: 'excellent', text: 'Closed eyes + dim glow is the clearest sleep signal at any size.' },
    { rating: 'excellent', text: 'Long blink into sleep is unmistakable even at 90px.' },
    { rating: 'good',      text: 'Yawn mouth may be too small at 90px — closed eyes + dim glow carries it.' },
    { rating: 'excellent', text: 'Closed eyes + drift is clear. Body drift adds depth without complexity.' },
  ],
};

/* ─── MascotBody ────────────────────────────────────────────────────────────── */
function MascotBody() {
  return (
    <img
      src="/mascot-body.svg"
      alt=""
      style={{ width: 220, height: 220, display: 'block', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

/* ─── Particles ─────────────────────────────────────────────────────────────── */
function Particles({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={containerRef} className="mp-particles-wrap" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="mp-particle" />
      ))}
    </div>
  );
}

/* ─── Mascot refs hook ───────────────────────────────────────────────────────── */
function useMascotRefs() {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const bodyRef      = useRef<HTMLDivElement>(null);
  const glowRef      = useRef<HTMLDivElement>(null);
  const shadowRef    = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const eyeLRef      = useRef<HTMLDivElement>(null);
  const eyeRRef      = useRef<HTMLDivElement>(null);
  const lidLRef      = useRef<HTMLDivElement>(null);
  const lidRRef      = useRef<HTMLDivElement>(null);
  const browLRef     = useRef<HTMLDivElement>(null);
  const browRRef     = useRef<HTMLDivElement>(null);
  const cheekLRef    = useRef<HTMLDivElement>(null);
  const cheekRRef    = useRef<HTMLDivElement>(null);
  const smileRef     = useRef<HTMLDivElement>(null);
  const mouthRef     = useRef<HTMLDivElement>(null);
  const floatARef    = useRef<HTMLDivElement>(null);
  const floatBRef    = useRef<HTMLDivElement>(null);
  const floatCRef    = useRef<HTMLDivElement>(null);
  const floatDRef    = useRef<HTMLDivElement>(null);
  const waveLRef     = useRef<HTMLDivElement>(null);
  const waveRRef     = useRef<HTMLDivElement>(null);
  const magGlassRef  = useRef<HTMLDivElement>(null);
  const scanRingRef  = useRef<HTMLDivElement>(null);
  const zFloat1Ref   = useRef<HTMLDivElement>(null);
  const zFloat2Ref   = useRef<HTMLDivElement>(null);
  const zFloat3Ref   = useRef<HTMLDivElement>(null);
  const handRef      = useRef<HTMLDivElement>(null);

  const getRefs = useCallback((): FaceRefs => ({
    wrap:      wrapRef.current,
    body:      bodyRef.current,
    glow:      glowRef.current,
    shadow:    shadowRef.current,
    particles: particlesRef.current,
    eyeL:      eyeLRef.current,
    eyeR:      eyeRRef.current,
    lidL:      lidLRef.current,
    lidR:      lidRRef.current,
    browL:     browLRef.current,
    browR:     browRRef.current,
    cheekL:    cheekLRef.current,
    cheekR:    cheekRRef.current,
    smile:     smileRef.current,
    mouth:     mouthRef.current,
    floatA:    floatARef.current,
    floatB:    floatBRef.current,
    floatC:    floatCRef.current,
    floatD:    floatDRef.current,
    waveL:     waveLRef.current,
    waveR:     waveRRef.current,
    magGlass:  magGlassRef.current,
    scanRing:  scanRingRef.current,
    zFloat1:   zFloat1Ref.current,
    zFloat2:   zFloat2Ref.current,
    zFloat3:   zFloat3Ref.current,
    hand:      handRef.current,
  }), []);

  return {
    wrapRef, bodyRef, glowRef, shadowRef, particlesRef,
    eyeLRef, eyeRRef, lidLRef, lidRRef,
    browLRef, browRRef, cheekLRef, cheekRRef,
    smileRef, mouthRef,
    floatARef, floatBRef, floatCRef, floatDRef,
    waveLRef, waveRRef, magGlassRef, scanRingRef,
    zFloat1Ref, zFloat2Ref, zFloat3Ref,
    handRef,
    getRefs,
  };
}

type MascotRefs = ReturnType<typeof useMascotRefs>;

/* ─── MascotVisual component ─────────────────────────────────────────────────
   Renders the full multi-layer mascot. Toggle props add CSS classes that use
   visibility:hidden so GSAP tweens still run but elements are not shown.       */
type MascotVisualProps = {
  r: MascotRefs;
  glowColor: string;
  hideEyebrows: boolean;
  hideMouths: boolean;
  hideEffects: boolean;
};

function MascotVisual({ r, glowColor, hideEyebrows, hideMouths, hideEffects }: MascotVisualProps) {
  const cls = [
    'mp-mascot-frame',
    hideEyebrows ? 'mp-hide-brows'   : '',
    hideMouths   ? 'mp-hide-mouth'   : '',
    hideEffects  ? 'mp-hide-effects' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div ref={r.shadowRef} className="mp-shadow" />
      <div ref={r.glowRef} className="mp-glow"
        style={{ background: `radial-gradient(circle, ${glowColor}55 0%, ${glowColor}18 45%, transparent 70%)` }} />

      <div ref={r.wrapRef} className="mp-wrap">
        <div ref={r.bodyRef} className="mp-body">
          <MascotBody />

          <div ref={r.browLRef} className="mp-brow mp-brow-left"  style={{ opacity: 0 }} />
          <div ref={r.browRRef} className="mp-brow mp-brow-right" style={{ opacity: 0 }} />

          <div ref={r.eyeLRef} className="mp-eye-group mp-eye-group-left">
            <div className="mp-eye-glow" />
            <div className="mp-eye-pill" />
          </div>
          <div ref={r.eyeRRef} className="mp-eye-group mp-eye-group-right">
            <div className="mp-eye-glow" />
            <div className="mp-eye-pill" />
          </div>

          <div ref={r.lidLRef} className="mp-lid mp-lid-left" />
          <div ref={r.lidRRef} className="mp-lid mp-lid-right" />

          <div ref={r.smileRef}  className="mp-smile"             style={{ opacity: 0 }} />
          <div ref={r.mouthRef}  className="mp-mouth"             style={{ opacity: 0 }} />
          <div ref={r.cheekLRef} className="mp-cheek mp-cheek-left"  style={{ opacity: 0 }} />
          <div ref={r.cheekRRef} className="mp-cheek mp-cheek-right" style={{ opacity: 0 }} />
        </div>

        <div ref={r.floatARef} className="mp-float mp-float-heart"              style={{ opacity: 0 }}>♥</div>
        <div ref={r.floatBRef} className="mp-float mp-float-question mp-float-q1" style={{ opacity: 0 }}>?</div>
        <div ref={r.floatCRef} className="mp-float mp-float-question mp-float-q2" style={{ opacity: 0 }}>?</div>
        <div ref={r.floatDRef} className="mp-float mp-float-question mp-float-q3" style={{ opacity: 0 }}>?</div>

        {/* Acting props — hidden by default, animated per state */}
        <div ref={r.waveLRef}    className="mp-wave mp-wave-left"  style={{ opacity: 0 }} />
        <div ref={r.waveRRef}    className="mp-wave mp-wave-right" style={{ opacity: 0 }} />
        <div ref={r.magGlassRef} className="mp-mag-glass"          style={{ opacity: 0 }}>🔍</div>
        <div ref={r.scanRingRef} className="mp-scan-ring"          style={{ opacity: 0 }} />
        <div ref={r.zFloat1Ref}  className="mp-z-float mp-z-1"     style={{ opacity: 0 }}>z</div>
        <div ref={r.zFloat2Ref}  className="mp-z-float mp-z-2"     style={{ opacity: 0 }}>z</div>
        <div ref={r.zFloat3Ref}  className="mp-z-float mp-z-3"     style={{ opacity: 0 }}>z</div>
        <div ref={r.handRef}     className="mp-hand"               style={{ opacity: 0 }} />
      </div>

      <Particles containerRef={r.particlesRef} />
    </div>
  );
}

/* ─── Scaled mascot preview ──────────────────────────────────────────────────
   Uses transform: scale with transform-origin top-left on a correctly-sized
   wrapper so the container collapses to the visual size.                       */
const FRAME_W = 300;
const FRAME_H = 320;

function ScaledMascot({ r, scale, glowColor, hideEyebrows, hideMouths, hideEffects }: MascotVisualProps & { scale: number }) {
  const w = Math.round(FRAME_W * scale);
  const h = Math.round(FRAME_H * scale);
  return (
    <div style={{ width: w, height: h, position: 'relative', overflow: 'visible', flexShrink: 0 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        <MascotVisual r={r} glowColor={glowColor} hideEyebrows={hideEyebrows} hideMouths={hideMouths} hideEffects={hideEffects} />
      </div>
    </div>
  );
}

/* ─── Toggle button ──────────────────────────────────────────────────────────── */
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <button className={`mp-toggle ${value ? 'mp-toggle--on' : 'mp-toggle--off'}`} onClick={onChange}>
      <span className="mp-toggle-track">
        <span className="mp-toggle-thumb" />
      </span>
      <span className="mp-toggle-label">{label}</span>
    </button>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function MascotPlayground() {
  const [activeState, setActiveState] = useState<MascotState>(DEMO_STATES[0]);
  const [variantIdx,  setVariantIdx]  = useState(0);

  /* Global expression controls */
  const [showEyebrows,  setShowEyebrows]  = useState(true);
  const [showMouths,    setShowMouths]    = useState(true);
  const [showEffects,   setShowEffects]   = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [smallSizeMode, setSmallSizeMode] = useState(false);

  /* Three mascot instances — large, medium, small */
  const rL = useMascotRefs();
  const rM = useMascotRefs();
  const rS = useMascotRefs();

  const tlLRef = useRef<gsap.core.Timeline | null>(null);
  const tlMRef = useRef<gsap.core.Timeline | null>(null);
  const tlSRef = useRef<gsap.core.Timeline | null>(null);

  /* Run the selected animation on all 3 instances simultaneously */
  const runAnimOn = (
    pairs: Array<[MascotRefs, React.MutableRefObject<gsap.core.Timeline | null>]>,
    state: MascotState,
    vIdx: number,
    rm: boolean,
  ) => {
    pairs.forEach(([r, tlRef]) => {
      if (tlRef.current) tlRef.current.kill();
      faceReset(r.getRefs());
      const fns = ANIM_MAP[state.id];
      if (!fns) return;
      const tl = fns[vIdx](r.getRefs());
      if (tl) {
        if (rm) tl.timeScale(0.55);
        tlRef.current = tl;
      }
    });
  };

  const allPairs = (): Array<[MascotRefs, React.MutableRefObject<gsap.core.Timeline | null>]> =>
    [[rL, tlLRef], [rM, tlMRef], [rS, tlSRef]];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = requestAnimationFrame(() => runAnimOn(allPairs(), activeState, variantIdx, reducedMotion));
    return () => cancelAnimationFrame(id);
  }, [activeState, variantIdx, reducedMotion]); // rL/rM/rS refs are stable across renders

  const handleStateClick = (state: MascotState) => {
    if (state.id === activeState.id) setVariantIdx(prev => (prev + 1) % 4);
    else { setActiveState(state); setVariantIdx(0); }
  };

  const handleVariantClick = (idx: number) => {
    if (idx === variantIdx) {
      const id = requestAnimationFrame(() => runAnimOn(allPairs(), activeState, idx, reducedMotion));
      return () => cancelAnimationFrame(id);
    }
    setVariantIdx(idx);
  };

  const catColor = CATEGORY_META[activeState.category].color;
  const info = EXPRESSION_INFO[activeState.id]?.[variantIdx];
  const smallNote = SMALL_NOTES[activeState.id]?.[variantIdx];
  const variant = activeState.variants[variantIdx];

  const visProps = {
    glowColor:    catColor,
    hideEyebrows: !showEyebrows,
    hideMouths:   !showMouths,
    hideEffects:  !showEffects,
  };

  return (
    <div className="mp-root">

      {/* ══ TOP ROW ══════════════════════════════════════════════════════════ */}
      <div className="mp-top-row">

        {/* ── Left: state list + variant list ── */}
        <aside className="mp-sidebar">
          <div className="mp-sidebar-header">
            <h1 className="mp-title">Core Emotions</h1>
            <span className="mp-count">4 emotions · 4 variants each</span>
          </div>

          <div className="mp-sidebar-section-label">States</div>
          <div className="mp-state-list">
            {DEMO_STATES.map(state => (
              <button
                key={state.id}
                className={`mp-state-btn ${activeState.id === state.id ? 'mp-state-btn--active' : ''}`}
                style={activeState.id === state.id ? { borderLeftColor: catColor, background: `${catColor}14` } : {}}
                onClick={() => handleStateClick(state)}
              >
                <span className="mp-state-btn-label">{state.label}</span>
                <span className="mp-state-btn-emotion">{state.emotion}</span>
                {activeState.id === state.id && (
                  <span className="mp-variant-badge-sm" style={{ background: catColor }}>
                    {String.fromCharCode(65 + variantIdx)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mp-sidebar-section-label" style={{ marginTop: 4 }}>Variants</div>
          <div className="mp-variant-sidebar-list">
            {activeState.variants.map((v, i) => (
              <button
                key={v.id}
                className={`mp-variant-sidebar-btn ${variantIdx === i ? 'mp-variant-sidebar-btn--active' : ''}`}
                style={variantIdx === i ? { borderLeftColor: catColor, background: `${catColor}0d` } : {}}
                onClick={() => handleVariantClick(i)}
              >
                <span className="mp-variant-badge-sm"
                  style={variantIdx === i ? { background: catColor } : { background: '#1e1e32', color: '#555' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="mp-variant-sidebar-text">
                  {v.label.replace(/^[A-D]:\s*/, '')}
                </span>
              </button>
            ))}
          </div>

          <div className="mp-sidebar-note">
            Click state to select.<br />
            Click again to cycle variants.
          </div>
        </aside>

        {/* ── Center: large preview ── */}
        <main className="mp-stage">
          <div className="mp-stage-bg"
            style={{ background: `radial-gradient(ellipse at 50% 52%, ${catColor}18 0%, transparent 68%)` }} />

          <div className="mp-stage-label">
            <span className="mp-stage-emotion" style={{ color: catColor }}>{activeState.emotion}</span>
            <span className="mp-stage-state-name">{activeState.label}</span>
            <span className="mp-stage-variant-name">{variant.label}</span>
          </div>

          {/* Large preview — native scale */}
          <div className="mp-large-preview-wrap">
            <MascotVisual r={rL} {...visProps} />
          </div>

          <div className="mp-principles">
            {variant.disneyPrinciples.map(p => (
              <span key={p} className="mp-principle-tag">{p}</span>
            ))}
          </div>
        </main>

        {/* ── Right: medium + small + toggles ── */}
        <aside className="mp-controls">

          {/* Medium preview */}
          <div className="mp-preview-section">
            <div className="mp-preview-section-label">Medium · 158px</div>
            <div className="mp-preview-slot">
              <ScaledMascot r={rM} scale={0.72} {...visProps} />
            </div>
          </div>

          {/* Small preview */}
          <div className="mp-preview-section">
            <div className="mp-preview-section-label">
              Small · 84px
              {smallSizeMode && <span className="mp-size-badge">size mode ON</span>}
            </div>
            <div className={`mp-preview-slot ${smallSizeMode ? 'mp-preview-slot--size-mode' : ''}`}>
              <ScaledMascot r={rS} scale={0.38} {...visProps} />
            </div>
          </div>

          <div className="mp-controls-divider" />

          {/* Global expression controls */}
          <div className="mp-toggles-section">
            <div className="mp-toggles-title">Expression Controls</div>
            <Toggle label="Show Eyebrows"  value={showEyebrows}  onChange={() => setShowEyebrows(v  => !v)} />
            <Toggle label="Show Mouths"    value={showMouths}    onChange={() => setShowMouths(v    => !v)} />
            <Toggle label="Show Effects"   value={showEffects}   onChange={() => setShowEffects(v   => !v)} />
            <Toggle label="Reduced Motion" value={reducedMotion} onChange={() => setReducedMotion(v => !v)} />
            <Toggle label="Small Size Mode" value={smallSizeMode} onChange={() => setSmallSizeMode(v => !v)} />
          </div>

        </aside>
      </div>

      {/* ══ BOTTOM ROW ═══════════════════════════════════════════════════════ */}
      <div className="mp-bottom-row">

        {/* Animation notes */}
        <div className="mp-bottom-panel">
          <div className="mp-bottom-panel-title">Animation Notes</div>
          <div className="mp-bottom-variant-label">{variant.label}</div>
          <div className="mp-bottom-body">{variant.description}</div>
          <div className="mp-bottom-use-case">{activeState.useCase}</div>
        </div>

        {/* Small size readability check */}
        <div className="mp-bottom-panel mp-bottom-panel--mid">
          <div className="mp-bottom-panel-title">Small Size Check · 90px</div>
          {smallNote && (
            <>
              <div className={`mp-readability-badge mp-readability-badge--${smallNote.rating}`}>
                {smallNote.rating.charAt(0).toUpperCase() + smallNote.rating.slice(1)}
              </div>
              <div className="mp-bottom-body">{smallNote.text}</div>
            </>
          )}
          {(!showEffects || !showEyebrows || !showMouths) && (
            <div className="mp-bottom-hint">
              {[
                !showEyebrows && 'Brows hidden',
                !showMouths   && 'Mouth hidden',
                !showEffects  && 'Effects hidden',
              ].filter(Boolean).join(' · ')} — adjust toggles to test readability.
            </div>
          )}
        </div>

        {/* Active layers */}
        <div className="mp-bottom-panel">
          <div className="mp-bottom-panel-title">Active Layers · {activeState.label} {String.fromCharCode(65 + variantIdx)}</div>
          {info && (() => {
            const layers = [
              { key: 'Eyes',    val: info.eye,    hidden: false },
              { key: 'Brows',   val: info.brow,   hidden: !showEyebrows },
              { key: 'Mouth',   val: info.mouth,  hidden: !showMouths },
              { key: 'Effects', val: info.effect, hidden: !showEffects },
            ];
            return (
              <div className="mp-layers-list">
                {layers.map(l => {
                  const isNone = l.val.includes('_None');
                  return (
                    <div key={l.key} className="mp-layer-entry">
                      <span className="mp-layer-key">{l.key}</span>
                      <span className={`mp-layer-val ${
                        l.hidden && !isNone ? 'mp-layer-val--hidden' :
                        isNone             ? 'mp-layer-val--none'   : 'mp-layer-val--active'
                      }`}>
                        {isNone ? 'none' : l.val}
                      </span>
                      {l.hidden && !isNone && (
                        <span className="mp-layer-tag">hidden</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
