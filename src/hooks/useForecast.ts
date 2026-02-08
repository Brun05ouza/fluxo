import { useMemo } from 'react';
import { computeForecast } from '@/lib/forecast';
import type { Transaction, Budget } from '@/types/database';

export function useForecast(
  month: string,
  transactions: Transaction[],
  budgets: Budget[]
) {
  return useMemo(
    () => computeForecast(month, transactions, budgets),
    [month, transactions, budgets]
  );
}
