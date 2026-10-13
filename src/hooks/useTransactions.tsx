import { subscribeData } from '@/lib/data-sync';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { neon } from '@/lib/neon';
import type { Transaction } from '@/types/database';
import {
  toTransactionInsertRow,
  toTransactionInsertRows,
  toTransactionUpdatePatch,
} from '@/features/finance/application/transaction-command-service';

export type TransactionsContextValue = {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>
  ) => Promise<{ error: Error | null; id: string | undefined }>;
  addTransactions: (
    txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]
  ) => Promise<{ error: Error | null; ids: string[] }>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<{ error: Error | null }>;
  deleteTransaction: (id: string) => Promise<{ error: Error | null }>;
  fetchByDateRange: (
    minDate: string,
    maxDate: string
  ) => Promise<{ date: string; amount: number; title: string }[]>;
  refetchTransactions: () => Promise<void>;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

function useTransactionsState(userId: string): TransactionsContextValue {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await neon
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (!error) setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void fetchTransactions();

    return subscribeData('transactions', fetchTransactions);
  }, [userId, fetchTransactions]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      const row = toTransactionInsertRow(userId, tx);
      const { data, error } = await neon
        .from('transactions')
        .insert(row)
        .select('id')
        .single();
      if (!error) await fetchTransactions();
      return {
        error: error ? new Error(error.message) : null,
        id: data?.id as string | undefined,
      };
    },
    [userId, fetchTransactions]
  );

  const addTransactions = useCallback(
    async (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
      if (txs.length === 0) return { error: null, ids: [] as string[] };
      const rows = toTransactionInsertRows(userId, txs);
      const { data, error } = await neon.from('transactions').insert(rows).select('id');
      if (!error) await fetchTransactions();
      return {
        error: error ? new Error(error.message) : null,
        ids: error ? [] : (data ?? []).map((r) => (r as { id: string }).id),
      };
    },
    [userId, fetchTransactions]
  );

  const fetchByDateRange = useCallback(
    async (minDate: string, maxDate: string) => {
      const { data } = await neon
        .from('transactions')
        .select('date, amount, title')
        .eq('user_id', userId)
        .gte('date', minDate)
        .lte('date', maxDate);
      return (data ?? []) as { date: string; amount: number; title: string }[];
    },
    [userId]
  );

  const updateTransaction = useCallback(
    async (id: string, tx: Partial<Transaction>) => {
      const patch = toTransactionUpdatePatch(tx);
      const { data, error } = await neon
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');
      if (error) return { error: new Error(error.message) };
      if (!data?.length) {
        return {
          error: new Error(
            'Nenhuma linha foi atualizada. Confira se o lançamento existe ou se a coluna is_paid existe no banco (migration 007).'
          ),
        };
      }
      await fetchTransactions();
      return { error: null };
    },
    [userId, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error } = await neon.from('transactions').delete().eq('id', id).eq('user_id', userId);
      if (!error) await fetchTransactions();
      return { error: error ? new Error(error.message) : null };
    },
    [userId, fetchTransactions]
  );

  return useMemo(
    () => ({
      transactions,
      loading,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      fetchByDateRange,
      refetchTransactions: fetchTransactions,
    }),
    [
      transactions,
      loading,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      fetchByDateRange,
      fetchTransactions,
    ]
  );
}

export function TransactionsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const value = useTransactionsState(userId);
  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error('useTransactions deve ser usado dentro de TransactionsProvider.');
  }
  return ctx;
}
