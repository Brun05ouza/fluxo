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
} from 'lucide-react';
import { Card, Button, ProgressBar, Badge, Input, cn } from './ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { maskCpf } from '@/lib/validation';
import { getSpentByCategory, getBudgetProgress } from '@/lib/transaction-utils';
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
  const [hasChanges, setHasChanges] = useState(false);
  const [hasFinanceChanges, setHasFinanceChanges] = useState(false);

  const email = user?.email ?? '';
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

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2">Perfil</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-card ring-1 ring-border shadow-sm">
            <span className="text-2xl font-bold text-primary">
              {getInitials(user?.user_metadata?.full_name, email)}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Personalize seu perfil</p>
            <p className="text-xs text-muted-foreground">
              Altere o nome abaixo e salve as alterações.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <section className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2">Situação financeira</h3>
        <p className="text-sm text-muted-foreground">
          Informe sua renda e o dia que recebe para o cálculo do fluxo de caixa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <section className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2">Preferências</h3>
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

export const Reports = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center py-20">
    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
      <Target size={40} />
    </div>
    <h2 className="text-2xl font-bold">Relatórios Detalhados</h2>
    <p className="text-muted-foreground max-w-md mx-auto">
      Esta funcionalidade está sendo preparada para você. Em breve você terá acesso a gráficos
      comparativos e tendências avançadas.
    </p>
  </div>
);
