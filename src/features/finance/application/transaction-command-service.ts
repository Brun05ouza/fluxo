import type { Transaction } from '@/types/database';
import { assertTransferInvariants, normalizeSettlementStatus } from '../domain/transaction-contracts';

const MAX_AMOUNT = 9999999999.99;
const MIN_AMOUNT = -9999999999.99;

export type TransactionInsertInput = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

function clampAmount(value: number): number {
  return Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, Math.round(Number(value) * 100) / 100));
}

export function toTransactionInsertRow(userId: string, tx: TransactionInsertInput) {
  const kind = tx.transaction_kind ?? (tx.amount >= 0 ? 'income' : 'expense');
  const settlement = tx.settlement_status ?? normalizeSettlementStatus({ is_paid: tx.is_paid, is_ignored: tx.is_ignored });
  const transferError = assertTransferInvariants({
    kind,
    amount: Number(tx.amount ?? 0),
    settlement_status: settlement,
    account_id: tx.account_id ?? null,
    destination_account_id: tx.destination_account_id ?? null,
  });
  if (transferError) throw new Error(transferError);

  return {
    title: String(tx.title ?? '').slice(0, 500),
    description: tx.description != null ? String(tx.description).slice(0, 2000) : null,
    category: String(tx.category ?? 'Outros').slice(0, 100),
    amount: clampAmount(Number(tx.amount ?? 0)),
    date: String(tx.date).slice(0, 10),
    competency_date: tx.competency_date ? String(tx.competency_date).slice(0, 10) : null,
    effective_date: tx.effective_date ? String(tx.effective_date).slice(0, 10) : null,
    transaction_kind: kind,
    origin: tx.origin ?? (tx.is_recurring ? 'recurring' : 'manual'),
    settlement_status: settlement,
    payment_method: String(tx.payment_method ?? 'Outros').slice(0, 100),
    tags: Array.isArray(tx.tags) ? tx.tags.slice(0, 20) : [],
    is_recurring: Boolean(tx.is_recurring),
    spending_type: tx.spending_type ?? null,
    is_paid: tx.is_paid ?? true,
    is_ignored: tx.is_ignored ?? false,
    recurring_count: tx.recurring_count ?? null,
    recurring_interval: tx.recurring_interval ?? null,
    attachment_url: tx.attachment_url ?? null,
    account_id: tx.account_id ?? null,
    destination_account_id: tx.destination_account_id ?? null,
    user_id: userId,
  };
}

export function toTransactionInsertRows(userId: string, txs: TransactionInsertInput[]) {
  return txs.map((tx) => toTransactionInsertRow(userId, tx));
}

export function toTransactionUpdatePatch(tx: Partial<Transaction>) {
  const patch = Object.fromEntries(Object.entries(tx).filter(([, v]) => v !== undefined)) as Partial<Transaction>;
  if ('transaction_kind' in patch || 'is_paid' in patch || 'is_ignored' in patch || 'settlement_status' in patch) {
    const kind = patch.transaction_kind ?? 'expense';
    const settlement =
      patch.settlement_status ??
      normalizeSettlementStatus({
        is_paid: patch.is_paid,
        is_ignored: patch.is_ignored,
      });
    const transferError = assertTransferInvariants({
      kind,
      amount: Number(patch.amount ?? -1),
      settlement_status: settlement,
      account_id: patch.account_id ?? null,
      destination_account_id: patch.destination_account_id ?? null,
    });
    if (transferError) throw new Error(transferError);
    patch.settlement_status = settlement;
  }
  return patch;
}
