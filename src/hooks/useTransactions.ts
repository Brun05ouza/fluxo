import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types/database';

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
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('transactions').insert({
      ...tx,
      user_id: userId,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const addTransactions = async (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
    if (!userId) return { error: new Error('Não autenticado') };
    if (txs.length === 0) return { error: null };
    const MAX_AMOUNT = 9999999999.99;
    const MIN_AMOUNT = -9999999999.99;
    const rows = txs.map((tx) => {
      const amount = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, Math.round(Number(tx.amount) * 100) / 100));
      return {
        title: String(tx.title ?? '').slice(0, 500),
        description: tx.description != null ? String(tx.description).slice(0, 2000) : null,
        category: String(tx.category ?? 'Outros').slice(0, 100),
        amount,
        date: String(tx.date).slice(0, 10),
        payment_method: String(tx.payment_method ?? 'Outros').slice(0, 100),
        tags: Array.isArray(tx.tags) ? tx.tags.slice(0, 20) : [],
        is_recurring: Boolean(tx.is_recurring),
        user_id: userId,
      };
    });
    const { error } = await supabase.from('transactions').insert(rows);
    return { error: error ? new Error(error.message) : null };
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
    const { error } = await supabase.from('transactions').update(tx).eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
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
