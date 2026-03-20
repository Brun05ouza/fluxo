/**
 * Fallback quando não há `.env` com VITE_SUPABASE_*.
 * Para Supabase local (`supabase start`), crie `.env` na raiz com URL e anon key
 * de `supabase status` — não use este fallback.
 * Se o host *.supabase.co der ERR_NAME_NOT_RESOLVED, o projeto na nuvem pode ter
 * sido removido/pausado ou a URL está errada; use o Dashboard → Settings → API.
 */
export const projectId = "uxufbhvnxncescncsjmf";
export const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4dWZiaHZueG5jZXNjbmNzam1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc3MzIsImV4cCI6MjA4NjA3MzczMn0.elY4L30MgDxlWRuNFQOMCgTXsmlFRoSU_UhUklC3VpU";
