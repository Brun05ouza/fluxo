import type { Transaction } from '@/types/database';
export function isIgnored(tx: Transaction) {
  return tx.is_ignored === true || tx.settlement_status === 'ignored';
}
export function isSettled(tx: Transaction) {
  return !isIgnored(tx) && tx.is_paid !== false && tx.settlement_status !== 'pending';
}
export function isBudgetExpense(tx: Transaction) {
  return Number(tx.amount) < 0 && !isIgnored(tx) && !['transfer', 'invoice_payment', 'adjustment'].includes(tx.transaction_kind ?? 'expense');
}
