import type { Account, Transaction } from '@/types/database';

function safeNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function getAccountBalance(account: Account, transactions: Transaction[]): number {
  const base = safeNum(account.initial_balance);
  const flow = transactions
    .filter((t) => t.account_id === account.id)
    .reduce((s, t) => s + safeNum(t.amount), 0);
  return Math.round((base + flow) * 100) / 100;
}
