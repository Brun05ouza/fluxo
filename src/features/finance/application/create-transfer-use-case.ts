import type { Transaction } from '@/types/database';

export interface CreateTransferInput {
  title: string;
  amount: number;
  date: string;
  originAccountId: string;
  destinationAccountId: string;
  description?: string | null;
}

export function buildTransferTransactions(input: CreateTransferInput): Array<Omit<Transaction, 'id' | 'user_id' | 'created_at'>> {
  const abs = Math.abs(Number(input.amount));
  if (abs <= 0) throw new Error('Transferencia exige valor maior que zero.');
  if (!input.originAccountId || !input.destinationAccountId) {
    throw new Error('Transferencia exige conta de origem e destino.');
  }
  if (input.originAccountId === input.destinationAccountId) {
    throw new Error('Transferencia nao pode usar a mesma conta.');
  }

  const common = {
    title: input.title.trim() || 'Transferencia',
    description: input.description ?? null,
    category: 'Transferência',
    date: input.date,
    competency_date: input.date,
    effective_date: input.date,
    origin: 'manual' as const,
    is_recurring: false,
    tags: [] as string[],
    payment_method: 'Transferência',
    is_paid: true,
    is_ignored: false,
    recurring_count: null,
    recurring_interval: null,
    attachment_url: null,
    spending_type: null,
  };

  return [
    {
      ...common,
      amount: -abs,
      transaction_kind: 'transfer',
      settlement_status: 'settled',
      account_id: input.originAccountId,
      destination_account_id: input.destinationAccountId,
    },
    {
      ...common,
      amount: abs,
      transaction_kind: 'transfer',
      settlement_status: 'settled',
      account_id: input.destinationAccountId,
      destination_account_id: input.originAccountId,
    },
  ];
}
