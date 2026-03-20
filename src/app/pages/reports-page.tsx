import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Brain, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';
import { EmptyState } from '@/app/components/patterns';
import { emptyStates } from '@/content/microcopy';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { getSpentByCategory, getExpenseTotal } from '@/lib/transaction-utils';
import {
  getSpendingTypeDistribution,
  getSpendingTypeEvolution,
} from '@/lib/mindful-utils';
import { formatCurrencyBRL } from '@/lib/format-currency';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SPENDING_TYPE_LABELS: Record<string, string> = {
  ESSENTIAL: 'Essencial',
  OPTIONAL: 'Opcional',
  EMOTIONAL: 'Emocional',
};
const SPENDING_TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export const Reports = ({
  onGoToImport,
  onAddTransaction,
  onGuideClick,
}: {
  onGoToImport?: () => void;
  onAddTransaction?: () => void;
  onGuideClick?: () => void;
} = {}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) { setSelectedYear(y => y - 1); setSelectedMonth(12); }
    else setSelectedMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (selectedMonth === 12) { setSelectedYear(y => y + 1); setSelectedMonth(1); }
    else setSelectedMonth(m => m + 1);
  };

  const thisMonthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const [prevY, prevM] = selectedMonth === 1 ? [selectedYear - 1, 12] : [selectedYear, selectedMonth - 1];
  const lastMonthPrefix = `${prevY}-${String(prevM).padStart(2, '0')}`;
  const txThisMonth = transactions.filter((t) => t.amount < 0 && t.date.startsWith(thisMonthPrefix));
  const txLastMonth = transactions.filter((t) => t.amount < 0 && t.date.startsWith(lastMonthPrefix));
  const gastosThisMonth = getExpenseTotal(txThisMonth);
  const gastosLastMonth = getExpenseTotal(txLastMonth);
  const comparacaoPercent =
    gastosLastMonth > 0
      ? Math.round(((gastosThisMonth - gastosLastMonth) / gastosLastMonth) * 100)
      : 0;

  const spentByCategory = getSpentByCategory(txThisMonth);
  const categoriasMaisCaras = Object.entries(spentByCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const distribution = getSpendingTypeDistribution(transactions);
  const evolution = getSpendingTypeEvolution(transactions);

  const totalTyped = Object.values(distribution).reduce((a, b) => a + b, 0);
  const hasMindfulData = totalTyped > 0;

  const pieData = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value], i) => ({
      name: SPENDING_TYPE_LABELS[name] || name,
      value,
      color: SPENDING_TYPE_COLORS[i % SPENDING_TYPE_COLORS.length],
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasExpenses = transactions.filter((t) => t.amount < 0).length > 0;

  const monthSelector = (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
      <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Mês anterior">
        <ChevronLeft size={20} />
      </button>
      <span className="min-w-[140px] text-center font-semibold text-sm">
        {MONTHS[selectedMonth - 1]} {selectedYear}
      </span>
      <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Próximo mês">
        <ChevronRight size={20} />
      </button>
    </div>
  );

  if (!hasExpenses) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" data-tour="fluxia-reports-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Relatórios</h2>
            <p className="text-foreground/80">
              Análise simples dos seus gastos. Comparação mensal, categorias e comportamento.
            </p>
          </div>
          {monthSelector}
        </div>
        <EmptyState
          icon={<TrendingUp size={28} />}
          title={emptyStates.reports.title}
          description={emptyStates.reports.description}
          primaryAction={onGoToImport ? { label: emptyStates.reports.primaryCta, onClick: onGoToImport } : undefined}
          secondaryAction={onAddTransaction ? { label: emptyStates.reports.secondaryCta, onClick: onAddTransaction } : undefined}
          onGuideClick={onGuideClick}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" data-tour="fluxia-reports-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-foreground/80">
            Análise simples dos seus gastos. Comparação mensal, categorias e comportamento.
          </p>
        </div>
        {monthSelector}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Comparação mensal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gastos deste mês vs mês passado.
          </p>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{MONTHS[selectedMonth - 1]}</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrencyBRL(gastosThisMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{MONTHS[prevM - 1]}</p>
              <p className="text-xl font-medium text-muted-foreground">{formatCurrencyBRL(gastosLastMonth)}</p>
            </div>
            {gastosLastMonth > 0 && (
              <span
                className={cn(
                  'text-sm font-medium',
                  comparacaoPercent > 0 ? 'text-destructive' : comparacaoPercent < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                )}
              >
                {comparacaoPercent > 0 ? '+' : ''}{comparacaoPercent}%
              </span>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Categorias mais caras</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Onde você mais gastou em {MONTHS[selectedMonth - 1]}.
          </p>
          {categoriasMaisCaras.length > 0 ? (
            <ul className="space-y-2">
              {categoriasMaisCaras.map(([cat, value]) => (
                <li key={cat} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{cat}</span>
                  <span className="text-destructive font-semibold">{formatCurrencyBRL(value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum gasto registrado.</p>
          )}
        </Card>
      </div>

      {hasMindfulData ? (
        <>
          <Card className="p-6 [&_.recharts-legend-item-text]:fill-[hsl(var(--foreground))]">
            <div className="flex items-center gap-2 mb-6">
              <Brain size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Relatório por comportamento</h3>
            </div>
            <p className="text-sm text-foreground/80 mb-4">
              Gastos classificados como Essencial, Opcional ou Emocional.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-[280px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatCurrencyBRL(v)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="space-y-4">
                {Object.entries(distribution)
                  .filter(([, v]) => v > 0)
                  .map(([key], i) => (
                    <div key={key} className="flex items-center justify-between text-foreground">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: SPENDING_TYPE_COLORS[i % SPENDING_TYPE_COLORS.length],
                          }}
                        />
                        <span>{SPENDING_TYPE_LABELS[key] || key}</span>
                      </div>
                      <span className="font-medium">{formatCurrencyBRL(distribution[key as keyof typeof distribution])}</span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          <Card className="p-6 [&_.recharts-legend-item-text]:fill-[hsl(var(--foreground))]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={22} className="text-primary" />
              <h3 className="font-semibold text-lg">Evolução de gastos por tipo</h3>
            </div>
            <div className="h-[300px]">
              {evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip
                      formatter={(v: number) => formatCurrencyBRL(v)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="ESSENTIAL" name="Essencial" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="OPTIONAL" name="Opcional" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="EMOTIONAL" name="Emocional" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-foreground/70">
                  Poucos dados para evolução
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <Brain size={48} className="mx-auto mb-4 text-foreground/70" />
          <h3 className="font-semibold text-lg mb-2">Relatório por comportamento</h3>
          <p className="text-foreground/85 max-w-md mx-auto mb-4">
            Ao registrar gastos, classifique como Essencial, Opcional ou Emocional.
            A análise por comportamento aparecerá aqui.
          </p>
          <p className="text-sm text-foreground/70">
            Adicione lançamentos e marque o tipo de gasto para começar.
          </p>
        </Card>
      )}
    </div>
  );
};
