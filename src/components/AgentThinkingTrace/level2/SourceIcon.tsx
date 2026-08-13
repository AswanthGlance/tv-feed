import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   LEVEL 2 — Source icon.

   A small circular mark for one source the agent actually consulted. The
   favicon is fetched through the app's own /api/favicon proxy (see
   vite.config.ts), so the browser never hotlinks a domain that came out of a
   trace, and no key is involved.

   Failure is expected and handled, not exceptional: plenty of domains have no
   favicon, and the proxy can be unavailable entirely. Either way this falls
   back to a neutral globe glyph — never a broken-image icon, never a
   fabricated brand logo.
   ───────────────────────────────────────────────────────────────────────────── */

/** Maps is a provider, not a website — it gets a pin rather than a favicon
 *  lookup, since there is no single domain that honestly represents it. */
function GlyphMaps() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <path
        d="M12 2.75c-3.5 0-6.25 2.7-6.25 6.1 0 4.3 5.2 11.1 5.42 11.39a1.05 1.05 0 0 0 1.66 0c.22-.29 5.42-7.09 5.42-11.39 0-3.4-2.75-6.1-6.25-6.1Zm0 8.6a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GlyphGlobe() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.6 12h16.8M12 3.6c2.2 2.3 3.3 5.2 3.3 8.4 0 3.2-1.1 6.1-3.3 8.4-2.2-2.3-3.3-5.2-3.3-8.4 0-3.2 1.1-6.1 3.3-8.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function SourceIcon({ domain, kind }: { domain?: string; kind: 'web' | 'maps' }) {
  const [failed, setFailed] = useState(false);
  const showFavicon = kind === 'web' && !!domain && !failed;

  return (
    <span className="att-l2v-source-icon" aria-hidden>
      {showFavicon ? (
        <img
          src={`/api/favicon?domain=${encodeURIComponent(domain!)}&sz=64`}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : kind === 'maps' ? (
        <GlyphMaps />
      ) : (
        <GlyphGlobe />
      )}
    </span>
  );
}
