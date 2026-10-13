import { subscribeData } from '@/lib/data-sync';
import { useEffect, useState } from 'react';
import { neon } from '@/lib/neon';
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
      const { data, error } = await neon
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('due_day');
      if (!error) setExpenses((data as FixedExpense[]) ?? []);
      setLoading(false);
    };

    fetch();

    return subscribeData('fixed_expenses', fetch);
  }, [userId]);

  const addExpense = async (exp: Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await neon.from('fixed_expenses').insert({
      ...exp,
      user_id: userId,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updateExpense = async (id: string, exp: Partial<FixedExpense>) => {
    const { error } = await neon.from('fixed_expenses').update(exp).eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  const deleteExpense = async (id: string) => {
    if (!userId) return { error: new Error('Não autenticado') };
    let snapshot: FixedExpense[] = [];
    setExpenses((prev) => {
      snapshot = prev;
      return prev.filter((e) => e.id !== id);
    });
    const { error } = await neon.from('fixed_expenses').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      setExpenses(snapshot);
      return { error: new Error(error.message) };
    }
    return { error: null };
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
