import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Moon,
  Sun,
  User,
  ArrowRight,
  Banknote,
  DollarSign,
  Shield,
  Palette,
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
import { EmptyState } from './patterns';
import { emptyStates, labels } from '@/content/microcopy';
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
import { useTheme } from './ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useForecast } from '@/hooks/useForecast';
import { maskCpf } from '@/lib/validation';
import { getSpentByCategory, getBudgetProgress, getExpenseTotal } from '@/lib/transaction-utils';
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
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const forecast = useForecast(currentMonth, transactions, budgets);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const spentByCategory = getSpentByCategory(transactions);
  const budgetProgress = getBudgetProgress(budgets, spentByCategory);
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const restanteMes = Math.max(0, totalBudgeted - totalSpent);

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
          <p className="text-sm font-medium text-muted-foreground uppercase">{labels.totalOrcado}</p>
          <h3 className="text-3xl font-bold">{formatCurrency(totalBudgeted)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">{labels.totalGasto}</p>
          <h3 className="text-3xl font-bold text-destructive">{formatCurrency(totalSpent)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">{labels.restanteDoMes}</p>
          <h3 className="text-3xl font-bold text-emerald-500">{formatCurrency(restanteMes)}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgetProgress.map((budget) => {
          const Icon = BUDGET_ICONS[budget.category] || Target;
          const percent = budget.percent;
          const isCritical = percent >= 80;
          const isOver = percent >= 100;
          const catForecast = forecast.byCategory.find((c) => c.category === budget.category);
          const daysUntilOverflow = catForecast?.daysUntilOverflow ?? null;
          const suggestedDaily = catForecast?.suggestedDailyLimit ?? 0;

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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{labels.usado}</p>
                  <p className="font-bold text-lg">{formatCurrency(budget.spent)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{labels.restante}</p>
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(Math.max(0, budget.limit - budget.spent))}</p>
                </div>
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
              {daysUntilOverflow !== null && daysUntilOverflow <= (catForecast?.daysRemaining ?? 31) && !isOver && (
                <div className="p-3 rounded-lg text-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <p className="font-medium">No ritmo atual, você estoura em {daysUntilOverflow} dia(s).</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Ação recomendada: reduzir {formatCurrency(suggestedDaily)}/dia para não estourar.
                  </p>
                </div>
              )}
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
          <div className="col-span-2">
            <EmptyState
              icon={<Target size={28} />}
              title={emptyStates.budgets.title}
              description={emptyStates.budgets.description}
              primaryAction={{ label: emptyStates.budgets.primaryCta, onClick: () => setShowAdd(true) }}
            />
          </div>
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

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const cpf = user?.user_metadata?.cpf ? maskCpf(user.user_metadata.cpf) : '—';

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

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-foreground/80 mt-1">Personalize suas informações e foto.</p>
      </div>
      <section className="space-y-6">
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
      {hasChanges && (
        <div className="flex gap-4">
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

export const Settings = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, upsertProfile } = useFinancialProfile(user?.id);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [saving, setSaving] = useState(false);
  const [hasFinanceChanges, setHasFinanceChanges] = useState(false);
  const [resetting, setResetting] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (profile !== undefined && profile !== null && !hasInitialized.current) {
      setMonthlyIncome(profile.monthly_income ? String(profile.monthly_income) : '');
      setPayDay(String(profile.pay_day || 1));
      hasInitialized.current = true;
    } else if (!profileLoading && (profile === null || profile === undefined)) {
      setMonthlyIncome('');
      setPayDay('1');
      hasInitialized.current = false;
    }
  }, [profile, profileLoading]);

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
      toast.success(`Salvo! Renda: ${formatCurrency(income)}`);
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

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const selectClass = cn(
    "w-full h-12 px-4 text-base bg-background text-foreground border border-border rounded-xl",
    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
    "transition-colors hover:border-foreground/30 cursor-pointer"
  );

  const inputClass = "h-12 px-4 text-base rounded-xl";

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-foreground/80 mt-1">Ajustes do site e preferências.</p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Perfil</h3>
            <p className="text-sm text-foreground/80">
              Edite seu nome, foto e dados pessoais.
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/profile')}>
          <User size={18} />
          Editar Meu Perfil
          <ArrowRight size={16} />
        </Button>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Aparência</h3>
            <p className="text-sm text-foreground/80">
              Alterne entre tema claro e escuro.
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </Button>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Situação financeira</h3>
            <p className="text-sm text-foreground/80">
              Informe sua renda e o dia que recebe para o cálculo do fluxo de caixa.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 items-end">
          <div className="space-y-2 flex flex-col items-center sm:items-stretch">
            <label className="text-sm font-medium text-foreground/90 w-full text-center sm:text-left">Renda mensal</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 2750"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value.replace(/[^\d,.]/g, ''))}
              className={inputClass}
            />
          </div>
          <div className="space-y-2 flex flex-col items-center sm:items-stretch">
            <label className="text-sm font-medium text-foreground/90 w-full text-center sm:text-left">Dia que recebe</label>
            <select
              className={cn(selectClass, "text-center sm:text-left")}
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
          <div className="flex justify-center pt-2">
            <Button onClick={handleSaveFinance} loading={saving}>
              Salvar situação financeira
            </Button>
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Preferências</h3>
            <p className="text-sm text-foreground/80">
              Defina a moeda padrão para seus relatórios.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-muted/30 border border-border">
          <span className="font-medium text-foreground text-base">Moeda Principal</span>
          <select className={cn(selectClass, "sm:min-w-[160px]")}>
            <option>BRL (R$)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Segurança</h3>
            <p className="text-sm text-foreground/80">
              Altere sua senha de acesso.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-between h-12 px-4"
          onClick={() => toast.info('Em breve: alteração de senha via e-mail')}
        >
          <span>Alterar Senha</span>
          <ArrowRight size={16} />
        </Button>
      </Card>

      <Card className="space-y-6 border-destructive/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive">Restaurar conta</h3>
            <p className="text-sm text-foreground/80">
              Remove todos os seus dados do site: transações, orçamentos, contas fixas e perfil financeiro. A conta de acesso permanece.
            </p>
          </div>
        </div>
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
      </Card>

    </div>
  );
};

const SPENDING_TYPE_LABELS: Record<string, string> = {
  ESSENTIAL: 'Essencial',
  OPTIONAL: 'Opcional',
  EMOTIONAL: 'Emocional',
};
const SPENDING_TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export const Reports = ({
  onGoToImport,
  onAddTransaction,
  onGuideClick,
}: {
  onGoToImport?: () => void;
  onAddTransaction?: () => void;
  onGuideClick?: () => void;
} = {}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [prevY, prevM] = now.getMonth() === 0 ? [now.getFullYear() - 1, 12] : [now.getFullYear(), now.getMonth()];
  const lastMonthPrefix = `${prevY}-${String(prevM).padStart(2, '0')}`;
  const txThisMonth = transactions.filter((t) => t.amount < 0 && t.date.startsWith(thisMonthPrefix));
  const txLastMonth = transactions.filter((t) => t.amount < 0 && t.date.startsWith(lastMonthPrefix));
  const gastosThisMonth = getExpenseTotal(txThisMonth);
  const gastosLastMonth = getExpenseTotal(txLastMonth);
  const comparacaoPercent =
    gastosLastMonth > 0
      ? Math.round(((gastosThisMonth - gastosLastMonth) / gastosLastMonth) * 100)
      : 0;

  const spentByCategory = getSpentByCategory(transactions);
  const categoriasMaisCaras = Object.entries(spentByCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

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

  const hasExpenses = transactions.filter((t) => t.amount < 0).length > 0;
  if (!hasExpenses) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" data-tour="fluxia-reports-page">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-foreground/80">
            Análise simples dos seus gastos. Comparação mensal, categorias e comportamento.
          </p>
        </div>
        <EmptyState
          icon={<TrendingUp size={28} />}
          title={emptyStates.reports.title}
          description={emptyStates.reports.description}
          primaryAction={onGoToImport ? { label: emptyStates.reports.primaryCta, onClick: onGoToImport } : undefined}
          secondaryAction={onAddTransaction ? { label: emptyStates.reports.secondaryCta, onClick: onAddTransaction } : undefined}
          onGuideClick={onGuideClick}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" data-tour="fluxia-reports-page">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-foreground/80">
          Análise simples dos seus gastos. Comparação mensal, categorias e comportamento.
        </p>
      </div>

      {/* Comparação mensal + Categorias mais caras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Comparação mensal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gastos deste mês vs mês passado.
          </p>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Este mês</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(gastosThisMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mês passado</p>
              <p className="text-xl font-medium text-muted-foreground">{formatCurrency(gastosLastMonth)}</p>
            </div>
            {gastosLastMonth > 0 && (
              <span
                className={cn(
                  'text-sm font-medium',
                  comparacaoPercent > 0 ? 'text-destructive' : comparacaoPercent < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                )}
              >
                {comparacaoPercent > 0 ? '+' : ''}{comparacaoPercent}%
              </span>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Categorias mais caras</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Onde você mais gastou (todo período).
          </p>
          {categoriasMaisCaras.length > 0 ? (
            <ul className="space-y-2">
              {categoriasMaisCaras.map(([cat, value]) => (
                <li key={cat} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{cat}</span>
                  <span className="text-destructive font-semibold">{formatCurrency(value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum gasto registrado.</p>
          )}
        </Card>
      </div>

      {hasMindfulData ? (
        <>
          <Card className="p-6 [&_.recharts-legend-item-text]:fill-[hsl(var(--foreground))]">
            <div className="flex items-center gap-2 mb-6">
              <Brain size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Relatório por comportamento</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4">
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
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="space-y-4">
                {Object.entries(distribution)
                  .filter(([, v]) => v > 0)
                  .map(([key], i) => (
                    <div key={key} className="flex items-center justify-between text-foreground">
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

          <Card className="p-6 [&_.recharts-legend-item-text]:fill-[hsl(var(--foreground))]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Evolução de gastos por tipo</h3>
            </div>
            <div className="h-[300px]">
              {evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="ESSENTIAL" name="Essencial" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="OPTIONAL" name="Opcional" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="EMOTIONAL" name="Emocional" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-foreground/70">
                  Poucos dados para evolução
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Brain size={48} className="mx-auto mb-4 text-foreground/70" />
          <h3 className="font-semibold text-lg mb-2">Relatório por comportamento</h3>
          <p className="text-foreground/85 max-w-md mx-auto mb-4">
            Ao registrar gastos, classifique como Essencial, Opcional ou Emocional.
            A análise por comportamento aparecerá aqui.
          </p>
          <p className="text-sm text-foreground/70">
            Adicione lançamentos e marque o tipo de gasto para começar.
          </p>
        </Card>
      )}
    </div>
  );
};
