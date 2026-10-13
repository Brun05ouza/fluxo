import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';
import { notifyDataChange } from './data-sync';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
const dataUrl = import.meta.env.VITE_NEON_DATA_API_URL;
export const neonConfigured = Boolean(authUrl && dataUrl);

// Public URLs only: DATABASE_URL must never enter the browser bundle.
export const neon = createClient({
  auth: { url: authUrl || 'http://localhost:5173/unconfigured-auth', adapter: BetterAuthReactAdapter() },
  dataApi: {
    url: dataUrl || 'http://localhost:5173/unconfigured-data',
    options: { global: { fetch: async (input, init) => {
      if (!neonConfigured) throw new Error('Configure as URLs públicas do Neon no ambiente.');
      const response = await fetch(input, init);
      const method = (init?.method || 'GET').toUpperCase();
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (response.ok && ['POST', 'PATCH', 'DELETE'].includes(method) && !url.pathname.includes('/rpc/')) {
        notifyDataChange(url.pathname.split('/').pop()!);
      }
      return response;
    } } },
  },
});
