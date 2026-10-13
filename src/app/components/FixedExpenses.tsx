import { MonthlyPlan } from './MonthlyPlan';
import React, { useState } from 'react';
import { Plus, X, Calendar, FileText, Trash2 } from 'lucide-react';
import { Card, Button, Input } from './ui';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { EmptyState, InlineHint } from './patterns';
import { emptyStates } from '@/content/microcopy';
import { useAuth } from '@/contexts/AuthContext';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { CATEGORIES, type FixedExpense } from '@/types/database';
import { toast } from 'sonner';
import { formatCurrencyBRL } from '@/lib/format-currency';

export const FixedExpenses = () => {
  const { user } = useAuth();
  const { expenses, loading, addExpense, deleteExpense } = useFixedExpenses(user?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FixedExpense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeExpenses = expenses.filter((e) => e.is_active);
  const totalMonthly = activeExpenses.reduce((s, e) => s + e.amount, 0);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDay('10');
    setCategory(CATEGORIES[0]);
    setShowAdd(false);
  };

  const handleAdd = async () => {
    const numAmount = parseFloat(amount?.replace(',', '.') || '0');
    if (numAmount <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe o nome da conta');
      return;
    }
    const day = Math.min(31, Math.max(1, parseInt(dueDay || '1', 10)));
    setSaving(true);
    const { error } = await addExpense({
      title: title.trim(),
      amount: numAmount,
      due_day: day,
      category,
      is_active: true,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Conta fixa adicionada!');
      resetForm();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    const { error } = await deleteExpense(target.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error(error.message);
    else toast.success(`“${target.title}” removida`);
  };

  const sortedByDueDay = [...activeExpenses].sort((a, b) => a.due_day - b.due_day);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <MonthlyPlan month={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`} />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contas fixas</h2>
          <p className="text-muted-foreground">
            Obrigações mensais: aluguel, luz, internet, assinaturas, etc.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)} disabled={showAdd}>
          <Plus size={20} /> Nova obrigação
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold">Adicionar obrigação</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome"
              placeholder="Ex: Aluguel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Valor (R$)"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ''))}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Dia do vencimento</label>
              <select
                className="w-full h-11 px-3 bg-background border border-border rounded-[var(--radius)]"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Categoria</label>
              <select
                className="w-full h-11 px-3 bg-background border border-border rounded-[var(--radius)]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleAdd} loading={saving} disabled={!title || !amount}>
              Salvar
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Total mensal</h3>
            <span className="text-2xl font-bold text-destructive">{formatCurrencyBRL(totalMonthly)}</span>
          </div>
          {sortedByDueDay.length > 0 ? (
            <div className="space-y-3">
              {sortedByDueDay.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence dia {exp.due_day} • {exp.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatCurrencyBRL(exp.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      aria-label={`Remover ${exp.title}`}
                      onClick={() => setDeleteTarget(exp)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={28} />}
              title={emptyStates.fixedExpenses.title}
              description={emptyStates.fixedExpenses.description}
              primaryAction={{ label: emptyStates.fixedExpenses.primaryCta, onClick: () => setShowAdd(true) }}
            />
          )}
        </Card>
      </div>
      {activeExpenses.length > 0 && (
        <InlineHint>{emptyStates.fixedExpenses.hint}</InlineHint>
      )}

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
            <AlertDialogTitle>Remover obrigação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta fixa sai da lista e deixa de entrar no total mensal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-left">
              <p className="font-medium text-foreground">{deleteTarget.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Vence dia {deleteTarget.due_day} • {deleteTarget.category}
              </p>
              <p className="mt-2 text-base font-semibold text-destructive">
                {formatCurrencyBRL(deleteTarget.amount)}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={deleting}
              disabled={deleting}
            >
              Remover
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
