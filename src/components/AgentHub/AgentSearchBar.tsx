/**
 * AgentSearchBar — the mic + search field row shared by NewConversationScreen
 * and ReturningUserScreen. Extracted because it was byte-identical in both
 * (a third piece of duplicated markup after icons and capabilities), and the
 * two homepages are meant to stay pixel-consistent by construction.
 *
 * Sizing is the original compact scale (a Figma pass at literal size, node
 * 5229:29113, read too large on screen). What carried over from that pass:
 * the search field's rounded-pill corners always traced by a crisp, constant
 * white border — previously the border only appeared once focused, so the
 * field's rounded shape barely read against the dark background at rest.
 *
 * Mic is a tall pill/capsule (not a circle) — taller than the search field,
 * vertically centered against it. When focused it fills solid white and
 * surfaces a "Press to Activate" tooltip below it; the mic icon inverts to
 * dark so it stays legible against the white fill.
 */

import { ICON_DIR } from './agentHubIcons';

const MIC_W = 72;
const MIC_H = 104;
const FIELD_H = MIC_H; // field matches the mic's height exactly
const FIELD_RADIUS = 21; // fixed — half the original full-pill radius (was FIELD_H/2 at FIELD_H=84)
const ICON_SIZE = 26;
const GAP = 16;
// Total row width is pinned to CONTENT_WIDTH (1124) so the row still lines up
// with the capability grid and other CONTENT_WIDTH-anchored sections below it.
const FIELD_W = 1124 - MIC_W - GAP;

export type AgentSearchBarProps = {
  micFocused: boolean;
  fieldFocused: boolean;
  placeholder: string;
  onMicClick?: () => void;
  onFieldClick?: () => void;
};

export default function AgentSearchBar({
  micFocused,
  fieldFocused,
  placeholder,
  onMicClick,
  onFieldClick,
}: AgentSearchBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: MIC_W + GAP + FIELD_W, gap: GAP }}>
      {/* Mic — tall capsule, solid white + tooltip when focused */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          style={{
            padding: 0, width: MIC_W, height: MIC_H, borderRadius: MIC_W / 2,
            background: micFocused ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
            border: micFocused ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.22,0.61,0.36,1)',
          }}
          onClick={onMicClick}
        >
          <img
            src={`${ICON_DIR}/search-mic-icon.svg`} alt=""
            style={{
              width: ICON_SIZE, height: ICON_SIZE,
              filter: micFocused ? 'invert(1)' : 'none',
              opacity: micFocused ? 1 : 0.5,
              transition: 'filter 0.2s ease, opacity 0.2s ease',
            }}
          />
        </button>

        {micFocused && (
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 10, whiteSpace: 'nowrap', pointerEvents: 'none',
            background: 'rgba(10,8,20,0.92)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: '8px 16px',
            fontSize: 13, fontWeight: 500, color: '#F5F3F7', letterSpacing: '-0.005em',
          }}>
            Press to Activate
          </div>
        )}
      </div>

      {/* Search field — same height as the mic, rounded rect at FIELD_RADIUS
          (half the original full-pill radius) */}
      <div
        style={{
          width: FIELD_W, height: FIELD_H, borderRadius: FIELD_RADIUS,
          background: fieldFocused ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)',
          border: fieldFocused ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: fieldFocused
            ? 'inset 0px 6px 16px 0px rgba(255,255,255,0.9), inset 0px 0px 16px 0px rgba(255,255,255,0.9)'
            : 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 28px 0 32px',
          cursor: 'pointer',
          transition: 'background 0.2s ease, box-shadow 0.2s ease',
        }}
        onClick={onFieldClick}
      >
        <span style={{
          flex: '1 0 0', fontSize: 20, fontWeight: 500,
          color: fieldFocused ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          transition: 'color 0.2s ease',
        }}>
          {placeholder}
        </span>
        <img
          src={`${ICON_DIR}/search-magnifying-glass.svg`} alt=""
          style={{
            width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0,
            filter: fieldFocused ? 'none' : 'invert(1) brightness(1.3)',
            opacity: fieldFocused ? 1 : 0.55,
            transition: 'filter 0.2s ease, opacity 0.2s ease',
          }}
        />
      </div>
    </div>
  );
}
