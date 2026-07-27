/**
 * ReturningUserScreen — Returning-user homepage for Ambient TV.
 *
 * Deliberately the FTUX layout (NewConversationScreen) reused wholesale —
 * same top bar, nav rail, mascot/headline/search block, and capability row.
 * The two screens are meant to feel like the same product; only the bottom
 * section differs: FTUX's "Choose from Prompts" prompt row is replaced here
 * with a static "Continue Conversations" grid (same column count as the
 * capability row above it, so focus can move straight up/down between them).
 *
 * Unlike FTUX's prompt row, this row is NOT a marquee — it's a fixed set of
 * conversations plus a trailing "View All Conversations" tile that opens the
 * full Conversation Library. No auto-scroll, no ambient drift.
 *
 * Layout:
 *   Far left: vertical icon nav rail (shared with FTUX)
 *   Top-left: GlanceLogo
 *   Center: Mascot → headline → search bar (identical to FTUX)
 *   Below: 6 capability cards (identical to FTUX)
 *   Below: "Continue Conversations" — static 6-cell grid (5 conversations +
 *     View All), same column layout as the capability row
 *
 * TV navigation mirrors FTUX exactly, with the prompt row's marquee-specific
 * logic (ambient drift, center-on-entry) removed since this row is static:
 *   Default focus: mic button
 *   DOWN from search → capabilities → DOWN → Continue Conversations
 *   UP/DOWN between capabilities and the row preserves column index (both
 *     rows have exactly 6 cells)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import GlanceLogo from '../Shared/GlanceLogo';
import { gsap } from 'gsap';
import {
  type IconComponent,
  IconHanger, IconAirplane, IconChefHat, IconHouse, IconLotus, IconArrowRight,
  NAV_ITEMS,
} from './agentHubIcons';
import { CAPABILITIES, type Capability } from './agentHubCapabilities';
import AgentSearchBar from './AgentSearchBar';

// ─── Data ──────────────────────────────────────────────────────────────────────

type ActiveConversation = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  lastOpened: string;
  icon: IconComponent;
  accentColor: string;
};

const CONTINUE_CONVS: ActiveConversation[] = [
  { id: 'goa',        title: 'Goa Weekend Trip',             category: 'Travel',   thumbnail: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg', lastOpened: 'Yesterday',  icon: IconAirplane, accentColor: '#60A5FA' },
  { id: 'wedding',    title: 'Wedding Outfit',                category: 'Fashion',  thumbnail: '/images/feed/feed_46-fashion-luxury-flatlay.jpg',             lastOpened: 'Yesterday',  icon: IconHanger,   accentColor: '#A78BFA' },
  { id: 'restaurant', title: 'Restaurant Recommendations',    category: 'Recipes',  thumbnail: '/images/feed/feed_42-food-japanese-ramen-counter.jpg',        lastOpened: '2 days ago', icon: IconChefHat,  accentColor: '#FF9800' },
  { id: 'living',     title: 'Living Room Makeover',          category: 'Home',     thumbnail: '/images/feed/feed_24-home-cozy-monsoon-living-room.jpg',      lastOpened: 'Yesterday',  icon: IconHouse,    accentColor: '#2DD4BF' },
  { id: 'wellness',   title: 'Morning Wellness',              category: 'Wellness', thumbnail: '/images/feed/feed_07-wellness-morning-ritual.jpg',            lastOpened: 'Today',      icon: IconLotus,    accentColor: '#F06292' },
];

// Deterministic decorative particle positions around the mascot — identical
// set to FTUX, kept local since both screens own their own entrance timing.
const MASCOT_PARTICLES = [
  { top: '4%',  left: '86%', size: 5, delay: 0 },
  { top: '78%', left: '92%', size: 3.5, delay: 0.6 },
  { top: '88%', left: '10%', size: 4, delay: 1.2 },
  { top: '10%', left: '4%',  size: 3, delay: 1.8 },
  { top: '46%', left: '96%', size: 3, delay: 0.9 },
];

// ─── Focus zones ───────────────────────────────────────────────────────────────
// continue-row has CONTINUE_CONVS.length + 1 cells — the trailing cell is the
// "View All Conversations" destination. That total is deliberately 6, the
// same as CAPABILITIES.length, so UP/DOWN between the two rows can preserve
// column index with no clamping.

type FocusZone = 'left-nav' | 'search-mic' | 'search-field' | 'capabilities' | 'continue-row';
type FocusState = { zone: FocusZone; idx: number };

const VIEW_ALL_IDX = CONTINUE_CONVS.length;
const DEFAULT_FOCUS: FocusState = { zone: 'search-mic', idx: 0 };

function navigate(focus: FocusState, dir: 'up' | 'down' | 'left' | 'right'): FocusState {
  const { zone, idx } = focus;

  if (zone === 'left-nav') {
    if (dir === 'right') return { zone: 'search-field', idx: 0 };
    if (dir === 'up' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'down' && idx < NAV_ITEMS.length - 1) return { zone, idx: idx + 1 };
    return focus;
  }

  // search-field = keyboard mode (LEFT element)
  if (zone === 'search-field') {
    if (dir === 'left') return { zone: 'left-nav', idx: 0 };
    if (dir === 'right') return { zone: 'search-mic', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  // search-mic = mic mode (RIGHT element)
  if (zone === 'search-mic') {
    if (dir === 'left') return { zone: 'search-field', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  if (zone === 'capabilities') {
    if (dir === 'left' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'right' && idx < CAPABILITIES.length - 1) return { zone, idx: idx + 1 };
    if (dir === 'up') return { zone: 'search-field', idx: 0 };
    if (dir === 'down') return { zone: 'continue-row', idx: Math.min(idx, VIEW_ALL_IDX) };
    return focus;
  }

  if (zone === 'continue-row') {
    if (dir === 'left' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'right' && idx < VIEW_ALL_IDX) return { zone, idx: idx + 1 };
    if (dir === 'up') return { zone: 'capabilities', idx: Math.min(idx, CAPABILITIES.length - 1) };
    return focus;
  }

  return focus;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export type ReturningUserScreenProps = {
  onStartConversation?: (query: string) => void;
  onOpenLibrary?: () => void;
  onBack?: () => void;
};

export default function ReturningUserScreen({
  onStartConversation,
  onOpenLibrary,
  onBack,
}: ReturningUserScreenProps) {
  const [focus, setFocus] = useState<FocusState>(DEFAULT_FOCUS);
  const [activeCap, setActiveCap] = useState<Capability | null>(null);
  const [placeholder, setPlaceholder] = useState('Ask Anything...');

  const containerRef = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const headlineRef   = useRef<HTMLDivElement>(null);
  const searchRef     = useRef<HTMLDivElement>(null);
  const capsRef       = useRef<HTMLDivElement>(null);
  const rowHeadingRef = useRef<HTMLDivElement>(null);
  const rowRef        = useRef<HTMLDivElement>(null);

  // ── Entrance animation — same sequence and pacing as FTUX: mascot →
  // headline → search → capabilities → row heading → row. The row is part
  // of the introduction, not a static fixture on first paint. ──────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      gsap.set(mascotRef.current, { opacity: 0, y: 18, scale: 0.92 });
      gsap.set(headlineRef.current, { opacity: 0, y: 20 });
      gsap.set(searchRef.current, { opacity: 0, y: 22 });
      gsap.set(capsRef.current, { opacity: 0, y: 28 });
      gsap.set(rowHeadingRef.current, { opacity: 0, y: 16 });
      gsap.set(rowRef.current, { opacity: 0, y: 22 });

      tl.to(mascotRef.current,   { opacity: 1, y: 0, scale: 1, duration: 0.6 })
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 0.45 }, '-=0.28')
        .to(searchRef.current,   { opacity: 1, y: 0, duration: 0.45 }, '-=0.2')
        .to(capsRef.current,     { opacity: 1, y: 0, duration: 0.5 },  '-=0.1')
        .to(rowHeadingRef.current, { opacity: 1, y: 0, duration: 0.35 }, '-=0.05')
        .to(rowRef.current,      { opacity: 1, y: 0, duration: 0.4 },  '-=0.1');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ── Capability card focus → update placeholder (identical to FTUX) ─────────

  useEffect(() => {
    if (focus.zone === 'capabilities') {
      const cap = CAPABILITIES[focus.idx];
      setActiveCap(cap);
      setPlaceholder(cap.placeholder);
    }
  }, [focus]);

  useEffect(() => {
    if (focus.zone === 'search-mic' || focus.zone === 'search-field') {
      if (!activeCap) setPlaceholder('Ask Anything...');
    }
    if (focus.zone === 'continue-row' || focus.zone === 'search-mic') {
      setActiveCap(null);
      if (focus.zone === 'search-mic') setPlaceholder('Ask Anything...');
    }
  }, [focus.zone]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKey = useCallback((e: KeyboardEvent) => {
    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Escape' || e.key === 'Backspace') { onBack?.(); return; }

    const dir = dirMap[e.key];
    if (dir) { setFocus(prev => navigate(prev, dir)); return; }

    if (e.key === 'Enter' || e.key === ' ') {
      if (focus.zone === 'capabilities') {
        // Selecting a capability opens its L1 conversation-start state
        // immediately — no intermediate category lobby.
        window.location.href = `/l1-category/${CAPABILITIES[focus.idx].landingId}`;
      } else if (focus.zone === 'continue-row') {
        if (focus.idx === VIEW_ALL_IDX) {
          onOpenLibrary?.();
        } else {
          onStartConversation?.(CONTINUE_CONVS[focus.idx].title);
        }
      } else if (focus.zone === 'search-mic') {
        onStartConversation?.('');
      }
    }
  }, [focus, onBack, onOpenLibrary, onStartConversation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isFocused = (zone: FocusZone, i = 0) => focus.zone === zone && focus.idx === i;

  // Matches the search row's total width (84 mic + 16 gap + 1024 field = 1124) so
  // every section below shares one consistent centered column / left edge.
  const CONTENT_WIDTH = 1124;
  const ROW_CARD_H = 168;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 1100px 720px at 50% -4%, rgba(124,58,237,0.16), transparent 62%)',
          'radial-gradient(ellipse 900px 680px at 88% 88%, rgba(76,29,149,0.10), transparent 65%)',
          'linear-gradient(180deg, #07050f 0%, #05040c 55%, #06040f 100%)',
        ].join(', '),
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Plus Jakarta Sans", "Instrument Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '30px 76px 0', position: 'relative', zIndex: 10 }}>
        <GlanceLogo />
      </div>

      {/* ── Left icon nav rail — identical geometry to FTUX ─────────────────── */}
      <div style={{
        position: 'absolute', left: 66, top: 0, height: '100%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        zIndex: 8,
      }}>
        {NAV_ITEMS.map((item, i) => {
          const focused = isFocused('left-nav', i);
          return (
            <div
              key={item.id}
              onClick={() => setFocus({ zone: 'left-nav', idx: i })}
              style={{
                width: 52, height: 52, borderRadius: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                outline: focused ? '2px solid rgba(139,92,246,0.8)' : 'none',
                outlineOffset: 2,
                transition: 'outline 0.2s ease',
              }}
            >
              <img
                src={item.icon} alt=""
                style={{
                  width: 32, height: 32,
                  opacity: item.active ? 1 : 0.55,
                  filter: item.active ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none',
                  transition: 'opacity 0.2s ease, filter 0.2s ease',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Center: Mascot + Headline + Search — identical to FTUX ──────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 38,
      }}>
        <div ref={mascotRef} style={{
          position: 'relative',
          width: 140, height: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
            filter: 'blur(6px)',
            animation: 'nc-mascot-glow 4.2s ease-in-out infinite',
          }} />
          {MASCOT_PARTICLES.map((p, i) => (
            <span
              key={i}
              style={{
                position: 'absolute', top: p.top, left: p.left,
                width: p.size, height: p.size, borderRadius: '50%',
                background: i % 2 === 0
                  ? 'rgba(196,181,253,0.85)'
                  : 'rgba(255,255,255,0.75)',
                boxShadow: '0 0 6px rgba(167,139,250,0.6)',
                animation: `nc-particle-float 5.5s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
          <AgentMascot
            agentMode={focus.zone === 'search-mic' ? 'looking' : 'idle'}
            size={78}
          />
        </div>

        <div ref={headlineRef} style={{
          fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em',
          color: '#F5F3F7', marginBottom: 38, textAlign: 'center',
        }}>
          Ready to create something new?
        </div>

        <div ref={searchRef}>
          <AgentSearchBar
            micFocused={isFocused('search-mic')}
            fieldFocused={isFocused('search-field')}
            placeholder={placeholder}
            onMicClick={() => { setFocus({ zone: 'search-mic', idx: 0 }); onStartConversation?.(''); }}
            onFieldClick={() => setFocus({ zone: 'search-field', idx: 0 })}
          />
        </div>
      </div>

      {/* ── Capability Cards — identical to FTUX ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0 0' }}>
        <div style={{ width: CONTENT_WIDTH }}>
          <div ref={capsRef} style={{
            display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14,
          }}>
            {CAPABILITIES.map((cap, i) => {
              const focused = isFocused('capabilities', i);
              const active  = activeCap?.id === cap.id;
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  onClick={() => {
                    setFocus({ zone: 'capabilities', idx: i });
                    window.location.href = `/l1-category/${cap.landingId}`;
                  }}
                  style={{
                    borderRadius: 20,
                    padding: '20px 16px 18px',
                    background: focused
                      ? 'rgba(255,255,255,0.10)'
                      : active
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(20,17,34,0.55)',
                    border: focused
                      ? '2px solid rgba(255,255,255,0.85)'
                      : active
                      ? '1px solid rgba(255,255,255,0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: focused
                      ? '0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)'
                      : 'none',
                    transform: focused ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex', flexDirection: 'column', gap: 14,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <Icon color={cap.accentColor} size={31} />
                  <div>
                    <div style={{
                      fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
                      color: focused ? '#F5F3F7' : 'rgba(245,243,247,0.82)',
                      marginBottom: 5, transition: 'color 0.2s',
                    }}>
                      {cap.label}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 400, lineHeight: 1.42,
                      color: focused ? 'rgba(245,243,247,0.7)' : 'rgba(245,243,247,0.38)',
                      transition: 'color 0.2s',
                    }}>
                      {cap.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── "Continue Conversations" heading — same divider-flanked style and
          position as FTUX's "Choose from Prompts" ──────────────────────────── */}
      <div ref={rowHeadingRef} style={{ position: 'absolute', left: 0, right: 0, top: 716, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: 600 }}>
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(to left, rgba(255,255,255,0.35), transparent)',
          }} />
          <span style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap',
          }}>
            Continue Conversations
          </span>
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(to right, rgba(255,255,255,0.35), transparent)',
          }} />
        </div>
      </div>

      {/* ── Continue Conversations — static 6-cell grid, same columns as the
          capability row above (no marquee, no auto-scroll, no drift) ───────── */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 752, display: 'flex', justifyContent: 'center' }}>
        <div ref={rowRef} style={{ width: CONTENT_WIDTH, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14 }}>
          {CONTINUE_CONVS.map((conv, i) => {
            const focused = isFocused('continue-row', i);
            const Icon = conv.icon;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setFocus({ zone: 'continue-row', idx: i });
                  onStartConversation?.(conv.title);
                }}
                style={{
                  height: ROW_CARD_H, borderRadius: 18, overflow: 'hidden',
                  position: 'relative', cursor: 'pointer',
                  border: focused
                    ? '2px solid rgba(255,255,255,0.92)'
                    : '1.5px solid rgba(255,255,255,0.07)',
                  boxShadow: focused
                    ? '0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)'
                    : 'none',
                  transform: focused ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
                }}
              >
                <img
                  src={conv.thumbnail} alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 25%, rgba(5,2,16,0.88) 100%)',
                }} />
                <div style={{
                  position: 'absolute', left: 12, right: 12, bottom: 11,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <Icon color={conv.accentColor} size={14} />
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                    color: '#FFFFFF', lineHeight: 1.28,
                  }}>
                    {conv.title}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>
                    {conv.lastOpened}
                  </span>
                </div>
              </div>
            );
          })}

          {/* View All Conversations — trailing cell, navigation destination */}
          {(() => {
            const focused = isFocused('continue-row', VIEW_ALL_IDX);
            return (
              <div
                onClick={() => { setFocus({ zone: 'continue-row', idx: VIEW_ALL_IDX }); onOpenLibrary?.(); }}
                style={{
                  height: ROW_CARD_H, borderRadius: 18,
                  position: 'relative', cursor: 'pointer',
                  background: focused ? 'rgba(255,255,255,0.10)' : 'rgba(20,17,34,0.55)',
                  border: focused
                    ? '2px solid rgba(255,255,255,0.85)'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: focused ? '0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                  transform: focused ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconArrowRight size={15} color={focused ? '#F5F3F7' : 'rgba(245,243,247,0.6)'} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center',
                  color: focused ? '#F5F3F7' : 'rgba(245,243,247,0.6)', lineHeight: 1.3,
                  padding: '0 10px',
                }}>
                  View All Conversations
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <style>{KF}</style>
    </div>
  );
}

// ─── Keyframes ─────────────────────────────────────────────────────────────────

const KF = `
@keyframes nc-mascot-glow {
  0%, 100% { opacity: 0.6; transform: scale(0.94); }
  50%       { opacity: 1;   transform: scale(1.08); }
}
@keyframes nc-particle-float {
  0%, 100% { opacity: 0.25; transform: translateY(0) scale(1); }
  50%       { opacity: 0.9;  transform: translateY(-6px) scale(1.15); }
}
`;
