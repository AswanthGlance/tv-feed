/**
 * V6HubSections — presentational pieces of the V6 Agent Hub.
 *
 * Pure rendering: the Ask Glance hero module, the compact Continue row, the
 * Explore Bento cards, Your Space tiles, and the Threads history view. All
 * navigation state lives in V6Experience; these components only receive
 * `focused`.
 *
 * Density contract: the whole hub IA — ASK · CONTINUE · EXPLORE · YOUR SPACE —
 * must read in one glance, no scrolling. The composition principle: a strict
 * underlying grid, but content occupies different grid spans by importance.
 * Every region has a purpose, every size means something.
 */

import AgentMascot from '../../Shared/AgentMascot';
import { FONT, chrome, Icon } from '../HybridHubPanel';
import { PinGlyph } from './V6PersistentStrip';
import { V6_EASE, type V6ExploreCard, type V6SpaceTile, type V6Thread } from './v6Data';

// ─── Hub geometry ─────────────────────────────────────────────────────────────

export const HUB_PAD_L = 64;
export const HUB_PAD_R = 48;

/** Explore — stable 4×2 grid, all eight visible at once, uniform cards */
export const EXP_H = 158;
export const EXP_GAP = 16;

export const SPACE_W = 190;
export const SPACE_H = 100;
export const SPACE_GAP = 14;

// ─── Small shared pieces ──────────────────────────────────────────────────────

export function SectionHeading({ text, quiet }: { text: string; quiet?: boolean }) {
  return (
    <div style={{
      fontFamily: FONT,
      fontSize: quiet ? 13 : 15,
      fontWeight: 800,
      letterSpacing: quiet ? '0.14em' : '0.16em',
      textTransform: 'uppercase',
      color: quiet ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.46)',
      margin: '0 2px 10px',
    }}>
      {text}
    </div>
  );
}

function PinnedDot({ small }: { small?: boolean }) {
  const s = small ? 18 : 22;
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, width: s, height: s, borderRadius: '50%',
      display: 'grid', placeItems: 'center', zIndex: 1,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
    }}>
      <PinGlyph size={small ? 9 : 11} tint="rgba(255,255,255,0.9)" />
    </div>
  );
}

function KeyboardGlyph({ size = 16, tint = 'rgba(255,255,255,0.45)' }: { size?: number; tint?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={tint} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
      <path d="M6 10 h.01 M9.5 10 h.01 M13 10 h.01 M16.5 10 h.01 M6 13.5 h.01 M8.5 13.5 h7 M18 13.5 h.01" />
    </svg>
  );
}

// ─── ASK GLANCE — one intentional hero module ─────────────────────────────────
// The equivalent of the reference's large "Widgets on Desktop" module: mascot,
// question, voice input and contextual suggestions live INSIDE one surface —
// nothing floats separately. One focus target; OK starts listening.

export function AskHero({ focused, listening, suggestions }: {
  focused: boolean; listening: boolean; suggestions: string[];
}) {
  return (
    <div style={{
      position: 'relative', boxSizing: 'border-box',
      borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
      padding: '24px 30px',
      display: 'flex', alignItems: 'center', gap: 24,
      background: focused
        ? `radial-gradient(120% 160% at 4% 0%, rgba(139,92,246,0.2), transparent 55%),
           linear-gradient(180deg, rgba(38,35,58,0.92) 0%, rgba(22,20,36,0.92) 100%)`
        : `radial-gradient(120% 160% at 4% 0%, rgba(139,92,246,0.13), transparent 55%),
           linear-gradient(180deg, rgba(28,26,44,0.85) 0%, rgba(16,15,26,0.85) 100%)`,
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      ...chrome(focused,
        'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 34px rgba(0,0,0,0.35)',
        1.008),
    }}>
      {/* the mascot is the AI's identity — calm, floating, never a button */}
      <div style={{
        width: 84, height: 84, flexShrink: 0, display: 'grid', placeItems: 'center',
        filter: 'drop-shadow(0 0 26px rgba(139,92,246,0.42))',
        animation: 'v6-mascot-float 4.8s ease-in-out infinite',
      }}>
        <AgentMascot agentMode={listening ? 'thinking' : focused ? 'looking' : 'idle'} size={76} />
      </div>

      {/* question + one large conversational input */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONT, fontSize: 27, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          What would you like to do?
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box',
          maxWidth: 640, height: 52, padding: '0 22px', borderRadius: 999,
          background: focused
            ? 'linear-gradient(180deg, rgba(52,49,74,0.9) 0%, rgba(28,26,44,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(36,34,52,0.8) 0%, rgba(20,19,32,0.8) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)',
          transition: 'background 0.25s ease',
        }}>
          <Icon name="mic" tint={focused ? '#C9B6F5' : 'rgba(255,255,255,0.6)'} size={20} />
          <span style={{
            flex: 1, fontFamily: FONT, fontSize: 15.5, fontWeight: 500,
            color: focused ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.25s ease',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {listening ? 'Listening…' : 'Press OK to ask anything…'}
          </span>
          {/* voice + keyboard supported — stated quietly, not as buttons */}
          <KeyboardGlyph size={15} />
        </div>
      </div>

      {/* contextual suggestions — quiet invitations, not focus targets */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 330 }}>
        <span style={{
          fontFamily: FONT, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 2px 1px',
        }}>
          Try asking
        </span>
        {suggestions.map(s => (
          <span key={s} style={{
            fontFamily: FONT, fontSize: 12.5, fontWeight: 500,
            color: focused ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.44)',
            transition: 'color 0.25s ease',
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── EXPLORE — evergreen invitations: image-led grid tiles ───────────────────
// Eight identical cards on a stable 4×2 grid — calm, balanced, readable in
// one glance. No spans, no hierarchy games: Ask is the hero, Explore is the
// canvas, Your Space is the shelf.

export function ExploreCardView({ card, focused, dimmed, pinned, onClick }: {
  card: V6ExploreCard; focused: boolean; dimmed: boolean; pinned: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', height: EXP_H, boxSizing: 'border-box',
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        background: '#0b0b12',
        opacity: dimmed ? 0.88 : 1,
        zIndex: focused ? 1 : 0,
        ...chrome(focused, 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03), 0 6px 18px rgba(0,0,0,0.28)', 1.035),
      }}
    >
      <img src={card.image} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        opacity: focused ? 1 : 0.88,
        filter: focused ? 'brightness(0.96) saturate(1.04)' : 'brightness(0.7) saturate(0.94)',
        transform: `scale(${focused ? 1.05 : 1})`,
        transition: `opacity 0.35s ease, filter 0.35s ease, transform 0.6s ${V6_EASE}`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 80% at 20% 0%, ${card.tone}0d, transparent 50%),
          linear-gradient(180deg, transparent 34%, rgba(7,7,13,0.52) 64%, rgba(7,7,13,0.9) 100%)`,
      }} />

      {pinned && <PinnedDot small />}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 15px', boxSizing: 'border-box' }}>
        <div style={{
          fontFamily: FONT, fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.1,
          color: focused ? '#fff' : 'rgba(255,255,255,0.95)', transition: 'color 0.25s ease',
          textShadow: '0 1px 6px rgba(0,0,0,0.65)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.title}
        </div>
        <div style={{
          fontFamily: FONT, fontSize: 11.5, fontWeight: 500, lineHeight: 1.3,
          color: focused ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.55)',
          transition: 'color 0.25s ease', marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.desc}
        </div>
      </div>
    </div>
  );
}

// ─── YOUR SPACE — bottom utility shelf ────────────────────────────────────────
// Same outer system (dimensions, radius, focus), different INTERNAL grammar
// per tile, like macOS widgets: gallery → mosaic · wishlist → overlapping
// thumbs · threads → conversation snippets · weather → big value · settings
// → extremely minimal.

export function SpaceTileView({ tile, focused, onClick }: {
  tile: V6SpaceTile; focused: boolean; onClick: () => void;
}) {
  const quietSettings = tile.variant === 'settings';
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: SPACE_W, height: SPACE_H, flexShrink: 0, boxSizing: 'border-box',
        borderRadius: 18, cursor: 'pointer', overflow: 'hidden',
        padding: '13px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: quietSettings
          ? (focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)')
          : focused
            ? 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.045) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)',
        ...chrome(focused, quietSettings
          ? 'inset 0 0 0 1px rgba(255,255,255,0.03)'
          : 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.04), 0 4px 14px rgba(0,0,0,0.22)', 1.035),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Icon name={tile.icon} tint={tile.tint} size={20} />

        {/* internal grammar: gallery = flat mosaic · wishlist = overlapping stack */}
        {tile.thumbs && tile.icon === 'wishlist' ? (
          <div style={{ display: 'flex' }}>
            {tile.thumbs.map((src, i) => (
              <img key={i} src={src} alt="" style={{
                width: 28, height: 28, borderRadius: '50%', objectFit: 'cover',
                marginLeft: i === 0 ? 0 : -10,
                filter: focused ? 'brightness(0.95)' : 'brightness(0.72)',
                transition: 'filter 0.25s ease',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 2px 8px rgba(0,0,0,0.45)',
              }} />
            ))}
          </div>
        ) : tile.thumbs ? (
          <div style={{ display: 'flex', gap: 4 }}>
            {tile.thumbs.map((src, i) => (
              <img key={i} src={src} alt="" style={{
                width: 26, height: 26, borderRadius: 7, objectFit: 'cover',
                filter: focused ? 'brightness(0.95)' : 'brightness(0.72)',
                transition: 'filter 0.25s ease',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.4)',
              }} />
            ))}
          </div>
        ) : tile.variant === 'threads' ? (
          /* recent conversation snippets — two quiet lines, not an icon */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
            <span style={{ width: 58, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.14)' }} />
            <span style={{ width: 42, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.09)' }} />
          </div>
        ) : null}
      </div>

      {tile.variant === 'weather' ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: focused ? '#fff' : 'rgba(255,255,255,0.95)', transition: 'color 0.25s ease' }}>
            {tile.value}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tile.sub}
          </span>
        </div>
      ) : (
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: FONT, fontSize: 14, fontWeight: quietSettings ? 600 : 800, letterSpacing: '-0.01em',
            color: quietSettings
              ? (focused ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)')
              : (focused ? '#fff' : 'rgba(255,255,255,0.94)'),
            transition: 'color 0.25s ease',
          }}>
            {tile.label}
          </div>
          {tile.sub && (
            <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.46)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tile.sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── THREADS — the complete conversation history ─────────────────────────────

export function ThreadsOverlay({ threads, focusIdx }: { threads: V6Thread[]; focusIdx: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5,
      background: 'linear-gradient(to right, rgba(6,5,13,0.97) 0%, rgba(6,5,13,0.94) 80%, rgba(6,5,13,0.88) 100%)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: `0 ${HUB_PAD_R}px 0 ${HUB_PAD_L}px`, boxSizing: 'border-box',
      animation: 'v6-fade-in 0.28s ease both',
    }}>
      <div style={{ width: 780 }}>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Threads
        </div>
        <div style={{ fontFamily: FONT, fontSize: 14.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: 6, marginBottom: 28 }}>
          18 conversations across your experiences
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {threads.map((t, i) => {
            const focused = focusIdx === i;
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, boxSizing: 'border-box',
                height: 66, padding: '0 22px', borderRadius: 18,
                background: focused
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.045) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)',
                animation: `v6-rise-in 0.34s ${(i * 0.04 + 0.06).toFixed(2)}s both`,
                ...chrome(focused, 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03)', 1.015),
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.tint, flexShrink: 0, boxShadow: `0 0 10px ${t.tint}66` }} />
                <span style={{
                  flex: 1, fontFamily: FONT, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em',
                  color: focused ? '#fff' : 'rgba(255,255,255,0.85)', transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {t.title}
                </span>
                <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.42)', flexShrink: 0 }}>
                  {t.domain} · {t.when}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
          OK opens a conversation · BACK returns to the Hub
        </div>
      </div>
    </div>
  );
}

// ─── Hints — development only, hidden in presentation mode ───────────────────

export function HintsBar() {
  return (
    <div style={{ flexShrink: 0, display: 'flex', gap: 12 }}>
      {[['↑↓←→', 'Navigate'], ['OK', 'Open'], ['Hold OK', 'Pin / Unpin'], ['BACK', 'Home'], ['→ past strip', 'Home']].map(([k, l]) => (
        <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          <kbd style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', fontFamily: FONT }}>{k}</kbd>
          {l}
        </span>
      ))}
    </div>
  );
}

// ─── Keyframes shared by the hub sections ────────────────────────────────────

export const V6_HUB_KF = `
@keyframes v6-mascot-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
@keyframes v6-rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;
