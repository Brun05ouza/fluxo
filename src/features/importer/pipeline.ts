import type { RawRow, NormalizedTxn, PreviewTxn } from './types';
import { parseCsv, type CsvParseOutput } from './parsers/csv';
import { normalize } from './normalize';
import { enrich } from './categorize';
import { markDuplicates } from './dedupe';

export type ColumnMapping = { date: string; description: string; amount: string; type?: string };

export interface PipelineInput {
  file: File;
  fetchExistingTxs: (minDate: string, maxDate: string) => Promise<{ date: string; amount: number; title: string }[]>;
}

export interface PipelineResult {
  rows: PreviewTxn[];
  error?: string;
}

/**
 * Pipeline: parse → normalize → enrich → dedupe → preview
 */
export async function runImportPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { file, fetchExistingTxs } = input;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (ext !== '.csv') {
    return { rows: [], error: 'Por enquanto só aceitamos CSV.' };
  }

  let rawRows: { [key: string]: string | number }[];
  let detectedMapping: { date: string; description: string; amount: string; type?: string } | null;
  try {
    const parsed = parseCsv(await file.text()) as CsvParseOutput;
    rawRows = parsed.rawRows;
    detectedMapping = parsed.mapping;
  } catch (e) {
    return { rows: [], error: 'Erro ao ler o arquivo. Verifique se é um CSV válido.' };
  }

  if (rawRows.length === 0) {
    return { rows: [], error: 'Nenhuma linha válida encontrada.' };
  }

  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const mapping = detectedMapping ?? (headers.length >= 3
    ? { date: headers[0], description: headers[1], amount: headers[2] }
    : headers.length >= 2
      ? { date: headers[0], description: headers[0], amount: headers[1] }
      : headers.length >= 1
        ? { date: headers[0], description: headers[0], amount: headers[0] }
        : null);
  if (!mapping) {
    return { rows: [], error: 'Arquivo sem colunas identificáveis.' };
  }

  const normalized = normalize(rawRows, mapping);

  if (normalized.length === 0) {
    return { rows: [], error: 'Não consegui extrair transações. Verifique datas e valores.' };
  }

  const dates = normalized.map((n) => n.date);
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  const existing = await fetchExistingTxs(minDate, maxDate);
  const enriched = enrich(normalized);
  const withDupes = markDuplicates(enriched, existing);

  const rows: PreviewTxn[] = withDupes.map((t, i) => ({
    ...t,
    id: `preview-${i}`,
    category: t.suggestedCategory,
    title: t.description.slice(0, 200),
    payment_method: 'Transferência',
    tags: [],
    is_recurring: false,
  }));

  return { rows };
}

/** DECIMAL(12,2): máx 10 dígitos antes do decimal. Evita overflow no Supabase. */
const MAX_AMOUNT = 9999999999.99;
const MIN_AMOUNT = -9999999999.99;

/**
 * Parseia valor monetário em formato BR (1.234,56) ou US (1,234.56).
 * Também trata só pontos como milhares: 16.112.025 → 16112025.
 */
export function normalizeAmount(value: string | number): number {
  if (typeof value === 'number') {
    return Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, Math.round(value * 100) / 100));
  }
  const s = String(value).replace(/[^\d,.-]/g, '').trim();
  if (!s) return 0;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let normalized: string;
  if (lastComma > lastDot) {
    // Formato BR: 1.234,56 → remover pontos (milhares), vírgula → ponto
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Formato US: 1,234.56 → remover vírgulas (milhares)
    normalized = s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    normalized = s.replace(',', '.');
  } else if (lastDot >= 0) {
    // Só pontos, sem vírgula: 16.112.025 = milhares (formato BR/EU)
    normalized = s.replace(/\./g, '');
  } else {
    normalized = s;
  }
  const n = parseFloat(normalized) || 0;
  return Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, Math.round(n * 100) / 100));
}

export function parseDate(value: string): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const dmY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) {
    const [, d, m, y] = dmY;
    const day = parseInt(d!, 10);
    const month = parseInt(m!, 10) - 1;
    const year = parseInt(y!, 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function normalizeDescription(value: string): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}
