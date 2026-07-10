/**
 * L0ToL1Transition
 *
 * Phase machine:
 *   STAGING    → background dims; mascot + CTA detach and drift to bottom-center
 *   READING    → status text + scan ring appear around background image
 *   SCANNING   → ring converges toward mascot; image thumbnail flies INTO mascot
 *   CAPTURING  → mascot absorb-pulse; CTA chip + capture thumbnail fly to top-right
 *   COMPLETE   → onComplete() fires
 */

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { FeedItem } from '../../data/types';
import AgentMascot from '../Shared/AgentMascot';

/* ── Timing (ms) ─────────────────────────────────────────────────────── */
const T_DIM        = 500;
const T_MOVE       = 750;
const T_STATUS     = 400;
const T_SCAN_IN    = 350;
const T_SCAN_HOLD  = 250;
const T_INGEST     = 680;   // thumbnail flies into mascot (same window as ring converge)
const T_SCAN_OUT   = 680;   // ring converges — runs in parallel with T_INGEST
const T_ABSORB     = 400;   // glow burst after image lands in mascot
const T_CAPTURE    = 820;
const T_HOLD_END   = 400;

/* ── Layout constants ─────────────────────────────────────────────────── */
const STACK_BOTTOM_Y = 96;
const MASCOT_SIZE    = 72;
const STACK_GAP      = 14;
const CHIP_H         = 56;
const STATUS_H       = 24;

/* Ingest thumbnail — materialises at screen center and flies into the mascot */
const INGEST_W = 200;
const INGEST_H = 112;

/* Top-right capture destination */
const THUMB_W = 164;
const THUMB_H = 92;
const THUMB_R = 56;
const THUMB_T = 88;

const AGENT_STATUS = 'Picking this up…';

const W = 1920;
const H = 1080;

type Phase = 'STAGING' | 'READING' | 'SCANNING' | 'CAPTURING' | 'COMPLETE';

type Props = {
  item:       FeedItem;
  ctaLabel:   string;
  ctaRect:    DOMRect;
  onComplete: () => void;
};

export default function L0ToL1Transition({ item, ctaLabel, ctaRect, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('STAGING');

  const dimRef        = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const mascotGlowRef = useRef<HTMLDivElement>(null);
  const statusRef     = useRef<HTMLDivElement>(null);
  const chipRef       = useRef<HTMLDivElement>(null);
  const scanRingRef   = useRef<HTMLDivElement>(null);
  const ingestRef     = useRef<HTMLDivElement>(null);  // thumbnail flying INTO mascot
  const thumbRef      = useRef<HTMLDivElement>(null);  // thumbnail flying to top-right
  const overlayRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delay = (ms: number) =>
      new Promise<void>(res => { const t = setTimeout(res, ms); timers.push(t); });

    async function run() {
      const srcX = (ctaRect.left  + ctaRect.width  / 2) - W / 2;
      const srcY = (ctaRect.top   + ctaRect.height / 2) - H / 2;

      const chipBottomY   = H / 2 - STACK_BOTTOM_Y;
      const chipCenterY   = chipBottomY - CHIP_H / 2;
      const statusCenterY = chipCenterY  - CHIP_H / 2 - STACK_GAP - STATUS_H / 2;
      const mascotCenterY = statusCenterY - STATUS_H / 2 - STACK_GAP - MASCOT_SIZE / 2;
      const targetX = 0;

      /* Top-right capture destination (stage-center coords) */
      const thumbX   = W / 2 - THUMB_R - THUMB_W / 2;
      const thumbY   = -(H / 2 - THUMB_T - THUMB_H / 2);
      const capChipY = thumbY + THUMB_H / 2 + STACK_GAP + CHIP_H / 2;
      const capChipX = thumbX;

      if (!mascotRef.current || !chipRef.current || !statusRef.current) return;

      /* ── Initial positions ──────────────────────────────────── */
      gsap.set(mascotRef.current,  { x: srcX - MASCOT_SIZE / 2, y: srcY - MASCOT_SIZE / 2, opacity: 0, scale: 0.75 });
      gsap.set(chipRef.current,    { x: srcX, y: srcY, opacity: 0, scale: 0.9, xPercent: -50, yPercent: -50 });
      gsap.set(statusRef.current,  { x: targetX, y: statusCenterY, opacity: 0, xPercent: -50, yPercent: -50 });
      gsap.set(scanRingRef.current,{ opacity: 0, scale: 1 });
      gsap.set(mascotGlowRef.current, { opacity: 0, scale: 1 });
      /* Ingest thumb — starts at screen center */
      gsap.set(ingestRef.current,  { x: 0, y: 0, opacity: 0, scale: 1, xPercent: -50, yPercent: -50 });
      /* Capture thumb — starts hidden at top-right target */
      gsap.set(thumbRef.current,   { x: thumbX, y: thumbY, opacity: 0, scale: 0.7, xPercent: -50, yPercent: -50 });

      /* ── STAGING ────────────────────────────────────────────── */
      gsap.to(dimRef.current, { opacity: 1, duration: T_DIM / 1000, ease: 'power2.out' });

      await delay(120);
      if (cancelled) return;

      gsap.to(mascotRef.current, {
        x: targetX - MASCOT_SIZE / 2, y: mascotCenterY - MASCOT_SIZE / 2,
        opacity: 1, scale: 1,
        duration: T_MOVE / 1000, ease: 'power3.out',
      });
      gsap.to(chipRef.current, {
        x: targetX, y: chipCenterY,
        opacity: 1, scale: 1,
        duration: T_MOVE / 1000, ease: 'power3.out',
      });

      await delay(T_MOVE);
      if (cancelled) return;

      /* ── READING ────────────────────────────────────────────── */
      setPhase('READING');
      gsap.to(statusRef.current,   { opacity: 1, duration: T_STATUS / 1000, ease: 'power2.out' });
      gsap.to(scanRingRef.current, { opacity: 1, duration: T_SCAN_IN / 1000, ease: 'power2.out' });

      await delay(T_STATUS + T_SCAN_IN + T_SCAN_HOLD);
      if (cancelled) return;

      /* ── SCANNING: ring shrinks + image flies INTO mascot ───── */
      setPhase('SCANNING');

      /* Ring converges toward mascot position */
      const mascotAbsY = H / 2 + mascotCenterY + MASCOT_SIZE / 2;
      const originYPct = ((mascotAbsY - 8) / (H - 16) * 100).toFixed(1) + '%';

      gsap.to(scanRingRef.current, {
        scale: 0, opacity: 0,
        duration: T_SCAN_OUT / 1000, ease: 'power2.in',
        transformOrigin: `50% ${originYPct}`,
      });

      /* Ingest thumbnail: materialise at screen center, then arc into mascot */
      gsap.to(ingestRef.current, {
        opacity: 0.92,
        duration: 0.15, ease: 'power1.out',
      });
      /* Short beat so ring and thumb appear together, then both converge */
      await delay(120);
      if (cancelled) return;

      gsap.to(ingestRef.current, {
        x: targetX,
        y: mascotCenterY,
        scale: 0,
        opacity: 0,
        duration: (T_INGEST - 120) / 1000,
        ease: 'power3.in',
      });

      await delay(T_INGEST);
      if (cancelled) return;

      /* ── ABSORB: mascot glow pulse ──────────────────────────── */
      gsap.fromTo(mascotGlowRef.current,
        { opacity: 0.9, scale: 0.95 },
        { opacity: 0, scale: 2.8, duration: T_ABSORB / 1000, ease: 'power2.out' }
      );

      await delay(T_ABSORB);
      if (cancelled) return;

      /* ── CAPTURING: CTA chip + capture thumbnail → top-right ── */
      setPhase('CAPTURING');

      gsap.to(statusRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in' });
      gsap.to(mascotRef.current, { opacity: 0.28, scale: 0.58, duration: 0.35, ease: 'power2.in' });

      gsap.to(thumbRef.current, {
        opacity: 1, scale: 1,
        duration: T_CAPTURE / 1000, ease: 'power3.inOut',
      });
      gsap.to(chipRef.current, {
        x: capChipX, y: capChipY,
        scale: 0.78,
        duration: T_CAPTURE / 1000, ease: 'power3.inOut',
      });

      await delay(T_CAPTURE + T_HOLD_END);
      if (cancelled) return;

      setPhase('COMPLETE');
      onComplete();
    }

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      gsap.killTweensOf([
        dimRef.current, mascotRef.current, mascotGlowRef.current,
        chipRef.current, statusRef.current, scanRingRef.current,
        ingestRef.current, thumbRef.current, overlayRef.current,
      ]);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const agentMode = (phase === 'READING' || phase === 'SCANNING') ? 'thinking' : 'looking';

  return (
    <div
      ref={overlayRef}
      style={{ position: 'absolute', inset: 0, zIndex: 200, overflow: 'hidden', pointerEvents: 'all' }}
    >
      {/* Dim layer */}
      <div ref={dimRef} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        opacity: 0, pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Scan ring — glowing border that converges toward the agent */}
      <div ref={scanRingRef} style={{
        position: 'absolute', inset: 8,
        border: '3px solid rgba(167,134,229,0.80)',
        borderRadius: 16,
        boxShadow: [
          '0 0 48px rgba(167,134,229,0.50)',
          '0 0 100px rgba(167,134,229,0.20)',
          'inset 0 0 48px rgba(167,134,229,0.14)',
        ].join(', '),
        opacity: 0, pointerEvents: 'none', zIndex: 5,
      }} />

      {/* Ingest thumbnail — materialises at center and flies INTO the mascot */}
      <div ref={ingestRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: INGEST_W, height: INGEST_H,
        borderRadius: 12,
        backgroundImage: `url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0, zIndex: 8, pointerEvents: 'none',
        boxShadow: [
          '0 8px 32px rgba(0,0,0,0.60)',
          '0 0 0 2.5px rgba(167,134,229,0.70)',
          '0 0 40px 8px rgba(167,134,229,0.35)',
        ].join(', '),
      }} />

      {/* Mascot + glow ring behind it (absorb pulse) */}
      <div ref={mascotRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 10, willChange: 'transform, opacity', opacity: 0,
      }}>
        {/* Absorption glow ring — expands outward when image is ingested */}
        <div ref={mascotGlowRef} style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,134,229,0.70) 0%, rgba(112,71,226,0.30) 50%, transparent 75%)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }} />
        <AgentMascot agentMode={agentMode} size={MASCOT_SIZE} />
      </div>

      {/* Agent status text */}
      <div ref={statusRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 10, opacity: 0, willChange: 'opacity',
        fontSize: 18, fontWeight: 500,
        color: 'rgba(255,255,255,0.70)',
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
        letterSpacing: '0.01em', whiteSpace: 'nowrap', textAlign: 'center',
        pointerEvents: 'none',
      }}>
        {AGENT_STATUS}
      </div>

      {/* CTA chip — moves from bottom-center to top-right during CAPTURING */}
      <div ref={chipRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        zIndex: 10, willChange: 'transform, opacity', opacity: 0,
        display: 'inline-flex', alignItems: 'center',
        height: CHIP_H, paddingLeft: 20, paddingRight: 24,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.22), 0 0 32px 8px rgba(112,71,226,0.30)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 17, fontWeight: 600, color: '#111',
          fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          whiteSpace: 'nowrap',
        }}>
          {ctaLabel}
        </span>
      </div>

      {/* Capture thumbnail — appears at top-right during CAPTURING */}
      <div ref={thumbRef} style={{
        position: 'absolute', top: '50%', left: '50%',
        width: THUMB_W, height: THUMB_H,
        borderRadius: 10,
        backgroundImage: `url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0, zIndex: 15, pointerEvents: 'none',
        boxShadow: '0 6px 24px rgba(0,0,0,0.55), 0 0 0 2px rgba(167,134,229,0.55)',
      }} />
    </div>
  );
}
