/**
 * TwoLevelNavPanel — Option 3 Agent Hub (leadership-demo refinement).
 *
 * Data-driven from agentHubData.ts — every content card owns its own contextual
 * prompts, agent message and metadata. Imagery reuses the real L0 feed assets.
 *
 * Column 1 — Global nav: Search (top) · Agents (10) · AI Gallery · Wishlist ·
 *            Recent · Settings (bottom). No page title, no "Personal" heading.
 * Column 2 — Explore gateway + content cards. Exactly ONE card is expanded at a
 *            time (the focused one) into a full-image hero; the rest are compact.
 *            The current-L0 card keeps a small badge even when collapsed.
 * Column 3 — Contextual: the selected card's own agent message + item-specific
 *            prompts (mascot-led), or — when Explore is focused — visual
 *            category cards + detailed recent activity.
 *
 * Navigation:
 *   C1: ↑↓ · → C2 · ← exit to L0
 *   C2: ↑↓ (focus expands) · ← C1 · → C3 · Enter open
 *   C3: ↑↓ · ← C2 · Enter execute
 */

import { useState, useEffect, useMemo } from 'react';
import AgentMascot, { type AgentMode } from '../Shared/AgentMascot';
import {
  TOPICS, buildGlobals, resolveTopicIdx, GALLERY_TOPIC_ID,
  type Topic, type ContentCard, type Global,
} from './agentHubData';

function readAmbient() {
  const c = (typeof window !== 'undefined' && window.GLANCE_CTX) || {};
  return { city: c.city || 'Bangalore', weather: c.weather || 'clear', timeOfDay: c.timeOfDay || 'morning' };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Rail (Column 1) ────────────────────────────────────────────────────────

type RailEntry =
  | { kind: 'topic'; topicIdx: number; label: string; icon: string; tint: string; agent: boolean; groupBefore?: string; sepBefore?: boolean }
  | { kind: 'global'; globalId: string; label: string; icon: string; sepBefore?: boolean };

// Premium glyph icons for globals
const ICON = { search: '⌕', gallery: '✦', wishlist: '♡', recent: '⟲', settings: '⚙' };

function buildRail(topics: Topic[]): RailEntry[] {
  const agents = topics.filter(t => t.id !== GALLERY_TOPIC_ID);
  const gallery = topics.find(t => t.id === GALLERY_TOPIC_ID)!;
  const galleryIdx = topics.indexOf(gallery);
  const r: RailEntry[] = [];
  r.push({ kind: 'global', globalId: 'search', label: 'Search', icon: ICON.search });
  agents.forEach((t, i) => r.push({
    kind: 'topic', topicIdx: topics.indexOf(t), label: t.label, icon: t.icon, tint: t.tint, agent: true,
    groupBefore: i === 0 ? 'Agents' : undefined, sepBefore: i === 0,
  }));
  r.push({ kind: 'topic', topicIdx: galleryIdx, label: gallery.label, icon: ICON.gallery, tint: gallery.tint, agent: false, sepBefore: true });
  r.push({ kind: 'global', globalId: 'wishlist', label: 'Wishlist', icon: ICON.wishlist });
  r.push({ kind: 'global', globalId: 'recent', label: 'Recent', icon: ICON.recent });
  r.push({ kind: 'global', globalId: 'settings', label: 'Settings', icon: ICON.settings, sepBefore: true });
  return r;
}

// ─── Column-2 list model ───────────────────────────────────────────────────────
// row 0 = Explore · rows 1.. = content cards (current L0 first, then rest)
type C2Item = { kind: 'explore' } | { kind: 'card'; card: ContentCard };

function buildC2(topic: Topic, currentTitle?: string): C2Item[] {
  let cards = [...topic.cards];
  // Ensure the card matching current L0 is first (after Explore); flag isCurrentL0.
  if (currentTitle) {
    const i = cards.findIndex(c =>
      c.title.toLowerCase().includes(currentTitle.toLowerCase().split(' ')[0]) ||
      currentTitle.toLowerCase().includes(c.title.toLowerCase().split(' ')[0]));
    if (i > 0) { const [m] = cards.splice(i, 1); cards.unshift(m); }
  }
  return [{ kind: 'explore' }, ...cards.map(card => ({ kind: 'card' as const, card }))];
}

type Column = 'c1' | 'c2' | 'c3';

// ─── Component ─────────────────────────────────────────────────────────────────

export type TwoLevelNavPanelProps = {
  onBack: () => void; onToast?: (msg: string) => void;
  currentCategory?: string; currentSubs?: string[]; currentTitle?: string;
};

export default function TwoLevelNavPanel({ onBack, onToast, currentCategory, currentSubs, currentTitle }: TwoLevelNavPanelProps) {
  const amb = useMemo(() => readAmbient(), []);
  const globals = useMemo(() => buildGlobals(amb.city, cap(amb.weather)), [amb]);
  const rail = useMemo(() => buildRail(TOPICS), []);
  const ctxTopicIdx = useMemo(() => resolveTopicIdx(currentCategory, currentSubs), [currentCategory, currentSubs]);
  const ctxRailIdx = useMemo(() => {
    const i = rail.findIndex(e => e.kind === 'topic' && e.topicIdx === ctxTopicIdx);
    return i >= 0 ? i : 1;
  }, [rail, ctxTopicIdx]);

  const [column, setColumn] = useState<Column>('c2');
  const [railIdx, setRailIdx] = useState(ctxRailIdx);
  const [c2Idx, setC2Idx] = useState(1);   // first content card (current L0)
  const [c3Idx, setC3Idx] = useState(0);
  const [globalIdx, setGlobalIdx] = useState(0);
  const [thinking, setThinking] = useState(false);

  const entry = rail[railIdx];
  const isTopic = entry.kind === 'topic';
  const topic = isTopic ? TOPICS[entry.topicIdx] : null;
  const global = !isTopic ? globals.find(g => g.id === entry.globalId)! : null;

  const c2Items = useMemo(() => (topic ? buildC2(topic, currentTitle) : []), [topic, currentTitle]);
  const c2Sel = c2Items[c2Idx];
  const selectedCard = c2Sel && c2Sel.kind === 'card' ? c2Sel.card : null;
  const c3Mode: 'browse' | 'agent' = c2Sel?.kind === 'explore' ? 'browse' : 'agent';

  const exploreLen = topic ? topic.explore.length : 0;   // grid items (2-col)
  const recentLen = topic ? topic.recent.length : 0;
  const c3Len = useMemo(() => {
    if (!topic) return 0;
    if (c3Mode === 'browse') return exploreLen + recentLen;
    return (selectedCard?.prompts.length ?? 0) + 1; // + Ask entry
  }, [topic, c3Mode, selectedCard, exploreLen, recentLen]);

  useEffect(() => { setC2Idx(1); setC3Idx(0); }, [railIdx]); // eslint-disable-line
  useEffect(() => { setC3Idx(0); }, [c2Idx]);

  // Mascot state: idle browsing C1/C2, attentive in C3, thinking on select, listening on Ask.
  const mascotMode: AgentMode = thinking ? 'thinking'
    : column === 'c3' ? 'looking' : 'idle';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(key)) e.preventDefault();

      // Back always exits straight to L0, from anywhere.
      if (key === 'Escape' || key === 'Backspace') { onBack(); return; }

      if (column === 'c1') {
        if (key === 'ArrowUp')   { setRailIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setRailIdx(i => Math.min(rail.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { onBack(); return; }         // far-left edge → exit
        if (key === 'ArrowRight' || key === 'Enter' || key === ' ') { setColumn('c2'); setGlobalIdx(0); return; }
        return;
      }

      if (column === 'c2' && !isTopic) {
        const len = global!.items.length;
        if (key === 'ArrowUp')   { setGlobalIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setGlobalIdx(i => Math.min(len - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c1'); return; }
        // Globals have no C3 — Right at this far edge exits to L0.
        if (key === 'ArrowRight') { onBack(); return; }
        if (key === 'Enter' || key === ' ') { onToast?.(`${global!.label} · ${global!.items[globalIdx].title}`); return; }
        return;
      }

      if (column === 'c2' && isTopic) {
        if (key === 'ArrowUp')   { setC2Idx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setC2Idx(i => Math.min(c2Items.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c1'); return; }
        if (key === 'ArrowRight') { setColumn('c3'); setC3Idx(0); return; }
        if (key === 'Enter' || key === ' ') {
          if (c2Sel.kind === 'explore') { setColumn('c3'); setC3Idx(0); onToast?.(`Explore ${topic!.label}`); }
          else onToast?.(`Open · ${c2Sel.card.title}`);
          return;
        }
        return;
      }

      if (column === 'c3') {
        if (!isTopic) { setColumn('c2'); return; }

        // Browse mode = a 2-col explore grid on top, then a 1-col recent list.
        if (c3Mode === 'browse') {
          const cols = 2;
          const inGrid = c3Idx < exploreLen;
          if (key === 'ArrowLeft') {
            if (inGrid && c3Idx % cols === 0) { setColumn('c2'); return; }   // far-left → back to C2
            if (!inGrid) { setColumn('c2'); return; }                        // recent list far-left → C2
            setC3Idx(i => i - 1); return;
          }
          if (key === 'ArrowRight') {
            if (inGrid && c3Idx % cols === cols - 1) { onBack(); return; }    // far-right edge → exit L0
            if (inGrid && c3Idx + 1 < exploreLen) { setC3Idx(i => i + 1); return; }
            if (!inGrid) { onBack(); return; }                               // recent list far-right → exit
            return;
          }
          if (key === 'ArrowUp') {
            if (inGrid) { setC3Idx(i => Math.max(0, i - cols)); return; }
            // first recent row → back into last grid row
            if (c3Idx === exploreLen) { setC3Idx(Math.max(0, exploreLen - 1)); return; }
            setC3Idx(i => i - 1); return;
          }
          if (key === 'ArrowDown') {
            if (inGrid) {
              const down = c3Idx + cols;
              if (down < exploreLen) { setC3Idx(down); return; }
              setC3Idx(exploreLen); return;                                  // into recent list
            }
            setC3Idx(i => Math.min(c3Len - 1, i + 1)); return;
          }
          if (key === 'Enter' || key === ' ') {
            const all = [...topic!.explore.map(x => x.label), ...topic!.recent.map(r => r.title)];
            onToast?.(`${topic!.label} · ${all[c3Idx]}`);
            return;
          }
          return;
        }

        // Agent mode = single vertical prompt list.
        if (key === 'ArrowUp')   { setC3Idx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setC3Idx(i => Math.min(c3Len - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c2'); return; }
        if (key === 'ArrowRight') { onBack(); return; }                      // far-right edge → exit L0
        if (key === 'Enter' || key === ' ') {
          if (selectedCard) {
            const isAsk = c3Idx === selectedCard.prompts.length;
            onToast?.(isAsk ? `${topic!.agentName} · open conversation` : `${topic!.agentName} · ${selectedCard.prompts[c3Idx].label}`);
            setThinking(true); setTimeout(() => setThinking(false), 1400);
          }
          return;
        }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [column, railIdx, isTopic, global, globalIdx, topic, c2Items, c2Idx, c2Sel, selectedCard, c3Len, c3Mode, c3Idx, exploreLen, recentLen, rail.length, onBack, onToast]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: '86vw',
      background: [
        'radial-gradient(1300px 1400px at -8% 50%, rgba(11,9,20,0.98), rgba(7,6,14,0.84) 55%, transparent 88%)',
        'linear-gradient(100deg, rgba(5,4,12,0.98) 0%, rgba(5,4,12,0.88) 74%, rgba(5,4,12,0) 100%)',
      ].join(', '),
      animation: 'tln-panel-in 0.36s cubic-bezier(0.22,0.61,0.36,1) forwards',
      display: 'flex', alignItems: 'stretch',
      WebkitMaskImage: 'linear-gradient(to right, black 94%, transparent 100%)',
      maskImage: 'linear-gradient(to right, black 94%, transparent 100%)',
    }}>
      {/* ── Column 1 ─────────────────────────────────────────── */}
      <div style={{
        width: 288, flexShrink: 0, padding: '40px 14px 26px 46px',
        display: 'flex', flexDirection: 'column', gap: 2,
        opacity: column === 'c1' ? 1 : 0.9, transition: 'opacity 0.3s ease', overflowY: 'auto',
      }}>
        <RailLogo />
        {rail.map((e, i) => (
          <div key={i}>
            {e.sepBefore && <RailSep label={e.kind === 'topic' ? e.groupBefore : undefined} />}
            <RailRow icon={e.icon} label={e.label}
              tint={e.kind === 'topic' ? e.tint : undefined}
              agent={e.kind === 'topic' && e.agent}
              focused={column === 'c1' && railIdx === i} selected={railIdx === i}
              onClick={() => { setRailIdx(i); setColumn('c2'); setGlobalIdx(0); }} />
          </div>
        ))}
        <RailFooter />
      </div>

      {/* ── Column 2 ─────────────────────────────────────────── */}
      <div style={{
        width: 552, flexShrink: 0, padding: '40px 30px 26px 30px',
        opacity: column === 'c2' ? 1 : 0.82, transition: 'opacity 0.3s ease', overflowY: 'auto',
      }}>
        {isTopic
          ? <C2Topic topic={topic!} items={c2Items} idx={c2Idx} focused={column === 'c2'} />
          : <C2Global dest={global!} idx={globalIdx} focused={column === 'c2'} />}
      </div>

      {/* ── Column 3 ─────────────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 0, padding: '40px 48px 26px 34px',
        opacity: column === 'c3' ? 1 : 0.72, transition: 'opacity 0.3s ease', overflowY: 'auto',
        display: 'flex', justifyContent: 'flex-start',
      }}>
        {isTopic && (
          c3Mode === 'agent' && selectedCard
            ? <AgentPanel topic={topic!} card={selectedCard} idx={c3Idx} focused={column === 'c3'} mascotMode={mascotMode} />
            : <ExplorePanel topic={topic!} idx={c3Idx} focused={column === 'c3'} />
        )}
      </div>

      {/* Hint strip */}
      <div style={{
        position: 'absolute', left: 46, bottom: 16,
        display: 'flex', alignItems: 'center', gap: 16, zIndex: 40,
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.32)',
      }}>
        {hintFor(column, c3Mode).map(([k, l]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <kbd style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            }}>{k}</kbd>
            <span>{l}</span>
          </span>
        ))}
      </div>

      <style>{TLN_KF}</style>
    </div>
  );
}

function hintFor(col: Column, mode: 'browse' | 'agent'): [string, string][] {
  if (col === 'c1') return [['↑↓', 'Navigate'], ['→', 'Open'], ['←', 'Back to feed']];
  if (col === 'c2') return [['↑↓', 'Browse'], ['→', 'Ask AI'], ['←', 'Nav'], ['Enter', 'Open']];
  if (mode === 'browse') return [['↑↓←→', 'Browse grid'], ['Enter', 'Open'], ['←', 'Back']];
  return [['↑↓', 'Prompts'], ['Enter', 'Start chat'], ['←', 'Back']];
}

// ─── Column 1 pieces ───────────────────────────────────────────────────────────

function RailLogo() {
  return (
    <div style={{ marginBottom: 18 }}>
      <img src="/glance-logo.png" alt="Glance" style={{ height: 24, opacity: 0.9 }} />
    </div>
  );
}
function RailSep({ label }: { label?: string }) {
  if (label) return (
    <div style={{
      fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 10, fontWeight: 700,
      color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '16px 0 8px 8px',
    }}>{label}</div>
  );
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 8px' }} />;
}
function RailFooter() {
  return <div style={{
    marginTop: 'auto', paddingTop: 14,
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.24)',
  }}>← or Back returns to Home</div>;
}
function RailRow({ icon, label, tint, agent, focused, selected, onClick }: {
  icon: string; label: string; tint?: string; agent?: boolean; focused: boolean; selected: boolean; onClick: () => void;
}) {
  const accent = tint || '#C7B6F5';
  const rgb = hexRgb(accent);
  const strong = selected && agent;
  return (
    <div onClick={onClick} style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      padding: strong ? '11px 14px' : '9px 12px', borderRadius: 13, cursor: 'pointer',
      background: focused ? 'rgba(255,255,255,0.14)'
        : strong ? `linear-gradient(100deg, rgba(${rgb},0.15), rgba(255,255,255,0.04))`
        : selected ? 'rgba(255,255,255,0.06)' : 'transparent',
      border: focused ? '1.5px solid rgba(255,255,255,0.45)'
        : strong ? `1.5px solid rgba(${rgb},0.42)` : selected ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid transparent',
      boxShadow: focused ? '0 8px 26px rgba(0,0,0,0.45)' : strong ? `0 6px 22px rgba(${rgb},0.16)` : 'none',
      transform: focused || strong ? 'translateX(5px)' : 'none',
      transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
    }}>
      {strong && <div style={{ position: 'absolute', left: -4, top: '20%', bottom: '20%', width: 3, borderRadius: 3, background: accent, boxShadow: `0 0 9px ${accent}` }} />}
      <div style={{
        width: strong ? 38 : 30, height: strong ? 38 : 30, borderRadius: 10, flexShrink: 0,
        background: strong ? `rgba(${rgb},0.18)` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${strong ? `rgba(${rgb},0.4)` : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: strong ? 19 : 15, transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
      }}>{icon}</div>
      <span style={{
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
        fontWeight: focused || strong ? 700 : 600, fontSize: strong ? 17 : 14,
        color: focused || strong ? '#FFFFFF' : selected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
        letterSpacing: '-0.01em', transition: 'all 0.2s',
      }}>{label}</span>
    </div>
  );
}

// ─── Column 2: topic list (single-card expansion) ──────────────────────────────

function C2Topic({ topic, items, idx, focused }: { topic: Topic; items: C2Item[]; idx: number; focused: boolean }) {
  const rgb = hexRgb(topic.tint);
  return (
    <div key={topic.id} style={{ animation: 'tln-ws-in 0.34s ease' }}>
      {/* Explore gateway */}
      <MiniLabel text="Explore" />
      {(() => {
        const on = focused && idx === 0;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderRadius: 16, cursor: 'pointer', marginBottom: 22,
            background: on ? `linear-gradient(110deg, rgba(${rgb},0.2), rgba(255,255,255,0.05))` : 'rgba(255,255,255,0.045)',
            border: on ? `1.5px solid rgba(${rgb},0.6)` : `1px solid rgba(${rgb},0.22)`,
            boxShadow: on ? `0 12px 32px rgba(${rgb},0.2)` : 'none', transform: on ? 'translateX(5px)' : 'none',
            transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: `rgba(${rgb},0.18)`, border: `1px solid rgba(${rgb},0.45)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{topic.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 22, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Explore {topic.label}</div>
              <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Browse collections, saved & recent activity</div>
            </div>
            <span style={{ fontSize: 18, color: on ? topic.tint : `rgba(${rgb},0.7)`, flexShrink: 0 }}>⤢</span>
          </div>
        );
      })()}

      <MiniLabel text="From this topic" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => {
          if (it.kind !== 'card') return null;
          const on = focused && idx === i;
          const c = it.card;

          // Focused → full-image hero
          if (on) {
            return (
              <div key={c.id} style={{
                position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', height: 200,
                border: `2px solid rgba(${rgb},0.7)`, boxShadow: `0 20px 50px rgba(${rgb},0.28)`,
                background: '#111', transition: 'all 0.28s cubic-bezier(0.22,0.61,0.36,1)',
                animation: 'tln-hero-in 0.3s cubic-bezier(0.22,0.61,0.36,1)',
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,3,10,0.95) 0%, rgba(4,3,10,0.4) 50%, transparent 82%)' }} />
                {c.isCurrentL0 && (
                  <div style={{
                    position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(${rgb},0.6)`,
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700, color: topic.tint, textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.tint, boxShadow: `0 0 8px ${topic.tint}` }} />
                    {topic.currentLabel}
                  </div>
                )}
                <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16 }}>
                  <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 25, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.12 }}>{c.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>{c.sub}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <kbd style={{ background: 'rgba(255,255,255,0.92)', color: '#0A0812', borderRadius: 5, padding: '2px 7px', fontSize: 9.5, fontWeight: 800, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif' }}>Enter</kbd>
                      <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Open</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Collapsed → compact image row (current L0 keeps a small badge)
          return (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '8px', borderRadius: 16, cursor: 'pointer',
              background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.28s cubic-bezier(0.22,0.61,0.36,1)',
            }}>
              <div style={{
                width: 118, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
              }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                {c.isCurrentL0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 4,
                    padding: '1px 8px', borderRadius: 999, background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.35)`,
                    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 8.5, fontWeight: 700, color: topic.tint, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: topic.tint }} />
                    On L0
                  </div>
                )}
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 16.5, color: 'rgba(255,255,255,0.82)', letterSpacing: '-0.01em', lineHeight: 1.18 }}>{c.title}</div>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniLabel({ text }: { text: string }) {
  return <div style={{
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12,
  }}>{text}</div>;
}

// ─── Column 2: global destination (image-rich) ─────────────────────────────────

function C2Global({ dest, idx, focused }: { dest: Global; idx: number; focused: boolean }) {
  return (
    <div key={dest.id} style={{ animation: 'tln-ws-in 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 4 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{dest.icon}</div>
        <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 25, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{dest.label}</div>
      </div>
      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '16px 0 12px' }}>{dest.heading}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dest.items.map((it, i) => {
          const on = focused && idx === i;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: it.image ? '8px' : '15px 17px', borderRadius: 14, cursor: 'pointer',
              background: on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: on ? '1.5px solid rgba(255,255,255,0.42)' : '1px solid rgba(255,255,255,0.08)',
              transform: on ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
            }}>
              {it.image && <div style={{ width: 84, height: 56, borderRadius: 10, flexShrink: 0, overflow: 'hidden', backgroundImage: `url(${it.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.12)' }} />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 16, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em' }}>{it.title}</div>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Column 3: Agent panel (mascot-led, per-card prompts) ───────────────────────

function AgentPanel({ topic, card, idx, focused, mascotMode }: {
  topic: Topic; card: ContentCard; idx: number; focused: boolean; mascotMode: AgentMode;
}) {
  const rgb = hexRgb(topic.tint);
  const askIdx = card.prompts.length;
  return (
    <div key={topic.id + card.id} style={{ animation: 'tln-ws-in 0.3s ease', maxWidth: 520, width: '100%' }}>
      {/* Mascot + agent identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 22, flexShrink: 0,
          background: `radial-gradient(circle at 50% 40%, rgba(${rgb},0.26), rgba(255,255,255,0.04))`,
          border: `1px solid rgba(${rgb},0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 10px 34px rgba(${rgb},0.22)`, animation: 'tln-mascot-float 4s ease-in-out infinite',
        }}>
          <AgentMascot agentMode={mascotMode} size={68} />
        </div>
        <div>
          <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 21, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{topic.agentName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: `rgba(${rgb},0.9)` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.tint, boxShadow: `0 0 7px ${topic.tint}` }} />
            {card.note}
          </div>
        </div>
      </div>

      {/* Opening line */}
      <div style={{
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.92)', lineHeight: 1.45,
        marginBottom: 20, padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      }}>“{card.message}”</div>

      <MiniLabel text="Suggested questions" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {card.prompts.map((p, i) => {
          const on = focused && idx === i;
          return (
            <div key={i} style={{
              padding: '12px 15px', borderRadius: 13, cursor: 'pointer',
              background: on ? `linear-gradient(110deg, rgba(${rgb},0.2), rgba(255,255,255,0.05))` : 'rgba(255,255,255,0.05)',
              border: on ? `1.5px solid rgba(${rgb},0.55)` : '1px solid rgba(255,255,255,0.1)',
              boxShadow: on ? `0 8px 24px rgba(${rgb},0.16)` : 'none', transform: on ? 'translateX(5px)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
            }}>
              <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 600, fontSize: 15.5, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', lineHeight: 1.35 }}>{p.label}</div>
              {p.outcome && <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{p.outcome}</div>}
            </div>
          );
        })}
        {/* Ask entry */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', borderRadius: 13, cursor: 'pointer', marginTop: 2,
          background: focused && idx === askIdx ? 'rgba(255,255,255,0.12)' : 'transparent',
          border: focused && idx === askIdx ? '1.5px solid rgba(255,255,255,0.4)' : '1px dashed rgba(255,255,255,0.2)',
          transform: focused && idx === askIdx ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
        }}>
          <span style={{ fontSize: 15 }}>💬</span>
          <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 600, fontSize: 15, fontStyle: 'italic', color: focused && idx === askIdx ? '#FFFFFF' : 'rgba(255,255,255,0.55)' }}>Ask {topic.agentName}…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Column 3: Explore panel (visual categories + detailed recent) ──────────────

function ExplorePanel({ topic, idx, focused }: { topic: Topic; idx: number; focused: boolean }) {
  const rgb = hexRgb(topic.tint);
  const exploreLen = topic.explore.length;
  return (
    <div key={'explore' + topic.id} style={{ animation: 'tln-ws-in 0.3s ease', width: '100%' }}>
      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 22, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 20 }}>Explore {topic.label}</div>

      {/* Visual category grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
        {topic.explore.map((cat, i) => {
          const on = focused && idx === i;
          return (
            <div key={cat.label} style={{
              position: 'relative', height: on ? 128 : 116, borderRadius: 15, overflow: 'hidden', cursor: 'pointer',
              border: on ? `2px solid rgba(${rgb},0.65)` : '1px solid rgba(255,255,255,0.09)',
              boxShadow: on ? `0 14px 34px rgba(${rgb},0.22)` : 'none', transform: on ? 'scale(1.015)' : 'none',
              transition: 'all 0.24s cubic-bezier(0.22,0.61,0.36,1)', background: '#111',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cat.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,3,10,0.92) 0%, rgba(4,3,10,0.3) 55%, transparent 85%)' }} />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 16, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{cat.label}</div>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{cat.cue}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity — real chat threads / ongoing work */}
      <MiniLabel text="Recent activity" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {topic.recent.map((r, i) => {
          const on = focused && idx === exploreLen + i;
          const isChat = r.kind === 'Conversation';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 13,
              padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
              background: on ? `linear-gradient(120deg, rgba(${rgb},0.14), rgba(255,255,255,0.05))` : 'rgba(255,255,255,0.04)',
              border: on ? `1.5px solid rgba(${rgb},0.5)` : '1px solid rgba(255,255,255,0.09)',
              transform: on ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
            }}>
              {/* thread glyph */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.28)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>{isChat ? '💬' : r.action === 'Continue' ? '↺' : '★'}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 9.5, fontWeight: 700, color: `rgba(${rgb},0.9)`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.kind}</span>
                  <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.time}</span>
                </div>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isChat ? `“${r.title}”` : r.title}
                </div>
                {r.context && <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{r.context}</div>}
              </div>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, fontWeight: 700,
                color: on ? '#FFFFFF' : `rgba(${rgb},0.9)`,
              }}>{r.action} ›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function hexRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// ─── Keyframes ─────────────────────────────────────────────────────────────────

const TLN_KF = `
@keyframes tln-panel-in { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tln-ws-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes tln-hero-in { from { opacity: 0.4; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes tln-mascot-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
`;
