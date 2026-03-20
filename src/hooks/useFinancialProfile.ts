import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FinancialProfile } from '@/types/database';

export function useFinancialProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('financial_profile')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) setProfile(data as FinancialProfile);
    else setProfile(null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchProfile();

    const channel = supabase
      .channel('financial_profile-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_profile', filter: `id=eq.${userId}` }, () => {
        fetchProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProfile]);

  const upsertProfile = async (data: { monthly_income?: number; pay_day?: number }) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabase.from('financial_profile').upsert(
      { id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    return { error: error ? new Error(error.message) : null };
  };

  return { profile, loading, upsertProfile, refetch: fetchProfile };
}
