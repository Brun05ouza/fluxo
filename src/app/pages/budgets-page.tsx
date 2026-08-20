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
  Pencil,
  Check,
  Trash2,
} from 'lucide-react';
import { Card, Button, ProgressBar, Input, cn } from '@/app/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
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
import { formatCurrencyBRL, maskBRLInput, parseBRLInput } from '@/lib/format-currency';

const BUDGET_ICONS: Record<string, React.ElementType> = {
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Casa: Home,
  Lazer: Play,
  Saúde: HeartPulse,
  Educação: GraduationCap,
};

type DeleteTarget = {
  id: string;
  category: string;
  limit: number;
  spent: number;
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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openAddModal = () => {
    setNewCategory(CATEGORIES.find((c) => !budgets.some((b) => b.category === c)) ?? CATEGORIES[0]);
    setNewLimit('');
    setShowAdd(true);
  };

  React.useEffect(() => {
    const openForm = () => openAddModal();
    window.addEventListener('fluxia-tour-open-budget-form', openForm);
    return () => window.removeEventListener('fluxia-tour-open-budget-form', openForm);
  }, [budgets]);

  const allCategoriesBudgeted = CATEGORIES.every((c) => budgets.some((b) => b.category === c));

  const spentByCategory = getSpentByCategory(transactions);
  const budgetProgress = getBudgetProgress(budgets, spentByCategory);
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const restanteMes = Math.max(0, totalBudgeted - totalSpent);

  const resetAddForm = () => {
    setShowAdd(false);
    setNewCategory(CATEGORIES.find((c) => !budgets.some((b) => b.category === c)) ?? CATEGORIES[0]);
    setNewLimit('');
  };

  const handleAddBudget = async () => {
    const limit = parseBRLInput(newLimit);
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
      resetAddForm();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    const { error } = await deleteBudget(target.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error(error.message);
    else toast.success(`Orçamento de “${target.category}” removido`);
  };

  const handleEditStart = (id: string, currentLimit: number) => {
    setEditId(id);
    setEditLimit(
      currentLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const limit = parseBRLInput(editLimit);
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
        <Button
          className="gap-2"
          onClick={openAddModal}
          disabled={allCategoriesBudgeted}
          title={
            allCategoriesBudgeted
              ? 'Todas as categorias já possuem orçamento'
              : 'Criar novo orçamento'
          }
          data-tour="fluxia-budgets-new"
        >
          <Plus size={20} /> Novo Orçamento
        </Button>
      </div>

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          if (!open) resetAddForm();
          else openAddModal();
        }}
      >
        <DialogContent
          className="sm:max-w-md border-border bg-card"
          data-tour="fluxia-budgets-form"
        >
          <DialogHeader>
            <DialogTitle>Novo orçamento</DialogTitle>
            <DialogDescription>
              Defina um limite mensal por categoria. O Fluxo avisa quando você se aproxima do teto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground" id="budget-category-label">
                Categoria
              </label>
              {allCategoriesBudgeted ? (
                <div className="flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                  Todas as categorias já possuem orçamento
                </div>
              ) : (
                <Select
                  value={newCategory}
                  onValueChange={setNewCategory}
                >
                  <SelectTrigger
                    id="budget-category"
                    aria-labelledby="budget-category-label"
                    className="h-11 w-full rounded-xl border-border bg-background px-3 text-sm shadow-none focus-visible:ring-primary/30"
                  >
                    <SelectValue placeholder="Escolha a categoria">
                      {(() => {
                        const Icon = BUDGET_ICONS[newCategory] || Target;
                        return (
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon size={15} />
                            </span>
                            <span className="truncate font-medium">{newCategory}</span>
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[130] rounded-xl border-border p-1">
                    {CATEGORIES.filter((c) => !budgets.some((b) => b.category === c)).map((c) => {
                      const Icon = BUDGET_ICONS[c] || Target;
                      return (
                        <SelectItem
                          key={c}
                          value={c}
                          className="rounded-lg py-2.5 pl-2 pr-8 cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Icon size={15} />
                            </span>
                            <span className="font-medium">{c}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="budget-limit">
                Limite mensal
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  R$
                </span>
                <input
                  id="budget-limit"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={newLimit}
                  onChange={(e) => setNewLimit(maskBRLInput(e.target.value))}
                  autoFocus
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-11 pr-3 py-2 text-sm tabular-nums outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
              {newLimit && parseBRLInput(newLimit) <= 0 && (
                <p className="text-xs text-destructive">Informe um valor maior que zero.</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={resetAddForm} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddBudget}
              loading={saving}
              disabled={!newLimit || parseBRLInput(newLimit) <= 0 || allCategoriesBudgeted}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                          inputMode="numeric"
                          className="w-28 h-7 px-2 text-sm border border-border rounded-md bg-background tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={editLimit}
                          onChange={(e) => setEditLimit(maskBRLInput(e.target.value))}
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
                    aria-label={`Remover orçamento de ${budget.category}`}
                    onClick={() =>
                      setDeleteTarget({
                        id: budget.id,
                        category: budget.category,
                        limit: budget.limit,
                        spent: budget.spent,
                      })
                    }
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-border bg-card sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto sm:mx-0 mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 size={22} />
            </div>
            <AlertDialogTitle>Remover orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O limite desta categoria deixa de aparecer no acompanhamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-left">
              <p className="font-medium text-foreground">{deleteTarget.category}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Usado {formatCurrencyBRL(deleteTarget.spent)} de {formatCurrencyBRL(deleteTarget.limit)}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                Limite: {formatCurrencyBRL(deleteTarget.limit)}
              </p>
            </div>
          )}
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
