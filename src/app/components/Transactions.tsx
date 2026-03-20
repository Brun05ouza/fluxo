import React, { useMemo, useState } from 'react';
import { Search, MoreHorizontal, Trash2, Pencil, Inbox, Copy, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Card, Button, Badge, cn } from './ui';
import { EmptyState } from './patterns';
import { emptyStates, labels } from '@/content/microcopy';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { TransactionDrawer } from './TransactionDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryIcon } from '@/lib/category-icons';
import { getIncomeTotal, getExpenseTotal } from '@/lib/transaction-utils';
import { CATEGORIES } from '@/types/database';
import type { Transaction } from '@/types/database';
import { toast } from 'sonner';
import { formatCurrencyBRL } from '@/lib/format-currency';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

type FilterType = 'all' | 'expense' | 'income';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function groupTransactionsByDay(list: Transaction[]): { label: string; items: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  for (const t of list) {
    const d = t.date;
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  return sortedDates.map((date) => {
    let label: string;
    if (date === today) label = 'Hoje';
    else if (date === yesterday) label = 'Ontem';
    else
      label = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    return { label, items: groups[date]! };
  });
}

interface TransactionsProps {
  onAddTransaction?: () => void;
  onGoToImport?: () => void;
  onGuideClick?: () => void;
}

export const Transactions = ({ onAddTransaction, onGoToImport, onGuideClick }: TransactionsProps) => {
  const { user } = useAuth();
  const { transactions, loading, deleteTransaction, updateTransaction, addTransaction } = useTransactions(user?.id);
  const now = new Date();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number | null>(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(now.getMonth() + 1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    let list = transactions;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (filterType === 'expense') list = list.filter((t) => t.amount < 0);
    if (filterType === 'income') list = list.filter((t) => t.amount > 0);

    if (filterCategory !== 'all') list = list.filter((t) => t.category === filterCategory);

    if (filterYear !== null && filterMonth !== null) {
      const prefix = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
      list = list.filter((t) => t.date.startsWith(prefix));
    }

    return list;
  }, [transactions, searchTerm, filterType, filterCategory, filterYear, filterMonth]);

  const income = getIncomeTotal(filtered);
  const expense = getExpenseTotal(filtered);
  const net = income - expense;

  const handleDeleteClick = (id: string) => setDeleteId(id);

  const handleEditSave = async (tx: {
    title: string;
    description: string;
    category: string;
    amount: number;
    date: string;
    payment_method: string;
    tags: string[];
    is_recurring: boolean;
    spending_type?: 'ESSENTIAL' | 'OPTIONAL' | 'EMOTIONAL' | null;
  }) => {
    if (!editTx) return { error: new Error('Nenhuma transação para editar') };
    const { error } = await updateTransaction(editTx.id, tx);
    if (error) return { error };
    setEditTx(null);
    return { error: null };
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await deleteTransaction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast.error(error.message);
    else toast.success('Lançamento excluído');
  };

  const handleDuplicate = async (tx: Transaction) => {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await addTransaction({
      title: tx.title,
      description: tx.description ?? '',
      category: tx.category,
      amount: tx.amount,
      date: today,
      payment_method: tx.payment_method,
      tags: tx.tags ?? [],
      is_recurring: tx.is_recurring,
      spending_type: (tx as Transaction & { spending_type?: string }).spending_type ?? undefined,
    });
    if (error) toast.error(error.message);
    else toast.success('Lançamento duplicado');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterType !== 'all' ||
    filterCategory !== 'all' ||
    filterYear !== now.getFullYear() ||
    filterMonth !== now.getMonth() + 1;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
  };

  const handlePrevMonth = () => {
    if (filterYear === null || filterMonth === null) return;
    if (filterMonth === 1) { setFilterYear(filterYear - 1); setFilterMonth(12); }
    else setFilterMonth(filterMonth - 1);
  };

  const handleNextMonth = () => {
    if (filterYear === null || filterMonth === null) return;
    if (filterMonth === 12) { setFilterYear(filterYear + 1); setFilterMonth(1); }
    else setFilterMonth(filterMonth + 1);
  };

  const groupedByDay = useMemo(() => groupTransactionsByDay(filtered), [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Lançamentos</h2>
        <p className="text-muted-foreground text-sm">
          Suas entradas e gastos em ordem cronológica. Use os filtros para encontrar o que precisa.
        </p>
      </div>

      {/* Filtros + Busca */}
      <Card className="p-4 space-y-4">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterType('expense')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filterType === 'expense' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setFilterType('income')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filterType === 'income' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              Receita
            </button>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value="all">Todas categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-1 h-9">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-muted transition-colors" aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[130px] text-center text-sm font-medium select-none">
              {filterYear !== null && filterMonth !== null
                ? `${MONTH_NAMES[filterMonth - 1]} ${filterYear}`
                : 'Todo período'}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-muted transition-colors" aria-label="Próximo mês">
              <ChevronRight size={16} />
            </button>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              {labels.limparFiltros}
            </Button>
          )}
        </div>
      </Card>

      {/* Lista agrupada por dia */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          groupedByDay.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {group.label}
              </p>
              {group.items.map((tx) => {
                const Icon = getCategoryIcon(tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <Card
                    key={tx.id}
                    className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    data-tour="fluxia-transaction-row"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tx.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="font-normal text-[10px] px-1.5 py-0">
                          {tx.category}
                        </Badge>
                      </p>
                    </div>
                    <span
                      className={cn(
                        'font-semibold tabular-nums shrink-0',
                        isIncome ? 'text-emerald-500' : 'text-destructive'
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrencyBRL(Math.abs(tx.amount))}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem onClick={() => setEditTx(tx)} className="gap-2">
                          <Pencil size={16} />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(tx)} className="gap-2">
                          <Copy size={16} />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteClick(tx.id)}
                          className="gap-2"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                );
              })}
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Inbox size={28} />}
            title={emptyStates.transactions.title}
            description={transactions.length === 0 ? emptyStates.transactions.description : emptyStates.transactions.filterEmpty}
            primaryAction={onGoToImport ? { label: emptyStates.transactions.primaryCta, onClick: onGoToImport } : undefined}
            secondaryAction={onAddTransaction ? { label: emptyStates.transactions.secondaryCta, onClick: onAddTransaction } : undefined}
            onGuideClick={onGuideClick}
          />
        )}
      </div>

      {/* Resumo do período filtrado */}
      {filtered.length > 0 && (
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-semibold text-emerald-500">{formatCurrencyBRL(income)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="font-semibold text-destructive">{formatCurrencyBRL(expense)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="font-semibold">{formatCurrencyBRL(net)}</p>
            </div>
          </div>
        </Card>
      )}

      <TransactionDrawer
        isOpen={editTx !== null}
        onClose={() => setEditTx(null)}
        onSave={handleEditSave}
        initialTransaction={editTx}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={deleting}
              disabled={deleting}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
