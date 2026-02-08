import { describe, it, expect } from 'vitest';
import { computeForecast, getAlertMessageForCategory } from './forecast';
import type { Transaction, Budget } from '@/types/database';

const baseTx = (
  overrides: Partial<Transaction> = {}
): Transaction =>
  ({
    id: '1',
    user_id: 'u1',
    title: 'Test',
    description: null,
    category: 'Alimentação',
    amount: -100,
    date: '2025-02-15',
    payment_method: 'Pix',
    tags: [],
    is_recurring: false,
    created_at: '2025-02-15T00:00:00Z',
    ...overrides,
  }) as Transaction;

const baseBudget = (overrides: Partial<Budget> = {}): Budget =>
  ({
    id: '1',
    user_id: 'u1',
    category: 'Alimentação',
    limit_amount: 1000,
    created_at: '2025-01-01',
    ...overrides,
  }) as Budget;

describe('computeForecast', () => {
  it('calcula dailyAvg e forecastEndMonth corretamente', () => {
    const transactions = [
      baseTx({ date: '2025-02-01', amount: -100 }),
      baseTx({ date: '2025-02-02', amount: -100 }),
      baseTx({ date: '2025-02-03', amount: -100 }),
    ];
    const budgets = [baseBudget({ category: 'Alimentação', limit_amount: 1000 })];
    const result = computeForecast('2025-02', transactions, budgets);

    expect(result.totalSpent).toBe(300);
    expect(result.dayOfMonth).toBeGreaterThanOrEqual(1);
    expect(result.dailyAvg).toBe(300 / result.dayOfMonth);
    expect(result.daysInMonth).toBe(28);
    expect(result.forecastEndMonth).toBe(
      (300 / result.dayOfMonth) * 28
    );
  });

  it('retorna riskLevel OK quando gasto < 80%', () => {
    const transactions = [
      baseTx({ date: '2025-02-01', amount: -100 }),
      baseTx({ date: '2025-02-02', amount: -100 }),
    ];
    const budgets = [baseBudget({ category: 'Alimentação', limit_amount: 1000 })];
    const result = computeForecast('2025-02', transactions, budgets);

    const cat = result.byCategory.find((c) => c.category === 'Alimentação');
    expect(cat).toBeDefined();
    expect(cat!.percentUsed).toBeLessThan(80);
    expect(cat!.riskLevel).toBe('OK');
  });

  it('retorna riskLevel WARNING quando gasto >= 80%', () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      baseTx({ date: `2025-02-${String(i + 1).padStart(2, '0')}`, amount: -85 })
    );
    const budgets = [baseBudget({ category: 'Alimentação', limit_amount: 1000 })];
    const result = computeForecast('2025-02', transactions, budgets);

    const cat = result.byCategory.find((c) => c.category === 'Alimentação');
    expect(cat).toBeDefined();
    expect(cat!.percentUsed).toBeGreaterThanOrEqual(80);
    expect(['WARNING', 'DANGER']).toContain(cat!.riskLevel);
  });

  it('retorna riskLevel DANGER quando gasto >= 100%', () => {
    const transactions = [
      baseTx({ date: '2025-02-01', amount: -600 }),
      baseTx({ date: '2025-02-02', amount: -500 }),
    ];
    const budgets = [baseBudget({ category: 'Alimentação', limit_amount: 1000 })];
    const result = computeForecast('2025-02', transactions, budgets);

    const cat = result.byCategory.find((c) => c.category === 'Alimentação');
    expect(cat).toBeDefined();
    expect(cat!.percentUsed).toBeGreaterThanOrEqual(100);
    expect(cat!.riskLevel).toBe('DANGER');
  });

  it('calcula suggestedDailyLimit quando há dias restantes', () => {
    const transactions = [
      baseTx({ date: '2025-02-01', amount: -200 }),
    ];
    const budgets = [baseBudget({ category: 'Alimentação', limit_amount: 1000 })];
    const result = computeForecast('2025-02', transactions, budgets);

    const cat = result.byCategory.find((c) => c.category === 'Alimentação');
    expect(cat).toBeDefined();
    expect(cat!.daysRemaining).toBeGreaterThan(0);
    expect(cat!.suggestedDailyLimit).toBe((1000 - 200) / cat!.daysRemaining);
  });
});

describe('getAlertMessageForCategory', () => {
  it('retorna null quando percent < 80', () => {
    expect(getAlertMessageForCategory('Alimentação', 50)).toBeNull();
    expect(getAlertMessageForCategory('Alimentação', 79)).toBeNull();
  });

  it('retorna mensagem quando percent >= 80 e < 100', () => {
    const msg = getAlertMessageForCategory('Alimentação', 83);
    expect(msg).toContain('83%');
    expect(msg).toContain('Alimentação');
  });

  it('retorna mensagem de limite estourado quando percent >= 100', () => {
    const msg = getAlertMessageForCategory('Alimentação', 100);
    expect(msg).toContain('100%');
    expect(msg).toContain('estourado');
  });
});
