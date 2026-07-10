/**
 * CurvedNavPanel — Option 2: vertical global navigation rail.
 *
 * A living vertical rail emerging from the left edge. The selected destination
 * sits at the vertical center, enlarged, showing an information-rich live
 * preview and one action. Neighbours sit above/below, smaller and lighter.
 *
 * This is GLOBAL ambient navigation, not a list of AI domains.
 * Destinations: Search · Home · Chats · AI Gallery · Wishlist · Settings
 *
 * All previews are grounded in real ambient context (window.GLANCE_CTX) and the
 * warm profile's actual interests — no random filler. Settings surfaces the
 * ambient state itself: location, weather, selfie, profile, privacy.
 *
 * Visual language: near-black, monochrome surfaces, frosted glass, thin white
 * borders, restrained color only in icons / thumbnails / status dots.
 *
 * TV navigation (deterministic, no looping):
 *   ↑ / ↓    → previous / next destination
 *   →        → dismiss, return to L0
 *   Back/Esc → dismiss, return to L0
 *   Enter/OK → open selected destination (toast for now)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Ambient context (live, from window.GLANCE_CTX) ─────────────────────────────

type Ambient = { city: string; weather: string; day: string; timeOfDay: string; upcomingContext: string };

function readAmbient(): Ambient {
  const c = (typeof window !== 'undefined' && window.GLANCE_CTX) || {};
  return {
    city: c.city || 'Bangalore',
    weather: c.weather || 'clear',
    day: c.day || 'Today',
    timeOfDay: c.timeOfDay || 'morning',
    upcomingContext: c.upcomingContext || 'weekend',
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const weatherIcon = (w: string) =>
  ({ rainy: '🌧', sunny: '☀', cloudy: '☁', stormy: '⛈', clear: '✦' } as Record<string, string>)[w] || '☁';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Dest = {
  id: string;
  label: string;
  icon: string;
  tint: string;                       // small accent, used sparingly
  status: string;                     // one short status/action line
  preview: PreviewSpec;
};

type Row = { label: string; value: string; state?: 'ok' | 'attention' };

type PreviewSpec =
  | { kind: 'search'; hint: string; suggestions: string[] }
  | { kind: 'home'; glance: string; sub: string; upNext: string; contextLine: string }
  | { kind: 'chats'; threads: { title: string; snippet: string; agent: string; unread?: boolean }[] }
  | { kind: 'gallery'; count: number; last: string; prompts: string[]; thumbs: string[] }
  | { kind: 'wishlist'; items: { name: string; note: string }[]; count: number }
  | { kind: 'settings'; rows: Row[] };

// ─── Build destinations from live ambient context ────────────────────────────────
// Order is the navigation order. Content is grounded in the warm profile (Akshay:
// Bangalore, sports/triathlon, travel, wellness, music) and window.GLANCE_CTX.

function buildDestinations(a: Ambient): Dest[] {
  const when = `${a.day} ${a.timeOfDay}`;
  return [
    {
      id: 'search', label: 'Search', icon: '⌕', tint: '#9FB4FF',
      status: 'Ask anything',
      preview: {
        kind: 'search',
        hint: `Search or ask — ${a.city}, ${cap(a.timeOfDay)}`,
        suggestions: [
          `Weekend escapes near ${a.city}`,
          a.weather === 'rainy' ? 'Cosy rainy-day recipes' : 'Things to do outdoors today',
          'India vs Afghanistan — start time',
        ],
      },
    },
    {
      id: 'home', label: 'Home', icon: '◉', tint: '#A786E5',
      status: 'Ambient feed · Live',
      preview: {
        kind: 'home',
        glance: 'A Coffee Estate at First Light',
        sub: 'Coorg · Weekend escape',
        upNext: 'Up next · The Nandi Hills Ride',
        contextLine: `${a.city} · ${weatherIcon(a.weather)} ${cap(a.weather)} · ${when}`,
      },
    },
    {
      id: 'chats', label: 'Chats', icon: '❒', tint: '#7FD1C4',
      status: '2 active threads',
      preview: {
        kind: 'chats',
        threads: [
          { title: 'Coorg trip planning', snippet: '3 estate stays under ₹4,500 · dates for the weekend', agent: 'Travel', unread: true },
          { title: 'Triathlon training block', snippet: 'This week: 2 rides, 1 swim — Nandi loop on Sunday', agent: 'Fitness' },
        ],
      },
    },
    {
      id: 'gallery', label: 'AI Gallery', icon: '✦', tint: '#E5A9F0',
      status: '24 creations',
      preview: {
        kind: 'gallery',
        count: 24, last: '2h ago',
        prompts: ['Coorg estate in the mist', 'Nandi Hills sunrise ride'],
        thumbs: ['#2E2A4A', '#25384A', '#3E2A38'],
      },
    },
    {
      id: 'wishlist', label: 'Wishlist', icon: '♥', tint: '#F0A9B4',
      status: '12 saved',
      preview: {
        kind: 'wishlist',
        count: 12,
        items: [
          { name: 'Ama Plantation, Coorg', note: 'Saved since February · dates open for the weekend' },
          { name: 'Sony WH-1000XM5', note: '↓ ₹8,000 since you saved it' },
        ],
      },
    },
    {
      id: 'settings', label: 'Settings', icon: '⚙', tint: '#B9BEC9',
      status: 'Ambient context',
      preview: {
        kind: 'settings',
        rows: [
          { label: 'Location', value: `${a.city} · confirmed`, state: 'ok' },
          { label: 'Weather', value: `${weatherIcon(a.weather)} ${cap(a.weather)} · ${cap(a.timeOfDay)}`, state: 'ok' },
          { label: 'Selfie', value: 'Not added — set up your looks', state: 'attention' },
          { label: 'Profile', value: 'Akshay · Warm', state: 'ok' },
          { label: 'Privacy', value: 'On-device · 6 services linked', state: 'ok' },
        ],
      },
    },
  ];
}

// ─── Layout math ─────────────────────────────────────────────────────────────────
//
// Vertical rail. Every node shares one left anchor (RAIL_X) — no horizontal drift.
// The selected node sits at the vertical center, expanded. Neighbours are pushed
// clear of the tall card (first step clears half the card) so nothing overlaps,
// then spaced evenly outward. Distant nodes fade but never clip meaningfully.

const STAGE_H = 1080;
const CENTER_Y = STAGE_H / 2;      // 540
const RAIL_X = 88;                  // shared left anchor for all nodes
const SELECTED_HALF = 210;          // ~half the expanded card height (richer content)
const COMPACT_H = 56;               // compact node height
const GAP = 20;                     // breathing room between nodes

// signed vertical offset for a node at distance d from the selected node
function nodeY(d: number): number {
  if (d === 0) return CENTER_Y;
  const sign = Math.sign(d);
  const first = SELECTED_HALF + GAP + COMPACT_H / 2; // clear the tall card
  const step = COMPACT_H + GAP;
  return CENTER_Y + sign * (first + (Math.abs(d) - 1) * step);
}

function nodeOpacity(d: number): number {
  return Math.max(0.3, 1 - Math.abs(d) * 0.22);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export type CurvedNavPanelProps = {
  onBack: () => void;
  onToast?: (msg: string) => void;
};

export default function CurvedNavPanel({ onBack, onToast }: CurvedNavPanelProps) {
  const dests = useMemo(() => buildDestinations(readAmbient()), []);
  const [selected, setSelected] = useState(1); // default: Home

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(key)) {
        e.preventDefault();
      }
      if (key === 'Escape' || key === 'Backspace' || key === 'ArrowRight') { onBack(); return; }
      if (key === 'ArrowUp')   { setSelected(i => Math.max(0, i - 1)); return; }
      if (key === 'ArrowDown') { setSelected(i => Math.min(dests.length - 1, i + 1)); return; }
      if (key === 'Enter' || key === ' ') {
        onToast?.(`Opening ${dests[selected].label}…`);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, dests, onBack, onToast]);

  const select = useCallback((i: number) => setSelected(i), []);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      // dark, depth-separating wash concentrated on the left — L0 stays legible on the right
      background: [
        'radial-gradient(1100px 1100px at -8% 50%, rgba(8,6,16,0.94), rgba(6,5,12,0.6) 45%, transparent 68%)',
        'linear-gradient(100deg, rgba(4,3,10,0.92) 0%, rgba(4,3,10,0.5) 34%, transparent 52%)',
      ].join(', '),
      animation: 'cnav-panel-in 0.34s cubic-bezier(0.22,0.61,0.36,1) forwards',
      pointerEvents: 'auto',
    }}>
      {/* Nodes */}
      {dests.map((d, i) => {
        const dist = i - selected;
        const isSel = i === selected;
        return (
          <NavNode
            key={d.id}
            dest={d}
            selected={isSel}
            y={nodeY(dist)}
            opacity={isSel ? 1 : nodeOpacity(dist)}
            near={Math.abs(dist) <= 1}
            onClick={() => select(i)}
          />
        );
      })}

      {/* Bottom hint strip */}
      <div style={{
        position: 'absolute', left: RAIL_X, bottom: 40,
        display: 'flex', alignItems: 'center', gap: 14,
        fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
        fontSize: 12, color: 'rgba(255,255,255,0.3)',
      }}>
        {[['↑↓','Browse'],['Enter','Open'],['→','Back to feed']].map(([k,l]) => (
          <span key={k} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <kbd style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:5, padding:'2px 8px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)',
            }}>{k}</kbd>
            <span>{l}</span>
          </span>
        ))}
      </div>

      <style>{CNAV_KF}</style>
    </div>
  );
}

// ─── Node ────────────────────────────────────────────────────────────────────────

function NavNode({ dest, selected, y, opacity, near, onClick }: {
  dest: Dest; selected: boolean;
  y: number; opacity: number; near: boolean;
  onClick: () => void;
}) {
  const rgb = hexRgb(dest.tint);

  const commonTransition = 'top 0.44s cubic-bezier(0.22,0.61,0.36,1), opacity 0.4s ease';

  if (selected) {
    return (
      <div
        onClick={onClick}
        style={{
          position: 'absolute', left: RAIL_X, top: y,
          transform: 'translateY(-50%)',
          width: 480,
          transition: commonTransition,
          zIndex: 30,
        }}
      >
        <div style={{
          borderRadius: 26,
          background: 'linear-gradient(150deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1.5px solid rgba(255,255,255,0.28)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset',
          backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
          padding: '26px 28px',
          position: 'relative', overflow: 'hidden',
          animation: 'cnav-sel-in 0.44s cubic-bezier(0.22,0.61,0.36,1)',
        }}>
          {/* subtle tint glow anchored to the icon */}
          <div style={{
            position: 'absolute', top: -40, left: -40, width: 220, height: 220,
            background: `radial-gradient(circle, rgba(${rgb},0.16), transparent 68%)`,
            pointerEvents: 'none',
          }} />

          {/* Header: icon + title + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, flexShrink: 0,
              background: `rgba(${rgb},0.16)`,
              border: `1px solid rgba(${rgb},0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: dest.tint,
              boxShadow: `0 4px 20px rgba(${rgb},0.2)`,
            }}>{dest.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                fontWeight: 800, fontSize: 26, color: '#FFFFFF',
                letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>{dest.label}</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, marginTop: 5,
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                fontSize: 12, fontWeight: 600, color: `rgba(${rgb},0.95)`,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: dest.tint,
                  boxShadow: `0 0 8px ${dest.tint}`,
                }} />
                {dest.status}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 1, margin: '20px 0 18px',
            background: 'linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.16), rgba(255,255,255,0.02))',
          }} />

          {/* Live preview body */}
          <PreviewBody spec={dest.preview} rgb={rgb} tint={dest.tint} />

          {/* Action */}
          <div style={{
            marginTop: 20,
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '10px 22px', borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
            fontWeight: 700, fontSize: 13, color: '#FFFFFF', letterSpacing: '-0.01em',
          }}>
            {actionLabel(dest)}
            <span style={{ fontSize: 11, opacity: 0.7 }}>›</span>
          </div>
        </div>
      </div>
    );
  }

  // Compact (non-selected) node — same left anchor, vertically centered on y
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', left: RAIL_X, top: y,
        transform: 'translateY(-50%)',
        opacity,
        transition: commonTransition,
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', zIndex: 10,
      }}
    >
      <div style={{
        width: COMPACT_H, height: COMPACT_H, borderRadius: 16, flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.16)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: `rgba(${rgb},0.9)`,
      }}>{dest.icon}</div>
      {near && (
        <div style={{
          fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
          fontWeight: 700, fontSize: 17, color: 'rgba(255,255,255,0.72)',
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>{dest.label}</div>
      )}
    </div>
  );
}

// ─── Preview bodies ──────────────────────────────────────────────────────────────

function PreviewBody({ spec, rgb, tint }: { spec: PreviewSpec; rgb: string; tint: string }) {
  const labelStyle: React.CSSProperties = {
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7,
  };
  const primaryStyle: React.CSSProperties = {
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
    fontSize: 18, fontWeight: 700, color: '#FFFFFF',
    letterSpacing: '-0.01em', lineHeight: 1.3,
  };
  const subStyle: React.CSSProperties = {
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
    fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 5, lineHeight: 1.4,
  };

  const rowLabel: React.CSSProperties = {
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35,
  };
  const rowSub: React.CSSProperties = {
    fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
    fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginTop: 2,
  };

  switch (spec.kind) {
    case 'search':
      return (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
          }}>
            <span style={{ fontSize: 17, color: tint }}>⌕</span>
            <span style={{
              fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
              fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500,
            }}>{spec.hint}</span>
            <span style={{ marginLeft: 'auto', fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>🎙</span>
          </div>
          <div style={{ ...labelStyle, marginTop: 14, marginBottom: 8 }}>Try asking</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {spec.suggestions.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                fontSize: 13, color: 'rgba(255,255,255,0.75)',
              }}>
                <span style={{ color: `rgba(${rgb},0.8)`, fontSize: 12 }}>›</span>{s}
              </div>
            ))}
          </div>
        </div>
      );

    case 'home':
      return (
        <div>
          <div style={labelStyle}>Now playing</div>
          <div style={primaryStyle}>{spec.glance}</div>
          <div style={subStyle}>{spec.sub}</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ ...rowSub, marginTop: 0, color: `rgba(${rgb},0.85)`, fontWeight: 600 }}>{spec.upNext}</span>
          </div>
          <div style={{ ...rowSub, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Context</span>· {spec.contextLine}
          </div>
        </div>
      );

    case 'chats':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {spec.threads.map((t, i) => (
            <div key={i} style={{
              padding: '11px 14px', borderRadius: 13,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  padding: '1px 8px', borderRadius: 999,
                  background: `rgba(${rgb},0.16)`, border: `1px solid rgba(${rgb},0.32)`,
                  fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                  fontSize: 9.5, fontWeight: 700, color: tint, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{t.agent}</span>
                <span style={rowLabel}>{t.title}</span>
                {t.unread && (
                  <span style={{
                    marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                    background: tint, boxShadow: `0 0 7px ${tint}`,
                  }} />
                )}
              </div>
              <div style={rowSub}>{t.snippet}</div>
            </div>
          ))}
        </div>
      );

    case 'gallery':
      return (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {spec.thumbs.map((c, i) => (
              <div key={i} style={{
                flex: 1, height: 74, borderRadius: 12,
                background: `linear-gradient(140deg, ${c}, rgba(255,255,255,0.06))`,
                border: '1px solid rgba(255,255,255,0.14)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.16), transparent 60%)',
                }} />
              </div>
            ))}
          </div>
          <div style={{ ...labelStyle, marginBottom: 7 }}>Recent prompts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {spec.prompts.map((p, i) => (
              <span key={i} style={{
                padding: '5px 11px', borderRadius: 999,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                fontSize: 12, color: 'rgba(255,255,255,0.72)',
              }}>“{p}”</span>
            ))}
          </div>
          <div style={subStyle}>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{spec.count} creations</span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}> · last {spec.last}</span>
          </div>
        </div>
      );

    case 'wishlist':
      return (
        <div>
          <div style={{ ...labelStyle, marginBottom: 9 }}>Saved · {spec.count} items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {spec.items.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '10px 13px', borderRadius: 13,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                  background: 'linear-gradient(140deg, #2A2A30, rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
                }}>{i === 0 ? '⛰' : '🎧'}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={rowLabel}>{it.name}</div>
                  <div style={{ ...rowSub, color: it.note.startsWith('↓') ? `rgba(${rgb},0.95)` : 'rgba(255,255,255,0.5)', fontWeight: it.note.startsWith('↓') ? 600 : 400 }}>{it.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'settings':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {spec.rows.map((r) => {
            const attn = r.state === 'attention';
            const dot = attn ? '#F0C36A' : '#7FD1A0';
            return (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: dot, boxShadow: `0 0 7px ${dot}`,
                }} />
                <span style={{
                  fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 76,
                }}>{r.label}</span>
                <span style={{
                  fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif',
                  fontSize: 13.5, fontWeight: 600,
                  color: attn ? '#F0C36A' : 'rgba(255,255,255,0.85)',
                }}>{r.value}</span>
              </div>
            );
          })}
        </div>
      );
  }
}

function actionLabel(d: Dest): string {
  switch (d.preview.kind) {
    case 'search':   return 'Start a search';
    case 'home':     return 'Return to feed';
    case 'chats':    return 'Open chats';
    case 'gallery':  return 'View gallery';
    case 'wishlist': return 'View wishlist';
    case 'settings': return 'Manage settings';
  }
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function hexRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// ─── Keyframes ─────────────────────────────────────────────────────────────────

const CNAV_KF = `
@keyframes cnav-panel-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cnav-sel-in {
  from { opacity: 0; transform: translateX(-14px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
`;
