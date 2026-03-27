import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types/database';
import {
  toTransactionInsertRow,
  toTransactionInsertRows,
  toTransactionUpdatePatch,
} from '@/features/finance/application/transaction-command-service';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (!error) setTransactions((data as Transaction[]) ?? []);
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return { error: new Error('Não autenticado'), id: undefined as string | undefined };
    const row = toTransactionInsertRow(userId, tx);
    const { data, error } = await supabase
      .from('transactions')
      .insert(row)
      .select('id')
      .single();
    return {
      error: error ? new Error(error.message) : null,
      id: data?.id as string | undefined,
    };
  };

  const addTransactions = async (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
    if (!userId) return { error: new Error('Não autenticado') };
    if (txs.length === 0) return { error: null };
    const rows = toTransactionInsertRows(userId, txs);
    const { data, error } = await supabase.from('transactions').insert(rows).select('id');
    return {
      error: error ? new Error(error.message) : null,
      ids: error ? [] : (data ?? []).map((r) => (r as { id: string }).id),
    };
  };

  const fetchByDateRange = async (minDate: string, maxDate: string) => {
    if (!userId) return [];
    const { data } = await supabase
      .from('transactions')
      .select('date, amount, title')
      .eq('user_id', userId)
      .gte('date', minDate)
      .lte('date', maxDate);
    return (data ?? []) as { date: string; amount: number; title: string }[];
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const patch = toTransactionUpdatePatch(tx);
    const { data, error } = await supabase
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
    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  return {
    transactions,
    loading,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    fetchByDateRange,
  };
}
