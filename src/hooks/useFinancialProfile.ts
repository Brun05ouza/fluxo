import { subscribeData } from '@/lib/data-sync';
import { useCallback, useEffect, useState } from 'react';
import { neon } from '@/lib/neon';
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
    const { data, error } = await neon
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

    return subscribeData('financial_profile', fetchProfile);
  }, [userId, fetchProfile]);

  const upsertProfile = async (data: { monthly_income?: number; pay_day?: number }) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await neon.from('financial_profile').upsert(
      { id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    return { error: error ? new Error(error.message) : null };
  };

  return { profile, loading, upsertProfile, refetch: fetchProfile };
}
