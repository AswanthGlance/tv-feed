import type { PreferenceProfile, FeedItem } from '../data/types';
import { getLastSignalSummary } from '../logic/signals';

type SliderValues = {
  interactionCap: number;
  interstitialN: number;
  decayFactor: number;
};

type Props = {
  profile: PreferenceProfile;
  screen: string;
  feed: FeedItem[];
  feedIdx: number;
  feedbackCount: number;
  onboardingDone: boolean;
  onExportSession: () => void;
  sliders: SliderValues;
  onSliderChange: (key: keyof SliderValues, value: number) => void;
};

export default function DebugPanel({ profile, screen, feed, feedIdx, feedbackCount, onboardingDone, onExportSession, sliders, onSliderChange }: Props) {
  const topWeights = Object.entries(profile.weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topNeg = Object.entries(profile.negativeWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const upcoming = feed.slice(feedIdx, feedIdx + 3);

  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
    borderBottom: '1px solid rgba(112,71,226,0.12)',
  };

  const label: React.CSSProperties = { color: '#A786E5', marginRight: 8 };
  const val: React.CSSProperties = { color: '#F5F3F7' };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9000,
        background: 'rgba(5,3,14,0.96)',
        border: '1px solid rgba(112,71,226,0.4)',
        borderRadius: 12,
        padding: '16px 20px',
        maxWidth: 480,
        maxHeight: '80vh',
        overflowY: 'auto',
        fontFamily: '"Courier New", monospace',
        fontSize: 12,
        color: '#F5F3F7',
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: '#7047E2', fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>
        ✦ GLANCE DEBUG  <span style={{ color: '#666', fontWeight: 400 }}>press D to close</span>
      </div>

      {/* Screen */}
      <div style={row}>
        <span style={label}>Screen</span>
        <span style={val}>{screen}</span>
      </div>

      {/* Profile settings */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Profile</div>
      <div style={row}><span style={label}>Market</span><span style={val}>{profile.market}</span></div>
      <div style={row}><span style={label}>Language</span><span style={val}>{profile.language}</span></div>
      <div style={row}><span style={label}>Family-friendly</span><span style={val}>{profile.familyFriendly ? 'Yes' : 'No'}</span></div>
      <div style={row}><span style={label}>Onboarding done</span><span style={val}>{onboardingDone ? 'Yes' : 'No'}</span></div>
      <div style={row}><span style={label}>Feedback count</span><span style={val}>{feedbackCount}</span></div>

      {/* Onboarding answers */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Onboarding Answers</div>
      <div style={row}><span style={label}>Q1 Scenario</span><span style={val}>{profile.selectedQ1Scenario || '—'}</span></div>
      <div style={row}><span style={label}>Q1 Categories</span><span style={val}>{profile.selectedQ3Categories?.join(', ') || '—'}</span></div>
      <div style={row}><span style={label}>Q2 Worlds</span><span style={val}>{(profile.selectedQ2Worlds || []).join(', ') || '—'}</span></div>
      <div style={row}><span style={label}>Q3 Discovery</span><span style={val}>{profile.discoveryMode || '—'}</span></div>

      {/* Top weights */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Top 8 Weights</div>
      {topWeights.length === 0 && <div style={{ color: '#666' }}>None yet</div>}
      {topWeights.map(([k, v]) => (
        <div key={k} style={row}>
          <span style={label}>{k}</span>
          <span style={{ color: '#6ee7b7' }}>{v.toFixed(2)}</span>
        </div>
      ))}

      {/* Negative weights */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Top 4 Negative Weights</div>
      {topNeg.length === 0 && <div style={{ color: '#666' }}>None yet</div>}
      {topNeg.map(([k, v]) => (
        <div key={k} style={row}>
          <span style={label}>{k}</span>
          <span style={{ color: '#f87171' }}>-{v.toFixed(2)}</span>
        </div>
      ))}

      {/* Last signal */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Last Signal</div>
      <div style={{ color: '#F5F3F7', wordBreak: 'break-word' }}>{getLastSignalSummary(profile.lastSignal)}</div>

      {/* Next feed items */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Next 3 Feed Items (idx {feedIdx})</div>
      {upcoming.map((item, i) => (
        <div key={item.id} style={row}>
          <span style={label}>+{i}</span>
          <span style={val}>{item.title} · {item.category}</span>
        </div>
      ))}

      {/* Badges */}
      <div style={{ marginTop: 8, color: '#A786E5', fontWeight: 700, marginBottom: 4 }}>Active Badges</div>
      <div style={{ color: '#F5F3F7' }}>
        {profile.badges.length === 0 ? '—' : profile.badges.join(', ')}
      </div>

      {/* Debug sliders */}
      <div style={{ marginTop: 12, color: '#A786E5', fontWeight: 700, marginBottom: 6 }}>Sliders</div>
      {[
        { key: 'interactionCap' as keyof SliderValues, label: 'Follow-up cap/session', min: 1, max: 20, step: 1 },
        { key: 'interstitialN' as keyof SliderValues, label: 'Interstitial gap (cards)', min: 4, max: 30, step: 1 },
        { key: 'decayFactor' as keyof SliderValues, label: 'Decay factor', min: 0.80, max: 1.00, step: 0.01 },
      ].map(sl => (
        <div key={sl.key} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A786E5', marginBottom: 3 }}>
            <span>{sl.label}</span>
            <span style={{ color: '#F5F3F7' }}>{sliders[sl.key]}</span>
          </div>
          <input
            type="range" min={sl.min} max={sl.max} step={sl.step}
            value={sliders[sl.key]}
            onChange={e => onSliderChange(sl.key, parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#7047E2' }}
          />
        </div>
      ))}

      {/* Export CTA */}
      <button
        onClick={onExportSession}
        style={{
          marginTop: 16, width: '100%',
          padding: '10px 0', borderRadius: 8,
          background: 'rgba(112,71,226,0.2)', border: '1px solid rgba(167,134,229,0.35)',
          color: '#A786E5', fontFamily: '"Courier New", monospace',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(112,71,226,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(112,71,226,0.2)')}
      >
        ↗ EXPORT SESSION DATA (ML)
      </button>
    </div>
  );
}
