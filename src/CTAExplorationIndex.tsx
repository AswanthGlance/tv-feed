/**
 * Landing page — CTA exploration index.
 */
export default function CTAExplorationIndex() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0e0e0e', color: '#fff',
      fontFamily: 'monospace',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 48,
    }}>
      <div style={{ fontSize: 13, color: '#555', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        CTA Interaction Exploration
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        <OptionCard
          label="Option 1"
          title="CTA Row Below Card"
          desc={[
            'CTAs float below the focused card border.',
            'Visible when card is focused.',
            'ENTER enters CTA strip.',
            'DOWN skips CTAs → prompts.',
            'LEFT edge → 👍/👎 · ⌨️/🎤.',
          ]}
          href="/l1-embedded-cta"
        />
        <OptionCard
          label="Option 2"
          title="Embedded CTA Inside Card"
          desc={[
            'Card auto-expands on focus.',
            'CTAs live inside the expanded card.',
            'ENTER enters action mode.',
            'UP exits CTA → card. DOWN exits CTA → prompts.',
            'LEFT edge → 👍/👎 · ⌨️/🎤.',
          ]}
          href="/l1-expanded-card"
        />
        <OptionCard
          label="Option 3"
          title="Continuous Primary CTA"
          desc={[
            'No ENTER required — CTAs always active.',
            'Buy Now is default focused CTA.',
            'RIGHT from Buy Now → next card (Buy Now stays).',
            'LEFT from More → prev card (Buy Now flips to left).',
            'CTA order mirrors based on travel direction.',
          ]}
          href="/l1-continuous-cta"
        />
      </div>
    </div>
  );
}

function OptionCard({ label, title, desc, href }: {
  label: string; title: string; desc: string[]; href: string;
}) {
  return (
    <a href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          width: 340,
          border: '1px solid #333',
          borderRadius: 10,
          padding: '36px 32px',
          background: '#161616',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#666')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
      >
        <div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.14em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e0e0e0' }}>{title}</div>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {desc.map((d, i) => (
            <li key={i} style={{ fontSize: 13, color: '#777', lineHeight: '20px' }}>{d}</li>
          ))}
        </ul>
        <div style={{ marginTop: 8, padding: '12px 24px', border: '1px solid #444', borderRadius: 999, fontSize: 14, color: '#aaa', textAlign: 'center' }}>
          Open →
        </div>
      </div>
    </a>
  );
}
