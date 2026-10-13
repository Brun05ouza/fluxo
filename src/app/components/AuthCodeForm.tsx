import { useState } from 'react';
import { neon } from '@/lib/neon';
import { FluxoBrand } from './FluxoBrand';
import { validatePasswordStrength } from '@/lib/validation';
import { mapAuthError } from '@/lib/authErrors';

export function AuthCodeForm({ email, purpose, onBack }: { email: string; purpose: 'verify' | 'reset'; onBack: () => void }) {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const run = async (resend: boolean) => {
    setBusy(true); setError(''); setMessage('');
    try {
      if (!resend && purpose === 'reset') {
        if (!validatePasswordStrength(password).valid) throw new Error('Use 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.');
        if (password !== confirm) throw new Error('As senhas não coincidem.');
      }
      const result = resend
        ? await neon.auth.emailOtp.sendVerificationOtp({ email, type: purpose === 'reset' ? 'forget-password' : 'email-verification' })
        : purpose === 'verify'
          ? await neon.auth.emailOtp.verifyEmail({ email, otp })
          : await neon.auth.emailOtp.resetPassword({ email, otp, password });
      if (result.error) throw new Error(result.error.message);
      if (resend) setMessage('Novo código solicitado. Confira seu e-mail.');
      else { setDone(true); setPassword(''); setConfirm(''); setMessage(purpose === 'verify' ? 'E-mail confirmado. Você já pode entrar.' : 'Senha atualizada. Entre com sua nova senha.'); }
    } catch (e) { setError(mapAuthError(e)); }
    finally { setBusy(false); }
  };
  const inputClass = 'h-12 w-full rounded-lg border border-border bg-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  return <main className="min-h-screen flex items-center justify-center p-5 bg-background text-foreground">
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 space-y-6">
      <FluxoBrand />
      <div><h1 className="text-2xl font-bold">{purpose === 'verify' ? 'Confirme seu e-mail' : 'Defina sua nova senha'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use o código enviado para <strong>{email}</strong>.</p></div>
      {!done && <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(false); }}>
        <label className="block space-y-2"><span>Código do e-mail</span><input aria-label="Código do e-mail" className={inputClass} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required /></label>
        {purpose === 'reset' && <>
          <label className="block space-y-2"><span>Nova senha</span><input className={inputClass} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} /></label>
          <p className="text-xs text-muted-foreground">8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.</p>
          <label className="block space-y-2"><span>Confirme a nova senha</span><input className={inputClass} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required /></label>
        </>}
        <button disabled={busy} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">{busy ? 'Aguarde…' : purpose === 'verify' ? 'Confirmar e-mail' : 'Salvar nova senha'}</button>
      </form>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
      <div className="flex justify-between text-sm">
        <button disabled={busy} onClick={onBack} className="underline underline-offset-4">Voltar para entrar</button>
        {!done && <button disabled={busy} onClick={()=>void run(true)} className="underline underline-offset-4">Reenviar código</button>}
      </div>
    </section>
  </main>;
}
