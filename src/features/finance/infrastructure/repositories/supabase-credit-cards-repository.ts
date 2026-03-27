import { supabase } from '@/lib/supabase';
import type { CreditCard, CreditCardInvoice, CreditCardInvoiceItem } from '@/types/database';

export type CreditCardInsert = Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const supabaseCreditCardsRepository = {
  async listCards(userId: string) {
    return supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
  },

  async insertCard(userId: string, row: CreditCardInsert) {
    return supabase
      .from('credit_cards')
      .insert({
        user_id: userId,
        name: row.name,
        brand: row.brand ?? null,
        bank_name: row.bank_name ?? null,
        color: row.color,
        limit_total: row.limit_total,
        closing_day: row.closing_day,
        due_day: row.due_day,
        payment_account_id: row.payment_account_id ?? null,
        is_automatic: row.is_automatic,
        is_active: row.is_active,
      })
      .select('id')
      .single();
  },

  async updateCard(userId: string, cardId: string, patch: Partial<CreditCardInsert>) {
    return supabase
      .from('credit_cards')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', cardId)
      .select('id');
  },

  async deleteCard(userId: string, cardId: string) {
    return supabase.from('credit_cards').delete().eq('user_id', userId).eq('id', cardId);
  },

  async listInvoices(userId: string, cardId?: string) {
    let query = supabase
      .from('credit_card_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('reference_month', { ascending: false });
    if (cardId) query = query.eq('credit_card_id', cardId);
    return query;
  },

  async listInvoiceItems(userId: string, invoiceId: string) {
    return supabase
      .from('credit_card_invoice_items')
      .select('*')
      .eq('user_id', userId)
      .eq('invoice_id', invoiceId)
      .order('purchase_date', { ascending: false });
  },

  async payInvoice(input: {
    userId: string;
    invoice: CreditCardInvoice;
    amountToPay: number;
    paymentAccountId: string | null;
  }) {
    const nowIso = new Date().toISOString();
    const nextPaid = Math.min(Number(input.invoice.amount_total), Number(input.invoice.amount_paid) + Number(input.amountToPay));
    const status =
      nextPaid <= 0
        ? 'open'
        : nextPaid >= Number(input.invoice.amount_total)
          ? 'paid'
          : 'partial';

    const updateInvoice = supabase
      .from('credit_card_invoices')
      .update({
        amount_paid: nextPaid,
        status,
        paid_at: status === 'paid' ? nowIso : input.invoice.paid_at,
        updated_at: nowIso,
      })
      .eq('id', input.invoice.id)
      .eq('user_id', input.userId);

    const createCashTransaction = supabase.from('transactions').insert({
      user_id: input.userId,
      title: `Pagamento fatura - ${input.invoice.reference_month}`,
      description: 'Pagamento de fatura de cartao',
      category: 'Cartão de Crédito',
      amount: -Math.abs(Number(input.amountToPay)),
      date: nowIso.slice(0, 10),
      competency_date: input.invoice.reference_month,
      effective_date: nowIso.slice(0, 10),
      transaction_kind: 'invoice_payment',
      origin: 'manual',
      settlement_status: 'settled',
      payment_method: 'Transferência',
      is_paid: true,
      is_ignored: false,
      tags: ['fatura'],
      account_id: input.paymentAccountId,
      credit_card_id: input.invoice.credit_card_id,
      credit_card_invoice_id: input.invoice.id,
    });

    return Promise.all([updateInvoice, createCashTransaction]);
  },
};

export type CreditCardWithMeta = CreditCard;
export type CreditCardInvoiceWithMeta = CreditCardInvoice;
export type CreditCardInvoiceItemWithMeta = CreditCardInvoiceItem;
