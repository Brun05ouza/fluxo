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

    const poll = setInterval(() => fetch(), 2000);

    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, fetch)
      .subscribe();

    return () => {
      clearInterval(poll);
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

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').update(tx).eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}
