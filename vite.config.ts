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
