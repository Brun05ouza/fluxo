import type { Transaction, Budget } from '@/types/database';
import { isBudgetExpense, isSettled } from './financial-status';

export type RiskLevel = 'OK' | 'WARNING' | 'DANGER';

export interface CategoryForecast {
  category: string;
  limit: number;
  spent: number;
  forecastEndMonth: number;
  riskLevel: RiskLevel;
  percentUsed: number;
  suggestedDailyLimit: number;
  daysRemaining: number;
  /** No ritmo atual, quantos dias até estourar o orçamento (null se já estourou ou não estoura) */
  daysUntilOverflow: number | null;
}

export interface MonthForecast {
  month: string;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  totalSpent: number;
  forecastEndMonth: number;
  dailyAvg: number;
  totalBudgeted: number;
  riskLevel: RiskLevel;
  suggestedDailyLimit: number;
  byCategory: CategoryForecast[];
}

function getRiskLevel(percentUsed: number): RiskLevel {
  if (percentUsed >= 100) return 'DANGER';
  if (percentUsed >= 80) return 'WARNING';
  return 'OK';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Filtra transações de despesa (amount < 0) do mês dado.
 */
function getExpensesForMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return transactions.filter(
    (t) => isBudgetExpense(t) && isSettled(t) && t.date.startsWith(prefix)
  );
}

/**
 * Calcula o total gasto por categoria no mês.
 */
function getSpentByCategoryForMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Record<string, number> {
  const expenses = getExpensesForMonth(transactions, year, month);
  return expenses.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Calcula forecast para um mês.
 * Entrada: month (YYYY-MM), transactions, budgets
 */
export function computeForecast(
  month: string,
  transactions: Transaction[],
  budgets: Budget[]
): MonthForecast {
  const [yearStr, monthStr] = month.split('-').map(Number);
  const year = yearStr!;
  const monthNum = monthStr!;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === monthNum;
  const dayOfMonth = isCurrentMonth ? today.getDate() : 1;
  const daysInMonth = getDaysInMonth(year, monthNum);
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
  const period = `${year}-${String(monthNum).padStart(2, '0')}`;
  const pendingByCategory: Record<string, number> = {};
  const fixedPaidByCategory: Record<string, number> = {};
  for (const tx of transactions.filter(t=>t.date.startsWith(period) && isBudgetExpense(t))) {
    if (!isSettled(tx)) pendingByCategory[tx.category] = (pendingByCategory[tx.category] || 0) + Math.abs(Number(tx.amount));
    else if (tx.planning_item_id) fixedPaidByCategory[tx.category] = (fixedPaidByCategory[tx.category] || 0) + Math.abs(Number(tx.amount));
  }
  const pendingTotal = Object.values(pendingByCategory).reduce((a,b)=>a+b,0);
  const fixedPaidTotal = Object.values(fixedPaidByCategory).reduce((a,b)=>a+b,0);

  const spentByCategory = getSpentByCategoryForMonth(transactions, year, monthNum);
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);

  const dailyAvg = dayOfMonth > 0 ? (totalSpent - fixedPaidTotal) / dayOfMonth : 0;
  const forecastEndMonth = dailyAvg * daysInMonth + fixedPaidTotal + pendingTotal;

  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);

  const byCategory: CategoryForecast[] = budgets.map((b) => {
    const limit = Number(b.limit_amount);
    const spent = spentByCategory[b.category] || 0;
    const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;
    const riskLevel = getRiskLevel(percentUsed);

    const remaining = Math.max(0, limit - spent - (pendingByCategory[b.category] || 0));
    const suggestedDailyLimit =
      daysRemaining > 0 ? remaining / daysRemaining : 0;

    const categoryDailyAvg =
      dayOfMonth > 0 && spentByCategory[b.category]
        ? (spent - (fixedPaidByCategory[b.category] || 0)) / dayOfMonth
        : 0;
    const categoryForecastEnd =
      categoryDailyAvg * daysInMonth + (fixedPaidByCategory[b.category] || 0) + (pendingByCategory[b.category] || 0);

    const daysUntilOverflow =
      limit > 0 && spent < limit && categoryDailyAvg > 0
        ? Math.floor(remaining / categoryDailyAvg)
        : null;

    return {
      category: b.category,
      limit,
      spent,
      forecastEndMonth: categoryForecastEnd,
      riskLevel,
      percentUsed,
      suggestedDailyLimit,
      daysRemaining,
      daysUntilOverflow,
    };
  });

  const overallPercent =
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overallRisk = getRiskLevel(overallPercent);
  const budgetRemaining = Math.max(0, totalBudgeted - totalSpent - pendingTotal);
  const suggestedDailyLimit =
    daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  return {
    month,
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    totalSpent,
    forecastEndMonth,
    dailyAvg,
    totalBudgeted,
    riskLevel: overallRisk,
    suggestedDailyLimit,
    byCategory,
  };
}

/**
 * Retorna mensagem de alerta para toast, se a categoria está em WARNING ou DANGER.
 */
export function getAlertMessageForCategory(
  category: string,
  percentUsed: number
): string | null {
  if (percentUsed >= 100) {
    return `${category} atingiu 100% do orçamento. Limite estourado!`;
  }
  if (percentUsed >= 80) {
    return `${category} atingiu ${Math.round(percentUsed)}% do orçamento.`;
  }
  return null;
}
