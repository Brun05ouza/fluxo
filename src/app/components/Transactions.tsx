import React, { useMemo, useState } from 'react';
import {
  Search,
  MoreHorizontal,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Card, Button, Badge, cn } from './ui';
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
import type { Transaction } from '@/types/database';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export const Transactions = () => {
  const { user } = useAuth();
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [transactions, searchTerm]);

  const income = getIncomeTotal(filtered);
  const expense = getExpenseTotal(filtered);
  const net = income - expense;
  const avgDaily = filtered.filter((t) => t.amount < 0).length
    ? expense / 30
    : 0;

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
    else toast.success('Transação excluída');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar transação..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-[var(--radius)] outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {filtered.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transação
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pagamento
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((tx) => {
                    const Icon = getCategoryIcon(tx.category);
                    const isIncome = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                              <Icon size={18} />
                            </div>
                            <span className="font-medium whitespace-nowrap">{tx.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-normal">
                            {tx.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {tx.payment_method}
                        </td>
                        <td
                          className={cn(
                            'px-6 py-4 text-sm font-semibold text-right whitespace-nowrap',
                            isIncome ? 'text-emerald-500' : 'text-foreground'
                          )}
                        >
                          {isIncome ? '+' : '-'}{' '}
                          {formatCurrency(Math.abs(tx.amount))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              >
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[140px] border-border bg-card">
                              <DropdownMenuItem
                                onClick={() => setEditTx(tx)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil size={16} />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteClick(tx.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Trash2 size={16} />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="w-full lg:w-72 space-y-6">
        <Card className="space-y-4">
          <h3 className="font-semibold">Resumo do Período</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Entradas</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(income)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Saídas</span>
              <span className="font-semibold text-destructive">{formatCurrency(expense)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Total Líquido</span>
              <span className="font-bold text-primary">{formatCurrency(net)}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-primary/5 border-primary/20 space-y-3">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
            Média Diária
          </h4>
          <p className="text-3xl font-bold">{formatCurrency(avgDaily)}</p>
          <p className="text-xs text-muted-foreground">
            Com base nos gastos do período.
          </p>
        </Card>
      </div>

      <TransactionDrawer
        isOpen={editTx !== null}
        onClose={() => setEditTx(null)}
        onSave={handleEditSave}
        initialTransaction={editTx}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
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
