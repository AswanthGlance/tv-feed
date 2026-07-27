/**
 * FinalOptionScreen — "Final Option" homepage variant for Ambient TV.
 *
 * Same structural skeleton as NewConversationScreen (dark gradient BG, left
 * nav rail, centered mascot + hero + search) but with the reference-inspired
 * content hierarchy:
 *   - Larger, more editorial hero copy ("Hi there!" / big heading / subtext)
 *   - Visual capability cards (tall tiles with background images) instead of
 *     the frosted-glass icon cards used in FTUX/Returning User
 *   - No prompt marquee / continue-conversations row at the bottom
 *   - Sign-in pill at top-right (mouse-only, non-functional prototype)
 *
 * TV navigation:
 *   Default focus: mic button
 *   LEFT from mic → left nav rail
 *   RIGHT from left nav → mic
 *   RIGHT from mic → search field
 *   DOWN from search → capability cards (first card)
 *   LEFT/RIGHT within capability cards
 *   UP from capability cards → search field
 *   ENTER on search/mic → l1-scenarios
 *   ENTER on capability card → corresponding L1 category state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AgentMascot from '../Shared/AgentMascot';
import GlanceLogo from '../Shared/GlanceLogo';
import { gsap } from 'gsap';
import { NAV_ITEMS } from './agentHubIcons';
import AgentSearchBar from './AgentSearchBar';
import { CAPABILITIES } from './agentHubCapabilities';

// Per-card background images and descriptions for the visual tiles.
const CARD_META: Record<string, { thumbnail: string; description: string }> = {
  fashion:  { thumbnail: '/images/feed/feed_31-fashion-streetwear-editorial.jpg', description: 'Fashion, beauty, wellness & everyday essentials' },
  travel:   { thumbnail: '/images/feed/feed_54-travel-kerala-backwaters-houseboat.jpg', description: 'Plan trips, get ideas, find experiences' },
  food:     { thumbnail: '/images/feed/feed_42-food-japanese-ramen-counter.jpg', description: 'Discover restaurants, recipes & foodie experiences' },
  sports:   { thumbnail: '/images/feed/feed_25-sports-cricket-stadium-floodlights.jpg', description: 'Concerts, shows, exhibitions & local happenings' },
  wellness: { thumbnail: '/images/feed/feed_32-wellness-sunrise-yoga-lake.jpg', description: 'Get ideas for anything you have in mind' },
  home:     { thumbnail: '/images/feed/feed_34-travel-nordic-winter-cabin.jpg', description: 'Find hotels, villas and unique places to stay' },
};

// ─── Focus model ───────────────────────────────────────────────────────────────

type FocusZone = 'left-nav' | 'search-mic' | 'search-field' | 'capabilities';
type FocusState = { zone: FocusZone; idx: number };
type InputMode = 'mic' | 'keyboard';

const DEFAULT_FOCUS: FocusState = { zone: 'search-mic', idx: 0 };

function navigate(
  focus: FocusState,
  dir: 'up' | 'down' | 'left' | 'right',
  lastInputMode: InputMode,
): FocusState {
  const { zone, idx } = focus;

  if (zone === 'left-nav') {
    if (dir === 'right') return { zone: 'search-field', idx: 0 };
    if (dir === 'up' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'down' && idx < NAV_ITEMS.length - 1) return { zone, idx: idx + 1 };
    return focus;
  }

  if (zone === 'search-field') {
    if (dir === 'left') return { zone: 'left-nav', idx: 0 };
    if (dir === 'right') return { zone: 'search-mic', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  if (zone === 'search-mic') {
    if (dir === 'left') return { zone: 'search-field', idx: 0 };
    if (dir === 'down') return { zone: 'capabilities', idx: 0 };
    return focus;
  }

  if (zone === 'capabilities') {
    if (dir === 'left' && idx > 0) return { zone, idx: idx - 1 };
    if (dir === 'right' && idx < CAPABILITIES.length - 1) return { zone, idx: idx + 1 };
    // UP restores whichever input mode the user came from
    if (dir === 'up') return { zone: lastInputMode === 'keyboard' ? 'search-field' : 'search-mic', idx: 0 };
    return focus;
  }

  return focus;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export type FinalOptionScreenProps = {
  onBack?: () => void;
};

export default function FinalOptionScreen({ onBack }: FinalOptionScreenProps) {
  const [focus, setFocus] = useState<FocusState>(DEFAULT_FOCUS);
  const [activeInputMode, setActiveInputMode] = useState<InputMode>('mic');
  const lastInputModeRef = useRef<InputMode>('mic');
  const [placeholder, setPlaceholder] = useState('Just say what you\'re looking for…');

  const containerRef  = useRef<HTMLDivElement>(null);
  const mascotRef     = useRef<HTMLDivElement>(null);
  const headlineRef   = useRef<HTMLDivElement>(null);
  const searchRef     = useRef<HTMLDivElement>(null);
  const capsSectionRef = useRef<HTMLDivElement>(null);

  // ── Entrance animation ────────────────────────────────────────────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(mascotRef.current,      { opacity: 0, y: 18, scale: 0.92 });
      gsap.set(headlineRef.current,    { opacity: 0, y: 20 });
      gsap.set(searchRef.current,      { opacity: 0, y: 22 });
      gsap.set(capsSectionRef.current, { opacity: 0, y: 28 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.to(mascotRef.current,      { opacity: 1, y: 0, scale: 1, duration: 0.6 })
        .to(headlineRef.current,    { opacity: 1, y: 0, duration: 0.5 }, '-=0.28')
        .to(searchRef.current,      { opacity: 1, y: 0, duration: 0.45 }, '-=0.2')
        .to(capsSectionRef.current, { opacity: 1, y: 0, duration: 0.55 }, '-=0.12');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ── Capability card focus → update placeholder ─────────────────────────

  useEffect(() => {
    if (focus.zone === 'capabilities') {
      setPlaceholder(CAPABILITIES[focus.idx].placeholder);
    } else if (focus.zone === 'search-mic' || focus.zone === 'search-field') {
      setPlaceholder('Just say what you\'re looking for…');
    }
  }, [focus]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKey = useCallback((e: KeyboardEvent) => {
    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    };

    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'Escape' || e.key === 'Backspace') {
      onBack?.();
      return;
    }

    const dir = dirMap[e.key];
    if (dir) {
      setFocus(prev => {
        const next = navigate(prev, dir, lastInputModeRef.current);

        // Switching between mic and keyboard — update active mode
        if (prev.zone === 'search-mic' && next.zone === 'search-field') {
          setActiveInputMode('keyboard');
          lastInputModeRef.current = 'keyboard';
        } else if (prev.zone === 'search-field' && next.zone === 'search-mic') {
          setActiveInputMode('mic');
          lastInputModeRef.current = 'mic';
        }
        // Entering either input zone directly (e.g. from left-nav)
        else if (next.zone === 'search-mic' && prev.zone !== 'search-field') {
          setActiveInputMode('mic');
          lastInputModeRef.current = 'mic';
        } else if (next.zone === 'search-field' && prev.zone !== 'search-mic') {
          setActiveInputMode('keyboard');
          lastInputModeRef.current = 'keyboard';
        }

        return next;
      });
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      if (focus.zone === 'capabilities') {
        window.location.href = `/l1-category/${CAPABILITIES[focus.idx].landingId}`;
      } else if (focus.zone === 'search-mic' || focus.zone === 'search-field') {
        window.location.href = '/l1-scenarios';
      }
    }
  }, [focus, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isFocused = (zone: FocusZone, i = 0) => focus.zone === zone && focus.idx === i;

  // Match FTUX's CONTENT_WIDTH so the search bar and cards stay aligned
  const CONTENT_WIDTH = 1124;

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
      {/* ── Top bar: Logo only ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '30px 76px 0',
        position: 'relative', zIndex: 10,
        flexShrink: 0,
      }}>
        <GlanceLogo />
      </div>

      {/* ── Left icon nav rail — identical geometry to FTUX ───────────────────── */}
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
                src={item.icon}
                alt=""
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

      {/* ── Center: Mascot + Headline + Search ──────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 32,
        flexShrink: 0,
      }}>
        {/* Mascot with ambient glow */}
        <div ref={mascotRef} style={{
          position: 'relative',
          width: 130, height: 130,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
            filter: 'blur(6px)',
            animation: 'fo-mascot-glow 4.2s ease-in-out infinite',
          }} />
          <AgentMascot
            agentMode={focus.zone === 'search-mic' ? 'looking' : 'idle'}
            size={72}
          />
        </div>

        {/* Headline block */}
        <div ref={headlineRef} style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Greeting */}
          <div style={{
            fontSize: 18, fontWeight: 700, letterSpacing: '0.01em',
            color: 'rgba(167,139,250,0.88)',
            marginBottom: 8,
          }}>
            Hi there!
          </div>
          {/* Main heading */}
          <div style={{
            fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#F5F3F7',
            marginBottom: 14,
            whiteSpace: 'nowrap',
          }}>
            What can I help you plan today?
          </div>
          {/* Supporting copy */}
          <div style={{
            fontSize: 16, fontWeight: 400, lineHeight: 1.55,
            color: 'rgba(245,243,247,0.48)',
            whiteSpace: 'nowrap',
          }}>
            Ask me anything. I'll help you discover, plan and find the perfect options.
          </div>
        </div>

        {/* Search row */}
        <div ref={searchRef}>
          <AgentSearchBar
            micFocused={isFocused('search-mic')}
            fieldFocused={isFocused('search-field')}
            activeInputMode={activeInputMode}
            placeholder={placeholder}
            onMicClick={() => { setFocus({ zone: 'search-mic', idx: 0 }); window.location.href = '/l1-scenarios'; }}
            onFieldClick={() => setFocus({ zone: 'search-field', idx: 0 })}
          />
          {/* Try saying examples */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 14,
          }}>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: 'rgba(255,255,255,0.28)',
            }}>
              Try saying:
            </span>
            {['"Weekend getaway"', '"Romantic dinner"', '"Outfits for Paris"'].map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.42)',
                  padding: '3px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Capability section ─────────────────────────────────────────────────── */}
      <div
        ref={capsSectionRef}
        style={{
          display: 'flex', justifyContent: 'center',
          padding: '40px 0 0',
          flexShrink: 0,
        }}
      >
        <div style={{ width: CONTENT_WIDTH }}>
          {/* Section heading */}
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '2.2px',
            textTransform: 'uppercase',
            color: 'rgba(167,139,250,0.65)',
            marginBottom: 16,
          }}>
            What would you like to explore?
          </div>

          {/* Visual card tiles — 6 columns, tall with background images */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 12,
          }}>
            {CAPABILITIES.map((cap, i) => {
              const focused = isFocused('capabilities', i);
              const meta = CARD_META[cap.id];
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  onClick={() => {
                    setFocus({ zone: 'capabilities', idx: i });
                    window.location.href = `/l1-category/${cap.landingId}`;
                  }}
                  style={{
                    height: 200,
                    borderRadius: 18, overflow: 'hidden',
                    position: 'relative', cursor: 'pointer',
                    background: focused
                      ? 'rgba(255,255,255,0.10)'
                      : 'rgba(20,17,34,0.55)',
                    border: focused
                      ? '2px solid rgba(255,255,255,0.92)'
                      : '1.5px solid rgba(255,255,255,0.07)',
                    boxShadow: focused
                      ? '0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                      : '0 4px 16px rgba(0,0,0,0.3)',
                    transform: focused ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.24s cubic-bezier(0.22,0.61,0.36,1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex', flexDirection: 'column',
                    padding: '20px 16px 18px',
                    gap: 14,
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 19,
                    background: focused ? 'rgba(139,92,246,0.85)' : 'rgba(255,255,255,0.08)',
                    border: focused
                      ? '1.5px solid rgba(255,255,255,0.55)'
                      : '1px solid rgba(255,255,255,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.22s ease',
                    flexShrink: 0,
                  }}>
                    <Icon
                      color={focused ? '#FFFFFF' : cap.accentColor}
                      size={18}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
                      color: focused ? '#F5F3F7' : 'rgba(245,243,247,0.82)', lineHeight: 1.2,
                      transition: 'color 0.2s',
                    }}>
                      {cap.label}
                    </div>

                    <div style={{
                      fontSize: 13, fontWeight: 400, lineHeight: 1.42,
                      color: focused ? 'rgba(245,243,247,0.72)' : 'rgba(245,243,247,0.42)',
                      transition: 'color 0.22s ease',
                    }}>
                      {meta?.description ?? cap.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fo-mascot-glow {
          0%, 100% { opacity: 0.6; transform: scale(0.94); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
