import type { Transaction, Budget } from '@/types/database';

export function getIncomeTotal(transactions: Transaction[]): number {
  return transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getExpenseTotal(transactions: Transaction[]): number {
  return transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
}

export function getBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

export function getSpentByCategory(transactions: Transaction[]): Record<string, number> {
  return transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      return acc;
    }, {} as Record<string, number>);
}

export function getBudgetProgress(budgets: Budget[], spentByCategory: Record<string, number>) {
  return budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    const limit = Number(b.limit_amount);
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      ...b,
      spent,
      limit,
      percent,
    };
  });
}

export function getChartDataFromTransactions(transactions: Transaction[], days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const dayKeys: string[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    dayKeys.push(d.toISOString().split('T')[0]);
  }
  const txByDay: Record<string, number> = {};
  dayKeys.forEach((k) => (txByDay[k] = 0));
  transactions
    .filter((t) => dayKeys.includes(t.date))
    .forEach((t) => {
      txByDay[t.date] = (txByDay[t.date] || 0) + Number(t.amount);
    });
  let running = 0;
  return dayKeys.map((date) => {
    running += txByDay[date] || 0;
    return {
      name: date.slice(8, 10),
      saldo: Math.round(running * 100) / 100,
    };
  });
}

export function getPieDataFromTransactions(transactions: Transaction[]) {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#94a3b8', '#ef4444', '#06b6d4'];
  const spent = getSpentByCategory(transactions);
  return Object.entries(spent).map(([name, value], i) => ({
    name,
    value,
    color: colors[i % colors.length],
  }));
}
