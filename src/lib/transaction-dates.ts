import { addMonths, addWeeks, format, parseISO } from 'date-fns';
import type { RecurringInterval } from '@/types/database';

/** Próxima data de parcela a partir de `isoDate` (yyyy-MM-dd), somando `steps` intervalos. */
export function shiftTransactionDate(
  isoDate: string,
  interval: RecurringInterval,
  steps: number
): string {
  const base = parseISO(`${isoDate}T12:00:00`);
  const next =
    interval === 'MONTH' ? addMonths(base, steps) : addWeeks(base, steps);
  return format(next, 'yyyy-MM-dd');
}

/** Lista de datas para N parcelas materiais (primeira = data inicial). */
export function materializeRecurringDates(
  startIso: string,
  interval: RecurringInterval,
  count: number
): string[] {
  const n = Math.max(1, count);
  return Array.from({ length: n }, (_, i) =>
    shiftTransactionDate(startIso, interval, i)
  );
}
