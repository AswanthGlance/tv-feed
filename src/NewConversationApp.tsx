/**
 * NewConversationApp — standalone route wrapper for /new-conversation.
 *
 * Hosts three homepage variants for design exploration:
 *   Variant 1 — First-time user (FTOX): Search → Categories → Prompts
 *   Variant 2 — Returning user:         Search → Continue → Categories → History
 *   Variant 3 — Final Option:           Editorial left-column hero, ambient BG, visual capability cards
 *
 * A mouse-only debug switcher in the top-right corner toggles between them.
 * It does not participate in TV D-pad navigation.
 */

import { useState, useEffect } from 'react';
import NewConversationScreen from './components/AgentHub/NewConversationScreen';
import ReturningUserScreen from './components/AgentHub/ReturningUserScreen';
import ConversationLibraryScreen from './components/AgentHub/ConversationLibraryScreen';
import FinalOptionScreen from './components/AgentHub/FinalOptionScreen';

type Variant = 'ftox' | 'returning' | 'final-option';
type ReturningScreen = 'home' | 'library';

export default function NewConversationApp() {
  const [variant, setVariant] = useState<Variant>('ftox');
  const [returningScreen, setReturningScreen] = useState<ReturningScreen>('home');

  // Leaving the "returning user" variant should always land back on its
  // homepage, not mid-way inside the library.
  useEffect(() => { setReturningScreen('home'); }, [variant]);

  const handleStartConversation = (query: string) => {
    if (query) {
      const params = new URLSearchParams({ q: query });
      window.location.href = `/l1-scenarios?${params.toString()}`;
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/agent-hub';
  };

  return (
    <div id="scaler">
      <div id="stage">
        {variant === 'ftox' ? (
          <NewConversationScreen
            onStartConversation={handleStartConversation}
            onBack={handleBack}
          />
        ) : variant === 'final-option' ? (
          <FinalOptionScreen onBack={handleBack} />
        ) : returningScreen === 'home' ? (
          <ReturningUserScreen
            onStartConversation={handleStartConversation}
            onOpenLibrary={() => setReturningScreen('library')}
            onBack={handleBack}
          />
        ) : (
          <ConversationLibraryScreen
            onStartConversation={handleStartConversation}
            onBack={() => setReturningScreen('home')}
          />
        )}

        {/* ── Debug variant switcher — mouse only, excluded from TV nav ──────── */}
        <div
          // Intercept all keyboard events so D-pad never lands here
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 24, right: 36,
            zIndex: 9999,
            background: 'rgba(8,6,18,0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '12px 18px 14px',
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            userSelect: 'none',
            // pointer-events explicitly on so mouse clicks register
            pointerEvents: 'all',
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1.4px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
            marginBottom: 10,
          }}>
            Homepage Variant
          </div>
          {(
            [
              { key: 'ftox',         label: 'FTUX' },
              { key: 'returning',    label: 'Returning User' },
              { key: 'final-option', label: 'Final Option' },
            ] as const
          ).map(({ key, label }) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                marginBottom: key !== 'final-option' ? 8 : 0,
                cursor: 'pointer',
              }}
            >
              {/* Custom radio dot */}
              <div
                onClick={() => setVariant(key)}
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: variant === key ? '2px solid #A78BFA' : '1.5px solid rgba(255,255,255,0.3)',
                  background: variant === key ? 'rgba(167,139,250,0.25)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'border 0.15s ease, background 0.15s ease',
                }}
              >
                {variant === key && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A78BFA' }} />
                )}
              </div>
              <span
                onClick={() => setVariant(key)}
                style={{
                  fontSize: 12, fontWeight: variant === key ? 600 : 400,
                  color: variant === key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                  transition: 'color 0.15s ease, font-weight 0.15s ease',
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
