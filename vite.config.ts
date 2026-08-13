import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const phoenixBase = env.VITE_PHOENIX_BASE_URL;
  // Deliberately NOT prefixed with VITE_ — that would bundle it into client
  // JS. It only ever exists here, server-side, and is injected into the
  // proxied request header below. The browser never sees it.
  const googlePlacesKey = env.GOOGLE_PLACES_API_KEY;
  // Same "never bundled into client JS" principle as googlePlacesKey above.
  // Used only as a relevant-stock-photo fallback (see
  // src/api/pexelsClient.ts) when neither Google Places nor the harness's
  // own photo_url resolve to a real image — never claims to be the real
  // place's photo.
  const pexelsKey = env.PEXELS_API_KEY;

  const proxy: Record<string, import('vite').ProxyOptions> = {};

  if (phoenixBase) {
    proxy['/api/phoenix'] = {
      target: phoenixBase,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api\/phoenix/, ''),
    };
  }

  // Always registered (even without a key) so the client gets a clean
  // 401/error response to handle gracefully, instead of a dev-server 404
  // that looks like a routing bug.
  proxy['/api/places'] = {
    target: 'https://places.googleapis.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/places/, ''),
    configure: (proxyServer) => {
      proxyServer.on('proxyReq', (proxyReq) => {
        // Strip anything a client might try to pass and always inject the
        // real key server-side, so a stray client-set header can never be
        // used to smuggle a different key through the proxy.
        proxyReq.removeHeader('X-Goog-Api-Key');
        if (googlePlacesKey) {
          proxyReq.setHeader('X-Goog-Api-Key', googlePlacesKey);
        }
      });
    },
  };

  // Favicons for the Level 2 source strip. Proxied rather than hotlinked
  // straight from the browser: it keeps the requests same-origin, needs no key
  // of any kind, and means a source domain the trace mentions is never fetched
  // directly by the client. Google's favicon endpoint is public and
  // unauthenticated; a failure just falls back to a generic globe glyph in the
  // UI (see SourceIcon), so this can never break the demo.
  proxy['/api/favicon'] = {
    target: 'https://www.google.com',
    changeOrigin: true,
    secure: true,
    // The endpoint 301s to gstatic. Following it here keeps the whole thing
    // same-origin from the browser's point of view — without this the client
    // would end up fetching the image cross-origin after all, which is the
    // hotlinking this proxy exists to avoid.
    followRedirects: true,
    rewrite: (path) => path.replace(/^\/api\/favicon/, '/s2/favicons'),
  };

  // Same always-registered-even-without-a-key pattern as /api/places.
  proxy['/api/pexels'] = {
    target: 'https://api.pexels.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/pexels/, ''),
    configure: (proxyServer) => {
      proxyServer.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('Authorization');
        if (pexelsKey) {
          proxyReq.setHeader('Authorization', pexelsKey);
        }
      });
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5175,
      proxy,
    },
    test: {
      environment: 'node',
      globals: true,
    },
  };
})
