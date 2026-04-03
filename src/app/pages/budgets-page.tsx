import React, { useState } from 'react';
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
  Pencil,
  Check,
} from 'lucide-react';
import { Card, Button, ProgressBar, Input, cn } from '@/app/components/ui';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { EmptyState } from '@/app/components/patterns';
import { emptyStates, labels } from '@/content/microcopy';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useForecast } from '@/hooks/useForecast';
import { getSpentByCategory, getBudgetProgress } from '@/lib/transaction-utils';
import { CATEGORIES } from '@/types/database';
import { toast } from 'sonner';
import { formatCurrencyBRL } from '@/lib/format-currency';

const BUDGET_ICONS: Record<string, React.ElementType> = {
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Casa: Home,
  Lazer: Play,
  Saúde: HeartPulse,
  Educação: GraduationCap,
};

export const Budgets = () => {
  const { user } = useAuth();
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudgets(user?.id);
  const { transactions } = useTransactions();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const forecast = useForecast(currentMonth, transactions, budgets);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await deleteBudget(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast.error(error.message);
    else toast.success('Orçamento removido');
  };

  const handleEditStart = (id: string, currentLimit: number) => {
    setEditId(id);
    setEditLimit(currentLimit.toFixed(2).replace('.', ','));
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const limit = parseFloat(editLimit.replace(',', '.') || '0');
    if (limit <= 0) {
      toast.error('Informe um limite válido');
      return;
    }
    setEditSaving(true);
    const { error } = await updateBudget(editId, { limit_amount: limit });
    setEditSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Limite atualizado!');
      setEditId(null);
      setEditLimit('');
    }
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
          <h3 className="text-3xl font-bold">{formatCurrencyBRL(totalBudgeted)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">{labels.totalGasto}</p>
          <h3 className="text-3xl font-bold text-destructive">{formatCurrencyBRL(totalSpent)}</h3>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase">{labels.restanteDoMes}</p>
          <h3 className="text-3xl font-bold text-emerald-500">{formatCurrencyBRL(restanteMes)}</h3>
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
                    {editId === budget.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-28 h-7 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value.replace(/[^\d,.]/g, ''))}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') setEditId(null);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10" onClick={handleEditSave} disabled={editSaving}>
                          <Check size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditId(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Limite: {formatCurrencyBRL(budget.limit)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditStart(budget.id, budget.limit)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(budget.id)}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{labels.usado}</p>
                  <p className="font-bold text-lg">{formatCurrencyBRL(budget.spent)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">{labels.restante}</p>
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(Math.max(0, budget.limit - budget.spent))}</p>
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
                    Ação recomendada: reduzir {formatCurrencyBRL(suggestedDaily)}/dia para não estourar.
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

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm} loading={deleting} disabled={deleting}>
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
