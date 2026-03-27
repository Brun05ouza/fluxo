import { useCallback, useEffect, useState } from 'react';
import type { CreditCard } from '@/types/database';
import {
  supabaseCreditCardsRepository,
  type CreditCardInsert,
} from '@/features/finance/infrastructure/repositories/supabase-credit-cards-repository';

export function useCreditCards(userId: string | undefined) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabaseCreditCardsRepository.listCards(userId);
    if (!error) setCards((data as CreditCard[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const addCard = async (row: CreditCardInsert) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { data, error } = await supabaseCreditCardsRepository.insertCard(userId, row);
    if (!error) await refetch();
    return { error: error ? new Error(error.message) : null, id: data?.id as string | undefined };
  };

  const updateCard = async (cardId: string, patch: Partial<CreditCardInsert>) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabaseCreditCardsRepository.updateCard(userId, cardId, patch);
    if (!error) await refetch();
    return { error: error ? new Error(error.message) : null };
  };

  const deleteCard = async (cardId: string) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { error } = await supabaseCreditCardsRepository.deleteCard(userId, cardId);
    if (!error) await refetch();
    return { error: error ? new Error(error.message) : null };
  };

  return { cards, loading, refetch, addCard, updateCard, deleteCard };
}
