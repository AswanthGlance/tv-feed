import { useState, useMemo, useEffect } from 'react';
import { getGroupedRegistry, getExternalGroup, getRegistryCounts } from './config/registryUtils';
import type { GroupedEntries } from './config/registryUtils';
import type { PrototypeEntry, PrototypeStatus } from './config/prototypeRegistry';

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_STYLE: Record<PrototypeStatus, { bg: string; color: string }> = {
  Demo:     { bg: 'rgba(112,71,226,0.18)',  color: '#a78be5' },
  Final:    { bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  WIP:      { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  Archived: { bg: 'rgba(255,255,255,0.06)', color: '#555' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrototypeStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.WIP;
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

function ExternalBadge() {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
      background: 'rgba(0,112,243,0.15)', color: '#60a5fa',
    }}>
      Vercel
    </span>
  );
}

function LinkRow({ entry, isExternal }: { entry: PrototypeEntry; isExternal: boolean }) {
  const [hovered, setHovered] = useState(false);
  const disabled = entry.url === '#';

  const row = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '13px 18px', borderRadius: 10,
        border: `1px solid ${hovered && !disabled ? 'rgba(112,71,226,0.35)' : 'rgba(255,255,255,0.06)'}`,
        background: hovered && !disabled ? 'rgba(112,71,226,0.05)' : 'rgba(255,255,255,0.02)',
        transition: 'border-color 0.15s, background 0.15s',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: disabled ? '#555' : '#e8e6f0' }}>
            {entry.title}
          </span>
          {isExternal && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.45, flexShrink: 0 }}>
              <path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.description}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {isExternal && <ExternalBadge />}
        <StatusBadge status={entry.status} />
      </div>
    </div>
  );

  if (disabled) return row;

  return (
    <a
      href={entry.url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      {row}
    </a>
  );
}

function CategorySection({ group, query }: { group: GroupedEntries; query: string }) {
  const q = query.toLowerCase();
  const visible = q
    ? group.entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q) ||
        e.tags?.some(t => t.includes(q))
      )
    : group.entries;

  if (visible.length === 0) return null;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444' }}>
          {group.category}
        </h2>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 10, color: '#333' }}>{visible.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {visible.map((entry, i) => (
          <LinkRow key={`${group.category}-${i}`} entry={entry} isExternal={entry.isExternal} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrototypeIndex() {
  const [query, setQuery] = useState('');

  // Unlock scroll — global CSS locks html/body/#root
  useEffect(() => {
    const root = document.getElementById('root');
    const els = [document.documentElement, document.body, root].filter(Boolean) as HTMLElement[];
    els.forEach(el => { el.style.overflow = 'auto'; el.style.height = 'auto'; });
    return () => {
      els.forEach(el => { el.style.overflow = ''; el.style.height = ''; });
    };
  }, []);

  const groups = useMemo(() => getGroupedRegistry(), []);
  const externalGroup = useMemo(() => getExternalGroup(), []);
  const counts = useMemo(() => getRegistryCounts(), []);

  // All groups + external section appended
  const allGroups = useMemo(() => {
    if (!externalGroup) return groups;
    // External entries already live inside groups by category.
    // Show a dedicated section only if there are hosted URLs.
    return [...groups, externalGroup];
  }, [groups, externalGroup]);

  const hasResults = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return true;
    return allGroups.some(g =>
      g.entries.some(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q) ||
        e.tags?.some(t => t.includes(q))
      )
    );
  }, [query, allGroups]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090f',
      color: '#e8e6f0',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '48px 0 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '3px 11px', borderRadius: 99, marginBottom: 14,
                background: 'rgba(112,71,226,0.12)', border: '1px solid rgba(112,71,226,0.25)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#7047e2', textTransform: 'uppercase',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7047e2', display: 'inline-block' }} />
                Glance Ambient TV
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f3f7', lineHeight: 1.1 }}>
                Prototype Index
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.6, maxWidth: 420 }}>
                Quick access to Ambient TV demos, flows, and hosted builds.
                Add entries in <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>prototypeRegistry.ts</code> or paste Vercel URLs in <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>externalPrototypeLinks.ts</code>.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', paddingBottom: 4 }}>
              <Stat label="Total" value={counts.total} />
              <Stat label="Active" value={counts.active} accent />
              <Stat label="WIP" value={counts.wip} dim />
            </div>
          </div>

          {/* Search */}
          <div style={{ marginTop: 24, position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.3 }}>
              <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.4"/>
              <path d="M9.5 9.5L12.5 12.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, tag, or status…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px 10px 38px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#e8e6f0', fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(112,71,226,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</span>
          {(Object.entries(STATUS_STYLE) as [PrototypeStatus, { bg: string; color: string }][]).map(([key, s]) => (
            <span key={key} style={{ fontSize: 11, color: s.color, opacity: 0.75 }}>{key}</span>
          ))}
        </div>
      </div>

      {/* ── Groups ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 32px 80px' }}>
        {!hasResults ? (
          <div style={{ textAlign: 'center', padding: '72px 0', color: '#333' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>—</div>
            <p style={{ margin: 0, fontSize: 13 }}>Nothing matched "<span style={{ color: '#555' }}>{query}</span>"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {allGroups.map(group => (
              <CategorySection key={group.category} group={group} query={query} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 60, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ fontSize: 11, color: '#2a2a2a' }}>
            Route: <code style={{ color: '#333', fontFamily: 'monospace' }}>/index</code>
            {' · '}
            Run <code style={{ color: '#333', fontFamily: 'monospace' }}>npm run update:index</code> to validate the registry
          </span>
          <span style={{ fontSize: 11, color: '#2a2a2a' }}>
            {counts.total} entries · {counts.active} active · {counts.external} external
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, dim }: { label: string; value: number; accent?: boolean; dim?: boolean }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 700, lineHeight: 1, marginBottom: 3,
        color: dim ? '#444' : accent ? '#a78be5' : '#e8e6f0',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#333', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
