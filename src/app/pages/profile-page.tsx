import React, { useState, useEffect } from 'react';
import {
  Camera, Mail, Calendar, ShieldCheck, TrendingUp,
  TrendingDown, ReceiptText, Wallet, Pencil, Check, X,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, Input, cn } from '@/app/components/ui';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { supabase } from '@/lib/supabase';
import { maskCpf } from '@/lib/validation';
import { formatCurrencyBRL } from '@/lib/format-currency';
import { toast } from 'sonner';

function getInitials(name: string | undefined, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function parseBRL(v: string) {
  const digits = v.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) / 100 : 0;
}
function formatBRL(v: string) {
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10) / 100;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { profile, upsertProfile } = useFinancialProfile(user?.id);
  const { transactions } = useTransactions();
  const { budgets } = useBudgets(user?.id);
  const { expenses: fixedExpenses } = useFixedExpenses(user?.id);

  const email    = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const cpf       = user?.user_metadata?.cpf ? maskCpf(user.user_metadata.cpf) : '—';
  const joinedAt  = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—';
  const provider  = (user?.app_metadata?.provider as string | undefined) ?? 'email';

  // ── name editing ──────────────────────────────────────────────────────
  const [fullName, setFullName]     = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving]         = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '');
  }, [user?.user_metadata?.full_name]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setHasChanges(e.target.value !== (user?.user_metadata?.full_name || ''));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    const { error } = await updateProfile({ fullName: fullName.trim() });
    setSaving(false);
    if (error) toast.error(error.message);
    else { setHasChanges(false); toast.success('Perfil atualizado!'); }
  };

  const handleDiscard = () => {
    setFullName(user?.user_metadata?.full_name || '');
    setHasChanges(false);
  };

  // ── photo upload ──────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Envie uma imagem (JPEG, PNG, GIF ou WebP).');
      return;
    }
    if (file.size > 1024 * 1024) { toast.error('A imagem deve ter no máximo 1 MB.'); return; }
    setUploadingPhoto(true);
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: profileError } = await updateProfile({ avatarUrl: data.publicUrl });
      if (profileError) throw profileError;
      toast.success('Foto atualizada!');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // ── financial profile editing ─────────────────────────────────────────
  const [editingFinancial, setEditingFinancial] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [payDayInput, setPayDayInput] = useState('');
  const [savingFinancial, setSavingFinancial] = useState(false);

  useEffect(() => {
    if (profile) {
      setIncomeInput(profile.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setPayDayInput(String(profile.pay_day));
    }
  }, [profile]);

  const handleSaveFinancial = async () => {
    const monthly_income = parseBRL(incomeInput.replace('.', '').replace(',', ''));
    const pay_day        = Math.max(1, Math.min(31, parseInt(payDayInput) || 1));
    setSavingFinancial(true);
    const { error } = await upsertProfile({ monthly_income, pay_day });
    setSavingFinancial(false);
    if (error) toast.error(error.message);
    else { setEditingFinancial(false); toast.success('Perfil financeiro atualizado!'); }
  };

  // ── computed stats ─────────────────────────────────────────────────────
  const txCount         = transactions.length;
  const totalIncome     = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const txExpense       = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const fixedMonthly    = fixedExpenses.filter((e) => e.is_active).reduce((s, e) => s + e.amount, 0);
  const totalExpense    = txExpense + fixedMonthly;
  const budgetCount     = budgets.length;

  // top spending category
  const categoryTotals = transactions
    .filter((t) => t.amount < 0)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-muted-foreground mt-1">Personalize suas informações e acompanhe sua atividade.</p>
      </div>

      {/* ── Avatar + name ──────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group shrink-0">
            <Avatar className="w-24 h-24 border-4 border-card ring-2 ring-border shadow-lg">
              <AvatarImage src={avatarUrl} alt="Foto de perfil" />
              <AvatarFallback className="text-2xl font-bold text-primary bg-primary/20">
                {getInitials(user?.user_metadata?.full_name, email)}
              </AvatarFallback>
            </Avatar>
            <label className={cn(
              'absolute bottom-0 right-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-md transition-colors',
              uploadingPhoto ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:bg-primary/90'
            )}>
              {uploadingPhoto
                ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                : <Camera size={16} />}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
            </label>
          </div>

          <div className="flex-1 space-y-4 min-w-0 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nome completo" value={fullName} onChange={handleFullNameChange} placeholder="Seu nome completo" />
              <Input label="E-mail" value={email} disabled placeholder="—" />
              <Input label="CPF" value={cpf} disabled placeholder="—" />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground/80">Tipo de conta</span>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-muted/30">
                  {profile?.is_admin && <ShieldCheck size={14} className="text-primary" />}
                  <span className="text-sm text-foreground/70 capitalize">
                    {provider === 'google' ? 'Google' : 'E-mail'} · {profile?.is_admin ? 'Admin' : 'Membro'}
                  </span>
                </div>
              </div>
            </div>

            {hasChanges && (
              <div className="flex gap-3">
                <Button className="px-6" onClick={handleSave} loading={saving}>Salvar</Button>
                <Button variant="ghost" onClick={handleDiscard} disabled={saving}>Descartar</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold mb-4">Resumo da atividade</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Transações registradas" value={String(txCount)} sub="no total" icon={ReceiptText} color="#6366f1" />
          <StatCard label="Orçamentos criados"      value={String(budgetCount)} sub="categorias monitoradas" icon={Wallet} color="#0ea5e9" />
          <StatCard label="Total de receitas"        value={formatCurrencyBRL(totalIncome)} sub="soma das entradas" icon={TrendingUp} color="#22c55e" />
          <StatCard label="Total de despesas" value={formatCurrencyBRL(totalExpense)} sub={`transações + ${fixedExpenses.filter(e => e.is_active).length} conta${fixedExpenses.filter(e => e.is_active).length !== 1 ? 's' : ''} fixa${fixedExpenses.filter(e => e.is_active).length !== 1 ? 's' : ''}`} icon={TrendingDown} color="#f87171" />
        </div>
        {topCategory && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingDown size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Categoria com mais gastos</p>
              <p className="text-base font-semibold text-foreground">
                {topCategory[0]} · {formatCurrencyBRL(topCategory[1])}
              </p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        )}
      </section>

      {/* ── Financial profile ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Perfil financeiro</h3>
          {!editingFinancial
            ? <Button variant="ghost" size="sm" onClick={() => setEditingFinancial(true)}>
                <Pencil size={14} className="mr-1.5" /> Editar
              </Button>
            : <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveFinancial} loading={savingFinancial}>
                  <Check size={14} className="mr-1" /> Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingFinancial(false)} disabled={savingFinancial}>
                  <X size={14} />
                </Button>
              </div>
          }
        </div>

        <Card className="p-6">
          {!editingFinancial ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Renda mensal</p>
                <p className="text-2xl font-bold text-foreground">{profile ? formatCurrencyBRL(profile.monthly_income) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Dia de pagamento</p>
                <p className="text-2xl font-bold text-foreground">{profile ? `Dia ${profile.pay_day}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Onboarding</p>
                <p className="text-base font-semibold text-foreground">
                  {profile?.onboarding_completed_at
                    ? `Concluído em ${new Date(profile.onboarding_completed_at).toLocaleDateString('pt-BR')}`
                    : 'Pendente'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Renda mensal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(formatBRL(e.target.value))}
                    placeholder="0,00"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Dia de pagamento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={payDayInput}
                  onChange={(e) => setPayDayInput(e.target.value)}
                  placeholder="1–31"
                />
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── Account info ──────────────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold mb-4">Informações da conta</h3>
        <Card className="divide-y divide-border">
          {[
            { label: 'E-mail', value: email, icon: Mail },
            { label: 'Conta criada em', value: joinedAt, icon: Calendar },
            {
              label: 'Autenticação',
              value: provider === 'google' ? 'Google OAuth' : 'E-mail e senha',
              icon: ShieldCheck,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
          {profile?.is_admin && (
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Permissão</p>
                <p className="text-sm font-semibold text-primary">Administrador</p>
              </div>
            </div>
          )}
        </Card>
      </section>

    </div>
  );
};
