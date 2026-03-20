import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '@/config/supabase';

/** Prioridade: variáveis em `.env` (Vite). Sem `.env`, usa fallback de `src/config/supabase.ts`. */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

if (import.meta.env.DEV) {
  const usingEnvUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const usingEnvKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (!usingEnvUrl || !usingEnvKey) {
    console.info(
      '[Fluxo] Supabase: %s',
      !usingEnvUrl && !usingEnvKey
        ? 'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (local: supabase status). Sem isso, usa o fallback em src/config/supabase.ts.'
        : !usingEnvUrl
          ? 'VITE_SUPABASE_URL ausente — usando URL de src/config/supabase.ts.'
          : 'VITE_SUPABASE_ANON_KEY ausente — usando chave de src/config/supabase.ts.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
