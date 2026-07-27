/**
 * AgentSearchBar — two-mode input switcher
 *
 * Layout is always: [ Keyboard (LEFT) ] [ Mic (RIGHT) ]
 *
 * micFocused (default):  keyboard is a small collapsed pill (104px wide);
 *                        mic is the wide active area (1008px wide, white fill when focused)
 * fieldFocused:          keyboard is the wide active area with text input;
 *                        mic is a small collapsed pill (104px wide)
 *
 * Navigation: LEFT from mic → keyboard; RIGHT from keyboard → mic.
 * Transitions: 260ms width + border-radius.
 */

import { ICON_DIR } from './agentHubIcons';

const ROW_W     = 1124;
const H         = 104;
const PILL_W    = 72;         // collapsed side width
const AREA_R    = 21;         // radius — same for all states
const GAP       = 12;
const EXPANDED_W = ROW_W - PILL_W - GAP;   // 1040px
const ICON_SM   = 26;
const ICON_LG   = 32;

const EASE = '0.26s cubic-bezier(0.22,0.61,0.36,1)';

export type AgentSearchBarProps = {
  micFocused:      boolean;
  fieldFocused:    boolean;
  activeInputMode?: 'mic' | 'keyboard';
  placeholder:     string;
  onMicClick?:     () => void;
  onFieldClick?:   () => void;
};

// ── Inline keyboard SVG — no asset dependency ──────────────────────────────
function KeyboardIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, transition: 'stroke 0.2s ease' }}
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      {/* top-row keys */}
      <line x1="6"  y1="9"  x2="6"  y2="9.01"  strokeWidth="2.2" />
      <line x1="10" y1="9"  x2="10" y2="9.01"  strokeWidth="2.2" />
      <line x1="14" y1="9"  x2="14" y2="9.01"  strokeWidth="2.2" />
      <line x1="18" y1="9"  x2="18" y2="9.01"  strokeWidth="2.2" />
      {/* middle-row keys */}
      <line x1="8"  y1="12" x2="8"  y2="12.01" strokeWidth="2.2" />
      <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth="2.2" />
      <line x1="16" y1="12" x2="16" y2="12.01" strokeWidth="2.2" />
      {/* space bar */}
      <line x1="8" y1="15.5" x2="16" y2="15.5" strokeWidth="2" />
    </svg>
  );
}

export default function AgentSearchBar({
  micFocused,
  fieldFocused,
  activeInputMode,
  placeholder,
  onMicClick,
  onFieldClick,
}: AgentSearchBarProps) {
  // keyboard is LEFT; mic is RIGHT
  // Expansion is driven by activeInputMode (persists through focus changes).
  // Active (white fill) state is driven by whether the element currently has focus.
  const kbdActive = fieldFocused;
  const micActive = micFocused;

  const kbdExpanded = activeInputMode === 'keyboard';
  const kbdW = kbdExpanded ? EXPANDED_W : PILL_W;
  const micW = kbdExpanded ? PILL_W : EXPANDED_W;

  // Keyboard colors — white fill only when actively focused (has DOM focus)
  const kbdBg = kbdActive
    ? 'rgba(255,255,255,0.92)'
    : 'rgba(255,255,255,0.07)';
  const kbdBorder = kbdActive
    ? '2px solid rgba(255,255,255,0.88)'
    : '1px solid rgba(255,255,255,0.12)';

  // Mic colors — white when actively focused, dim translucent otherwise
  const micBg = micActive
    ? 'rgba(255,255,255,0.92)'
    : 'rgba(255,255,255,0.08)';
  const micBorder = micActive
    ? '2px solid rgba(255,255,255,0.88)'
    : '1px solid rgba(255,255,255,0.12)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: ROW_W,
      gap: GAP,
    }}>

      {/* ── Keyboard — LEFT ───────────────────────────────────────────────────── */}
      <div
        onClick={onFieldClick}
        style={{
          width: kbdW,
          height: H,
          borderRadius: AREA_R,
          flexShrink: 0,
          background: kbdBg,
          border: kbdBorder,
          boxShadow: kbdActive
            ? 'inset 0 2px 12px rgba(255,255,255,0.45)'
            : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: kbdExpanded ? 'space-between' : 'center',
          padding: kbdExpanded ? '0 28px' : 0,
          cursor: 'pointer',
          overflow: 'hidden',
          transition: [
            `width ${EASE}`,
            'background 0.2s ease',
            'box-shadow 0.2s ease',
            'border 0.2s ease',
            'padding 0.26s ease',
          ].join(', '),
        }}
      >
        {kbdExpanded ? (
          <>
            <span style={{
              flex: '1 0 0',
              fontSize: 20,
              fontWeight: 500,
              color: kbdActive ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.28)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              marginRight: 16,
              transition: 'color 0.2s ease',
            }}>
              Type your request…
            </span>
            <KeyboardIcon size={ICON_SM} color={kbdActive ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.28)'} />
          </>
        ) : (
          <KeyboardIcon size={ICON_SM} color="rgba(255,255,255,0.52)" />
        )}
      </div>

      {/* ── Mic — RIGHT ───────────────────────────────────────────────────────── */}
      <div
        onClick={onMicClick}
        style={{
          width: micW,
          height: H,
          borderRadius: AREA_R,
          flexShrink: 0,
          background: micBg,
          border: micBorder,
          boxShadow: micActive
            ? 'inset 0 2px 12px rgba(255,255,255,0.45)'
            : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          cursor: 'pointer',
          overflow: 'hidden',
          transition: [
            `width ${EASE}`,
            'background 0.2s ease',
            'box-shadow 0.2s ease',
            'border 0.2s ease',
          ].join(', '),
        }}
      >
        <img
          src={`${ICON_DIR}/search-mic-icon.svg`}
          alt=""
          style={{
            width: !kbdExpanded ? ICON_LG : ICON_SM,
            height: !kbdExpanded ? ICON_LG : ICON_SM,
            flexShrink: 0,
            filter: micActive ? 'invert(1)' : 'none',
            opacity: micActive ? 1 : 0.45,
            transition: 'filter 0.2s ease, opacity 0.2s ease',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        {!kbdExpanded && (
          <span style={{
            fontSize: 16,
            fontWeight: 500,
            color: micActive ? 'rgba(0,0,0,0.52)' : 'rgba(255,255,255,0.28)',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s ease',
          }}>
            {placeholder}
          </span>
        )}
      </div>

    </div>
  );
}
