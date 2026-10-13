import type { NormalizedTxn } from '../types';

/** Normaliza descrição para comparação de duplicados. */
export function normalizeForCompare(s: string): string {
  return (
    s
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\d{4,}/g, '') // remove números longos (cartão, etc)
      .replace(/[*#\-_.,;:]/g, '')
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60)
  );
}

export interface ExistingTx {
  date: string;
  amount: number;
  title: string;
}

/**
 * Marca transações que podem ser duplicadas.
 * Considera: mesma data, mesmo valor, descrição similar.
 */
export function markDuplicates<T extends NormalizedTxn>(
  normalized: T[],
  existing: ExistingTx[] = []
): (T & { isDuplicate: boolean })[] {
  const existingSet = new Set(
    existing.map((e) => `${e.date}|${e.amount}|${normalizeForCompare(e.title)}`)
  );

  return normalized.map((t) => {
    const key = `${t.date}|${t.amount}|${normalizeForCompare(t.description)}`;
    const isDuplicate = existingSet.has(key);
    if (isDuplicate) return { ...t, isDuplicate: true };
    existingSet.add(key);
    return { ...t, isDuplicate: false };
  });
}
