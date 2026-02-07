import React, { useState } from 'react';
import { ShieldCheck, Zap, PieChart, Chrome, Check, X } from 'lucide-react';
import { Button, Input } from './ui';
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

export const Login = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              'Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente. Ou desative a confirmação de e-mail no painel do Supabase (Authentication → Email).'
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
    ok ? <Check size={14} className="text-primary" /> : <X size={14} className="text-muted-foreground" />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Visual Side */}
      <div className="hidden md:flex flex-1 bg-secondary p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl -ml-32 -mb-32" />

        <div className="z-10">
          <FluxoBrand logoSize="lg" textSize="3xl" variant="light" />
        </div>

        <div className="z-10 space-y-8 max-w-md">
          <h1 className="text-5xl font-bold text-white leading-tight">Controle seus gastos com clareza.</h1>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-primary shrink-0">
                <PieChart size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Visual simples e rápido</h4>
                <p className="text-slate-400 text-sm">Acompanhe seu progresso sem complicações.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Segurança premium</h4>
                <p className="text-slate-400 text-sm">Seus dados financeiros protegidos e privados.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-primary shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Acompanhe seus limites</h4>
                <p className="text-slate-400 text-sm">Receba alertas antes de ultrapassar o orçamento.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="z-10 text-slate-500 text-sm">
          &copy; 2026 Fluxo Tecnologia Financeira.
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden flex justify-center mb-6">
              <FluxoBrand logoSize="lg" textSize="2xl" />
            </div>
            <h2 className="text-3xl font-bold">
              {mode === 'login' && 'Bem-vindo'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login' && 'Entre na sua conta para gerenciar seu fluxo.'}
              {mode === 'signup' && 'Preencha os dados para criar sua conta.'}
              {mode === 'forgot' && 'Informe seu e-mail para receber o link de redefinição.'}
            </p>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full gap-3 h-12 font-medium" type="button" disabled>
              <Chrome size={20} />
              Entrar com Google (em breve)
            </Button>

            {mode !== 'forgot' && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou com e-mail</span></div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <Input
                    label="Nome completo"
                    type="text"
                    placeholder="João da Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    label="CPF"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    required
                  />
                </>
              )}
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {mode !== 'forgot' && (
                <>
                  <Input
                    label="Senha"
                    type="password"
                    placeholder={mode === 'signup' ? 'Mín. 8 caracteres' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Força da senha:</span>
                        <span className={`font-medium ${
                          passwordStrength.score === 0 ? 'text-destructive' :
                          passwordStrength.score <= 2 ? 'text-orange-500' : 'text-primary'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-colors ${
                              i <= passwordStrength.score
                                ? passwordStrength.score <= 2
                                  ? 'bg-orange-500'
                                  : 'bg-primary'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                        <li className="flex items-center gap-2">
                          <CheckIcon ok={passwordStrength.checks.minLength} />
                          Mínimo 8 caracteres
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon ok={passwordStrength.checks.uppercase} />
                          Uma letra maiúscula
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon ok={passwordStrength.checks.lowercase} />
                          Uma letra minúscula
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon ok={passwordStrength.checks.number} />
                          Um número
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckIcon ok={passwordStrength.checks.special} />
                          Um caractere especial (!@#$% etc.)
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => handleModeChange('forgot')}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full h-12" loading={loading}>
                {mode === 'login' && 'Entrar'}
                {mode === 'signup' && 'Criar conta'}
                {mode === 'forgot' && 'Enviar link'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' && (
              <>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline"
                  onClick={() => handleModeChange('signup')}
                >
                  Criar conta grátis
                </button>
              </>
            )}
            {mode !== 'login' && (
              <>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline"
                  onClick={() => handleModeChange('login')}
                >
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
