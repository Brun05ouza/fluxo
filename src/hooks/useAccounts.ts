import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account } from '@/types/database';
import {
  toAccountInsertRow,
  toAccountUpdatePatch,
  type AccountInsertInput,
} from '@/features/finance/application/account-command-service';

export type AccountInsert = AccountInsertInput;

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
    const body = toAccountInsertRow(userId, row);
    const { data, error } = await supabase
      .from('accounts')
      .insert(body)
      .select('id')
      .single();
    return {
      error: error ? new Error(error.message) : null,
      id: data?.id as string | undefined,
    };
  };

  const updateAccount = async (id: string, patch: Partial<AccountInsert>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const body = toAccountUpdatePatch(patch);
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
