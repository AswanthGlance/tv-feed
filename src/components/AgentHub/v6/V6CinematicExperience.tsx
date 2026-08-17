/**
 * V6CinematicExperience — the CINEMATIC variant of Option 6 "Connected Hub"
 * (/agent_hub_final_v2).
 *
 * Same IA, same navigation model, same strip, same sound design as
 * V6Experience — this variant changes the visual hierarchy:
 *
 *   1 · SELECTED EXPLORE MASTHEAD  emotional / contextual / cinematic
 *   2 · EXPLORE                    primary discovery (equal cards, 4×2)
 *   3 · YOUR SPACE                 utilities
 *   4 · SMART TILES                persistent / active context (unchanged)
 * (No Continue row — ongoing threads live on the persistent strip.)
 *
 * The focused Explore card drives the masthead: its imagery becomes the
 * hub's upper background (edge-to-edge atmosphere, never another card), and
 * its label/headline/copy answer "why might I want to do this?". The card
 * itself stays the focused/selectable object — OK on the card opens the
 * experience; the masthead is purely contextual.
 *
 * Ask Glance survives as a compact conversational affordance inside the
 * masthead — reachable by D-pad, never competing with the selected
 * experience.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import AgentMascot from '../../Shared/AgentMascot';
import { FONT, HOLD_MS, chrome, Icon } from '../HybridHubPanel';
import V6PersistentStrip, { PinGlyph } from './V6PersistentStrip';
import { SpaceTileView, ThreadsOverlay, HintsBar, V6_HUB_KF, HUB_PAD_L, HUB_PAD_R, SPACE_GAP } from './V6HubSections';
import {
  V6_HUB_W, V6_EASE, V6_OPEN_MS, V6_MAX_PINS,
  V6_INITIAL_PINNED, V6_ACTIVE_ITEMS, V6_SPACE_TILES, V6_THREADS,
  v6EntryStripId,
  type V6StripItem, type V6HubTarget,
} from './v6Data';
import {
  V6_CINEMATIC_CARDS, V6_CIN_COLS, V6_MASTHEAD_FADE_MS,
  type V6CinematicCard,
} from './v6CinematicData';
import { v6sfx, sfxEnabled, setSfxEnabled } from './v6Sounds';

type Zone = 'strip' | 'ask' | 'explore' | 'space';

const ROW_ORDER: Zone[] = ['ask', 'explore', 'space'];

const ROW_LEN: Record<Zone, number> = {
  strip: 0,
  ask: 1,
  explore: V6_CINEMATIC_CARDS.length,
  space: V6_SPACE_TILES.length,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const pinId = (id: string) => `pin-${id}`;

/** the masthead atmosphere occupies the hub's upper ~40% and fades out */
const MASTHEAD_H = 440;

const HEADING: CSSProperties = {
  fontFamily: FONT, fontSize: 13, fontWeight: 800, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.46)', margin: '0 2px 14px',
};

export type V6CinematicExperienceProps = {
  open: boolean;
  onRequestOpen: () => void;
  onClose: () => void;
  onToast?: (msg: string) => void;
  currentCategory?: string;
  presentation?: boolean;
  onStripFocus?: (focused: boolean) => void;
};

export default function V6CinematicExperience({ open, onRequestOpen, onClose, onToast, currentCategory, presentation = false, onStripFocus }: V6CinematicExperienceProps) {
  const [zone, setZone] = useState<Zone>('strip');
  const [idx, setIdx] = useState(0);
  const [pins, setPins] = useState<V6StripItem[]>(V6_INITIAL_PINNED);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [threadIdx, setThreadIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [sfxOn, setSfxOn] = useState(sfxEnabled);
  /** which Explore experience owns the masthead — the last focused card */
  const [mastheadIdx, setMastheadIdx] = useState(0);

  const mem = useRef<Record<Zone, number>>({ strip: 0, ask: 0, explore: 0, space: 0 });
  const holdRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean }>({ t: null, fired: false });
  const listenT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOpen = useRef(false);

  const stripItems = [...pins, ...V6_ACTIVE_ITEMS];
  const masthead = V6_CINEMATIC_CARDS[mastheadIdx];

  // Explore focus drives the masthead — purely contextual, never a nav layer.
  useEffect(() => {
    if (zone === 'explore') setMastheadIdx(idx);
  }, [zone, idx]);

  useEffect(() => {
    if (open && !prevOpen.current) {
      const entryId = v6EntryStripId(currentCategory);
      const i = stripItems.findIndex(s => s.id === entryId);
      setZone('strip');
      setIdx(i >= 0 ? i : 0);
      setThreadsOpen(false);
      v6sfx.open();
    } else if (!open && prevOpen.current) {
      v6sfx.close();
      setListening(false);
      setThreadsOpen(false);
    }
    prevOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentCategory]);

  useEffect(() => {
    if (zone === 'strip' && idx >= stripItems.length) setIdx(Math.max(0, stripItems.length - 1));
  }, [pins.length, zone, idx, stripItems.length]);

  useEffect(() => () => {
    if (holdRef.current.t) clearTimeout(holdRef.current.t);
    if (listenT.current) clearTimeout(listenT.current);
  }, []);

  useEffect(() => {
    onStripFocus?.(open && zone === 'strip');
  }, [open, zone, onStripFocus]);

  // ── Focus helpers ───────────────────────────────────────────────────────────

  const gotoZone = useCallback((z: Zone, i?: number) => {
    setZone(prev => {
      mem.current[prev] = idx;
      return z;
    });
    const len = z === 'strip' ? stripItems.length : ROW_LEN[z];
    setIdx(clamp(i ?? mem.current[z] ?? 0, 0, Math.max(0, len - 1)));
  }, [idx, stripItems.length]);

  const gotoTarget = useCallback((target: V6HubTarget) => {
    gotoZone(target.zone, clamp(target.idx, 0, ROW_LEN[target.zone] - 1));
  }, [gotoZone]);

  // ── Pinning ─────────────────────────────────────────────────────────────────

  const unpin = useCallback((id: string) => {
    const item = pins.find(p => p.id === id);
    setPins(ps => ps.filter(p => p.id !== id));
    v6sfx.unpin();
    onToast?.(`Unpinned ${item?.hero ?? 'item'}`);
  }, [pins, onToast]);

  const addPin = useCallback((item: V6StripItem) => {
    if (pins.length >= V6_MAX_PINS) {
      v6sfx.deny();
      onToast?.(`Pins are full — unpin one first (max ${V6_MAX_PINS})`);
      return;
    }
    setPins(ps => [...ps, item]);
    v6sfx.pin();
    onToast?.(`Pinned ${item.hero} — kept on your strip`);
  }, [pins.length, onToast]);

  const togglePinAt = useCallback((z: Zone, i: number) => {
    if (z === 'explore') {
      const c = V6_CINEMATIC_CARDS[i];
      const id = pinId(c.id);
      if (pins.some(p => p.id === id)) { unpin(id); return; }
      addPin({
        id, kind: 'pinned', contentType: 'thread', status: c.pinStatus, tone: c.accent,
        hero: c.title, context: c.subtitle, image: c.cardImage,
        target: { zone: 'explore', idx: i },
      });
      return;
    }
    if (z === 'strip') {
      const item = stripItems[i];
      if (!item) return;
      if (item.kind === 'pinned') { unpin(item.id); return; }
      v6sfx.deny();
      onToast?.('Ambient curates Active surfaces — pin from the Hub instead');
      return;
    }
    v6sfx.deny();
    onToast?.("This can't be pinned");
  }, [pins, stripItems, addPin, unpin, onToast]);

  // ── Short-press OK ──────────────────────────────────────────────────────────

  const activate = useCallback(() => {
    if (zone === 'strip') {
      const item = stripItems[idx];
      if (!item) return;
      v6sfx.select();
      onToast?.(`Opening ${item.hero}…`);
      return;
    }
    if (zone === 'ask') {
      v6sfx.select();
      setListening(true);
      onToast?.('Listening — ask anything');
      if (listenT.current) clearTimeout(listenT.current);
      listenT.current = setTimeout(() => setListening(false), 2600);
      return;
    }
    if (zone === 'explore') {
      v6sfx.select();
      onToast?.(`Starting ${V6_CINEMATIC_CARDS[idx].title}…`);
      return;
    }
    if (zone === 'space') {
      const tile = V6_SPACE_TILES[idx];
      v6sfx.select();
      if (tile.variant === 'threads') { setThreadsOpen(true); setThreadIdx(0); return; }
      onToast?.(`Opening ${tile.label}…`);
    }
  }, [zone, idx, stripItems, onToast]);

  // ── Keyboard — TV D-pad model (identical structure to V6Experience) ────────

  useEffect(() => {
    if (!open) return;

    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Backspace'].includes(k)) {
        e.preventDefault();
      }

      if (k === 'Escape' || k === 'Backspace') {
        if (threadsOpen) { setThreadsOpen(false); v6sfx.navV(); return; }
        onClose();
        return;
      }

      if (threadsOpen) {
        if (k === 'ArrowDown') { setThreadIdx(i => { const n = Math.min(i + 1, V6_THREADS.length - 1); if (n !== i) v6sfx.navV(); return n; }); return; }
        if (k === 'ArrowUp') { setThreadIdx(i => { const n = Math.max(i - 1, 0); if (n !== i) v6sfx.navV(); return n; }); return; }
        if (k === 'Enter' || k === ' ') {
          if (e.repeat) return;
          v6sfx.select();
          onToast?.(`Opening ${V6_THREADS[threadIdx].title}…`);
        }
        return;
      }

      if (k === 'Enter' || k === ' ') {
        if (e.repeat) return;
        holdRef.current.fired = false;
        holdRef.current.t = setTimeout(() => {
          holdRef.current.fired = true;
          holdRef.current.t = null;
          togglePinAt(zone, idx);
        }, HOLD_MS);
        return;
      }

      // Explore is a uniform 4×2 grid — ←/→ move within a grid row, ↑/↓
      // step between its two rows before leaving the section.
      const expCol = idx % V6_CIN_COLS;

      if (k === 'ArrowLeft') {
        if (zone === 'strip') {
          const item = stripItems[idx];
          if (item) { v6sfx.navH(-1); gotoTarget(item.target); }
          return;
        }
        if (zone === 'ask') return;
        if (zone === 'explore') {
          if (expCol > 0) { v6sfx.navH(-1); setIdx(i => i - 1); }
          return;
        }
        if (idx > 0) { v6sfx.navH(-1); setIdx(i => i - 1); }
        return;
      }

      if (k === 'ArrowRight') {
        if (zone === 'strip') { onClose(); return; }
        if (zone === 'ask') { v6sfx.navH(1); gotoZone('strip'); return; }
        if (zone === 'explore') {
          if (expCol < V6_CIN_COLS - 1 && idx + 1 < ROW_LEN.explore) { v6sfx.navH(1); setIdx(i => i + 1); return; }
          v6sfx.navH(1);
          gotoZone('strip');
          return;
        }
        if (idx < ROW_LEN[zone] - 1) { v6sfx.navH(1); setIdx(i => i + 1); return; }
        v6sfx.navH(1);
        gotoZone('strip');
        return;
      }

      if (k === 'ArrowDown') {
        if (zone === 'strip') {
          if (idx < stripItems.length - 1) { v6sfx.navV(); setIdx(i => i + 1); }
          return;
        }
        if (zone === 'explore' && idx + V6_CIN_COLS < ROW_LEN.explore) {
          v6sfx.navV(); setIdx(i => i + V6_CIN_COLS);
          return;
        }
        const r = ROW_ORDER.indexOf(zone);
        if (r < ROW_ORDER.length - 1) { v6sfx.navV(); gotoZone(ROW_ORDER[r + 1]); }
        return;
      }

      if (k === 'ArrowUp') {
        if (zone === 'strip') {
          if (idx > 0) { v6sfx.navV(); setIdx(i => i - 1); }
          return;
        }
        if (zone === 'explore' && idx - V6_CIN_COLS >= 0) {
          v6sfx.navV(); setIdx(i => i - V6_CIN_COLS);
          return;
        }
        const r = ROW_ORDER.indexOf(zone);
        if (r > 0) { v6sfx.navV(); gotoZone(ROW_ORDER[r - 1]); }
        return;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
      if (holdRef.current.fired) { holdRef.current.fired = false; return; }
      if (threadsOpen) return;
      activate();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (holdRef.current.t) { clearTimeout(holdRef.current.t); holdRef.current.t = null; }
    };
  }, [open, zone, idx, stripItems, threadsOpen, threadIdx, gotoZone, gotoTarget, togglePinAt, activate, onClose, onToast]);

  const seq = (i: number): CSSProperties => ({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(16px)',
    transition: open
      ? `opacity 0.45s ease ${(0.14 + i * 0.07).toFixed(2)}s, transform 0.6s ${V6_EASE} ${(0.14 + i * 0.07).toFixed(2)}s`
      : 'opacity 0.22s ease, transform 0.25s ease',
  });

  return (
    <>
      {/* ── Agent Hub — expands from the left, L0 never disappears ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: V6_HUB_W,
        transform: `translateX(${open ? 0 : -(V6_HUB_W + 80)}px)`,
        transition: `transform ${V6_OPEN_MS}ms ${V6_EASE}`,
        zIndex: 57, pointerEvents: open ? 'auto' : 'none',
        overflow: 'hidden',
      }}>
        {/* base surface — same premium dark as V6 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(90% 70% at 8% 0%, rgba(112,71,226,0.14), transparent 55%),
            radial-gradient(70% 55% at 88% 108%, rgba(76,55,150,0.1), transparent 60%),
            linear-gradient(160deg, #110f20 0%, #0c0b18 46%, #090812 100%)`,
        }} />

        {/* ── MASTHEAD ATMOSPHERE — the selected Explore experience becomes
            the hub's upper background. Edge-to-edge inside the hub surface,
            soft gradients, no card rectangle. All eight images stay mounted
            (instant, preloaded crossfades); the active one fades in. ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: MASTHEAD_H, pointerEvents: 'none' }}>
          {V6_CINEMATIC_CARDS.map((c, i) => (
            <img key={c.id} src={c.mastheadImage} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === mastheadIdx ? 1 : 0,
              transform: `scale(${i === mastheadIdx ? 1 : 1.04})`,
              transition: `opacity ${V6_MASTHEAD_FADE_MS}ms ease, transform 900ms ${V6_EASE}`,
            }} />
          ))}
          {/* readability scrims — soft, never a heavy black overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `
              linear-gradient(to right, rgba(10,9,18,0.88) 0%, rgba(10,9,18,0.55) 34%, rgba(10,9,18,0.12) 62%, rgba(10,9,18,0.3) 100%),
              linear-gradient(to top, rgba(10,9,18,0.5) 0%, transparent 40%)`,
          }} />
          {/* ambient accent — the experience's tone subtly lights the scene */}
          {V6_CINEMATIC_CARDS.map((c, i) => (
            <div key={c.id} style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(70% 90% at 12% 60%, ${c.accent}1f, transparent 60%)`,
              opacity: i === mastheadIdx ? 1 : 0,
              transition: `opacity ${V6_MASTHEAD_FADE_MS + 120}ms ease`,
            }} />
          ))}
          {/* smooth fade into the Explore section below — no hard boundary */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -1, height: MASTHEAD_H * 0.55,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(12,11,24,0.62) 55%, #0c0b18 100%)',
          }} />
          {/* subtle vignette for atmospheric depth */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(130% 120% at 50% 30%, transparent 60%, rgba(5,4,10,0.4) 100%)',
          }} />
        </div>

        {/* ── Foreground column ── */}
        <div style={{
          position: 'relative', height: '100%', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          padding: `34px ${HUB_PAD_R}px 28px ${HUB_PAD_L}px`,
        }}>
          {/* brand row — floats over the masthead */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, ...seq(0) }}>
            <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.9 }} />
            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
              Agent Hub
            </span>
          </div>

          {/* 1 · MASTHEAD COPY — why might I want to do this? */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 32, ...seq(1) }}>
            {/* key remount = quick rise-in on every focus change; the image
                crossfade behind carries the cinematic weight */}
            <div key={masthead.id} style={{ maxWidth: 640, animation: 'v6-rise-in 0.32s ease both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 13px', borderRadius: 999, marginBottom: 14,
                background: 'rgba(10,9,18,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                boxShadow: `inset 0 0 0 1px ${masthead.accent}55`,
              }}>
                <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: masthead.accent }} />
                <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: masthead.accent }}>
                  {masthead.mastheadLabel}
                </span>
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 46, fontWeight: 800, lineHeight: 1.04,
                letterSpacing: '-0.025em', color: '#fff',
                textShadow: '0 2px 24px rgba(0,0,0,0.55)',
              }}>
                {masthead.contextualHeadline ?? masthead.mastheadHeadline}
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 15.5, fontWeight: 500, lineHeight: 1.4,
                color: 'rgba(255,255,255,0.72)', marginTop: 10, maxWidth: 520,
                textShadow: '0 1px 10px rgba(0,0,0,0.5)',
              }}>
                {masthead.contextualDescription ?? masthead.mastheadDescription}
              </div>
            </div>

            {/* Ask Glance — compact conversational affordance, never a hero */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11, boxSizing: 'border-box',
              width: 252, height: 46, padding: '0 8px 0 18px', borderRadius: 999, marginTop: 26, cursor: 'pointer',
              background: zone === 'ask'
                ? 'linear-gradient(180deg, rgba(48,45,70,0.92) 0%, rgba(26,24,42,0.92) 100%)'
                : 'linear-gradient(180deg, rgba(24,22,38,0.72) 0%, rgba(14,13,24,0.72) 100%)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              ...chrome(zone === 'ask',
                'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.07), 0 8px 22px rgba(0,0,0,0.35)',
                1.03),
            }}>
              <span style={{
                flex: 1, fontFamily: FONT, fontSize: 14, fontWeight: 600,
                color: zone === 'ask' ? '#fff' : 'rgba(255,255,255,0.66)', transition: 'color 0.25s ease',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {listening ? 'Listening…' : 'Ask Glance'}
              </span>
              <span style={{
                width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                background: zone === 'ask' ? `${masthead.accent}2e` : 'rgba(255,255,255,0.06)',
                boxShadow: zone === 'ask' ? `inset 0 0 0 1px ${masthead.accent}66` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'background 0.25s ease, box-shadow 0.25s ease',
              }}>
                <Icon name="mic" tint={zone === 'ask' ? '#DCCEFF' : 'rgba(255,255,255,0.6)'} size={16} />
              </span>
              <span style={{ width: 34, height: 34, flexShrink: 0, display: 'grid', placeItems: 'center', marginLeft: 2 }}>
                <AgentMascot agentMode={listening ? 'thinking' : zone === 'ask' ? 'looking' : 'idle'} size={32} />
              </span>
            </div>
          </div>

          {/* 2 · EXPLORE — equal cards, calm and even: what can I do?
              (The masthead above carries the hierarchy. No Continue row —
              ongoing threads live on the persistent strip.) */}
          <div style={{ flexShrink: 0, ...seq(2) }}>
            <div style={HEADING}>Explore</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${V6_CIN_COLS}, 1fr)`,
              gridTemplateRows: 'repeat(2, 184px)',
              gap: 16,
            }}>
              {V6_CINEMATIC_CARDS.map((c, i) => (
                <CinExploreCard
                  key={c.id}
                  card={c}
                  focused={zone === 'explore' && idx === i}
                  dimmed={zone === 'explore' && idx !== i}
                  pinned={pins.some(p => p.id === pinId(c.id))}
                  onClick={() => gotoZone('explore', i)}
                />
              ))}
            </div>
          </div>

          {/* 3 · YOUR SPACE — utilities */}
          <div style={{ flexShrink: 0, marginTop: 30, ...seq(3) }}>
            <div style={{ ...HEADING, color: 'rgba(255,255,255,0.32)', fontSize: 12 }}>Your Space</div>
            <div style={{ display: 'flex', gap: SPACE_GAP }}>
              {V6_SPACE_TILES.map((tile, i) => (
                <SpaceTileView
                  key={tile.id}
                  tile={tile}
                  focused={zone === 'space' && idx === i}
                  onClick={() => gotoZone('space', i)}
                />
              ))}
            </div>
          </div>

          {!presentation && (
            <div style={{ marginTop: 12, ...seq(5) }}>
              <HintsBar />
            </div>
          )}
        </div>

        {threadsOpen && <ThreadsOverlay threads={V6_THREADS} focusIdx={threadIdx} />}
      </div>

      {/* ── Persistent strip — unchanged from V6 ── */}
      <V6PersistentStrip
        open={open}
        pins={pins}
        actives={V6_ACTIVE_ITEMS}
        focusedId={open && zone === 'strip' ? stripItems[idx]?.id ?? null : null}
        onItemClick={(id) => {
          if (!open) { onRequestOpen(); return; }
          const i = stripItems.findIndex(s => s.id === id);
          if (i >= 0) gotoZone('strip', i);
        }}
      />

      {!presentation && <button
        onClick={() => { const next = !sfxOn; setSfxOn(next); setSfxEnabled(next); if (next) v6sfx.select(); }}
        style={{
          position: 'absolute', right: 18, bottom: 16, zIndex: 80,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
          background: 'rgba(10,7,20,0.72)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sfxOn ? '#6BD98A' : 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
          Sound Effects {sfxOn ? 'ON' : 'OFF'}
        </span>
      </button>}

      <style>{V6_HUB_KF}</style>
    </>
  );
}

/**
 * One Explore card — all eight identical in size. The card answers "what can
 * I do?" — kept compact because the masthead above provides the large visual
 * response. Focus is restrained (scale ~1.04, accent glow, brighter image);
 * the grid never reflows on focus change.
 */
function CinExploreCard({ card, focused, dimmed, pinned, onClick }: {
  card: V6CinematicCard; focused: boolean; dimmed: boolean; pinned: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', boxSizing: 'border-box',
        borderRadius: 15, overflow: 'hidden', cursor: 'pointer',
        background: '#0b0b12',
        opacity: dimmed ? 0.85 : 1,
        zIndex: focused ? 1 : 0,
        transform: `scale(${focused ? 1.04 : 1})`,
        boxShadow: focused
          ? `0 0 0 1.5px rgba(255,255,255,0.85), 0 0 26px ${card.accent}45, 0 14px 34px rgba(0,0,0,0.5)`
          : 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03), 0 5px 16px rgba(0,0,0,0.28)',
        transition: `transform 0.34s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease, opacity 0.3s ease`,
      }}
    >
      <img src={card.cardImage} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        filter: focused ? 'brightness(0.98) saturate(1.05)' : 'brightness(0.66) saturate(0.92)',
        transform: `scale(${focused ? 1.05 : 1})`,
        transition: `filter 0.35s ease, transform 0.6s ${V6_EASE}`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 80% at 20% 0%, ${card.accent}0d, transparent 50%),
          linear-gradient(180deg, transparent 30%, rgba(7,7,13,0.5) 62%, rgba(7,7,13,0.9) 100%)`,
      }} />

      {pinned && (
        <div style={{
          position: 'absolute', top: 9, right: 9, width: 18, height: 18, borderRadius: '50%',
          display: 'grid', placeItems: 'center', zIndex: 1,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
        }}>
          <PinGlyph size={9} tint="rgba(255,255,255,0.9)" />
        </div>
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '11px 14px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT, fontSize: 16, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.1,
          color: focused ? '#fff' : 'rgba(255,255,255,0.94)', transition: 'color 0.25s ease',
          textShadow: '0 1px 6px rgba(0,0,0,0.65)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.title}
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 500, lineHeight: 1.3,
          color: focused ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.52)',
          transition: 'color 0.25s ease', marginTop: 2.5,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.subtitle}
        </div>
      </div>
    </div>
  );
}

