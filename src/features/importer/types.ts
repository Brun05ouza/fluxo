/** Linha bruta do arquivo (após parse) */
export interface RawRow {
  [key: string]: string | number;
}

/** Transação normalizada (após pipeline de normalização) */
export interface NormalizedTxn {
  date: string;
  description: string;
  amount: number;
  type?: 'expense' | 'income';
  raw?: RawRow;
}

/** Transação no preview (enriquecida com sugestões e flags) */
export interface PreviewTxn extends NormalizedTxn {
  id: string;
  suggestedCategory: string;
  confidence: number;
  isDuplicate: boolean;
  payment_method: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  is_recurring: boolean;
}

export type ImportState = 'idle' | 'loading' | 'error' | 'empty' | 'ready';
