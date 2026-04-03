import type { Transaction } from '@/types/database';
import {
  getCashImpact,
  normalizeSettlementStatus,
  type TransactionCoreFields,
} from './transaction-contracts';

export interface BalanceProjection {
  effectiveBalance: number;
  pendingDelta: number;
  ignoredCount: number;
}

function toCore(tx: Transaction): TransactionCoreFields {
  return {
    kind: tx.transaction_kind ?? (tx.amount >= 0 ? 'income' : 'expense'),
    amount: Number(tx.amount ?? 0),
    settlement_status:
      tx.settlement_status ?? normalizeSettlementStatus({ is_paid: tx.is_paid, is_ignored: tx.is_ignored }),
    account_id: tx.account_id ?? null,
    destination_account_id: tx.destination_account_id ?? null,
  };
}

export function projectBalance(transactions: Transaction[]): BalanceProjection {
  let effectiveBalance = 0;
  let pendingDelta = 0;
  let ignoredCount = 0;

  for (const tx of transactions) {
    const core = toCore(tx);
    if (core.settlement_status === 'ignored') {
      ignoredCount += 1;
      continue;
    }

    const impact = getCashImpact(core);
    if (impact === 'inflow' || impact === 'outflow') {
      effectiveBalance += core.amount;
      continue;
    }

    if (core.settlement_status === 'pending') {
      pendingDelta += core.amount;
    }
  }

  return { effectiveBalance, pendingDelta, ignoredCount };
}

/** Soma líquida em caixa (só quitado; pendentes e ignorados ficam de fora). */
export function getEffectiveCashBalance(transactions: Transaction[]): number {
  return projectBalance(transactions).effectiveBalance;
}

/**
 * Soma só o que já impactou caixa nesta conta (quitado + transferências quitadas).
 * Despesas/receitas pendentes não entram até serem marcadas como pagas/recebidas.
 */
export function getAccountCashFlowFromTransactions(accountId: string, transactions: Transaction[]): number {
  let sum = 0;
  for (const tx of transactions) {
    if (tx.account_id !== accountId) continue;

    const core = toCore(tx);
    if (core.settlement_status === 'ignored') continue;
    if (core.settlement_status === 'pending') continue;

    if (core.kind === 'transfer') {
      sum += core.amount;
      continue;
    }

    const impact = getCashImpact(core);
    if (impact === 'inflow' || impact === 'outflow') {
      sum += core.amount;
    }
  }

  return sum;
}
