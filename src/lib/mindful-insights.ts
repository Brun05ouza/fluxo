import type { Transaction } from '@/types/database';
import {
  getEmotionalSpendingAvg,
  getEmotionalSpendingThisMonth,
  getSpendingTypeEvolution,
} from './mindful-utils';

export interface MindfulInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  cta?: { label: string; action: string };
}

/**
 * Gera insights baseados em spending_type (Mindful Finance).
 */
export function getMindfulInsights(transactions: Transaction[]): MindfulInsight[] {
  const insights: MindfulInsight[] = [];

  const emotionalThisMonth = getEmotionalSpendingThisMonth(transactions);
  const emotionalAvg = getEmotionalSpendingAvg(transactions, 3);

  const emotionalMonthlyAvg = emotionalAvg / 3;
  if (emotionalThisMonth > 0 && emotionalMonthlyAvg > 0 && emotionalThisMonth > emotionalMonthlyAvg * 1.2) {
    insights.push({
      id: 'emotional-above-avg',
      type: 'warning',
      title: 'Gasto emocional acima da média',
      description: `Este mês você gastou R$ ${emotionalThisMonth.toFixed(2)} em compras emocionais — acima da média dos últimos 3 meses (R$ ${emotionalMonthlyAvg.toFixed(2)}/mês).`,
      cta: { label: 'Ver transações', action: 'transactions' },
    });
  }

  const evolution = getSpendingTypeEvolution(transactions, 4);
  if (evolution.length >= 2) {
    const last = evolution[evolution.length - 1]!;
    const prev = evolution[evolution.length - 2]!;
    const emotionalLast = last.EMOTIONAL || 0;
    const emotionalPrev = prev.EMOTIONAL || 0;
    if (emotionalPrev > 0 && emotionalLast > emotionalPrev * 1.15) {
      insights.push({
        id: 'emotional-trend-up',
        type: 'warning',
        title: 'Tendência de aumento em gastos emocionais',
        description: `Seus gastos emocionais subiram de R$ ${emotionalPrev.toFixed(2)} para R$ ${emotionalLast.toFixed(2)} entre os últimos meses.`,
        cta: { label: 'Ver relatórios', action: 'reports' },
      });
    }
  }

  if (emotionalThisMonth > 0 && emotionalAvg === 0) {
    insights.push({
      id: 'first-emotional',
      type: 'info',
      title: 'Você começou a classificar gastos emocionais',
      description: 'Continue marcando suas despesas para ter insights mais precisos.',
      cta: { label: 'Ver relatórios', action: 'reports' },
    });
  }

  return insights;
}
