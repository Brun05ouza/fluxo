import React, { createContext, useContext, useEffect, useState } from 'react';
import { neon, neonConfigured } from '@/lib/neon';

export interface AppUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: { full_name: string; cpf: string; avatar_url?: string };
  app_metadata: { provider: string };
}
type Result = { error: Error | null };
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<Result>;
  signInWithGoogle: () => Promise<Result>;
  signUp: (email: string, password: string, metadata?: { fullName: string; cpf: string }) => Promise<Result>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<Result>;
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) => Promise<Result>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
async function authResult(action: () => Promise<{ error?: { message?: string } | null }>): Promise<Result> {
  try {
    if (!neonConfigured) throw new Error('O acesso ainda não foi configurado.');
    const { error } = await action();
    return { error: error ? new Error(error.message || 'Falha na autenticação.') : null };
  } catch (error) { return { error: error instanceof Error ? error : new Error('Falha de conexão.') }; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = neon.auth.useSession();
  const [user, setUser] = useState<AppUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const identity = session.data?.user;
    if (!identity) { setUser(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    setError(null);
    void (async () => {
      try {
        const pendingKey = `fluxo-signup:${identity.email.toLowerCase()}`;
        const cpf = sessionStorage.getItem(pendingKey);
        if (cpf && identity.emailVerified) {
          const result = await neon.from('users').update({ cpf }).eq('id', identity.id);
          if (result.error) throw result.error;
          sessionStorage.removeItem(pendingKey);
        }
        const { data, error: dbError } = await neon.from('users').select('*').eq('id', identity.id).single();
        if (dbError) throw dbError;
        if (active) setUser({
          id: identity.id, email: identity.email,
          created_at: data.created_at,
          user_metadata: { full_name: data.nome || identity.name, cpf: data.cpf, avatar_url: data.avatar_url || identity.image || undefined },
          app_metadata: { provider: 'email' },
        });
      } catch (e) { if (active) { setUser(null); setError(e instanceof Error ? e.message : 'Não foi possível carregar seu perfil.'); } }
      finally { if (active) setProfileLoading(false); }
    })();
    return () => { active = false; };
  }, [session.data?.user]);

  const signIn = (email: string, password: string) => authResult(() => neon.auth.signIn.email({ email, password }));
  const signInWithGoogle = () => authResult(() => neon.auth.signIn.social({ provider: 'google', callbackURL: `${window.location.origin}/` }));
  const signUp = async (email: string, password: string, metadata?: { fullName: string; cpf: string }) => {
    const pendingKey = `fluxo-signup:${email.toLowerCase()}`;
    if (metadata?.cpf) sessionStorage.setItem(pendingKey, metadata.cpf);
    const result = await authResult(() => neon.auth.signUp.email({ email, password, name: metadata?.fullName || email }));
    if (result.error) sessionStorage.removeItem(pendingKey);
    return result;
  };
  const signOut = async () => {
    const result = await authResult(() => neon.auth.signOut());
    if (result.error) throw result.error;
    setUser(null);
  };
  const resetPassword = (email: string) => authResult(() => neon.auth.emailOtp.sendVerificationOtp({ email, type: 'forget-password' }));
  const updateProfile = async (data: { fullName?: string; avatarUrl?: string }): Promise<Result> => {
    if (!user) return { error: new Error('Não autenticado') };
    if (data.fullName !== undefined) {
      const result = await authResult(() => neon.auth.updateUser({ name: data.fullName }));
      if (result.error) return result;
    }
    if (data.avatarUrl !== undefined) {
      const { error } = await neon.from('users').update({ avatar_url: data.avatarUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) return { error: new Error(error.message) };
    }
    setUser(previous => previous ? { ...previous, user_metadata: { ...previous.user_metadata,
      ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
      ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
    } } : null);
    return { error: null };
  };
  return <AuthContext.Provider value={{ user, loading: neonConfigured && (session.isPending || profileLoading || (!!session.data?.user && !user && !error)), error: error || session.error?.message || (!neonConfigured ? 'O acesso ainda não foi configurado.' : null), signIn, signInWithGoogle, signUp, signOut, resetPassword, updateProfile }}>{children}</AuthContext.Provider>;
};
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
