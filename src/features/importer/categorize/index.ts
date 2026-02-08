import type { NormalizedTxn } from '../types';
import { CATEGORIES } from '@/types/database';

const CATEGORY_DEFAULT = 'Outros';

/**
 * Sugere categoria baseada em keywords (rule-based).
 * FASE 5: expandir com histórico do usuário e category_rules.
 */
export function suggestCategory(description: string): { category: string; confidence: number } {
  const d = description.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const keywords: Record<string, string[]> = {
    Alimentação: ['UBER EATS', 'IFOOD', 'RAPPI', 'MERCADO', 'SUPER', 'PADARIA', 'RESTAURANTE', 'LANCHE'],
    Transporte: ['UBER', '99', 'TAXI', 'GASOLINA', 'POSTO', 'PEDAGIO', 'ESTACIONAMENTO'],
    Assinaturas: ['NETFLIX', 'SPOTIFY', 'AMAZON', 'PRIME', 'YOUTUBE', 'APPLE', 'GOOGLE'],
    Casa: ['ENERGIA', 'AGUA', 'ALUGUEL', 'CONDOMINIO', 'INTERNET'],
    Saúde: ['FARMACIA', 'MEDICO', 'CONSULTORIO', 'PLANO'],
  };

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some((w) => d.includes(w))) {
      return { category: cat, confidence: 0.85 };
    }
  }

  return { category: CATEGORY_DEFAULT, confidence: 0.5 };
}

/** Enriquece transações com categoria sugerida */
export function enrich(normalized: NormalizedTxn[]): (NormalizedTxn & { suggestedCategory: string; confidence: number })[] {
  return normalized.map((t) => {
    const { category, confidence } = suggestCategory(t.description);
    return {
      ...t,
      suggestedCategory: category,
      confidence,
    };
  });
}
