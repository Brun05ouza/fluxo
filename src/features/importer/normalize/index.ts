import type { RawRow, NormalizedTxn } from '../types';
import { normalizeAmount, parseDate, normalizeDescription } from '../pipeline';

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
}

const DEFAULT_MAPPING: ColumnMapping = {
  date: 'date',
  description: 'description',
  amount: 'amount',
};

/**
 * Normaliza rawRows em NormalizedTxn.
 * Usa mapeamento de colunas (detectado ou manual).
 */
export function normalize(
  rawRows: RawRow[],
  mapping: Partial<ColumnMapping> = {}
): NormalizedTxn[] {
  const map = { ...DEFAULT_MAPPING, ...mapping };
  const result: NormalizedTxn[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const dateStr = String(row[map.date] ?? row['data'] ?? row['Data'] ?? '');
    const date = parseDate(dateStr) ?? today;

    const descKey = map.description || 'description';
    const histKey = Object.keys(row).find((k) => /historico/i.test(k));
    const descColKey = Object.keys(row).find((k) => /descricao|descrição/i.test(k));
    const hist = histKey ? String(row[histKey] ?? '').trim() : '';
    const descCol = descColKey ? String(row[descColKey] ?? '').trim() : '';
    const main = String(row[descKey] ?? '').trim();
    const parts = [hist, descCol].filter(Boolean);
    const descRaw = parts.length > 1 ? parts.join(' - ') : (main || hist || descCol);
    const desc = normalizeDescription(descRaw);

    const amountKey = map.amount || 'amount';
    const creditsKey = Object.keys(row).find((k) => /credits?|cr[eé]dito/i.test(k));
    const debitsKey = Object.keys(row).find((k) => /debits?|d[eé]bito/i.test(k));
    let amount: number;
    if (creditsKey && debitsKey) {
      const c = normalizeAmount(row[creditsKey] ?? 0);
      const d = normalizeAmount(row[debitsKey] ?? 0);
      amount = c > 0 ? c : -d;
    } else {
      const rawAmount = row[amountKey] ?? row['valor'] ?? row['Value'] ?? 0;
      amount = normalizeAmount(rawAmount);
    }

    const typeKey = map.type || 'type';
    const typeStr = String(row[typeKey] ?? '').toLowerCase();
    if (typeStr) {
      if (typeStr.includes('cred') || typeStr.includes('entrada') || typeStr.includes('receita')) {
        amount = Math.abs(amount);
      } else if (typeStr.includes('deb') || typeStr.includes('saída') || typeStr.includes('despesa')) {
        amount = -Math.abs(amount);
      }
    }

    result.push({
      date,
      description: desc,
      amount,
      type: amount >= 0 ? 'income' : 'expense',
      raw: row,
    });
  }

  return result;
}
