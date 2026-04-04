import type { Transaction } from '@/types/database';

/** Data local no formato yyyy-MM-dd (comparável com `Transaction.date`). */
export function localTodayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function transactionParcelSeriesKey(tx: Transaction): string {
  return `${tx.title.trim()}|${tx.amount}|${tx.category}`;
}

/**
 * Agrupa lançamentos com o mesmo título, valor e categoria (ex.: parcelas mensais materializadas).
 * Só entra no mapa se houver 2+ itens e pelo menos uma data estritamente posterior a `todayIso`
 * (ainda há parcelas “à frente”).
 */
export function buildTransactionParcelLabelMap(
  transactions: Transaction[],
  todayIso: string = localTodayIso()
): Map<string, { index: number; total: number }> {
  const map = new Map<string, { index: number; total: number }>();
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = transactionParcelSeriesKey(tx);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      return c !== 0 ? c : a.id.localeCompare(b.id);
    });
    const hasFuture = sorted.some((t) => t.date > todayIso);
    if (!hasFuture) continue;
    const total = sorted.length;
    sorted.forEach((t, i) => {
      map.set(t.id, { index: i + 1, total });
    });
  }
  return map;
}

export function formatTransactionTitleWithParcel(
  tx: Transaction,
  parcelMap: Map<string, { index: number; total: number }>
): string {
  const p = parcelMap.get(tx.id);
  if (!p) return tx.title;
  return `${tx.title} - ${p.index}/${p.total}`;
}
