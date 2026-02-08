import type { RawRow } from '../types';

const DATE_HEADERS = [
  'data', 'date', 'dt', 'data transação', 'transaction date', 'data_lancamento',
  'data lancamento', 'data_movimentacao', 'data_operacao', 'data_transacao', 'lancamento', 'datetime'
];
const DESC_HEADERS = [
  'descrição', 'description', 'histórico', 'historico', 'descricao', 'detalhes',
  'memo', 'lançamento', 'lancamento', 'operacao', 'movimento', 'info', 'obs'
];
const AMOUNT_HEADERS = [
  'valor', 'amount', 'value', 'values', 'debito', 'débito', 'credito', 'crédito',
  'credits', 'debits', 'valor_debito', 'valor_credito', 'montante', 'total'
];
const TYPE_HEADERS = ['tipo', 'type', 'natureza', 'c/d', 'dc'];

function detectSeparatorAndHeaderRow(lines: string[]): { separator: string; headerRowIndex: number } {
  const candidates: { sep: string; idx: number; score: number }[] = [];
  for (const sep of [';', ',', '\t']) {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const parts = lines[i]?.split(sep).map((p) => p.trim()) ?? [];
      if (parts.length < 3) continue;
      const normalized = parts.map((p) => normalizeHeader(p));
      const hasDate = normalized.some((h) => DATE_HEADERS.some((d) => h.includes(d) || d.includes(h)));
      const hasAmount = normalized.some((h) => AMOUNT_HEADERS.some((a) => h.includes(a) || a.includes(h)));
      const hasDesc = normalized.some((h) => DESC_HEADERS.some((d) => h.includes(d) || d.includes(h)));
      const score = (hasDate ? 2 : 0) + (hasAmount ? 2 : 0) + (hasDesc ? 1 : 0) + parts.length / 10;
      if (hasDate && hasAmount) candidates.push({ sep, idx: i, score });
    }
  }
  if (candidates.length === 0) {
    const first = lines[0] ?? '';
    const counts = { ',': 0, ';': 0, '\t': 0 };
    for (const c of first) {
      if (c in counts) (counts as Record<string, number>)[c]++;
    }
    const best = ([';', ',', '\t'] as const).reduce((a, b) => (counts[b] > counts[a] ? b : a), ',');
    return { separator: counts[best] > 0 ? best : ',', headerRowIndex: 0 };
  }
  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a), candidates[0]!);
  return { separator: best.sep, headerRowIndex: best.idx };
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function findColumnIndex(headers: string[], options: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i] ?? '');
    if (options.some((o) => h.includes(o) || o.includes(h))) return i;
  }
  return -1;
}

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' || c === "'") {
      inQuotes = !inQuotes;
    } else if (!inQuotes && c === sep) {
      result.push(current.trim());
      current = '';
    } else {
      current += c ?? '';
    }
  }
  result.push(current.trim());
  return result;
}

function inferMappingFromContent(
  headers: string[],
  sampleLines: string[],
  separator: string
): { date: string; description: string; amount: string; type?: string } | null {
  if (headers.length === 0) return null;
  const sampleRows = sampleLines.map((l) => parseCsvLine(l, separator));
  const dateScores = headers.map((_, j) => {
    let score = 0;
    for (const row of sampleRows) {
      const v = String(row[j] ?? '').trim();
      if (!v) continue;
      const d = new Date(v);
      if (!isNaN(d.getTime())) score += 1;
    }
    return score;
  });
  const amountScores = headers.map((_, j) => {
    let score = 0;
    for (const row of sampleRows) {
      const v = String(row[j] ?? '').replace(/[^\d,.-]/g, '').replace(',', '.');
      if (v && !isNaN(parseFloat(v))) score += 1;
    }
    return score;
  });
  const descScores = headers.map((_, j) => {
    let score = 0;
    for (const row of sampleRows) {
      const v = String(row[j] ?? '').trim();
      if (v.length > 2 && !/^-?[\d,.]+$/.test(v)) score += 1;
    }
    return score;
  });
  const dateIdx = dateScores.findIndex((s) => s > 0) >= 0
    ? dateScores.indexOf(Math.max(...dateScores))
    : 0;
  const amountIdx = amountScores.findIndex((s) => s > 0) >= 0
    ? amountScores.indexOf(Math.max(...amountScores))
    : Math.min(1, headers.length - 1);
  const descIdx = descScores.findIndex((s) => s > 0) >= 0
    ? descScores.indexOf(Math.max(...descScores))
    : (headers.length > 2 ? 2 : 1);
  const used = new Set([dateIdx, amountIdx, descIdx]);
  const dateCol = headers[dateIdx] ?? headers[0] ?? 'date';
  const amountCol = headers[amountIdx] ?? headers[1] ?? 'amount';
  const descCol = headers[descIdx] ?? headers.find((_, i) => !used.has(i)) ?? headers[0] ?? 'description';
  return { date: dateCol, description: descCol, amount: amountCol };
}

export interface CsvParseResult {
  rawRows: RawRow[];
  headers: string[];
  mapping: { date: string; description: string; amount: string; type?: string } | null;
}

export function parseCsv(content: string): CsvParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rawRows: [], headers: [], mapping: null };

  const { separator, headerRowIndex } = detectSeparatorAndHeaderRow(lines);
  const headerLine = lines[headerRowIndex] ?? '';
  const headers = headerLine.split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const dateIdx = findColumnIndex(headers, DATE_HEADERS);
  const descIdx = findColumnIndex(headers, DESC_HEADERS);
  const amountIdx = findColumnIndex(headers, AMOUNT_HEADERS);
  const typeIdx = findColumnIndex(headers, TYPE_HEADERS);

  let mapping: { date: string; description: string; amount: string; type?: string } | null = null;
  if (dateIdx >= 0 && descIdx >= 0 && amountIdx >= 0) {
    mapping = {
      date: headers[dateIdx] ?? 'date',
      description: headers[descIdx] ?? 'description',
      amount: headers[amountIdx] ?? 'amount',
      type: typeIdx >= 0 ? (headers[typeIdx] ?? undefined) : undefined,
    };
  } else {
    const hasCredits = headers.some((h) => /credits?/i.test(h));
    const hasDebits = headers.some((h) => /debits?/i.test(h));
    if (hasCredits && hasDebits) {
      const dateCol = headers.find((h) => /data|date|dt/i.test(h)) ?? headers[0];
      const descCol = headers.find((h) => /desc|hist|memo|info|obs/i.test(h)) ?? headers.find((h) => !/credits?|debits?|balance|saldo/i.test(h)) ?? headers[0];
      const amountCol = headers.find((h) => /credits?/i.test(h)) ?? headers[1];
      mapping = { date: dateCol ?? 'date', description: descCol ?? 'description', amount: amountCol ?? 'amount' };
    } else {
      mapping = inferMappingFromContent(headers, lines.slice(headerRowIndex + 1, headerRowIndex + 6), separator);
    }
  }

  const rawRows: RawRow[] = [];
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const values = parseCsvLine(line, separator);
    const row: RawRow = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    if (Object.values(row).some((v) => String(v).trim())) {
      rawRows.push(row);
    }
  }

  return { rawRows, headers, mapping };
}
