export type TransactionKind =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'invoice_payment'
  | 'adjustment';

export type TransactionOrigin = 'manual' | 'automatic' | 'imported' | 'recurring';

export type SettlementStatus = 'pending' | 'settled' | 'ignored';

export type CashImpact = 'none' | 'inflow' | 'outflow';

export interface TransactionCoreFields {
  kind: TransactionKind;
  amount: number;
  settlement_status: SettlementStatus;
  account_id?: string | null;
  destination_account_id?: string | null;
}

export function normalizeSettlementStatus(input: {
  is_paid?: boolean;
  is_ignored?: boolean;
}): SettlementStatus {
  if (input.is_ignored) return 'ignored';
  return input.is_paid === false ? 'pending' : 'settled';
}

export function getCashImpact(tx: TransactionCoreFields): CashImpact {
  if (tx.settlement_status !== 'settled') return 'none';

  switch (tx.kind) {
    case 'income':
      return tx.amount > 0 ? 'inflow' : 'none';
    case 'expense':
    case 'invoice_payment':
      return tx.amount < 0 ? 'outflow' : 'none';
    case 'adjustment':
      if (tx.amount > 0) return 'inflow';
      if (tx.amount < 0) return 'outflow';
      return 'none';
    case 'transfer':
      return 'none';
    default:
      return 'none';
  }
}

export function assertTransferInvariants(tx: TransactionCoreFields): string | null {
  if (tx.kind !== 'transfer') return null;
  if (!tx.account_id || !tx.destination_account_id) {
    return 'Transferencia exige conta de origem e destino.';
  }
  if (tx.account_id === tx.destination_account_id) {
    return 'Transferencia nao pode usar a mesma conta em origem e destino.';
  }
  if (tx.amount >= 0) {
    return 'Transferencia de saida deve ter valor negativo na origem.';
  }
  return null;
}
