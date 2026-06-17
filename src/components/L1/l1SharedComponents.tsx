import React from 'react';
import { FOCUS_BORDER, FOCUS_SHADOW, IDLE_BORDER, FOCUS_TRANSITION } from './l1Constants';

/* ─── ThinkingLine ──────────────────────────────────────────────────────────── */
export function ThinkingLine({ typedText, done, isActive }: {
  typedText: string;
  done: boolean;
  isActive: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'l1StepIn 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
      <style>{`
        @keyframes l1StepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes l1Spin { to { transform: rotate(360deg); } }
        @keyframes l1GlowPulse {
          0%, 100% { text-shadow: 0 0 8px rgba(180,140,255,0.5), 0 0 22px rgba(140,90,255,0.22); }
          50%       { text-shadow: 0 0 14px rgba(205,165,255,0.78), 0 0 36px rgba(160,110,255,0.42), 0 0 58px rgba(120,70,220,0.18); }
        }
        @keyframes l1CursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
      <div style={{ flexShrink: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="rgba(160,220,170,0.35)" strokeWidth="1.2"/>
            <path d="M4 7l2 2 4-4" stroke="rgba(160,220,170,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'l1Spin 1.4s linear infinite' }}>
            <circle cx="7" cy="7" r="5" stroke="rgba(165,130,255,0.15)" strokeWidth="1.5"/>
            <path d="M7 2 A5 5 0 0 1 12 7" stroke="rgba(180,145,255,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 18, fontStyle: 'italic', fontWeight: 400,
        letterSpacing: '0.005em', lineHeight: 1.4,
        color: done ? 'rgba(200,185,235,0.4)' : 'rgba(215,195,255,0.9)',
        textShadow: done ? 'none' : '0 0 10px rgba(180,140,255,0.58), 0 0 26px rgba(140,90,255,0.28)',
        animation: isActive ? 'l1GlowPulse 2.4s ease-in-out infinite' : 'none',
        transition: 'color 0.55s ease, text-shadow 0.55s ease',
      }}>
        {typedText}
        {isActive && (
          <span style={{
            display: 'inline-block', width: 1.5, height: '0.85em',
            background: 'rgba(200,170,255,0.75)', marginLeft: 2, verticalAlign: 'text-bottom',
            borderRadius: 1, animation: 'l1CursorBlink 0.9s ease-in-out infinite',
            boxShadow: '0 0 6px rgba(180,140,255,0.7)',
          }} />
        )}
      </span>
    </div>
  );
}

/* ─── SectionLabel ──────────────────────────────────────────────────────────── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 16, fontWeight: 700, letterSpacing: '0.18em',
      color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase',
    }}>
      {children}
      <div style={{ flex: 1, height: 1, maxWidth: 90, background: 'linear-gradient(to right, rgba(255,255,255,0.16), transparent)' }} />
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M6 0.5L7.3 4.7L11.5 6L7.3 7.3L6 11.5L4.7 7.3L0.5 6L4.7 4.7L6 0.5Z" fill="rgba(190,140,255,0.6)"/>
      </svg>
    </div>
  );
}

/* ─── FocusButton ───────────────────────────────────────────────────────────── */
export function FocusButton({ focused, variant, icon, children }: {
  focused: boolean; variant: 'white' | 'dark'; icon?: React.ReactNode; children: React.ReactNode;
}) {
  const isWhite = variant === 'white';
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: isWhite
        ? (focused ? '#fff' : 'rgba(255,255,255,0.94)')
        : (focused ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'),
      color: isWhite ? '#111' : '#fff',
      border: isWhite ? 'none' : (focused ? FOCUS_BORDER : IDLE_BORDER('0.18')),
      borderRadius: 999, padding: '14px 26px',
      fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      backdropFilter: isWhite ? 'none' : 'blur(14px)',
      boxShadow: focused
        ? isWhite
          ? `0 0 0 3px rgba(0,0,0,0.25), 0 0 0 5px #fff, ${FOCUS_SHADOW}`
          : FOCUS_SHADOW
        : isWhite ? '0 4px 18px rgba(0,0,0,0.3)' : 'none',
      transform: focused ? 'scale(1.06)' : 'scale(1)',
      transition: FOCUS_TRANSITION,
    }}>
      {icon}{children}
    </button>
  );
}

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
export function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2" stroke="rgba(255,255,255,0.62)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="23" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
      <line x1="8"  y1="23" x2="16" y2="23" stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="rgba(255,255,255,0.62)" strokeWidth="2"/>
    </svg>
  );
}

export function TryOnIcon({ dark }: { dark: boolean }) {
  const c = dark ? '#111' : '#fff';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="2"/>
      <path d="M6 21C6 17.134 8.686 14 12 14s6 3.134 6 7" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function BagIcon({ dark }: { dark: boolean }) {
  const c = dark ? '#111' : '#fff';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={c} strokeWidth="2"/>
      <line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="2"/>
      <path d="M16 10a4 4 0 01-8 0" stroke={c} strokeWidth="2"/>
    </svg>
  );
}
