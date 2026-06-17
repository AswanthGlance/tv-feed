import { useState } from 'react';
import type { PreferenceProfile, FeedItem } from '../data/types';
import { buildMLPayload } from '../logic/sessionExport';

type Props = {
  profile: PreferenceProfile;
  feed: FeedItem[];
  feedIdx: number;
  feedbackCount: number;
  onboardingDone: boolean;
  onClose: () => void;
};

export default function SessionDataOverlay({ profile, feed, feedIdx, feedbackCount, onboardingDone, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');

  const payload = buildMLPayload(profile, feed, feedIdx, feedbackCount, onboardingDone);

  const summaryPayload = {
    session_id: payload.session_id,
    exported_at_iso: payload.exported_at_iso,
    market: payload.market,
    language: payload.language,
    family_friendly: payload.family_friendly,
    onboarding: payload.onboarding,
    derived_taste_summary: payload.derived_taste_summary,
    preference_profile: {
      top_categories: payload.preference_profile.top_categories,
      top_vibes: payload.preference_profile.top_vibes,
      top_regions: payload.preference_profile.top_regions,
      discovery_mode: payload.preference_profile.discovery_mode,
      badges_earned: payload.preference_profile.badges_earned,
    },
    feed_interactions_count: payload.feed_interactions.length,
    signals_collected: payload.signal_history.length,
  };

  const displayed = activeTab === 'summary' ? summaryPayload : payload;
  const json = JSON.stringify(displayed, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glance-session-${payload.session_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tab: (active: boolean) => React.CSSProperties = (active) => ({
    padding: '8px 20px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    background: active ? '#7047E2' : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : '#B7B3C0',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3,2,9,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 760, maxHeight: '88vh',
          background: 'linear-gradient(180deg,#1A0F3D,#0E0A22)',
          border: '1px solid rgba(167,134,229,0.22)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(112,71,226,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#A786E5', background: 'rgba(112,71,226,0.15)', padding: '4px 12px',
                borderRadius: 999, border: '1px solid rgba(167,134,229,0.2)',
              }}>ML Session Data</span>
              <span style={{ fontSize: 11, color: '#5D5968', fontFamily: 'monospace' }}>
                {payload.session_id}
              </span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: '#F5F3F7' }}>
              Session Preference Export
            </div>
            <div style={{ fontSize: 13, color: '#8B8794', marginTop: 4 }}>
              {payload.exported_at_iso} · schema v{payload.schema_version}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#8B8794', cursor: 'pointer',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontFamily: 'inherit',
          }}>×</button>
        </div>

        {/* Summary chips */}
        <div style={{ padding: '16px 28px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {payload.preference_profile.top_categories.map(c => (
            <span key={c} style={chipStyle('#7047E2')}>{c}</span>
          ))}
          {payload.preference_profile.top_vibes.map(v => (
            <span key={v} style={chipStyle('#A786E5')}>{v}</span>
          ))}
          {payload.derived_taste_summary.dominant_vibe && (
            <span style={chipStyle('#C24DFF')}>vibe: {payload.derived_taste_summary.dominant_vibe}</span>
          )}
          <span style={chipStyle('#5D5968')}>{payload.preference_profile.discovery_mode} mode</span>
          <span style={chipStyle('#5D5968')}>{payload.derived_taste_summary.interaction_depth}</span>
          <span style={chipStyle('#5D5968')}>{payload.feed_interactions.length} interactions</span>
          <span style={chipStyle('#5D5968')}>{payload.signal_history.length} signals</span>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 28px 12px', display: 'flex', gap: 8 }}>
          <button style={tab(activeTab === 'summary')} onClick={() => setActiveTab('summary')}>Summary</button>
          <button style={tab(activeTab === 'full')} onClick={() => setActiveTab('full')}>Full Payload</button>
        </div>

        {/* JSON body */}
        <div style={{
          flex: 1, overflowY: 'auto', margin: '0 28px',
          background: 'rgba(0,0,0,0.35)', borderRadius: 12,
          border: '1px solid rgba(167,134,229,0.1)',
        }}>
          <pre style={{
            margin: 0, padding: '18px 20px',
            fontFamily: '"Courier New", monospace', fontSize: 12,
            color: '#D4D0DC', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {json}
          </pre>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '18px 28px',
          display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center',
          borderTop: '1px solid rgba(167,134,229,0.1)',
        }}>
          <span style={{ fontSize: 12, color: '#5D5968', marginRight: 'auto' }}>
            Click outside to close · Full payload always copied/downloaded
          </span>
          <button onClick={handleDownload} style={{
            padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(167,134,229,0.3)',
            background: 'transparent', color: '#A786E5', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ↓ Download JSON
          </button>
          <button onClick={handleCopy} style={{
            padding: '10px 28px', borderRadius: 999, border: 'none',
            background: copied ? '#22c55e' : '#7047E2',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}>
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}

function chipStyle(color: string): React.CSSProperties {
  return {
    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    background: color + '22', color, border: `1px solid ${color}44`,
  };
}
