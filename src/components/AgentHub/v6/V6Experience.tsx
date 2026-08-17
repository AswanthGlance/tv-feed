/**
 * V6Experience — Option 6 "Connected Hub".
 *
 * One spatial composition connecting three layers:
 *
 *     L0  →  PERSISTENT STRIP  →  AGENT HUB
 *
 * The interaction principle: ONE ← press opens the entire Agent Hub. The
 * strip is the landing focus and the spatial bridge — never an intermediate
 * screen. Ambient physically opens up to reveal the deeper AI layer:
 *
 *   closed:  [ strip ][----------------- L0 -----------------]
 *   open:    [------------ AGENT HUB ------------][ strip ][ L0 ]
 *
 * Hub open state and focus state are independent: the hub is fully visible
 * while focus still rests on the strip. ← from a strip item lands on the
 * related hub content (intent preserved); → from the strip — and only from
 * the strip — closes the hub; BACK always returns straight to L0.
 *
 * Hub IA (top → bottom) — three calm sections, neat and balanced:
 *   ASK        one intentional hero module (mascot + question + voice +
 *              contextual suggestions)
 *   EXPLORE    stable 4×2 grid of identical cards
 *   YOUR SPACE bottom utility shelf
 * (No Continue row — ongoing threads live on the persistent strip.)
 *
 * This component owns all V6 state (focus zone, per-row memory, pins,
 * threads view) and renders both the strip and the hub. The host app only
 * animates L0 aside and freezes the feed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { FONT, HOLD_MS } from '../HybridHubPanel';
import V6PersistentStrip from './V6PersistentStrip';
import {
  AskHero, ExploreCardView, SpaceTileView, ThreadsOverlay,
  SectionHeading, HintsBar, V6_HUB_KF,
  HUB_PAD_L, HUB_PAD_R,
  EXP_GAP,
  SPACE_GAP,
} from './V6HubSections';
import {
  V6_HUB_W, V6_EASE, V6_OPEN_MS, V6_MAX_PINS,
  V6_INITIAL_PINNED, V6_ACTIVE_ITEMS,
  V6_ASK_SUGGESTIONS,
  V6_EXPLORE_CARDS, V6_EXPLORE_COLS,
  V6_SPACE_TILES, V6_THREADS,
  v6EntryStripId,
  type V6StripItem, type V6HubTarget,
} from './v6Data';
import { v6sfx, sfxEnabled, setSfxEnabled } from './v6Sounds';

type Zone = 'strip' | 'ask' | 'explore' | 'space';

/** vertical order of the hub's rows for UP/DOWN */
const ROW_ORDER: Zone[] = ['ask', 'explore', 'space'];

const ROW_LEN: Record<Zone, number> = {
  strip: 0, // dynamic — pins + actives
  ask: 1,
  explore: V6_EXPLORE_CARDS.length,
  space: V6_SPACE_TILES.length,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const pinIdForExplore = (cardId: string) => `pin-${cardId}`;

export type V6ExperienceProps = {
  open: boolean;
  /** clicking the strip on L0 opens the hub (mouse convenience) */
  onRequestOpen: () => void;
  onClose: () => void;
  onToast?: (msg: string) => void;
  /** category of the current L0 card — decides where focus lands on entry */
  currentCategory?: string;
  /** presentation/demo mode — hides dev chrome (hints, sound toggle) */
  presentation?: boolean;
  /** true while focus rests on the strip — the host slightly restores L0 presence */
  onStripFocus?: (focused: boolean) => void;
};

export default function V6Experience({ open, onRequestOpen, onClose, onToast, currentCategory, presentation = false, onStripFocus }: V6ExperienceProps) {
  const [zone, setZone] = useState<Zone>('strip');
  const [idx, setIdx] = useState(0);
  const [pins, setPins] = useState<V6StripItem[]>(V6_INITIAL_PINNED);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [threadIdx, setThreadIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [sfxOn, setSfxOn] = useState(sfxEnabled);

  /** last horizontal position per row — restored when a row is re-entered vertically */
  const mem = useRef<Record<Zone, number>>({ strip: 0, ask: 0, explore: 0, space: 0 });
  const holdRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean }>({ t: null, fired: false });
  const listenT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOpen = useRef(false);

  const stripItems = [...pins, ...V6_ACTIVE_ITEMS];

  // ── Open / close transitions ────────────────────────────────────────────────
  // On open, focus lands on the strip item most related to the L0 context the
  // user pressed ← from. The hub is already fully visible — focus and open
  // state are independent.
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

  // Keep strip focus valid if pins shrink under it.
  useEffect(() => {
    if (zone === 'strip' && idx >= stripItems.length) setIdx(Math.max(0, stripItems.length - 1));
  }, [pins.length, zone, idx, stripItems.length]);

  useEffect(() => () => {
    if (holdRef.current.t) clearTimeout(holdRef.current.t);
    if (listenT.current) clearTimeout(listenT.current);
  }, []);

  // Tell the host when focus rests on the strip — L0 presence is slightly
  // restored there (the strip is the doorway back toward Ambient).
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
      const card = V6_EXPLORE_CARDS[i];
      const id = pinIdForExplore(card.id);
      if (pins.some(p => p.id === id)) { unpin(id); return; }
      addPin({
        id, kind: 'pinned', contentType: 'thread', status: card.pinStatus, tone: card.tone,
        hero: card.title, context: card.desc, image: card.image,
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
      onToast?.(`Starting ${V6_EXPLORE_CARDS[idx].title} together…`);
      return;
    }
    if (zone === 'space') {
      const tile = V6_SPACE_TILES[idx];
      v6sfx.select();
      if (tile.variant === 'threads') { setThreadsOpen(true); setThreadIdx(0); return; }
      onToast?.(`Opening ${tile.label}…`);
    }
  }, [zone, idx, stripItems, onToast]);

  // ── Keyboard — TV D-pad model ───────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Backspace'].includes(k)) {
        e.preventDefault();
      }

      // BACK — from Threads back to the hub; from the hub straight to L0.
      if (k === 'Escape' || k === 'Backspace') {
        if (threadsOpen) { setThreadsOpen(false); v6sfx.navV(); return; }
        onClose();
        return;
      }

      // Threads view owns the keys while open.
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

      // OK — short press activates (on keyup), hold pins/unpins.
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

      // Explore is a 4×2 grid — ←/→ move within a grid row, ↑/↓ step
      // between its two rows before leaving the section.
      const expCol = idx % V6_EXPLORE_COLS;

      if (k === 'ArrowLeft') {
        if (zone === 'strip') {
          // Intent-preserving: land on the hub content related to this item.
          const item = stripItems[idx];
          if (item) { v6sfx.navH(-1); gotoTarget(item.target); }
          return;
        }
        if (zone === 'ask') return; // hub is the leftmost layer
        if (zone === 'explore') {
          if (expCol > 0) { v6sfx.navH(-1); setIdx(i => i - 1); }
          return;
        }
        if (idx > 0) { v6sfx.navH(-1); setIdx(i => i - 1); }
        return;
      }

      if (k === 'ArrowRight') {
        if (zone === 'strip') { onClose(); return; } // → from the strip — and only here — exits
        if (zone === 'ask') { v6sfx.navH(1); gotoZone('strip'); return; }
        if (zone === 'explore') {
          if (expCol < V6_EXPLORE_COLS - 1 && idx + 1 < ROW_LEN.explore) { v6sfx.navH(1); setIdx(i => i + 1); return; }
          v6sfx.navH(1);
          gotoZone('strip'); // past the grid's right edge — toward the strip
          return;
        }
        if (idx < ROW_LEN.space - 1) { v6sfx.navH(1); setIdx(i => i + 1); return; }
        // past the row's end — progressively toward the strip (hub stays open)
        v6sfx.navH(1);
        gotoZone('strip');
        return;
      }

      if (k === 'ArrowDown') {
        if (zone === 'strip') {
          if (idx < stripItems.length - 1) { v6sfx.navV(); setIdx(i => i + 1); }
          return;
        }
        if (zone === 'explore' && idx + V6_EXPLORE_COLS < ROW_LEN.explore) {
          v6sfx.navV(); setIdx(i => i + V6_EXPLORE_COLS);
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
        if (zone === 'explore' && idx - V6_EXPLORE_COLS >= 0) {
          v6sfx.navV(); setIdx(i => i - V6_EXPLORE_COLS);
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
      if (threadsOpen) return; // threads handles Enter on keydown
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

  /** staggered section entrance while the hub opens; instant on close */
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
        {/* surface: premium dark with a navy/purple undertone — never pure
            black — plus a whisper of Glance accent and a gentle vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(90% 70% at 8% 0%, rgba(112,71,226,0.14), transparent 55%),
            radial-gradient(70% 55% at 88% 108%, rgba(76,55,150,0.1), transparent 60%),
            linear-gradient(160deg, #110f20 0%, #0c0b18 46%, #090812 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(120% 105% at 42% 46%, transparent 58%, rgba(3,3,8,0.35) 100%)',
        }} />

        <div style={{
          position: 'relative', height: '100%', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          padding: `40px ${HUB_PAD_R}px 26px ${HUB_PAD_L}px`,
        }}>
          {/* brand row */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, ...seq(0) }}>
            <img src="/glance-logo.png" alt="Glance" style={{ height: 22, opacity: 0.88 }} />
            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Agent Hub
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
            {/* 1 · ASK GLANCE — one intentional hero module */}
            <div style={seq(1)}>
              <AskHero focused={zone === 'ask'} listening={listening} suggestions={V6_ASK_SUGGESTIONS} />
            </div>

            {/* 2 · EXPLORE — stable 4×2 grid, readable in one glance.
                (No Continue row — ongoing threads live on the strip.) */}
            <div style={seq(2)}>
              <SectionHeading text="Explore" />
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${V6_EXPLORE_COLS}, 1fr)`,
                gap: EXP_GAP,
              }}>
                {V6_EXPLORE_CARDS.map((card, i) => (
                  <ExploreCardView
                    key={card.id}
                    card={card}
                    focused={zone === 'explore' && idx === i}
                    dimmed={zone === 'explore' && idx !== i}
                    pinned={pins.some(p => p.id === pinIdForExplore(card.id))}
                    onClick={() => gotoZone('explore', i)}
                  />
                ))}
              </div>
            </div>

            {/* 3 · YOUR SPACE — bottom utility shelf */}
            <div style={seq(3)}>
              <SectionHeading text="Your Space" quiet />
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
          </div>

          {!presentation && (
            <div style={seq(4)}>
              <HintsBar />
            </div>
          )}
        </div>

        {/* Threads — the complete conversation history, one level deeper */}
        {threadsOpen && <ThreadsOverlay threads={V6_THREADS} focusIdx={threadIdx} />}
      </div>

      {/* ── Persistent strip — the spine; travels with the composition ── */}
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

      {/* ── Dev toggle — sound effects (hidden in presentation mode) ── */}
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
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: sfxOn ? '#6BD98A' : 'rgba(255,255,255,0.25)',
        }} />
        <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
          Sound Effects {sfxOn ? 'ON' : 'OFF'}
        </span>
      </button>}

      <style>{V6_HUB_KF}</style>
    </>
  );
}
