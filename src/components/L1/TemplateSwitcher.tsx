import type { RendererConfig } from './rendererRegistry';

interface Props {
  renderers: RendererConfig[];
  currentIdx: number;
  onNavigate: (slug: string) => void;
}

export default function TemplateSwitcher({ renderers, currentIdx, onNavigate }: Props) {
  const total   = renderers.length;
  const current = renderers[currentIdx];
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < total - 1;

  const iconColor = (active: boolean) =>
    active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.18)';

  return (
    <div style={{
      position: 'fixed',
      bottom: 22, right: 22,
      zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(10,6,20,0.88)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: '9px 12px',
      boxShadow: '0 8px 48px rgba(0,0,0,0.65)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      userSelect: 'none',
    }}>

      {/* Prev */}
      <button
        onClick={() => hasPrev && onNavigate(renderers[currentIdx - 1].id)}
        title="Previous (⌘←)"
        style={{
          width: 28, height: 28, borderRadius: 7, border: 'none',
          background: hasPrev ? 'rgba(255,255,255,0.08)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: hasPrev ? 'pointer' : 'default',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4"
            stroke={iconColor(hasPrev)} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Label */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        minWidth: 170, padding: '0 4px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {currentIdx + 1} / {total}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: 'rgba(255,255,255,0.72)',
          textAlign: 'center', lineHeight: 1.3,
          whiteSpace: 'nowrap',
        }}>
          {current.label}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={() => hasNext && onNavigate(renderers[currentIdx + 1].id)}
        title="Next (⌘→)"
        style={{
          width: 28, height: 28, borderRadius: 7, border: 'none',
          background: hasNext ? 'rgba(255,255,255,0.08)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: hasNext ? 'pointer' : 'default',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4"
            stroke={iconColor(hasNext)} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Progress pips */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 6, alignItems: 'center' }}>
        {renderers.map((_, i) => (
          <button
            key={i}
            onClick={() => onNavigate(renderers[i].id)}
            title={renderers[i].label}
            style={{
              width: i === currentIdx ? 18 : 5,
              height: 5, borderRadius: 3,
              border: 'none', padding: 0,
              background: i === currentIdx
                ? 'rgba(190,155,255,0.85)'
                : 'rgba(255,255,255,0.14)',
              transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}
