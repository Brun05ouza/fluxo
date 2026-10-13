import { neon } from '@/lib/neon';
import type { OnboardingData } from '@/types/database';

/** Dias de vencimento padrão para contas criadas no onboarding */
export const ONBOARDING_DUE_DAY_RENT = 5;
export const ONBOARDING_DUE_DAY_ELECTRICITY = 10;

export interface OnboardingAnswers {
  payDay?: number;
  rentDueDay?: number;
  electricityDueDay?: number;
  mainIncome: number;
  hasExtraIncome: boolean;
  extraLabel: string;
  extraAmount: number;
  hasRent: boolean;
  rentAmount: number;
  hasElectricity: boolean;
  electricityAmount: number;
  foodBudget: number;
  hasEmergency: boolean;
  emergencyAmount: number;
  leisureBudget: number;
}

export function parseMoneyBR(input: string): number {
  const s = input.trim().replace(/\s/g, '');
  if (!s) return 0;
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Persiste perfil, contas fixas e orçamentos após o onboarding.
 */
export async function completeOnboarding(
  userId: string,
  answers: OnboardingAnswers
): Promise<{ error: Error | null }> {
  const extraIncomes =
    answers.hasExtraIncome && answers.extraAmount > 0 && answers.extraLabel.trim()
      ? [{ label: answers.extraLabel.trim(), amount: answers.extraAmount }]
      : undefined;

  const totalIncome =
    answers.mainIncome + (answers.hasExtraIncome ? answers.extraAmount : 0);

  const onboardingData: OnboardingData | null =
    extraIncomes && extraIncomes.length > 0 ? { extraIncomes } : null;

  const now = new Date().toISOString();

  const { error: profileError } = await neon.from('financial_profile').upsert(
    {
      id: userId,
      monthly_income: totalIncome,
      pay_day: Math.min(31, Math.max(1, answers.payDay || 1)),
      onboarding_completed_at: now,
      onboarding_data: onboardingData,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    return { error: new Error(profileError.message) };
  }

  const fixedRows: Array<{
    title: string;
    amount: number;
    due_day: number;
    category: string;
    is_active: boolean;
  }> = [];

  if (answers.hasRent && answers.rentAmount > 0) {
    fixedRows.push({
      title: 'Aluguel / moradia',
      amount: answers.rentAmount,
      due_day: Math.min(31, Math.max(1, answers.rentDueDay || ONBOARDING_DUE_DAY_RENT)),
      category: 'Moradia',
      is_active: true,
    });
  }

  if (answers.hasElectricity && answers.electricityAmount > 0) {
    fixedRows.push({
      title: 'Energia elétrica',
      amount: answers.electricityAmount,
      due_day: Math.min(31, Math.max(1, answers.electricityDueDay || ONBOARDING_DUE_DAY_ELECTRICITY)),
      category: 'Casa',
      is_active: true,
    });
  }

  if (fixedRows.length > 0) {
    const { error: fixedError } = await neon.from('fixed_expenses').insert(
      fixedRows.map((row) => ({
        user_id: userId,
        ...row,
      }))
    );
    if (fixedError) {
      return { error: new Error(fixedError.message) };
    }
  }

  const budgetRows: Array<{ category: string; limit_amount: number }> = [];

  if (answers.foodBudget > 0) {
    budgetRows.push({ category: 'Alimentação', limit_amount: answers.foodBudget });
  }
  if (answers.hasEmergency && answers.emergencyAmount > 0) {
    budgetRows.push({ category: 'Extra', limit_amount: answers.emergencyAmount });
  }
  if (answers.leisureBudget > 0) {
    budgetRows.push({ category: 'Lazer', limit_amount: answers.leisureBudget });
  }

  if (budgetRows.length > 0) {
    const { error: budgetError } = await neon.from('budgets').insert(
      budgetRows.map((b) => ({
        user_id: userId,
        category: b.category,
        limit_amount: b.limit_amount,
      }))
    );
    if (budgetError) {
      return { error: new Error(budgetError.message) };
    }
  }

  return { error: null };
}
