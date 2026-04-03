import type { Account, Transaction } from '@/types/database';
import { getAccountCashFlowFromTransactions } from '@/features/finance/domain/balance-engine';

function safeNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function getAccountBalance(account: Account, transactions: Transaction[]): number {
  const base = safeNum(account.initial_balance);
  const flow = getAccountCashFlowFromTransactions(account.id, transactions);
  return Math.round((base + flow) * 100) / 100;
}
