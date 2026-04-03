import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Account } from '@/types/database';
import {
  toAccountInsertRow,
  toAccountUpdatePatch,
  type AccountInsertInput,
} from '@/features/finance/application/account-command-service';

export type AccountInsert = AccountInsertInput;

export type AccountsContextValue = {
  accounts: Account[];
  loading: boolean;
  refetch: () => Promise<void>;
  addAccount: (row: AccountInsert) => Promise<{ error: Error | null; id: string | undefined }>;
  updateAccount: (id: string, patch: Partial<AccountInsert>) => Promise<{ error: Error | null }>;
  deleteAccount: (id: string) => Promise<{ error: Error | null }>;
};

const AccountsContext = createContext<AccountsContextValue | null>(null);

function useAccountsState(userId: string): AccountsContextValue {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (!error) setAccounts((data as Account[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void fetchAccounts();

    const channel = supabase
      .channel(`accounts-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        () => {
          void fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAccounts]);

  const addAccount = useCallback(
    async (row: AccountInsert) => {
      const body = toAccountInsertRow(userId, row);
      const { data, error } = await supabase
        .from('accounts')
        .insert(body)
        .select('id')
        .single();
      if (!error) await fetchAccounts();
      return {
        error: error ? new Error(error.message) : null,
        id: data?.id as string | undefined,
      };
    },
    [userId, fetchAccounts]
  );

  const updateAccount = useCallback(
    async (id: string, patch: Partial<AccountInsert>) => {
      const body = toAccountUpdatePatch(patch);
      const { data, error } = await supabase
        .from('accounts')
        .update(body)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');
      if (error) return { error: new Error(error.message) };
      if (!data?.length) return { error: new Error('Conta não encontrada') };
      await fetchAccounts();
      return { error: null };
    },
    [userId, fetchAccounts]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId);
      if (!error) await fetchAccounts();
      return { error: error ? new Error(error.message) : null };
    },
    [userId, fetchAccounts]
  );

  return useMemo(
    () => ({
      accounts,
      loading,
      refetch: fetchAccounts,
      addAccount,
      updateAccount,
      deleteAccount,
    }),
    [accounts, loading, fetchAccounts, addAccount, updateAccount, deleteAccount]
  );
}

export function AccountsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const value = useAccountsState(userId);
  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error('useAccounts deve ser usado dentro de AccountsProvider.');
  }
  return ctx;
}
