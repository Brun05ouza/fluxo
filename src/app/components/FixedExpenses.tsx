import React, { useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { Card, Button, Input, cn } from './ui';
import { useAuth } from '@/contexts/AuthContext';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { CATEGORIES } from '@/types/database';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const FixedExpenses = () => {
  const { user } = useAuth();
  const { expenses, loading, addExpense, deleteExpense } = useFixedExpenses(user?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta obrigação?')) return;
    const { error } = await deleteExpense(id);
    if (error) toast.error(error.message);
    else toast.success('Removido');
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
            <span className="text-2xl font-bold text-destructive">{formatCurrency(totalMonthly)}</span>
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
                    <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(exp.id)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma obrigação cadastrada. Adicione suas contas fixas.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
