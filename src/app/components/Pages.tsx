import React, { useState, useEffect } from 'react';
import {
  Plus,
  Target,
  AlertTriangle,
  Utensils,
  Car,
  Home,
  Play,
  HeartPulse,
  GraduationCap,
  X,
  Brain,
  TrendingUp,
  RotateCcw,
  Camera,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, Button, ProgressBar, Badge, Input, cn } from './ui';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { maskCpf } from '@/lib/validation';
import { getSpentByCategory, getBudgetProgress } from '@/lib/transaction-utils';
import {
  getSpendingTypeDistribution,
  getSpendingTypeEvolution,
} from '@/lib/mindful-utils';
import { getCategoryIcon } from '@/lib/category-icons';
import { CATEGORIES } from '@/types/database';
import { toast } from 'sonner';

const BUDGET_ICONS: Record<string, React.ElementType> = {
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Casa: Home,
  Lazer: Play,
  Saúde: HeartPulse,
  Educação: GraduationCap,
};

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Budgets = () => {
  const { user } = useAuth();
  const { budgets, loading, addBudget, deleteBudget } = useBudgets(user?.id);
  const { transactions } = useTransactions(user?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const spentByCategory = getSpentByCategory(transactions);
  const budgetProgress = getBudgetProgress(budgets, spentByCategory);
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const available = totalBudgeted - totalSpent;

  const handleAddBudget = async () => {
    const limit = parseFloat(newLimit?.replace(',', '.') || '0');
    if (limit <= 0) {
      toast.error('Informe um limite válido');
      return;
    }
    const exists = budgets.some((b) => b.category === newCategory);
    if (exists) {
      toast.error('Já existe orçamento para esta categoria');
      return;
    }
    setSaving(true);
    const { error } = await addBudget({ category: newCategory, limit_amount: limit });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Orçamento criado!');
      setShowAdd(false);
      setNewCategory(CATEGORIES[0]);
      setNewLimit('');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Remover este orçamento?')) return;
    const { error } = await deleteBudget(id);
    if (error) toast.error(error.message);
    else toast.success('Orçamento removido');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Orçamentos</h2>
          <p className="text-muted-foreground">
            Mantenha seus gastos sob controle por categoria.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)} disabled={showAdd}>
          <Plus size={20} /> Novo Orçamento
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Categoria</label>
              <select
                className="w-full h-11 px-3 bg-background border border-border rounded-[var(--radius)]"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={CATEGORIES.every((c) => budgets.some((b) => b.category === c))}
              >
                {CATEGORIES.filter((c) => !budgets.some((b) => b.category === c)).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {CATEGORIES.every((c) => budgets.some((b) => b.category === c)) && (
                  <option>Todas as categorias já possuem orçamento</option>
                )}
              </select>
            </div>
            <Input
              label="Limite (R$)"
              placeholder="0,00"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddBudget} loading={saving} disabled={!newLimit}>
              Salvar
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">Total Orçado</p>
          <h3 className="text-3xl font-bold">{formatCurrency(totalBudgeted)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">Total Gasto</p>
          <h3 className="text-3xl font-bold text-destructive">{formatCurrency(totalSpent)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">Disponível</p>
          <h3 className="text-3xl font-bold text-emerald-500">{formatCurrency(available)}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgetProgress.map((budget) => {
          const Icon = BUDGET_ICONS[budget.category] || Target;
          const percent = budget.percent;
          const isCritical = percent >= 80;
          const isOver = percent >= 100;

          return (
            <Card key={budget.id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-primary">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{budget.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      Limite: {formatCurrency(budget.limit)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteBudget(budget.id)}
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">{formatCurrency(budget.spent)}</p>
                <p className="text-xs text-muted-foreground">
                  restam {formatCurrency(budget.limit - budget.spent)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span
                    className={cn(
                      isOver ? 'text-destructive' : isCritical ? 'text-orange-500' : 'text-primary'
                    )}
                  >
                    {percent.toFixed(1)}% utilizado
                  </span>
                  <span className="text-muted-foreground">Meta: 100%</span>
                </div>
                <ProgressBar
                  value={percent}
                  color={isOver ? 'destructive' : isCritical ? 'warning' : 'primary'}
                />
              </div>
              {isCritical && (
                <div
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg text-sm font-medium',
                    isOver
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-orange-500/10 text-orange-500'
                  )}
                >
                  <AlertTriangle size={16} />
                  {isOver
                    ? 'Limite ultrapassado!'
                    : 'Você já usou mais de 80% deste orçamento.'}
                </div>
              )}
            </Card>
          );
        })}
        {budgetProgress.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground col-span-2">
            Nenhum orçamento configurado. Clique em "Novo Orçamento" para começar.
          </Card>
        )}
      </div>
    </div>
  );
};

const getInitials = (name: string | undefined, email: string) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
};

export const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { profile, loading: profileLoading, upsertProfile } = useFinancialProfile(user?.id);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasFinanceChanges, setHasFinanceChanges] = useState(false);
  const [resetting, setResetting] = useState(false);

  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const cpf = user?.user_metadata?.cpf ? maskCpf(user.user_metadata.cpf) : '—';

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '');
  }, [user?.user_metadata?.full_name]);

  useEffect(() => {
    if (profile) {
      setMonthlyIncome(profile.monthly_income ? String(profile.monthly_income) : '');
      setPayDay(String(profile.pay_day || 1));
    } else if (!profileLoading) {
      setMonthlyIncome('');
      setPayDay('1');
    }
  }, [profile, profileLoading]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setHasChanges(e.target.value !== (user?.user_metadata?.full_name || ''));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    const { error } = await updateProfile({ fullName: fullName.trim() });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setHasChanges(false);
      toast.success('Perfil atualizado!');
    }
  };

  const handleDiscard = () => {
    setFullName(user?.user_metadata?.full_name || '');
    setHasChanges(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Envie uma imagem (JPEG, PNG, GIF ou WebP).');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 1 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: profileError } = await updateProfile({ avatarUrl: data.publicUrl });
      if (profileError) throw profileError;
      toast.success('Foto atualizada!');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto. Crie o bucket "avatars" no Supabase.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleFinanceChange = () => {
    const income = parseFloat(monthlyIncome?.replace(',', '.') || '0');
    const day = parseInt(payDay || '1', 10);
    setHasFinanceChanges(
      income !== (profile?.monthly_income ?? 0) || day !== (profile?.pay_day ?? 1)
    );
  };

  useEffect(() => {
    handleFinanceChange();
  }, [monthlyIncome, payDay, profile]);

  const handleSaveFinance = async () => {
    const income = parseFloat(monthlyIncome?.replace(',', '.') || '0');
    const day = Math.min(31, Math.max(1, parseInt(payDay || '1', 10)));
    setSaving(true);
    const { error } = await upsertProfile({ monthly_income: income, pay_day: day });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      setHasFinanceChanges(false);
      toast.success('Situação financeira atualizada!');
    }
  };

  const handleRestoreAccount = async () => {
    if (!user?.id) return;
    setResetting(true);
    const uid = user.id;
    const errors: string[] = [];
    const { error: e1 } = await supabase.from('transactions').delete().eq('user_id', uid);
    if (e1) errors.push(e1.message);
    const { error: e2 } = await supabase.from('budgets').delete().eq('user_id', uid);
    if (e2) errors.push(e2.message);
    const { error: e3 } = await supabase.from('fixed_expenses').delete().eq('user_id', uid);
    if (e3) errors.push(e3.message);
    const { error: e4 } = await supabase.from('financial_profile').delete().eq('id', uid);
    if (e4) errors.push(e4.message);
    setResetting(false);
    if (errors.length > 0) {
      toast.error('Erro ao restaurar: ' + errors.join('; '));
      return;
    }
    toast.success('Conta restaurada! Recarregando...');
    window.location.reload();
  };

  return (
    <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-6">
        <h3 className="text-lg font-bold border-b border-border pb-3">Perfil</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-card ring-2 ring-border shadow-lg">
              <AvatarImage src={avatarUrl} alt="Foto de perfil" />
              <AvatarFallback className="text-2xl font-bold text-primary bg-primary/20">
                {getInitials(user?.user_metadata?.full_name, email)}
              </AvatarFallback>
            </Avatar>
            <label className={cn(
              'absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-md transition-colors',
              uploadingPhoto ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:bg-primary/90'
            )}>
              {uploadingPhoto ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Camera size={18} />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-base font-medium">Personalize seu perfil</p>
            <p className="text-sm text-muted-foreground">
              Clique na câmera para alterar sua foto. Edite o nome abaixo e salve.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <Input
            label="Nome completo"
            value={fullName}
            onChange={handleFullNameChange}
            placeholder="Seu nome completo"
          />
          <Input label="E-mail" value={email} disabled placeholder="—" />
          <Input label="CPF" value={cpf} disabled placeholder="—" />
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-lg font-bold border-b border-border pb-3">Situação financeira</h3>
        <p className="text-sm text-muted-foreground">
          Informe sua renda e o dia que recebe para o cálculo do fluxo de caixa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Renda mensal (R$)"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value.replace(/[^\d,.]/g, ''))}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Dia que recebe</label>
            <select
              className="w-full h-11 px-3 bg-background border border-border rounded-[var(--radius)]"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasFinanceChanges && (
          <Button onClick={handleSaveFinance} loading={saving}>
            Salvar situação financeira
          </Button>
        )}
      </section>

      <section className="space-y-6">
        <h3 className="text-lg font-bold border-b border-border pb-3">Preferências</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="font-semibold">Moeda Principal</p>
              <p className="text-sm text-muted-foreground">
                Defina a moeda padrão para seus relatórios.
              </p>
            </div>
            <select className="bg-muted px-3 py-1.5 rounded-lg text-sm font-medium border border-border">
              <option>BRL (R$)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2">Segurança</h3>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => toast.info('Em breve: alteração de senha via e-mail')}
          >
            <span>Alterar Senha</span>
            <Plus size={16} className="rotate-45" />
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2 text-destructive">Restaurar conta</h3>
        <p className="text-sm text-muted-foreground">
          Remove todos os seus dados do site: transações, orçamentos, contas fixas e perfil financeiro. A conta de acesso permanece.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <RotateCcw size={18} />
              Restaurar conta (apagar dados)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente: transações, orçamentos, contas fixas e perfil financeiro. Sua conta de login continuará existindo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleRestoreAccount}
                disabled={resetting}
              >
                {resetting ? 'Restaurando...' : 'Sim, apagar todos os dados'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {hasChanges && (
        <div className="pt-4 flex gap-4">
          <Button className="px-8" onClick={handleSave} loading={saving}>
            Salvar Alterações
          </Button>
          <Button variant="ghost" onClick={handleDiscard} disabled={saving}>
            Descartar
          </Button>
        </div>
      )}
    </div>
  );
};

const SPENDING_TYPE_LABELS: Record<string, string> = {
  ESSENTIAL: 'Essencial',
  OPTIONAL: 'Opcional',
  EMOTIONAL: 'Emocional',
};
const SPENDING_TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export const Reports = () => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);

  const distribution = getSpendingTypeDistribution(transactions);
  const evolution = getSpendingTypeEvolution(transactions);

  const totalTyped = Object.values(distribution).reduce((a, b) => a + b, 0);
  const hasMindfulData = totalTyped > 0;

  const pieData = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value], i) => ({
      name: SPENDING_TYPE_LABELS[name] || name,
      value,
      color: SPENDING_TYPE_COLORS[i % SPENDING_TYPE_COLORS.length],
    }));

  const formatCurrency = (v: number) =>
    'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-muted-foreground">
          Visão geral e tendências dos seus gastos.
        </p>
      </div>

      {hasMindfulData ? (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Mindful Finance — Distribuição por tipo</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gastos classificados como Essencial, Opcional ou Emocional.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[280px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="space-y-4">
                {Object.entries(distribution)
                  .filter(([, v]) => v > 0)
                  .map(([key], i) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: SPENDING_TYPE_COLORS[i % SPENDING_TYPE_COLORS.length],
                          }}
                        />
                        <span>{SPENDING_TYPE_LABELS[key] || key}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(distribution[key as keyof typeof distribution])}</span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Evolução mensal por tipo</h3>
            </div>
            <div className="h-[300px]">
              {evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    />
                    <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="ESSENTIAL" name="Essencial" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="OPTIONAL" name="Opcional" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="EMOTIONAL" name="Emocional" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Poucos dados para evolução
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Brain size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Mindful Finance</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Ao registrar novas despesas, classifique-as como Essencial, Opcional ou Emocional.
            Os relatórios de comportamento financeiro aparecerão aqui.
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione transações e marque o tipo de gasto para começar.
          </p>
        </Card>
      )}
    </div>
  );
};
