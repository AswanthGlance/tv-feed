/**
 * AgentHubPanel — Option 1 concept: full-screen Agent Hub workspace.
 *
 * Slides in from the left over L0. onBack() dismisses it.
 * Sections: Pinned (live widgets) · AI Agents · More entry points.
 *
 * TV Navigation model:
 *   ↑ / ↓      → switch rows
 *   ← / →      → move within the row
 *   Food → →   → exit to L0 (rightmost anchor on the agents row)
 *   Enter/OK   → toggle pin
 *   Back/Esc   → return to L0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type PinnedWidget = {
  id: string; label: string; icon: string;
  preview: string; meta: string; accentColor: string;
};

type AgentCardT = {
  id: string; label: string; subLabel: string;
  previewLine1: string; previewLine2?: string; previewLine3?: string;
  badgeText?: string; bgGradient: string; accentColor: string; icon: string;
};

type EntryPoint = {
  id: string; label: string; icon: string;
  snippet: string; accentColor: string;
};

// ─── Static data ───────────────────────────────────────────────────────────────

const PINNED: PinnedWidget[] = [
  { id: 'sports-score',      label: 'Sports Score',      icon: '🏏', preview: 'IND vs AUS · Live',       meta: '312/5 (48.2 ov) · AUS 198',   accentColor: '#4CAF50' },
  { id: 'continue-watching', label: 'Continue Watching', icon: '▶',  preview: 'Mirzapur — S3 E5',        meta: '38 min remaining',             accentColor: '#FF5DA2' },
  { id: 'price-drop',        label: 'Price Drop',        icon: '↓',  preview: 'Sony WH-1000XM5',         meta: '₹24,990  was ₹32,990',         accentColor: '#7047E2' },
  { id: 'ai-gen',            label: 'AI Gallery',        icon: '✦',  preview: 'Latest creation',         meta: '24 images · 2h ago',           accentColor: '#A786E5' },
  { id: 'tonight-recipe',    label: "Tonight's Recipe",  icon: '🍲', preview: 'Butter Garlic Naan Pizza', meta: 'Ready in 25 min',             accentColor: '#FF9800' },
];

const TOP_AGENTS: AgentCardT[] = [
  {
    id: 'entertainment', label: 'Entertainment', subLabel: 'AI Agent',
    previewLine1: 'Trending now', previewLine2: 'The Boys — S4 · Netflix', previewLine3: '2 new episodes · Added this week',
    badgeText: 'New',
    bgGradient: 'linear-gradient(140deg, #1A0A2E 0%, #2D1254 60%, #1A0A2E 100%)',
    accentColor: '#C24DFF', icon: '🎬',
  },
  {
    id: 'shopping', label: 'Shopping', subLabel: 'AI Agent',
    previewLine1: 'Price drop alert', previewLine2: 'Sony WH-1000XM5 Headphones', previewLine3: '↓ 24% · ₹24,990 · Free delivery',
    badgeText: '3 drops',
    bgGradient: 'linear-gradient(140deg, #0D1A2E 0%, #122444 60%, #0D1A2E 100%)',
    accentColor: '#4FC3F7', icon: '🛍',
  },
  {
    id: 'food', label: 'Food & Recipes', subLabel: 'AI Agent',
    previewLine1: "Tonight's idea", previewLine2: 'Butter Garlic Naan Pizza', previewLine3: 'Ready in 25 min · Beginner friendly',
    bgGradient: 'linear-gradient(140deg, #1A0E05 0%, #2E1A08 60%, #1A0E05 100%)',
    accentColor: '#FF9800', icon: '🍽',
  },
  {
    id: 'news', label: 'News', subLabel: 'AI Agent',
    previewLine1: "Today's brief", previewLine2: 'RBI holds repo rate · Monsoon early in Kerala', previewLine3: 'India wins T20 series vs Australia',
    bgGradient: 'linear-gradient(140deg, #0A1020 0%, #141E35 60%, #0A1020 100%)',
    accentColor: '#78B1E0', icon: '📰',
  },
  {
    id: 'travel', label: 'Travel', subLabel: 'AI Agent',
    previewLine1: 'Weekend escape', previewLine2: 'Coorg — 4h from Bangalore', previewLine3: 'Coffee estates · ₹4,200 stays available',
    bgGradient: 'linear-gradient(140deg, #041A14 0%, #082E22 60%, #041A14 100%)',
    accentColor: '#4DB6AC', icon: '✈',
  },
  {
    id: 'ai-gallery', label: 'AI Gallery', subLabel: 'Create',
    previewLine1: 'Your recent creations', previewLine2: '24 images generated this month', previewLine3: 'Last: "Cozy café in rain" · 2h ago',
    badgeText: '24',
    bgGradient: 'linear-gradient(140deg, #160A2E 0%, #240F48 60%, #160A2E 100%)',
    accentColor: '#A786E5', icon: '✦',
  },
];

const MORE_ENTRIES: EntryPoint[] = [
  { id: 'sports',     label: 'Sports',          icon: '🏏', snippet: 'IND vs AUS · Live',         accentColor: '#4CAF50' },
  { id: 'music',      label: 'Music',            icon: '♪',  snippet: 'Your evening playlist',     accentColor: '#E040FB' },
  { id: 'podcasts',   label: 'Podcasts',         icon: '🎙',  snippet: 'Huberman Lab · Ep 142',     accentColor: '#FF5DA2' },
  { id: 'wallpapers', label: 'Wallpapers',       icon: '🖼',  snippet: '12 new today',              accentColor: '#78B1E0' },
  { id: 'family',     label: 'Family',           icon: '👨‍👩‍👧', snippet: 'Chhota Bheem · New ep',    accentColor: '#FFD740' },
  { id: 'learning',   label: 'Learning',         icon: '📚',  snippet: 'Python in 30 min',          accentColor: '#4DB6AC' },
  { id: 'lifestyle',  label: 'Lifestyle',        icon: '✿',  snippet: 'Morning routine tips',      accentColor: '#F48FB1' },
  { id: 'home',       label: 'Home Inspiration', icon: '🏡',  snippet: 'Monsoon decor ideas',       accentColor: '#A5D6A7' },
  { id: 'saved',      label: 'Saved',            icon: '★',  snippet: '17 recommendations saved',  accentColor: '#A786E5' },
];

// ─── Navigation map ────────────────────────────────────────────────────────────

type Section = 'pinned' | 'agents' | 'more';
type FocusState = { section: Section; idx: number };

const col = (section: Section, idx: number): number => {
  if (section === 'pinned') return idx;
  if (section === 'agents') return idx % 3;
  return idx % 5;
};

const gridRow = (section: Section, idx: number): number => {
  if (section === 'pinned') return 0;
  if (section === 'agents') return Math.floor(idx / 3);
  return Math.floor(idx / 5);
};

const SECTION_COLS: Record<Section, number> = { pinned: 5, agents: 3, more: 5 };
const SECTION_SIZE: Record<Section, number> = {
  pinned: PINNED.length,
  agents: TOP_AGENTS.length,
  more:   MORE_ENTRIES.length,
};

function idxAt(section: Section, c: number, r: number): number | null {
  const candidate = r * SECTION_COLS[section] + c;
  if (candidate < 0 || candidate >= SECTION_SIZE[section]) return null;
  if (col(section, candidate) !== c) return null;
  return candidate;
}

function navigate(
  focus: FocusState,
  dir: 'up' | 'down' | 'left' | 'right',
): FocusState | null {
  const { section, idx } = focus;
  const c = col(section, idx);
  const r = gridRow(section, idx);

  if (dir === 'left') {
    if (c > 0) return { section, idx: idx - 1 };
    return focus;
  }

  if (dir === 'right') {
    if (section === 'agents' && idx === 2) return null; // Food → exit to L0
    const nextIdx = idx + 1;
    if (nextIdx >= SECTION_SIZE[section]) return focus;
    if (col(section, nextIdx) <= c) return focus;
    return { section, idx: nextIdx };
  }

  if (dir === 'up') {
    if (r > 0) {
      const up = idxAt(section, c, r - 1);
      return up !== null ? { section, idx: up } : focus;
    }
    if (section === 'agents') {
      const pc = Math.min(c, SECTION_COLS['pinned'] - 1);
      const up = idxAt('pinned', pc, 0);
      return up !== null ? { section: 'pinned', idx: up } : focus;
    }
    if (section === 'more') {
      const agentRows = Math.ceil(SECTION_SIZE['agents'] / SECTION_COLS['agents']);
      const pc = Math.min(c, SECTION_COLS['agents'] - 1);
      const up = idxAt('agents', pc, agentRows - 1);
      return up !== null ? { section: 'agents', idx: up } : focus;
    }
    return focus;
  }

  if (dir === 'down') {
    const sectionRows = Math.ceil(SECTION_SIZE[section] / SECTION_COLS[section]);
    if (r < sectionRows - 1) {
      const down = idxAt(section, c, r + 1);
      if (down !== null) return { section, idx: down };
    }
    if (section === 'pinned') {
      const pc = Math.min(c, SECTION_COLS['agents'] - 1);
      const down = idxAt('agents', pc, 0);
      return down !== null ? { section: 'agents', idx: down } : focus;
    }
    if (section === 'agents') {
      const pc = Math.min(c, SECTION_COLS['more'] - 1);
      const down = idxAt('more', pc, 0);
      return down !== null ? { section: 'more', idx: down } : focus;
    }
    return focus;
  }

  return focus;
}

const DEFAULT_FOCUS: FocusState = { section: 'agents', idx: 2 };

// ─── Component ─────────────────────────────────────────────────────────────────

export type AgentHubPanelProps = {
  onBack: () => void;
  entering?: boolean;
};

export default function AgentHubPanel({ onBack, entering = false }: AgentHubPanelProps) {
  const [focus, setFocus]           = useState<FocusState>(DEFAULT_FOCUS);
  const [pinnedIds, setPinnedIds]   = useState<Set<string>>(new Set(['sports-score', 'ai-gen']));
  const [pinAnim, setPinAnim]       = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(`hub-row-${focus.section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focus.section]);

  const pin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
    setPinAnim(id);
    setTimeout(() => setPinAnim(null), 600);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(key)) {
        e.preventDefault();
      }
      if (key === 'Escape' || key === 'Backspace') { onBack(); return; }

      const dirMap: Record<string, 'up'|'down'|'left'|'right'> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      };
      const dir = dirMap[key];
      if (dir) {
        const next = navigate(focus, dir);
        if (next === null) onBack();
        else setFocus(next);
        return;
      }
      if (key === 'Enter' || key === ' ') {
        const { section, idx } = focus;
        const id =
          section === 'pinned' ? PINNED[idx]?.id :
          section === 'agents' ? TOP_AGENTS[idx]?.id :
          MORE_ENTRIES[idx]?.id;
        if (id) pin(id);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focus, onBack, pin]);

  const isFocused = (s: Section, i: number) => focus.section === s && focus.idx === i;

  return (
    <div
      ref={contentRef}
      style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(1400px 900px at 15% 30%, rgba(70,30,160,0.24), transparent 60%)',
          'radial-gradient(1000px 700px at 85% 70%, rgba(40,10,90,0.20), transparent 55%)',
          'linear-gradient(160deg, #04020e 0%, #0a0620 50%, #04020e 100%)',
        ].join(', '),
        overflowY: 'auto', overflowX: 'hidden',
        animation: entering ? 'hub-slide-in 0.32s cubic-bezier(0.22,0.61,0.36,1) forwards' : 'none',
        willChange: 'transform',
      }}
    >
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 88px 20px 88px',
        background: 'linear-gradient(to bottom, rgba(4,2,14,0.97) 75%, transparent)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src="/glance-logo.png" alt="Glance" style={{ height: 32, opacity: 0.88 }} />
          <div style={{ width: 1, height: 26, background: 'rgba(167,134,229,0.22)' }} />
          <div>
            <div style={{
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              fontWeight: 700, fontSize: 26, color: '#F5F3F7', letterSpacing: '-0.02em',
            }}>Agent Hub</div>
            <div style={{
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              fontSize: 12, color: 'rgba(167,134,229,0.65)',
              marginTop: 1, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500,
            }}>Your AI workspace</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          fontSize: 12, color: 'rgba(255,255,255,0.25)',
        }}>
          {[['↑↓','Switch row'],['←→','Browse'],['Enter','Pin to L0'],['Back','Return to feed']].map(([k,l]) => (
            <span key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <kbd style={{
                background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)',
              }}>{k}</kbd>
              <span>{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '4px 88px 80px' }}>
        <Section id="hub-row-pinned" label="Pinned" sub="Your live widgets" active={focus.section === 'pinned'}>
          <div style={{ display: 'flex', gap: 14 }}>
            {PINNED.map((w, i) => (
              <PinnedCard key={w.id} w={w} focused={isFocused('pinned', i)}
                pinned={pinnedIds.has(w.id)} animating={pinAnim === w.id} onClick={() => pin(w.id)} />
            ))}
            <AddSlot focused={isFocused('pinned', PINNED.length)} />
          </div>
        </Section>

        <Section id="hub-row-agents" label="AI Agents" sub="Explore · discover · act" active={focus.section === 'agents'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {TOP_AGENTS.map((a, i) => (
              <AgentCard key={a.id} a={a} focused={isFocused('agents', i)}
                pinned={pinnedIds.has(a.id)} animating={pinAnim === a.id} onClick={() => pin(a.id)} />
            ))}
          </div>
        </Section>

        <Section id="hub-row-more" label="More" sub="Discover more experiences" active={focus.section === 'more'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {MORE_ENTRIES.map((ep, i) => (
              <MoreCard key={ep.id} ep={ep} focused={isFocused('more', i)}
                pinned={pinnedIds.has(ep.id)} animating={pinAnim === ep.id} onClick={() => pin(ep.id)} />
            ))}
          </div>
        </Section>
      </div>

      <style>{HUB_KF}</style>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, label, sub, active, children }: {
  id: string; label: string; sub: string; active: boolean; children: React.ReactNode;
}) {
  return (
    <div id={id} style={{ marginBottom: 44 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:14, marginBottom:16 }}>
        <h2 style={{
          margin:0, fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif',
          fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
          color: active ? '#F5F3F7' : 'rgba(245,243,247,0.45)', transition: 'color 0.2s',
        }}>{label}</h2>
        <span style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif',
          fontSize:12, color: active ? 'rgba(167,134,229,0.65)' : 'rgba(167,134,229,0.28)', transition:'color 0.2s',
        }}>{sub}</span>
        {active && (
          <div style={{
            marginLeft:'auto', height:3, width:28,
            background:'linear-gradient(to right,#7047E2,#A786E5)', borderRadius:2, animation:'hub-bar-in 0.22s ease',
          }} />
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Card components ───────────────────────────────────────────────────────────

function PinnedCard({ w, focused, pinned, animating, onClick }: {
  w: PinnedWidget; focused: boolean; pinned: boolean; animating: boolean; onClick: () => void;
}) {
  const rgb = hexRgb(w.accentColor);
  return (
    <div onClick={onClick} style={{
      flex: '0 0 224px', height: 124, borderRadius: 18, padding: '16px 18px',
      background: focused
        ? `linear-gradient(140deg,rgba(${rgb},0.16) 0%,rgba(10,6,24,0.96) 100%)`
        : 'rgba(18,14,38,0.72)',
      border: focused ? `2px solid rgba(${rgb},0.55)` : '1px solid rgba(255,255,255,0.07)',
      boxShadow: focused
        ? `0 0 0 1px rgba(${rgb},0.15), 0 8px 32px rgba(${rgb},0.22), inset 0 1px 0 rgba(255,255,255,0.06)`
        : 'none',
      transform: focused ? 'translateY(-4px) scale(1.03)' : 'none',
      transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{
          fontSize:16, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center',
          background:`rgba(${rgb},0.15)`, borderRadius:9,
        }}>{w.icon}</span>
        <span style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:12, fontWeight:600,
          color: focused ? 'rgba(245,243,247,0.85)' : 'rgba(245,243,247,0.55)', transition:'color 0.2s',
        }}>{w.label}</span>
        {pinned && <PinDot color={w.accentColor} animating={animating} />}
      </div>
      <div>
        <div style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:14, fontWeight:600,
          color: 'rgba(245,243,247,0.92)', lineHeight:1.3, marginBottom:3,
        }}>{w.preview}</div>
        <div style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:11, fontWeight:500, color:`rgba(${rgb},0.8)`,
        }}>{w.meta}</div>
      </div>
      {focused && <BottomBar color={w.accentColor} radius={18} />}
      {focused && !pinned && <PinCTA color={w.accentColor} />}
    </div>
  );
}

function AddSlot({ focused }: { focused: boolean }) {
  return (
    <div style={{
      flex:'0 0 120px', height:124, borderRadius:18,
      border: focused ? '2px dashed rgba(167,134,229,0.55)' : '1px dashed rgba(255,255,255,0.1)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7,
      transition:'all 0.2s',
      background: focused ? 'rgba(112,71,226,0.07)' : 'transparent',
      transform: focused ? 'scale(1.03)' : 'none',
    }}>
      <span style={{ fontSize:20, color: focused ? 'rgba(167,134,229,0.8)' : 'rgba(255,255,255,0.18)', transition:'color 0.2s' }}>+</span>
      <span style={{
        fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:11, fontWeight:500,
        color: focused ? 'rgba(167,134,229,0.65)' : 'rgba(255,255,255,0.18)', textAlign:'center', transition:'color 0.2s',
      }}>Add widget</span>
    </div>
  );
}

function AgentCard({ a, focused, pinned, animating, onClick }: {
  a: AgentCardT; focused: boolean; pinned: boolean; animating: boolean; onClick: () => void;
}) {
  const rgb = hexRgb(a.accentColor);
  return (
    <div onClick={onClick} style={{
      height:188, borderRadius:22, padding:'22px 22px 18px',
      background: a.bgGradient,
      border: focused ? `2px solid rgba(${rgb},0.65)` : '1px solid rgba(255,255,255,0.07)',
      boxShadow: focused
        ? `0 0 0 1px rgba(${rgb},0.12), 0 12px 48px rgba(${rgb},0.28), inset 0 1px 0 rgba(255,255,255,0.08)`
        : '0 2px 12px rgba(0,0,0,0.4)',
      transform: focused ? 'translateY(-6px) scale(1.025)' : 'none',
      transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
      cursor:'pointer', position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
    }}>
      {focused && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(400px 300px at 80% 20%,rgba(${rgb},0.1),transparent 70%)`,
        }} />
      )}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{
            width:40, height:40, borderRadius:13,
            background:`rgba(${rgb},0.18)`, border:`1px solid rgba(${rgb},0.3)`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
          }}>{a.icon}</div>
          <div>
            <div style={{
              fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontWeight:700, fontSize:16,
              color:'#F5F3F7', letterSpacing:'-0.01em',
            }}>{a.label}</div>
            <div style={{
              fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:10, fontWeight:500,
              color:`rgba(${rgb},0.7)`, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2,
            }}>{a.subLabel}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          {a.badgeText && (
            <span style={{
              padding:'2px 9px', borderRadius:999,
              background:`rgba(${rgb},0.18)`, border:`1px solid rgba(${rgb},0.35)`,
              fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:10, fontWeight:700,
              color:a.accentColor, letterSpacing:'0.02em',
            }}>{a.badgeText}</span>
          )}
          {pinned && (
            <span style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'2px 9px', borderRadius:999,
              background:'rgba(112,71,226,0.15)', border:'1px solid rgba(112,71,226,0.3)',
              fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:10, fontWeight:600,
              color:'#A786E5', animation: animating ? 'hub-pin-in 0.4s ease' : 'none',
            }}>
              <span style={{ fontSize:8 }}>★</span> Pinned to L0
            </span>
          )}
        </div>
      </div>
      <div style={{ position:'relative' }}>
        <div style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:10, fontWeight:500,
          color:`rgba(${rgb},0.6)`, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5,
        }}>{a.previewLine1}</div>
        <div style={{
          fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:15, fontWeight:600,
          color:'rgba(245,243,247,0.92)', lineHeight:1.3, letterSpacing:'-0.01em', marginBottom:3,
        }}>{a.previewLine2}</div>
        {a.previewLine3 && (
          <div style={{
            fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:12,
            color:'rgba(245,243,247,0.48)', lineHeight:1.4,
          }}>{a.previewLine3}</div>
        )}
      </div>
      {focused && <BottomBar color={a.accentColor} radius={22} />}
      {focused && !pinned && <PinCTA color={a.accentColor} bottom={14} right={18} />}
    </div>
  );
}

function MoreCard({ ep, focused, pinned, animating, onClick }: {
  ep: EntryPoint; focused: boolean; pinned: boolean; animating: boolean; onClick: () => void;
}) {
  const rgb = hexRgb(ep.accentColor);
  return (
    <div onClick={onClick} style={{
      height:100, borderRadius:16, padding:'14px 16px',
      background: focused ? `rgba(${rgb},0.10)` : 'rgba(16,12,30,0.72)',
      border: focused ? `2px solid rgba(${rgb},0.5)` : '1px solid rgba(255,255,255,0.07)',
      boxShadow: focused ? `0 0 28px rgba(${rgb},0.2)` : 'none',
      transform: focused ? 'translateY(-3px) scale(1.04)' : 'none',
      transition: 'all 0.18s cubic-bezier(0.22,0.61,0.36,1)',
      cursor:'pointer', position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            fontSize:15, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
            background:`rgba(${rgb},0.14)`, borderRadius:8,
          }}>{ep.icon}</span>
          <span style={{
            fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontWeight:700, fontSize:13,
            color: focused ? '#F5F3F7' : 'rgba(245,243,247,0.65)', transition:'color 0.2s',
          }}>{ep.label}</span>
        </div>
        {pinned && <PinDot color={ep.accentColor} animating={animating} />}
      </div>
      <div style={{
        fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:11,
        color: focused ? `rgba(${rgb},0.75)` : 'rgba(245,243,247,0.32)', fontWeight:500, transition:'color 0.2s',
      }}>{ep.snippet}</div>
      {focused && <BottomBar color={ep.accentColor} radius={16} />}
      {focused && !pinned && (
        <span style={{
          position:'absolute', top:8, right:10, fontSize:10,
          color:`rgba(${rgb},0.8)`, fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif',
          fontWeight:600, animation:'hub-fade-in 0.2s ease',
        }}>★ Pin</span>
      )}
    </div>
  );
}

// ─── Shared micro-components ───────────────────────────────────────────────────

function BottomBar({ color, radius }: { color: string; radius: number }) {
  return (
    <div style={{
      position:'absolute', left:0, bottom:0, right:0, height:3,
      background:`linear-gradient(to right,transparent 5%,${color} 40%,${color} 60%,transparent 95%)`,
      borderRadius:`0 0 ${radius}px ${radius}px`,
    }} />
  );
}

function PinCTA({ color, bottom = 12, right = 14 }: { color: string; bottom?: number; right?: number }) {
  return (
    <div style={{
      position:'absolute', bottom, right,
      display:'flex', alignItems:'center', gap:5,
      fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif', fontSize:11, fontWeight:600,
      color, background:`rgba(${hexRgb(color)},0.12)`, border:`1px solid rgba(${hexRgb(color)},0.28)`,
      borderRadius:999, padding:'3px 10px', animation:'hub-fade-in 0.2s ease',
    }}>
      <span style={{ fontSize:9 }}>★</span> Pin to L0
    </div>
  );
}

function PinDot({ color, animating }: { color: string; animating: boolean }) {
  return (
    <div style={{
      marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:color,
      boxShadow:`0 0 7px ${color}`, animation: animating ? 'hub-pin-pulse 0.5s ease' : 'none',
    }} />
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function hexRgb(hex: string): string {
  const c = hex.replace('#','');
  const n = parseInt(c, 16);
  return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}

// ─── Keyframes ─────────────────────────────────────────────────────────────────

const HUB_KF = `
@keyframes hub-slide-in {
  from { transform: translateX(-100%); opacity: 0.4; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes hub-bar-in {
  from { width: 0; opacity: 0; }
  to   { width: 28px; opacity: 1; }
}
@keyframes hub-fade-in {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hub-pin-in {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes hub-pin-pulse {
  0%,100% { transform: scale(1);   opacity: 1; }
  50%     { transform: scale(1.9); opacity: 0.5; }
}
`;
