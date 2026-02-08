import type { Transaction } from '@/types/database';
import type { SpendingType } from '@/types/database';

/** Distribuição de gastos por spending_type (apenas despesas com tipo definido) */
export function getSpendingTypeDistribution(
  transactions: Transaction[]
): Record<SpendingType, number> {
  const expenses = transactions.filter((t) => t.amount < 0 && t.spending_type);
  const result: Record<string, number> = {
    ESSENTIAL: 0,
    OPTIONAL: 0,
    EMOTIONAL: 0,
  };
  expenses.forEach((t) => {
    const type = t.spending_type as SpendingType;
    if (result[type] !== undefined) {
      result[type] += Math.abs(Number(t.amount));
    }
  });
  return result as Record<SpendingType, number>;
}

/** Evolução mensal por spending_type */
export function getSpendingTypeEvolution(
  transactions: Transaction[],
  months = 6
): { month: string; ESSENTIAL: number; OPTIONAL: number; EMOTIONAL: number }[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const byMonth: Record<
    string,
    { ESSENTIAL: number; OPTIONAL: number; EMOTIONAL: number }
  > = {};

  transactions
    .filter((t) => t.amount < 0 && t.spending_type)
    .forEach((t) => {
      const d = new Date(t.date);
      if (d < cutoff) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { ESSENTIAL: 0, OPTIONAL: 0, EMOTIONAL: 0 };
      const type = t.spending_type as SpendingType;
      if (byMonth[key][type] !== undefined) {
        byMonth[key][type] += Math.abs(Number(t.amount));
      }
    });

  const sorted = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return sorted;
}

/** Média de gasto emocional nos últimos N meses */
export function getEmotionalSpendingAvg(
  transactions: Transaction[],
  months = 3
): number {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const emotional = transactions.filter(
    (t) => t.amount < 0 && t.spending_type === 'EMOTIONAL'
  );
  const inRange = emotional.filter((t) => new Date(t.date) >= cutoff);
  const total = inRange.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  return inRange.length > 0 ? total : 0;
}

/** Total de gasto emocional no mês atual */
export function getEmotionalSpendingThisMonth(transactions: Transaction[]): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return transactions
    .filter((t) => t.amount < 0 && t.spending_type === 'EMOTIONAL' && t.date.startsWith(prefix))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
}
