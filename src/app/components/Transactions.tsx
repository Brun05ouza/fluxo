import React, { useMemo, useState } from 'react';
import {
  Search,
  MoreHorizontal,
  Trash2,
  Pencil,
  Inbox,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  Paperclip,
  Building2,
  TrendingUp,
  TrendingDown,
  Scale,
  Filter,
} from 'lucide-react';
import { Card, Button, cn } from './ui';
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
import {
  getIncomeTotal,
  getExpenseTotal,
  getBalance,
  filterTransactionsByMonth,
  filterTransactionsThroughMonthEnd,
} from '@/lib/transaction-utils';
import { CATEGORIES } from '@/types/database';
import type { Transaction, TransactionSavePayload } from '@/types/database';
import { uploadTransactionAttachment } from '@/lib/transaction-attachment';
import { toast } from 'sonner';
import { formatCurrencyBRL } from '@/lib/format-currency';

const formatTableDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

type FilterType = 'all' | 'expense' | 'income';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface TransactionsProps {
  onAddTransaction?: (type?: 'income' | 'expense') => void;
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

  const summaryYear = filterYear ?? now.getFullYear();
  const summaryMonth = filterMonth ?? now.getMonth() + 1;

  /** Resumo do mês selecionado (só período; não usa busca/tipo/categoria). */
  const monthBaseTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, summaryYear, summaryMonth),
    [transactions, summaryYear, summaryMonth]
  );
  const summaryIncome = getIncomeTotal(monthBaseTransactions);
  const summaryExpense = getExpenseTotal(monthBaseTransactions);
  const monthlyBalance = summaryIncome - summaryExpense;
  /** Saldo acumulado: todas as movimentações até o último dia do mês exibido. */
  const cumulativeBalance = useMemo(
    () => getBalance(filterTransactionsThroughMonthEnd(transactions, summaryYear, summaryMonth)),
    [transactions, summaryYear, summaryMonth]
  );

  const handleDeleteClick = (id: string) => setDeleteId(id);

  const handleEditSave = async (payload: TransactionSavePayload) => {
    if (!editTx) return { error: new Error('Nenhuma transação para editar') };
    const { create_fixed_expense: _cf, attachmentFile, ...tx } = payload;
    const { error } = await updateTransaction(editTx.id, tx);
    if (error) return { error };
    if (attachmentFile && user) {
      const { url, error: upErr } = await uploadTransactionAttachment(user.id, attachmentFile);
      if (upErr) toast.warning('Salvo, mas o anexo não pôde ser enviado.');
      else if (url) await updateTransaction(editTx.id, { attachment_url: url });
    }
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

  const handleTogglePaid = async (tx: Transaction) => {
    const current = tx.is_paid !== false;
    const { error } = await updateTransaction(tx.id, { is_paid: !current });
    if (error) toast.error(error.message);
    else
      toast.success(
        !current
          ? tx.amount > 0
            ? 'Marcado como recebido'
            : 'Marcado como pago'
          : tx.amount > 0
            ? 'Marcado como a receber'
            : 'Marcado como não pago'
      );
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
      is_paid: tx.is_paid ?? true,
      recurring_count: tx.recurring_count ?? null,
      recurring_interval: tx.recurring_interval ?? null,
      attachment_url: tx.attachment_url ?? null,
      account_id: tx.account_id ?? null,
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

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      }),
    [filtered]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filterTypeLabel =
    filterType === 'all' ? 'Todas' : filterType === 'expense' ? 'Despesas' : 'Receitas';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cabeçalho estilo Mobills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transações</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Resumo pelo mês selecionado. A tabela abaixo respeita busca e filtros.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 gap-1.5 pr-3"
              >
                {filterTypeLabel}
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem onClick={() => setFilterType('all')}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('expense')}>Despesas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('income')}>Receitas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shrink-0" title="Mais filtros">
                <Filter className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Categoria</div>
              <DropdownMenuItem onClick={() => setFilterCategory('all')}>Todas categorias</DropdownMenuItem>
              {CATEGORIES.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setFilterCategory(c)}>
                  {c}
                </DropdownMenuItem>
              ))}
              {hasActiveFilters && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <DropdownMenuItem onClick={clearFilters}>{labels.limparFiltros}</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de resumo (cálculo geral do mês) */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Card className="p-4 flex items-center gap-3 rounded-2xl border-border/80 bg-card shadow-sm hover:bg-muted/20 transition-colors">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Building2 className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Saldo atual</p>
              <p
                className={cn(
                  'text-lg font-bold tabular-nums leading-tight',
                  cumulativeBalance >= 0 ? 'text-foreground' : 'text-destructive'
                )}
              >
                {formatCurrencyBRL(cumulativeBalance)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Até o fim de {MONTH_NAMES[summaryMonth - 1]}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" aria-hidden />
          </Card>
          <Card className="p-4 flex items-center gap-3 rounded-2xl border-border/80 bg-card shadow-sm hover:bg-muted/20 transition-colors">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">
                {formatCurrencyBRL(summaryIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">No mês</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" aria-hidden />
          </Card>
          <Card className="p-4 flex items-center gap-3 rounded-2xl border-border/80 bg-card shadow-sm hover:bg-muted/20 transition-colors">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
              <TrendingDown className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight">
                {formatCurrencyBRL(summaryExpense)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">No mês</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" aria-hidden />
          </Card>
          <Card className="p-4 flex items-center gap-3 rounded-2xl border-border/80 bg-card shadow-sm hover:bg-muted/20 transition-colors">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Scale className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Balanço mensal</p>
              <p
                className={cn(
                  'text-lg font-bold tabular-nums leading-tight',
                  monthlyBalance >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-destructive'
                )}
              >
                {formatCurrencyBRL(monthlyBalance)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Receitas − despesas (mês)</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" aria-hidden />
          </Card>
        </div>
      )}

      {/* Navegação do mês */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/5 px-1 py-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-semibold text-primary select-none px-2">
            {filterYear !== null && filterMonth !== null
              ? `${MONTH_NAMES[filterMonth - 1]} ${filterYear}`
              : 'Todo período'}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Busca + filtros da tabela */}
      <Card className="p-4 space-y-4 rounded-2xl">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-background text-sm"
          >
            <option value="all">Todas categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              {labels.limparFiltros}
            </Button>
          )}
        </div>
      </Card>

      {/* Tabela estilo Mobills */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 w-14 text-center">Situação</th>
                    <th className="px-3 py-3 w-28">Data</th>
                    <th className="px-3 py-3 min-w-[10rem]">Descrição</th>
                    <th className="px-3 py-3 min-w-[8rem]">Categoria</th>
                    <th className="px-3 py-3 min-w-[7rem]">Conta</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Valor</th>
                    <th className="px-3 py-3 w-36 text-right pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((tx) => {
                    const Icon = getCategoryIcon(tx.category);
                    const isIncome = tx.amount > 0;
                    const isPending = tx.is_paid === false;
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border/70 last:border-0 hover:bg-muted/25 transition-colors"
                        data-tour="fluxia-transaction-row"
                      >
                        <td className="px-3 py-2.5 text-center align-middle">
                          <span
                            className="inline-flex size-8 items-center justify-center rounded-full"
                            title={isPending ? 'Pendente' : 'Quitado'}
                          >
                            {isPending ? (
                              <AlertCircle className="size-5 text-destructive" strokeWidth={2.25} />
                            ) : (
                              <Check className="size-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} />
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle tabular-nums text-muted-foreground">
                          {formatTableDate(tx.date)}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{tx.title}</span>
                            {tx.attachment_url ? (
                              <Paperclip
                                className="size-3.5 shrink-0 text-primary opacity-80"
                                aria-label="Com anexo"
                              />
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <span className="inline-flex items-center gap-2 min-w-0">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                              <Icon size={16} />
                            </span>
                            <span className="truncate">{tx.category}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle text-muted-foreground truncate max-w-[10rem]">
                          {tx.payment_method}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2.5 align-middle text-right font-semibold tabular-nums whitespace-nowrap',
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                          )}
                        >
                          {isIncome ? '+' : '-'} {formatCurrencyBRL(Math.abs(tx.amount))}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                              title={isPending ? 'Marcar como pago/recebido' : 'Marcar como pendente'}
                              onClick={() => handleTogglePaid(tx)}
                              aria-label={isPending ? 'Marcar como quitado' : 'Marcar como pendente'}
                            >
                              <Check size={18} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Editar"
                              onClick={() => setEditTx(tx)}
                            >
                              <Pencil size={18} />
                            </Button>
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
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

      <TransactionDrawer
        key={editTx?.id ?? 'closed'}
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
