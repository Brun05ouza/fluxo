/**
 * Jornada e hábito financeiro: score, missões do mês e próximo passo recomendado.
 * Diferencial Fluxo (não existe no Mobills).
 */

import type { Transaction, Budget } from '@/types/database';
import { getSpentByCategory } from './transaction-utils';
import { computeForecast } from './forecast';

const STORAGE_KEY_MISSIONS = 'fluxo_missions';
const STORAGE_KEY_STREAK = 'fluxo_streak';

export type MissionId =
  | 'import_extrato'
  | 'categorizar_transacoes'
  | 'criar_orcamento'
  | 'visualizar_insight';

export interface Mission {
  id: MissionId;
  label: string;
  done: boolean;
  progress?: number; // 0-100 para "categorizar X transações"
  target?: number;
}

export interface MonthMissions {
  month: string; // YYYY-MM
  missions: Mission[];
  completedAt?: Partial<Record<MissionId, string>>; // ISO date
}

function getDefaultMissions(month: string): Mission[] {
  return [
    { id: 'import_extrato', label: 'Importar extrato do mês', done: false },
    { id: 'categorizar_transacoes', label: 'Categorizar lançamentos', done: false, progress: 0, target: 5 },
    { id: 'criar_orcamento', label: 'Criar ou ajustar orçamento', done: false },
    { id: 'visualizar_insight', label: 'Ver relatório do mês', done: false },
  ];
}

function loadMissions(userId: string): MonthMissions[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_MISSIONS}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMissions(userId: string, data: MonthMissions[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_MISSIONS}_${userId}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getMissionsForMonth(
  userId: string,
  month: string,
  context: {
    transactions: Transaction[];
    budgets: Budget[];
    hasViewedReportsThisMonth?: boolean;
  }
): Mission[] {
  const all = loadMissions(userId);
  let monthData = all.find((m) => m.month === month);
  const [yearStr, monthStr] = month.split('-').map(Number);
  const prefix = `${yearStr}-${String(monthStr).padStart(2, '0')}`;
  const txThisMonth = context.transactions.filter((t) => t.date.startsWith(prefix));
  const totalTx = context.transactions.length;
  const hasImported = totalTx > 0; // simplificado: tem transação = consideramos que importou ou lançou
  const withCategory = txThisMonth.filter((t) => t.category && t.category !== 'Outros').length;
  const targetCategorize = 5;
  const hasBudget = context.budgets.length > 0;

  if (!monthData) {
    monthData = { month, missions: getDefaultMissions(month), completedAt: {} };
    all.push(monthData);
    saveMissions(userId, all);
  }

  const missions: Mission[] = monthData.missions.map((m) => {
    if (m.id === 'import_extrato') {
      return { ...m, done: hasImported || m.done };
    }
    if (m.id === 'categorizar_transacoes') {
      const progress = Math.min(100, Math.round((withCategory / targetCategorize) * 100));
      const done = withCategory >= targetCategorize || m.done;
      return { ...m, progress, target: targetCategorize, done };
    }
    if (m.id === 'criar_orcamento') {
      return { ...m, done: hasBudget || m.done };
    }
    if (m.id === 'visualizar_insight') {
      return { ...m, done: context.hasViewedReportsThisMonth === true || m.done };
    }
    return m;
  });

  return missions;
}

export function markMissionDone(userId: string, month: string, missionId: MissionId): void {
  const all = loadMissions(userId);
  let monthData = all.find((m) => m.month === month);
  if (!monthData) {
    monthData = { month, missions: getDefaultMissions(month), completedAt: {} };
    all.push(monthData);
  }
  monthData.missions = monthData.missions.map((m) =>
    m.id === missionId ? { ...m, done: true } : m
  );
  monthData.completedAt = monthData.completedAt ?? {};
  monthData.completedAt[missionId] = new Date().toISOString();
  saveMissions(userId, all);
}

/**
 * Score financeiro do mês (0–100).
 * Baseado: orçamento respeitado, categorização, ter orçamento, diversidade de controle.
 */
export function getFinancialScore(
  month: string,
  transactions: Transaction[],
  budgets: Budget[]
): number {
  const forecast = computeForecast(month, transactions, budgets);
  const [yearStr, monthStr] = month.split('-').map(Number);
  const prefix = `${yearStr}-${String(monthStr).padStart(2, '0')}`;
  const txThisMonth = transactions.filter((t) => t.date.startsWith(prefix));
  const expenses = txThisMonth.filter((t) => t.amount < 0);
  const withCategory = expenses.filter((t) => t.category && t.category !== 'Outros').length;

  let score = 50; // base

  // Orçamento: não estourar (+30 max)
  if (forecast.totalBudgeted > 0) {
    const pct = forecast.totalSpent / forecast.totalBudgeted;
    if (pct <= 1) score += 30 * (1 - pct);
    else score -= 20;
  } else {
    score += 10; // tem dados mas sem orçamento
  }

  // Categorização: boa parte categorizada (+10)
  if (expenses.length > 0) {
    const ratio = withCategory / expenses.length;
    score += Math.round(10 * ratio);
  }

  // Ter orçamento definido (+10)
  if (budgets.length > 0) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

const TARGET_CATEGORIZE = 5;

/**
 * Sugestões para subir o score (2–3 itens).
 */
export function getScoreSuggestions(
  month: string,
  transactions: Transaction[],
  budgets: Budget[]
): string[] {
  const suggestions: string[] = [];
  const [yearStr, monthStr] = month.split('-').map(Number);
  const prefix = `${yearStr}-${String(monthStr).padStart(2, '0')}`;
  const txThisMonth = transactions.filter((t) => t.date.startsWith(prefix));
  const expenses = txThisMonth.filter((t) => t.amount < 0);
  const withCategory = expenses.filter((t) => t.category && t.category !== 'Outros').length;
  const forecast = computeForecast(month, transactions, budgets);

  if (budgets.length === 0) {
    suggestions.push('Crie 1 orçamento');
  }
  if (expenses.length > 0 && withCategory < Math.min(expenses.length, TARGET_CATEGORIZE)) {
    const need = Math.max(0, TARGET_CATEGORIZE - withCategory);
    suggestions.push(`Categorize ${need} lançamento(s)`);
  }
  if (forecast.totalBudgeted > 0 && forecast.totalSpent >= forecast.totalBudgeted) {
    suggestions.push('Revise gastos para não estourar');
  }
  return suggestions.slice(0, 3);
}

/**
 * Próximo passo recomendado (missão do mês com maior prioridade não feita).
 */
export function getRecommendedNextStep(
  userId: string,
  month: string,
  context: {
    transactions: Transaction[];
    budgets: Budget[];
    hasViewedReportsThisMonth?: boolean;
  }
): { mission: Mission; cta: string; route: string } | null {
  const missions = getMissionsForMonth(userId, month, context);
  const order: MissionId[] = ['import_extrato', 'categorizar_transacoes', 'criar_orcamento', 'visualizar_insight'];
  for (const id of order) {
    const m = missions.find((x) => x.id === id);
    if (m && !m.done) {
      const ctas: Record<MissionId, string> = {
        import_extrato: 'Importar extrato',
        categorizar_transacoes: 'Categorizar lançamentos',
        criar_orcamento: 'Criar orçamento',
        visualizar_insight: 'Ver relatório',
      };
      const routes: Record<MissionId, string> = {
        import_extrato: '/import',
        categorizar_transacoes: '/transactions',
        criar_orcamento: '/budgets',
        visualizar_insight: '/reports/analise',
      };
      return { mission: m, cta: ctas[id], route: routes[id] };
    }
  }
  return null;
}

/**
 * Streak: meses seguidos com score >= 70 (persistido em localStorage).
 */
export function getStreak(userId: string, currentMonth: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_STREAK}_${userId}`);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { lastMonth: string; streak: number };
    // Streak quebra se pular mês; simplificado: só guardamos último mês e streak
    const [y, m] = currentMonth.split('-').map(Number);
    const prevMonth = m === 1 ? `${y! - 1}-12` : `${y}-${String(m! - 1).padStart(2, '0')}`;
    if (data.lastMonth === prevMonth) return data.streak;
    if (data.lastMonth === currentMonth) return data.streak;
    return 0;
  } catch {
    return 0;
  }
}

export function updateStreak(userId: string, month: string, score: number): void {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_STREAK}_${userId}`);
    const data = raw ? JSON.parse(raw) : { lastMonth: '', streak: 0 };
    const [y, m] = month.split('-').map(Number);
    const prevMonth = m === 1 ? `${y! - 1}-12` : `${y}-${String(m! - 1).padStart(2, '0')}`;

    if (score >= 70) {
      if (data.lastMonth === prevMonth) {
        data.streak = (data.streak || 0) + 1;
      } else if (data.lastMonth !== month) {
        data.streak = 1;
      }
      data.lastMonth = month;
    } else {
      data.streak = 0;
      data.lastMonth = month;
    }
    localStorage.setItem(`${STORAGE_KEY_STREAK}_${userId}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}
