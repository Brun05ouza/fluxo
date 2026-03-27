import { useCallback, useEffect, useState } from 'react';
import type { CreditCardInvoice, CreditCardInvoiceItem } from '@/types/database';
import { supabaseCreditCardsRepository } from '@/features/finance/infrastructure/repositories/supabase-credit-cards-repository';

export function useCreditCardInvoices(userId: string | undefined, cardId?: string) {
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabaseCreditCardsRepository.listInvoices(userId, cardId);
    if (!error) setInvoices((data as CreditCardInvoice[]) ?? []);
    setLoading(false);
  }, [userId, cardId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const fetchItems = async (invoiceId: string): Promise<CreditCardInvoiceItem[]> => {
    if (!userId) return [];
    const { data, error } = await supabaseCreditCardsRepository.listInvoiceItems(userId, invoiceId);
    if (error) return [];
    return (data as CreditCardInvoiceItem[]) ?? [];
  };

  const payInvoice = async (invoice: CreditCardInvoice, amountToPay: number, paymentAccountId: string | null) => {
    if (!userId) return { error: new Error('Não autenticado') };
    if (amountToPay <= 0) return { error: new Error('Valor de pagamento deve ser maior que zero.') };
    const [updateResult, txResult] = await supabaseCreditCardsRepository.payInvoice({
      userId,
      invoice,
      amountToPay,
      paymentAccountId,
    });
    const err = updateResult.error ?? txResult.error;
    if (!err) await refetch();
    return { error: err ? new Error(err.message) : null };
  };

  return { invoices, loading, refetch, fetchItems, payInvoice };
}
