import type { RawRow } from '../types';
import { parseCsv as parseCsvFull } from './csvParser';

export type { CsvParseResult } from './csvParser';

export interface CsvParseOutput {
  rawRows: RawRow[];
  mapping: { date: string; description: string; amount: string; type?: string } | null;
}

/** Parse CSV e retorna rawRows + mapping (null se não reconhecer colunas). */
export function parseCsv(content: string): CsvParseOutput {
  const { rawRows, mapping } = parseCsvFull(content);
  return { rawRows, mapping };
}
