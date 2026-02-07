import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FixedExpense } from '@/types/database';

export function useFixedExpenses(userId: string | undefined) {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('due_day');
      if (!error) setExpenses((data as FixedExpense[]) ?? []);
      setLoading(false);
    };

    fetch();

    const poll = setInterval(() => fetch(), 2000);

    const channel = supabase
      .channel('fixed_expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_expenses', filter: `user_id=eq.${userId}` }, fetch)
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addExpense = async (exp: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('fixed_expenses').insert({
      ...exp,
      user_id: userId,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updateExpense = async (id: string, exp: Partial<FixedExpense>) => {
    const { error } = await supabase.from('fixed_expenses').update(exp).eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
