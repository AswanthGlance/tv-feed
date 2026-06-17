import { useState } from 'react';
import type { SignalLogEntry } from '../logic/signalLog';

type Props = {
  signals: SignalLogEntry[];
  sessionId: string;
  onClose: () => void;
};

const SOURCE_COLORS: Record<string, string> = {
  'setup': '#7047E2',
  'interstitial': '#A786E5',
  'l1-exit': '#C24DFF',
  'thumbs-up': '#22c55e',
  'thumbs-down': '#ef4444',
  'contextual': '#f59e0b',
  'passive-dwell': '#60a5fa',
  'skip-fast': '#f87171',
  'settings': '#8B8794',
  'reset': '#5D5968',
};

const SOURCE_LABELS: Record<string, string> = {
  'setup': 'Setup',
  'interstitial': 'Interstitial',
  'l1-exit': 'L1 Exit',
  'thumbs-up': 'Thumbs Up',
  'thumbs-down': 'Thumbs Down',
  'contextual': 'Contextual',
  'passive-dwell': 'Dwell',
  'skip-fast': 'Fast Skip',
  'settings': 'Settings',
  'reset': 'Reset',
};

export default function DataPanel({ signals, sessionId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'json'>('timeline');
  const [copied, setCopied] = useState(false);
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const filtered = filterSource ? signals.filter(s => s.source === filterSource) : signals;
  const sources = [...new Set(signals.map(s => s.source))];

  const durableCount = signals.filter(s => s.durable).length;
  const sessionOnlyCount = signals.filter(s => !s.durable).length;

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(signals, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const payload = { session_id: sessionId, exported_at: new Date().toISOString(), signal_count: signals.length, signals };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glance-signals-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tab: (active: boolean) => React.CSSProperties = (active) => ({
    padding: '8px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
    background: active ? '#7047E2' : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : '#B7B3C0', transition: 'all 0.15s',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(3,2,9,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 900, maxHeight: '90vh', background: 'linear-gradient(180deg, #1A0F3D, #0E0A22)',
          border: '1px solid rgba(167,134,229,0.22)', borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(112,71,226,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A786E5', background: 'rgba(112,71,226,0.15)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(167,134,229,0.2)' }}>
                Signal Log (Prototype)
              </span>
              <span style={{ fontSize: 11, color: '#5D5968', fontFamily: 'monospace' }}>{sessionId}</span>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, color: '#F5F3F7' }}>
              Session Learning Log
            </div>
            <div style={{ fontSize: 13, color: '#8B8794', marginTop: 4 }}>
              {signals.length} signals · {durableCount} durable · {sessionOnlyCount} session-only
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8B8794', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontFamily: 'inherit' }}>×</button>
        </div>

        {/* Summary chips */}
        <div style={{ padding: '14px 28px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgba(167,134,229,0.1)' }}>
          {/* Source filter chips */}
          <button onClick={() => setFilterSource(null)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filterSource === null ? '#7047E2' : 'rgba(255,255,255,0.08)', color: filterSource === null ? '#fff' : '#B7B3C0', fontFamily: 'inherit' }}>
            All ({signals.length})
          </button>
          {sources.map(src => (
            <button key={src} onClick={() => setFilterSource(filterSource === src ? null : src)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filterSource === src ? SOURCE_COLORS[src] : `${SOURCE_COLORS[src]}22`, color: filterSource === src ? '#fff' : SOURCE_COLORS[src], fontFamily: 'inherit' }}>
              {SOURCE_LABELS[src]} ({signals.filter(s => s.source === src).length})
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 28px', display: 'flex', gap: 8, borderBottom: '1px solid rgba(167,134,229,0.1)' }}>
          <button style={tab(activeTab === 'timeline')} onClick={() => setActiveTab('timeline')}>Timeline</button>
          <button style={tab(activeTab === 'json')} onClick={() => setActiveTab('json')}>Raw JSON</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
          {activeTab === 'timeline' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.length === 0 && (
                <div style={{ color: '#5D5968', fontSize: 16, textAlign: 'center', padding: '40px 0' }}>
                  No signals yet — interact with the feed to see what Glance learns.
                </div>
              )}
              {[...filtered].reverse().map(sig => (
                <div key={sig.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(167,134,229,0.1)',
                  borderRadius: 12, padding: '14px 18px',
                  borderLeft: `3px solid ${SOURCE_COLORS[sig.source] || '#5D5968'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${SOURCE_COLORS[sig.source]}22`, color: SOURCE_COLORS[sig.source] || '#8B8794', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {SOURCE_LABELS[sig.source] || sig.source}
                      </span>
                      {!sig.durable && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#5D5968', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 999 }}>
                          session only
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#5D5968', fontFamily: 'monospace' }}>
                      {new Date(sig.timestamp_ms).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 600, color: '#F5F3F7', marginBottom: 6 }}>
                    {sig.action_label}
                  </div>

                  {sig.card_title && (
                    <div style={{ fontSize: 13, color: '#8B8794', marginBottom: 8 }}>
                      Card: {sig.card_title} · {sig.card_category}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {sig.boosted_attributes.map(a => (
                      <span key={a} style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                        +{a}
                      </span>
                    ))}
                    {sig.decayed_attributes.map(a => (
                      <span key={a} style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                        −{a}
                      </span>
                    ))}
                    {sig.boosted_attributes.length === 0 && sig.decayed_attributes.length === 0 && (
                      <span style={{ fontSize: 12, color: '#5D5968' }}>No attribute change</span>
                    )}
                  </div>

                  {Object.keys(sig.weight_deltas).length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#5D5968', fontFamily: 'monospace' }}>
                      Δ {Object.entries(sig.weight_deltas).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v.toFixed(2)}`).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre style={{ margin: 0, fontFamily: '"Courier New", monospace', fontSize: 12, color: '#D4D0DC', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(filtered, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(167,134,229,0.1)' }}>
          <span style={{ fontSize: 12, color: '#5D5968', marginRight: 'auto' }}>Click outside to close</span>
          <button onClick={handleDownload} style={{ padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(167,134,229,0.3)', background: 'transparent', color: '#A786E5', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↓ Download JSON
          </button>
          <button onClick={handleCopy} style={{ padding: '10px 28px', borderRadius: 999, border: 'none', background: copied ? '#22c55e' : '#7047E2', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
