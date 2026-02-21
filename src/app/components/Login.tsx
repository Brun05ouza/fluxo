import React, { useState } from 'react';
import { ShieldCheck, Zap, BarChart3, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { Button } from './ui';
import { FluxoBrand } from './FluxoBrand';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  validatePasswordStrength,
  validateCpf,
  validateFullName,
  maskCpf,
  unmaskCpf,
} from '@/lib/validation';

type AuthMode = 'login' | 'signup' | 'forgot';

const loginColors = {
  backgroundDark: '#0A0A0C',
  surfaceDark: '#161618',
  borderDark: '#333333',
  muted: '#888888',
  primary: '#00FF94',
};

export const Login = () => {
  const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: err } = await signInWithGoogle();
      if (err) {
        setError(err.message);
        toast.error(err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const passwordStrength = validatePasswordStrength(password);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          return;
        }
        toast.success('Bem-vindo de volta!');
      } else if (mode === 'signup') {
        if (!validateFullName(fullName.trim())) {
          setError('Informe o nome completo (mínimo 2 palavras, sem números).');
          return;
        }
        if (!validateCpf(cpf)) {
          setError('CPF inválido.');
          return;
        }
        if (!passwordStrength.valid) {
          setError('A senha não atende aos requisitos mínimos de segurança.');
          return;
        }
        const { error } = await signUp(email, password, {
          fullName: fullName.trim(),
          cpf: unmaskCpf(cpf),
        });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('rate limit') || msg.includes('429')) {
            setError(
              'Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.'
            );
          } else {
            setError(error.message);
          }
          return;
        }
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
        setMode('login');
        setFullName('');
        setCpf('');
      } else {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
          return;
        }
        toast.success('E-mail de redefinição enviado!');
        setMode('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'signup') {
      setFullName('');
      setCpf('');
      setPassword('');
    }
  };

  const CheckIcon = ({ ok }: { ok: boolean }) =>
    ok ? (
      <span className="text-[#00FF94]" style={{ fontSize: 14 }}>✓</span>
    ) : (
      <span className="text-[#888]" style={{ fontSize: 14 }}>✕</span>
    );

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row text-white antialiased overflow-x-hidden"
      style={{ background: loginColors.backgroundDark }}
    >
      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Left: Brand & Value Props */}
      <div className="relative flex flex-col justify-between p-8 lg:p-16 lg:w-1/2 z-10">
        <div className="flex flex-col gap-2">
          <FluxoBrand logoSize="lg" textSize="3xl" className="[&_.fluxo-brand-text]:text-white [&_.fluxo-brand-text-light]:text-white" />
          <p className="text-lg font-medium tracking-wide max-w-md mt-2" style={{ color: loginColors.muted }}>
            Controle seus gastos com clareza.
          </p>
        </div>

        <div className="hidden lg:flex flex-col gap-10 mt-auto mb-auto">
          <div className="flex items-start gap-5 group">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,255,148,0.2)] group-hover:border-[#00FF9480]"
              style={{ background: loginColors.surfaceDark, borderColor: loginColors.borderDark }}
            >
              <BarChart3 size={24} style={{ color: loginColors.primary }} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold group-hover:transition-colors" style={{ color: loginColors.primary }}>Visual simples e rápido</h2>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: loginColors.muted }}>
                Transforme dados brutos em insights instantâneos sem distrações.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-5 group">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,255,148,0.2)] group-hover:border-[#00FF9480]"
              style={{ background: loginColors.surfaceDark, borderColor: loginColors.borderDark }}
            >
              <ShieldCheck size={24} style={{ color: loginColors.primary }} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold group-hover:transition-colors" style={{ color: loginColors.primary }}>Segurança premium</h2>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: loginColors.muted }}>
                Criptografia de ponta a ponta para proteger seus ativos mais valiosos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-5 group">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,255,148,0.2)] group-hover:border-[#00FF9480]"
              style={{ background: loginColors.surfaceDark, borderColor: loginColors.borderDark }}
            >
              <Zap size={24} style={{ color: loginColors.primary }} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold group-hover:transition-colors" style={{ color: loginColors.primary }}>Acompanhe seus limites</h2>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: loginColors.muted }}>
                Defina tetos de gastos com ferramentas de arrastar e soltar.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block text-xs opacity-50" style={{ color: loginColors.muted }}>
          © {new Date().getFullYear()} FLUXO FINANCE. SISTEMAS OTIMIZADOS.
        </div>
      </div>

      {/* Right: Auth Card */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-4 lg:p-0 z-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse opacity-20" style={{ background: loginColors.primary }} />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-[80px] opacity-10 bg-emerald-900" />
        </div>

        <div className="w-full max-w-[480px] p-8 md:p-10 rounded-xl shadow-2xl flex flex-col gap-8 relative overflow-hidden"
          style={{
            background: 'rgba(22, 22, 24, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF9480] to-transparent" />

          <div className="md:hidden flex justify-center pb-4">
            <FluxoBrand logoSize="md" textSize="2xl" className="[&_.fluxo-brand-text]:text-white" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {mode === 'login' && 'Bem-vindo'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h2>
            <p className="text-sm" style={{ color: loginColors.muted }}>
              {mode === 'login' && 'Entre na sua conta para acessar o terminal.'}
              {mode === 'signup' && 'Preencha os dados para criar sua conta.'}
              {mode === 'forgot' && 'Informe seu e-mail para receber o link de redefinição.'}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full gap-3 h-14 rounded-lg font-medium border transition-all duration-200 hover:border-gray-600 hover:bg-white/5"
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            style={{
              background: loginColors.surfaceDark,
              borderColor: loginColors.borderDark,
              color: 'white',
            }}
          >
            <Chrome size={20} className="shrink-0" />
            {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
          </Button>

          {mode !== 'forgot' && (
            <div className="relative flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1" style={{ background: loginColors.borderDark }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: loginColors.muted }}>ou entre com email</span>
              <div className="h-[1px] flex-1" style={{ background: loginColors.borderDark }} />
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider transition-colors" style={{ color: loginColors.muted }} htmlFor="fullName">Nome completo</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-14 rounded-lg px-4 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 font-mono text-sm border focus:ring-1 focus:ring-[#00FF94] focus:border-[#00FF94]"
                    style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider transition-colors" style={{ color: loginColors.muted }} htmlFor="cpf">CPF</label>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="w-full h-14 rounded-lg px-4 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 font-mono text-sm border focus:ring-1 focus:ring-[#00FF94] focus:border-[#00FF94]"
                    style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
                    required
                  />
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider transition-colors" style={{ color: loginColors.muted }} htmlFor="email">E-mail</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="user@fluxo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-lg pl-4 pr-12 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 font-mono text-sm border focus:ring-1 focus:ring-[#00FF94] focus:border-[#00FF94]"
                  style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
                  required
                />
                <Mail size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: loginColors.muted }} />
              </div>
            </div>
            {mode !== 'forgot' && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider transition-colors" style={{ color: loginColors.muted }} htmlFor="password">Senha</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-[11px] hover:text-white transition-colors"
                        style={{ color: loginColors.muted }}
                        onClick={() => handleModeChange('forgot')}
                      >
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      placeholder={mode === 'signup' ? 'Mín. 8 caracteres' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 rounded-lg pl-4 pr-12 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 font-mono text-sm border focus:ring-1 focus:ring-[#00FF94] focus:border-[#00FF94]"
                      style={{ background: loginColors.backgroundDark, borderColor: loginColors.borderDark }}
                      required
                    />
                    <Lock size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: loginColors.muted }} />
                  </div>
                </div>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: loginColors.muted }}>Força da senha:</span>
                      <span className="font-medium" style={{
                        color: passwordStrength.score === 0 ? 'var(--destructive)' : passwordStrength.score <= 2 ? '#f59e0b' : loginColors.primary,
                      }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full transition-colors"
                          style={{
                            background: i <= passwordStrength.score
                              ? passwordStrength.score <= 2 ? '#f59e0b' : loginColors.primary
                              : loginColors.borderDark,
                          }}
                        />
                      ))}
                    </div>
                    <ul className="text-xs space-y-1 mt-2" style={{ color: loginColors.muted }}>
                      <li className="flex items-center gap-2"><CheckIcon ok={passwordStrength.checks.minLength} /> Mínimo 8 caracteres</li>
                      <li className="flex items-center gap-2"><CheckIcon ok={passwordStrength.checks.uppercase} /> Uma letra maiúscula</li>
                      <li className="flex items-center gap-2"><CheckIcon ok={passwordStrength.checks.lowercase} /> Uma letra minúscula</li>
                      <li className="flex items-center gap-2"><CheckIcon ok={passwordStrength.checks.number} /> Um número</li>
                      <li className="flex items-center gap-2"><CheckIcon ok={passwordStrength.checks.special} /> Um caractere especial</li>
                    </ul>
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full h-14 font-bold text-lg uppercase tracking-wide rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 hover:shadow-[0_0_15px_rgba(0,255,148,0.2)] hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: loginColors.primary, color: '#000' }}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: loginColors.muted }}>
            {mode === 'login' && (
              <>
                Não tem uma conta?{' '}
                <button type="button" className="text-white font-medium hover:underline underline-offset-4 decoration-2 hover:text-[#00FF94] transition-colors" onClick={() => handleModeChange('signup')}>
                  Criar conta grátis
                </button>
              </>
            )}
            {mode !== 'login' && (
              <>
                Já tem uma conta?{' '}
                <button type="button" className="font-medium hover:underline underline-offset-4 decoration-2" style={{ color: loginColors.primary }} onClick={() => handleModeChange('login')}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
