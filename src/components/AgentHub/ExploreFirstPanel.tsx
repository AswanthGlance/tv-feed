/**
 * ExploreFirstPanel — Option 4: exploration-first Agent Hub.
 *
 * Same IA columns as Option 3, but the hierarchy is flipped:
 *   Column 1 — identical global nav (Search · Agents · Gallery · Wishlist · Recent · Settings)
 *   Column 2 — EXPLORE layer (promoted): visual category cards + Your Activity
 *   Column 3 — content browser filtered by the selected category; exactly one
 *              card expands at a time. A COMPACT AI preview attaches to the
 *              focused card; the full conversation only appears after Enter
 *              (progressive AI, not a permanent third of the screen).
 *
 * Navigation:
 *   C1: ↑↓ · → C2 · ← exit L0 · Back exit L0
 *   C2: ↑↓ categories + activity · ← C1 · → C3 · Enter → C3
 *   C3: ↑↓ content (focus expands) · ← C2 · Enter → open AI conversation
 *   AI conversation overlay: ↑↓ prompts · Enter send · ← / Back → close
 */

import { useState, useEffect, useMemo } from 'react';
import AgentMascot, { type AgentMode } from '../Shared/AgentMascot';
import {
  TOPICS, buildGlobals, resolveTopicIdx, GALLERY_TOPIC_ID,
  type Topic, type ContentCard, type Global,
} from './agentHubData';

function readAmbient() {
  const c = (typeof window !== 'undefined' && window.GLANCE_CTX) || {};
  return { city: c.city || 'Bangalore', weather: c.weather || 'clear' };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Category → content filtering ──────────────────────────────────────────────
// The data model doesn't tag cards by category, so we derive a sensible mapping
// per topic. Each explore category maps to a subset of the topic's cards; a
// category with no explicit mapping shows all cards (still a real content set).

const CATEGORY_CARDS: Record<string, Record<string, string[]>> = {
  recipes: {
    'Dinner Tonight': ['r-pizza', 'r-biryani', 'r-pasta', 'r-soup'],
    'Quick Meals': ['r-ramen', 'r-paneer', 'r-soup'],
    'Breakfast': ['r-pizza', 'r-paneer'],
    'Healthy': ['r-paneer', 'r-soup', 'r-ramen'],
    'Desserts': ['r-pizza'],
    'Italian': ['r-pasta', 'r-pizza'],
    'Indian': ['r-biryani', 'r-paneer'],
    'High Protein': ['r-paneer', 'r-biryani'],
  },
  travel: {
    'Weekend Escapes': ['t-coorg', 't-gokarna', 't-pondi'],
    'Road Trips': ['t-ooty', 't-coorg'],
    'Hidden Gems': ['t-gokarna', 't-wayanad'],
    'Beach': ['t-gokarna', 't-pondi'],
    'Mountains': ['t-munnar', 't-ooty', 't-coorg'],
    'International': ['t-munnar'],
    'Food Travel': ['t-coorg', 't-pondi'],
    'Cultural Trips': ['t-pondi', 't-wayanad'],
  },
  shopping: {
    'Electronics': ['s-headphones', 's-tv'],
    'Kitchen': ['s-coffee'],
    'Home': ['s-lamp', 's-tv'],
    'Fashion': ['s-backpack'],
    'Gaming': ['s-tv'],
    'Beauty': ['s-shoes'],
    'Deals': ['s-headphones', 's-tv'],
    'Price Drops': ['s-headphones', 's-tv'],
  },
  entertainment: {
    'Movies': ['e-movie'],
    'Series': ['e-continue', 'e-newrelease'],
    'Sports': ['e-sport'],
    'Music': ['e-music'],
    'Podcasts': ['e-podcast'],
    'Continue Watching': ['e-continue'],
  },
  fashion: {
    'Weekend Layers': ['f-weekend'],
    'Office Wear': ['f-office', 'f-smart'],
    'Rain Ready': ['f-rain'],
    'Occasion': ['f-occasion'],
    'Travel Looks': ['f-vacation'],
    'Accessories': ['f-occasion'],
    'Seasonal': ['f-weekend', 'f-rain'],
    'Saved Looks': ['f-weekend', 'f-smart'],
  },
  wellness: {
    'Sleep': ['w-sleep'],
    'Mindfulness': ['w-breath'],
    'Movement': ['w-stretch', 'w-yoga'],
    'Focus': ['w-breath'],
    'Stress Relief': ['w-breath', 'w-sleep'],
    'Nutrition': ['w-stretch'],
  },
  pets: {
    'Care': ['p-vet', 'p-grooming'],
    'Feeding': ['p-food'],
    'Grooming': ['p-grooming'],
    'Training': ['p-training'],
    'Play': ['p-training'],
    'Products': ['p-food'],
  },
  'home-decor': {
    'Living Room': ['h-lighting', 'h-living'],
    'Bedroom': ['h-bedroom'],
    'Kitchen': ['h-kitchen'],
    'Lighting': ['h-lighting'],
    'Balcony': ['h-balcony'],
    'Furniture': ['h-living', 'h-workspace'],
    'Small Spaces': ['h-living', 'h-workspace'],
    'Color Ideas': ['h-bedroom', 'h-lighting'],
  },
  news: {
    'Today': ['n-brief'],
    'World': ['n-monsoon'],
    'India': ['n-rbi', 'n-cricket'],
    'Technology': ['n-brief'],
    'Business': ['n-rbi'],
    'Explained': ['n-rbi', 'n-monsoon'],
  },
  sports: {
    'Live': ['sp-match'],
    'Upcoming': ['sp-football', 'sp-ride'],
    'Highlights': ['sp-highlights'],
    'Cricket': ['sp-match', 'sp-highlights'],
    'Football': ['sp-football'],
    'F1': ['sp-football'],
  },
  gallery: {
    'Recent Generations': ['g-coorg', 'g-wallpaper'],
    'Wallpapers': ['g-wallpaper', 'g-landscape'],
    'Portraits': ['g-portrait'],
    'Landscapes': ['g-landscape', 'g-coorg'],
    'Collections': ['g-coorg', 'g-portrait', 'g-landscape'],
    'Continue Editing': ['g-wallpaper'],
  },
};

function cardsForCategory(topic: Topic, categoryLabel: string): ContentCard[] {
  const map = CATEGORY_CARDS[topic.id];
  const ids = map?.[categoryLabel];
  if (!ids || !ids.length) return topic.cards;
  const byId = new Map(topic.cards.map(c => [c.id, c]));
  const picked = ids.map(id => byId.get(id)).filter(Boolean) as ContentCard[];
  return picked.length ? picked : topic.cards;
}

// ─── Column-2 rows: categories then "Your Activity" ────────────────────────────
type C2Row =
  | { kind: 'cat'; label: string; cue: string; image: string }
  | { kind: 'activity'; label: string };

function buildC2Rows(topic: Topic): C2Row[] {
  const cats: C2Row[] = topic.explore.map(e => ({ kind: 'cat', label: e.label, cue: e.cue, image: e.image }));
  // Your Activity = the recent thread titles, promoted here as quick entries.
  const activity: C2Row[] = topic.recent.map(r => ({ kind: 'activity', label: r.kind === 'Conversation' ? `“${r.title}”` : r.title }));
  return [...cats, ...activity];
}

type Column = 'c1' | 'c2' | 'c3';

// ─── Rail (Column 1 — identical to Option 3) ───────────────────────────────────
type RailEntry =
  | { kind: 'topic'; topicIdx: number; label: string; icon: string; tint: string; agent: boolean; groupBefore?: string; sepBefore?: boolean }
  | { kind: 'global'; globalId: string; label: string; icon: string; sepBefore?: boolean };
const ICON = { search: '⌕', gallery: '✦', wishlist: '♡', recent: '⟲', settings: '⚙' };
function buildRail(topics: Topic[]): RailEntry[] {
  const agents = topics.filter(t => t.id !== GALLERY_TOPIC_ID);
  const gallery = topics.find(t => t.id === GALLERY_TOPIC_ID)!;
  const r: RailEntry[] = [];
  r.push({ kind: 'global', globalId: 'search', label: 'Search', icon: ICON.search });
  agents.forEach((t, i) => r.push({ kind: 'topic', topicIdx: topics.indexOf(t), label: t.label, icon: t.icon, tint: t.tint, agent: true, groupBefore: i === 0 ? 'Agents' : undefined, sepBefore: i === 0 }));
  r.push({ kind: 'topic', topicIdx: topics.indexOf(gallery), label: gallery.label, icon: ICON.gallery, tint: gallery.tint, agent: false, sepBefore: true });
  r.push({ kind: 'global', globalId: 'wishlist', label: 'Wishlist', icon: ICON.wishlist });
  r.push({ kind: 'global', globalId: 'recent', label: 'Recent', icon: ICON.recent });
  r.push({ kind: 'global', globalId: 'settings', label: 'Settings', icon: ICON.settings, sepBefore: true });
  return r;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export type ExploreFirstPanelProps = {
  onBack: () => void; onToast?: (msg: string) => void;
  currentCategory?: string; currentSubs?: string[]; currentTitle?: string;
};

export default function ExploreFirstPanel({ onBack, onToast, currentCategory, currentSubs, currentTitle }: ExploreFirstPanelProps) {
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
  const [c2Idx, setC2Idx] = useState(0);      // category focus
  const [c3Idx, setC3Idx] = useState(0);      // content focus
  const [globalIdx, setGlobalIdx] = useState(0);
  const [convo, setConvo] = useState(false);  // progressive AI open
  const [convoIdx, setConvoIdx] = useState(0);
  const [thinking, setThinking] = useState(false);

  const entry = rail[railIdx];
  const isTopic = entry.kind === 'topic';
  const topic = isTopic ? TOPICS[entry.topicIdx] : null;
  const global = !isTopic ? globals.find(g => g.id === entry.globalId)! : null;

  const c2Rows = useMemo(() => (topic ? buildC2Rows(topic) : []), [topic]);
  const c2Sel = c2Rows[c2Idx];
  const catCount = topic ? topic.explore.length : 0;

  // Content shown in C3 = cards for the selected category (only when a cat is focused)
  const contentCards = useMemo(() => {
    if (!topic || !c2Sel || c2Sel.kind !== 'cat') return [];
    return cardsForCategory(topic, c2Sel.label);
  }, [topic, c2Sel]);
  const selectedCard = contentCards[c3Idx];

  useEffect(() => { setC2Idx(0); setC3Idx(0); setConvo(false); }, [railIdx]); // eslint-disable-line
  useEffect(() => { setC3Idx(0); setConvo(false); }, [c2Idx]);
  useEffect(() => { setConvo(false); setConvoIdx(0); }, [c3Idx]);

  const mascotMode: AgentMode = thinking ? 'thinking' : convo ? 'looking' : 'idle';

  // On mount, land focus on the current-L0 item's category if we can map it.
  useEffect(() => {
    if (!topic || !currentTitle) return;
    const catMap = CATEGORY_CARDS[topic.id];
    if (!catMap) return;
    const curCard = topic.cards.find(c =>
      c.title.toLowerCase().includes(currentTitle.toLowerCase().split(' ')[0]) ||
      currentTitle.toLowerCase().includes(c.title.toLowerCase().split(' ')[0]));
    if (!curCard) return;
    const catIdx = topic.explore.findIndex(e => (catMap[e.label] || []).includes(curCard.id));
    if (catIdx >= 0) setC2Idx(catIdx);
  }, [topic, currentTitle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(key)) e.preventDefault();
      if (key === 'Escape' || key === 'Backspace') { if (convo) { setConvo(false); return; } onBack(); return; }

      // ── Progressive AI conversation overlay ──────────────────
      if (convo && selectedCard) {
        const len = selectedCard.prompts.length + 1;
        if (key === 'ArrowUp')   { setConvoIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setConvoIdx(i => Math.min(len - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setConvo(false); return; }
        if (key === 'Enter' || key === ' ') {
          const isAsk = convoIdx === selectedCard.prompts.length;
          onToast?.(isAsk ? `${topic!.agentName} · open conversation` : `${topic!.agentName} · ${selectedCard.prompts[convoIdx].label}`);
          setThinking(true); setTimeout(() => setThinking(false), 1400);
          return;
        }
        return;
      }

      if (column === 'c1') {
        if (key === 'ArrowUp')   { setRailIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setRailIdx(i => Math.min(rail.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { onBack(); return; }
        if (key === 'ArrowRight' || key === 'Enter' || key === ' ') { setColumn('c2'); setGlobalIdx(0); return; }
        return;
      }

      if (column === 'c2' && !isTopic) {
        const len = global!.items.length;
        if (key === 'ArrowUp')   { setGlobalIdx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setGlobalIdx(i => Math.min(len - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c1'); return; }
        if (key === 'ArrowRight') { onBack(); return; }
        if (key === 'Enter' || key === ' ') { onToast?.(`${global!.label} · ${global!.items[globalIdx].title}`); return; }
        return;
      }

      if (column === 'c2' && isTopic) {
        if (key === 'ArrowUp')   { setC2Idx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setC2Idx(i => Math.min(c2Rows.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c1'); return; }
        if (key === 'ArrowRight' || key === 'Enter' || key === ' ') {
          if (c2Sel.kind === 'cat') { setColumn('c3'); setC3Idx(0); }
          else onToast?.(`${topic!.label} · ${c2Sel.label}`);
          return;
        }
        return;
      }

      if (column === 'c3') {
        if (key === 'ArrowUp')   { setC3Idx(i => Math.max(0, i - 1)); return; }
        if (key === 'ArrowDown') { setC3Idx(i => Math.min(contentCards.length - 1, i + 1)); return; }
        if (key === 'ArrowLeft') { setColumn('c2'); return; }
        if (key === 'ArrowRight') { if (selectedCard) { setConvo(true); setConvoIdx(0); } return; }  // progressive AI
        if (key === 'Enter' || key === ' ') { if (selectedCard) { setConvo(true); setConvoIdx(0); } return; }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [column, railIdx, isTopic, global, globalIdx, topic, c2Rows, c2Idx, c2Sel, contentCards, c3Idx, selectedCard, convo, convoIdx, rail.length, onBack, onToast]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0, width: '86vw',
      background: [
        'radial-gradient(1300px 1400px at -8% 50%, rgba(11,9,20,0.98), rgba(7,6,14,0.84) 55%, transparent 88%)',
        'linear-gradient(100deg, rgba(5,4,12,0.98) 0%, rgba(5,4,12,0.88) 74%, rgba(5,4,12,0) 100%)',
      ].join(', '),
      animation: 'e4-panel-in 0.36s cubic-bezier(0.22,0.61,0.36,1) forwards',
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
        <div style={{ marginBottom: 18 }}><img src="/glance-logo.png" alt="Glance" style={{ height: 24, opacity: 0.9 }} /></div>
        {rail.map((e, i) => (
          <div key={i}>
            {e.sepBefore && <RailSep label={e.kind === 'topic' ? e.groupBefore : undefined} />}
            <RailRow icon={e.icon} label={e.label} tint={e.kind === 'topic' ? e.tint : undefined}
              agent={e.kind === 'topic' && e.agent}
              focused={column === 'c1' && railIdx === i} selected={railIdx === i}
              onClick={() => { setRailIdx(i); setColumn('c2'); setGlobalIdx(0); }} />
          </div>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 14, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.24)' }}>← or Back returns to Home</div>
      </div>

      {/* ── Column 2: EXPLORE (promoted) ─────────────────────── */}
      <div style={{
        width: 420, flexShrink: 0, padding: '40px 22px 26px 30px',
        opacity: column === 'c2' ? 1 : 0.82, transition: 'opacity 0.3s ease', overflowY: 'auto',
      }}>
        {isTopic
          ? <C2Explore topic={topic!} rows={c2Rows} idx={c2Idx} catCount={catCount} focused={column === 'c2'} />
          : <C2Global dest={global!} idx={globalIdx} focused={column === 'c2'} />}
      </div>

      {/* ── Column 3: content browser + progressive AI ────────── */}
      <div style={{
        flex: 1, minWidth: 0, padding: '40px 44px 26px 30px',
        opacity: column === 'c3' || convo ? 1 : 0.72, transition: 'opacity 0.3s ease', overflowY: 'auto',
      }}>
        {isTopic && c2Sel?.kind === 'cat' && (
          <C3Content
            topic={topic!} category={c2Sel.label} cards={contentCards} idx={c3Idx}
            focused={column === 'c3'} convo={convo} convoIdx={convoIdx} mascotMode={mascotMode}
          />
        )}
        {isTopic && c2Sel?.kind === 'activity' && (
          <ActivityHint topic={topic!} />
        )}
      </div>

      {/* Hint strip */}
      <div style={{
        position: 'absolute', left: 46, bottom: 16, display: 'flex', alignItems: 'center', gap: 16, zIndex: 40,
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.32)',
      }}>
        {hintFor(column, convo).map(([k, l]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{k}</kbd>
            <span>{l}</span>
          </span>
        ))}
      </div>

      <style>{E4_KF}</style>
    </div>
  );
}

function hintFor(col: Column, convo: boolean): [string, string][] {
  if (convo) return [['↑↓', 'Prompts'], ['Enter', 'Send'], ['←', 'Close']];
  if (col === 'c1') return [['↑↓', 'Navigate'], ['→', 'Explore'], ['←', 'Back to feed']];
  if (col === 'c2') return [['↑↓', 'Categories'], ['→', 'Browse'], ['←', 'Nav']];
  return [['↑↓', 'Content'], ['Enter', 'Ask AI'], ['←', 'Categories']];
}

// ─── Column 1 pieces ───────────────────────────────────────────────────────────

function RailSep({ label }: { label?: string }) {
  if (label) return <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '16px 0 8px 8px' }}>{label}</div>;
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 8px' }} />;
}
function RailRow({ icon, label, tint, agent, focused, selected, onClick }: {
  icon: string; label: string; tint?: string; agent?: boolean; focused: boolean; selected: boolean; onClick: () => void;
}) {
  const accent = tint || '#C7B6F5'; const rgb = hexRgb(accent); const strong = selected && agent;
  return (
    <div onClick={onClick} style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 12,
      padding: strong ? '11px 14px' : '9px 12px', borderRadius: 13, cursor: 'pointer',
      background: focused ? 'rgba(255,255,255,0.14)' : strong ? `linear-gradient(100deg, rgba(${rgb},0.15), rgba(255,255,255,0.04))` : selected ? 'rgba(255,255,255,0.06)' : 'transparent',
      border: focused ? '1.5px solid rgba(255,255,255,0.45)' : strong ? `1.5px solid rgba(${rgb},0.42)` : selected ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid transparent',
      boxShadow: focused ? '0 8px 26px rgba(0,0,0,0.45)' : strong ? `0 6px 22px rgba(${rgb},0.16)` : 'none',
      transform: focused || strong ? 'translateX(5px)' : 'none', transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
    }}>
      {strong && <div style={{ position: 'absolute', left: -4, top: '20%', bottom: '20%', width: 3, borderRadius: 3, background: accent, boxShadow: `0 0 9px ${accent}` }} />}
      <div style={{ width: strong ? 38 : 30, height: strong ? 38 : 30, borderRadius: 10, flexShrink: 0, background: strong ? `rgba(${rgb},0.18)` : 'rgba(255,255,255,0.06)', border: `1px solid ${strong ? `rgba(${rgb},0.4)` : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: strong ? 19 : 15, transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)' }}>{icon}</div>
      <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: focused || strong ? 700 : 600, fontSize: strong ? 17 : 14, color: focused || strong ? '#FFFFFF' : selected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', transition: 'all 0.2s' }}>{label}</span>
    </div>
  );
}

function MiniLabel({ text }: { text: string }) {
  return <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>{text}</div>;
}

// ─── Column 2: Explore categories + Your Activity ──────────────────────────────

function C2Explore({ topic, rows, idx, catCount, focused }: {
  topic: Topic; rows: C2Row[]; idx: number; catCount: number; focused: boolean;
}) {
  const rgb = hexRgb(topic.tint);
  return (
    <div key={topic.id} style={{ animation: 'e4-ws-in 0.34s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(${rgb},0.16)`, border: `1px solid rgba(${rgb},0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{topic.icon}</div>
        <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 24, color: '#FFFFFF', letterSpacing: '-0.02em' }}>Explore {topic.label}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, i) => {
          const on = focused && idx === i;
          if (row.kind === 'cat') {
            return (
              <div key={row.label} style={{
                position: 'relative', height: on ? 96 : 76, borderRadius: 15, overflow: 'hidden', cursor: 'pointer',
                border: on ? `2px solid rgba(${rgb},0.65)` : '1px solid rgba(255,255,255,0.09)',
                boxShadow: on ? `0 14px 34px rgba(${rgb},0.22)` : 'none',
                transition: 'all 0.26s cubic-bezier(0.22,0.61,0.36,1)', background: '#111',
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${row.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(4,3,10,0.9) 0%, rgba(4,3,10,0.45) 55%, rgba(4,3,10,0.15) 100%)' }} />
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: on ? 19 : 17, color: '#FFFFFF', letterSpacing: '-0.01em', transition: 'font-size 0.2s' }}>{row.label}</div>
                  <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{row.cue}</div>
                </div>
                {on && <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#FFFFFF' }}>›</span>}
              </div>
            );
          }
          // activity row (index >= catCount)
          const isFirstActivity = i === catCount;
          return (
            <div key={`a-${i}`}>
              {isFirstActivity && <div style={{ margin: '14px 0 8px' }}><MiniLabel text="Your Activity" /></div>}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderRadius: 13, cursor: 'pointer',
                background: on ? `rgba(${rgb},0.16)` : 'rgba(255,255,255,0.04)',
                border: on ? `1.5px solid rgba(${rgb},0.5)` : '1px solid rgba(255,255,255,0.08)',
                transform: on ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
              }}>
                <span style={{ fontSize: 14, color: `rgba(${rgb},0.85)` }}>↺</span>
                <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 600, fontSize: 14.5, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Column 2 (global destination) ─────────────────────────────────────────────

function C2Global({ dest, idx, focused }: { dest: Global; idx: number; focused: boolean }) {
  return (
    <div key={dest.id} style={{ animation: 'e4-ws-in 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 4 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{dest.icon}</div>
        <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 25, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{dest.label}</div>
      </div>
      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '16px 0 12px' }}>{dest.heading}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dest.items.map((it, i) => {
          const on = focused && idx === i;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: it.image ? '8px' : '15px 17px', borderRadius: 14, cursor: 'pointer', background: on ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: on ? '1.5px solid rgba(255,255,255,0.42)' : '1px solid rgba(255,255,255,0.08)', transform: on ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)' }}>
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

// ─── Column 3: content browser (single-card expansion) + progressive AI ─────────

function C3Content({ topic, category, cards, idx, focused, convo, convoIdx, mascotMode }: {
  topic: Topic; category: string; cards: ContentCard[]; idx: number; focused: boolean;
  convo: boolean; convoIdx: number; mascotMode: AgentMode;
}) {
  const rgb = hexRgb(topic.tint);
  const selected = cards[idx];

  // Full conversation overlay (progressive AI)
  if (convo && selected) {
    const askIdx = selected.prompts.length;
    return (
      <div key={'convo' + selected.id} style={{ animation: 'e4-ws-in 0.3s ease', maxWidth: 560, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 84, height: 84, borderRadius: 22, flexShrink: 0, background: `radial-gradient(circle at 50% 40%, rgba(${rgb},0.26), rgba(255,255,255,0.04))`, border: `1px solid rgba(${rgb},0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 34px rgba(${rgb},0.22)`, animation: 'e4-float 4s ease-in-out infinite' }}>
            <AgentMascot agentMode={mascotMode} size={68} />
          </div>
          <div>
            <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 21, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{topic.agentName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, color: `rgba(${rgb},0.9)` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.tint, boxShadow: `0 0 7px ${topic.tint}` }} />{selected.note}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.92)', lineHeight: 1.45, marginBottom: 20, padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>“{selected.message}”</div>
        <MiniLabel text="Suggested questions" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selected.prompts.map((p, i) => {
            const on = convoIdx === i;
            return (
              <div key={i} style={{ padding: '12px 15px', borderRadius: 13, cursor: 'pointer', background: on ? `linear-gradient(110deg, rgba(${rgb},0.2), rgba(255,255,255,0.05))` : 'rgba(255,255,255,0.05)', border: on ? `1.5px solid rgba(${rgb},0.55)` : '1px solid rgba(255,255,255,0.1)', transform: on ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)' }}>
                <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 600, fontSize: 15.5, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', lineHeight: 1.35 }}>{p.label}</div>
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', borderRadius: 13, cursor: 'pointer', marginTop: 2, background: convoIdx === askIdx ? 'rgba(255,255,255,0.12)' : 'transparent', border: convoIdx === askIdx ? '1.5px solid rgba(255,255,255,0.4)' : '1px dashed rgba(255,255,255,0.2)', transform: convoIdx === askIdx ? 'translateX(5px)' : 'none', transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)' }}>
            <span style={{ fontSize: 15 }}>💬</span>
            <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 600, fontSize: 15, fontStyle: 'italic', color: convoIdx === askIdx ? '#FFFFFF' : 'rgba(255,255,255,0.55)' }}>Ask {topic.agentName}…</span>
          </div>
        </div>
      </div>
    );
  }

  // Content browser (single-card expansion + compact AI preview on focused card)
  return (
    <div key={topic.id + category} style={{ animation: 'e4-ws-in 0.32s ease' }}>
      <MiniLabel text={category} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cards.map((c, i) => {
          const on = focused && idx === i;
          if (on) {
            return (
              <div key={c.id}>
                {/* full-image hero */}
                <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', height: 210, border: `2px solid rgba(${rgb},0.7)`, boxShadow: `0 20px 50px rgba(${rgb},0.28)`, background: '#111', animation: 'e4-hero-in 0.3s cubic-bezier(0.22,0.61,0.36,1)' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,3,10,0.95) 0%, rgba(4,3,10,0.4) 50%, transparent 82%)' }} />
                  {c.isCurrentL0 && (
                    <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(${rgb},0.6)`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 11, fontWeight: 700, color: topic.tint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: topic.tint, boxShadow: `0 0 8px ${topic.tint}` }} />{topic.currentLabel}
                    </div>
                  )}
                  <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16 }}>
                    <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 800, fontSize: 25, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.12 }}>{c.title}</div>
                    <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.78)', marginTop: 5 }}>{c.sub}</div>
                  </div>
                </div>
                {/* compact AI preview attached to the focused card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '11px 14px', borderRadius: 14, background: `linear-gradient(110deg, rgba(${rgb},0.14), rgba(255,255,255,0.04))`, border: `1px solid rgba(${rgb},0.32)` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `rgba(${rgb},0.16)`, border: `1px solid rgba(${rgb},0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AgentMascot agentMode={mascotMode} size={32} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 13.5, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{topic.agentName}</div>
                    <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>“{selected?.message}”</div>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <kbd style={{ background: 'rgba(255,255,255,0.92)', color: '#0A0812', borderRadius: 5, padding: '2px 7px', fontSize: 9.5, fontWeight: 800, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif' }}>Enter</kbd>
                    <span style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>to ask</span>
                  </span>
                </div>
              </div>
            );
          }
          // compact card
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px', borderRadius: 16, cursor: 'pointer', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.28s cubic-bezier(0.22,0.61,0.36,1)' }}>
              <div style={{ width: 118, height: 72, borderRadius: 12, flexShrink: 0, overflow: 'hidden', backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.12)' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                {c.isCurrentL0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 4, padding: '1px 8px', borderRadius: 999, background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.35)`, fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 8.5, fontWeight: 700, color: topic.tint, textTransform: 'uppercase', letterSpacing: '0.06em' }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: topic.tint }} />On L0</div>}
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

function ActivityHint({ topic }: { topic: Topic }) {
  const rgb = hexRgb(topic.tint);
  return (
    <div style={{ animation: 'e4-ws-in 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: `rgba(${rgb},0.14)`, border: `1px solid rgba(${rgb},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>↺</div>
      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em' }}>Continue where you left off</div>
      <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 320, lineHeight: 1.5 }}>Press Enter to reopen this {topic.label.toLowerCase()} thread and pick up the conversation.</div>
    </div>
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function hexRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const E4_KF = `
@keyframes e4-panel-in { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes e4-ws-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes e4-hero-in { from { opacity: 0.4; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes e4-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
`;
