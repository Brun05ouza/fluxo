import { subscribeData } from '@/lib/data-sync';
import { useEffect, useState } from 'react';
import { neon } from '@/lib/neon';
import type { Budget } from '@/types/database';

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await neon
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('category');
      if (!error) setBudgets((data as Budget[]) ?? []);
      setLoading(false);
    };

    fetch();

    return subscribeData('budgets', fetch);
  }, [userId]);

  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await neon.from('budgets').insert({
      ...budget,
      user_id: userId,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    const { error } = await neon.from('budgets').update(budget).eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  const deleteBudget = async (id: string) => {
    if (!userId) return { error: new Error('Não autenticado') };
    let snapshot: Budget[] = [];
    setBudgets((prev) => {
      snapshot = prev;
      return prev.filter((b) => b.id !== id);
    });
    const { error } = await neon.from('budgets').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      setBudgets(snapshot);
      return { error: new Error(error.message) };
    }
    return { error: null };
  };

  return { budgets, loading, addBudget, updateBudget, deleteBudget };
}
