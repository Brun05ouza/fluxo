import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account, AccountType } from '@/types/database';

export type AccountInsert = Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (!error) setAccounts((data as Account[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAccounts();

    const channel = supabase
      .channel('accounts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        fetchAccounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAccounts]);

  const addAccount = async (row: AccountInsert) => {
    if (!userId) return { error: new Error('Não autenticado'), id: undefined as string | undefined };
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name: row.name.slice(0, 200),
        institution_key: row.institution_key.slice(0, 64),
        account_type: row.account_type,
        color: row.color.slice(0, 32),
        initial_balance: row.initial_balance,
        credit_limit: row.credit_limit,
        include_in_home_total: row.include_in_home_total,
      })
      .select('id')
      .single();
    return {
      error: error ? new Error(error.message) : null,
      id: data?.id as string | undefined,
    };
  };

  const updateAccount = async (id: string, patch: Partial<AccountInsert>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    (Object.entries(patch) as [keyof AccountInsert, AccountInsert[keyof AccountInsert]][]).forEach(
      ([k, v]) => {
        if (v !== undefined) body[k as string] = v;
      }
    );
    const { data, error } = await supabase
      .from('accounts')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');
    if (error) return { error: new Error(error.message) };
    if (!data?.length) return { error: new Error('Conta não encontrada') };
    return { error: null };
  };

  const deleteAccount = async (id: string) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId);
    return { error: error ? new Error(error.message) : null };
  };

  return {
    accounts,
    loading,
    refetch: fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
