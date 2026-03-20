import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Card, Button, cn } from './ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import {
  getIncomeTotal,
  getExpenseTotal,
  getBalance,
  getPieDataFromTransactions,
} from '@/lib/transaction-utils';
import { getSpendingTypeDistribution } from '@/lib/mindful-utils';
import { getCategoryIcon } from '@/lib/category-icons';
import { useForecast } from '@/hooks/useForecast';
import {
  getFinancialScore,
  getRecommendedNextStep,
  getMissionsForMonth,
  getScoreSuggestions,
  updateStreak,
  type MissionId,
} from '@/lib/journey';
import { KPIGroup, SectionCard, PrimaryCTA, EmptyState, SuccessBanner, ScoreRadial, InlineHint } from './patterns';
import { emptyStates, labels, hints, success, dashboardActionTitles, ctas } from '@/content/microcopy';
import { formatCurrencyBRL } from '@/lib/format-currency';
import { Upload } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function prevMonth(y: number, m: number) {
  if (m === 1) return { year: y - 1, month: 12 };
  return { year: y, month: m - 1 };
}

function nextMonth(y: number, m: number) {
  if (m === 12) return { year: y + 1, month: 1 };
  return { year: y, month: m + 1 };
}

const ChartTooltip = ({
  active,
  payload,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { name?: string; value?: number } }>;
  formatter?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const displayName = (item?.payload as { name?: string })?.name ?? item?.name ?? '';
  const val = Number(item?.value ?? item?.payload?.value ?? 0);
  const fmt = formatter ?? ((v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  return (
    <div className="px-4 py-3 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg">
      <p className="font-semibold text-foreground">{displayName}: {fmt(val)}</p>
    </div>
  );
};

export const Dashboard = ({
  onAddTransaction,
  onGoToTransactions,
  onGoToBudgets,
  onGoToFixedExpenses,
  onGoToReports,
  onGoToImport,
  onGuideClick,
}: {
  onAddTransaction?: () => void;
  onGoToTransactions?: () => void;
  onGoToBudgets?: () => void;
  onGoToFixedExpenses?: () => void;
  onGoToReports?: () => void;
  onGoToImport?: () => void;
  onGuideClick?: () => void;
}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const { expenses: fixedExpenses } = useFixedExpenses(user?.id);
  const { profile: financialProfile } = useFinancialProfile(user?.id);
  const fixedTotal = fixedExpenses.filter((e) => e.is_active).reduce((s, e) => s + e.amount, 0);
  const monthlyIncome = financialProfile?.monthly_income ?? 0;
  const fixedPercentOfIncome = monthlyIncome > 0 ? Math.round((fixedTotal / monthlyIncome) * 100) : null;
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const currentMonthKey = getMonthKey(selectedYear, selectedMonth);

  const txForMonth = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return transactions.filter((t) => t.date.startsWith(prefix));
  }, [transactions, selectedYear, selectedMonth]);

  const forecast = useForecast(currentMonthKey, transactions, budgets);
  const income = getIncomeTotal(txForMonth);
  const expense = getExpenseTotal(txForMonth);
  const balance = getBalance(txForMonth);
  const dataPie = getPieDataFromTransactions(txForMonth);
  const latestTx = txForMonth
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const score = useMemo(
    () => getFinancialScore(currentMonthKey, transactions, budgets),
    [currentMonthKey, transactions, budgets]
  );

  React.useEffect(() => {
    if (user?.id && score >= 0) updateStreak(user.id, currentMonthKey, score);
  }, [user?.id, currentMonthKey, score]);

  const nextStep = useMemo(
    () =>
      user?.id
        ? getRecommendedNextStep(user.id, currentMonthKey, {
            transactions,
            budgets,
          })
        : null,
    [user?.id, currentMonthKey, transactions, budgets]
  );

  const missions = useMemo(
    () =>
      user?.id
        ? getMissionsForMonth(user.id, currentMonthKey, {
            transactions,
            budgets,
          })
        : [],
    [user?.id, currentMonthKey, transactions, budgets]
  );

  const withCategoryCount = useMemo(
    () => txForMonth.filter((t) => t.amount < 0 && t.category && t.category !== 'Outros').length,
    [txForMonth]
  );

  const scoreSuggestions = useMemo(
    () => getScoreSuggestions(currentMonthKey, transactions, budgets),
    [currentMonthKey, transactions, budgets]
  );

  const dominantAction = useMemo((): {
    title: string;
    ctaLabel: string;
    onCta: () => void;
    secondary?: { label: string; onClick: () => void };
  } | null => {
    if (txForMonth.length === 0) {
      return {
        title: dashboardActionTitles.importFirst,
        ctaLabel: emptyStates.dashboard.primaryCta,
        onCta: () => onGoToImport?.(),
        secondary: onAddTransaction
          ? { label: emptyStates.dashboard.secondaryCta, onClick: onAddTransaction }
          : undefined,
      };
    }
    if (withCategoryCount < 5 && onGoToTransactions) {
      return { title: dashboardActionTitles.categorize, ctaLabel: 'Categorizar lançamentos', onCta: onGoToTransactions };
    }
    if (budgets.length === 0 && onGoToBudgets) {
      return { title: dashboardActionTitles.createBudget, ctaLabel: 'Criar orçamento', onCta: onGoToBudgets };
    }
    if (!nextStep && onGoToReports) {
      return { title: dashboardActionTitles.seeReport, ctaLabel: 'Ver relatório do mês', onCta: onGoToReports };
    }
    if (nextStep) {
      return {
        title: nextStep.mission.label,
        ctaLabel: nextStep.cta,
        onCta: () => handleMissionCta(nextStep!.mission.id),
      };
    }
    return null;
  }, [txForMonth.length, withCategoryCount, budgets.length, nextStep, onGoToImport, onAddTransaction, onGoToTransactions, onGoToBudgets, onGoToReports]);

  const [searchParams, setSearchParams] = useSearchParams();
  const importSuccess = searchParams.get('import') === 'success';
  const importCount = searchParams.get('importCount');

  const handlePrevMonth = () => {
    const { year, month } = prevMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = nextMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleMissionCta = (missionId: MissionId) => {
    if (missionId === 'import_extrato' && onGoToImport) onGoToImport();
    else if (missionId === 'categorizar_transacoes' && onGoToTransactions) onGoToTransactions();
    else if (missionId === 'criar_orcamento' && onGoToBudgets) onGoToBudgets();
    else if (missionId === 'visualizar_insight' && onGoToReports) onGoToReports();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {importSuccess && (
        <SuccessBanner
          message={importCount ? success.importDone.replace('{count}', importCount) : 'Importação concluída.'}
          onDismiss={() => setSearchParams({})}
          action={onGoToTransactions ? { label: success.importDoneCta, onClick: () => { setSearchParams({}); onGoToTransactions(); } } : undefined}
        />
      )}

      {/* Empty state: sem dados no mês */}
      {txForMonth.length === 0 && (
        <EmptyState
          icon={<Upload size={28} />}
          title={emptyStates.dashboard.title}
          description={emptyStates.dashboard.description}
          bullets={emptyStates.dashboard.bullets}
          primaryAction={onGoToImport ? { label: emptyStates.dashboard.primaryCta, onClick: onGoToImport } : undefined}
          secondaryAction={onAddTransaction ? { label: emptyStates.dashboard.secondaryCta, onClick: onAddTransaction } : undefined}
          onGuideClick={onGuideClick}
        />
      )}

      {/* Seletor de mês */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{labels.visaoDoMes}</h2>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[140px] text-center font-semibold text-sm">
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* KPIs: Gastos, Receitas, Saldo */}
      <KPIGroup
        items={[
          { label: labels.kpiGastos, value: formatCurrencyBRL(expense), variant: 'negative' },
          { label: labels.kpiReceitas, value: formatCurrencyBRL(income), variant: 'positive' },
          { label: labels.kpiSaldo, value: formatCurrencyBRL(balance) },
        ]}
      />

      {/* Ação principal do mês (oculto quando sem dados; EmptyState já orienta) */}
      {dominantAction && txForMonth.length > 0 && (
        <SectionCard
          title={labels.acaoPrincipal}
          action={
            <PrimaryCTA onClick={dominantAction.onCta} icon={<ArrowRight size={18} />}>
              {dominantAction.ctaLabel}
            </PrimaryCTA>
          }
        >
          <p className="text-muted-foreground">{dominantAction.title}</p>
          {dominantAction.secondary && (
            <Button variant="outline" size="sm" className="mt-2" onClick={dominantAction.secondary.onClick}>
              {dominantAction.secondary.label}
            </Button>
          )}
        </SectionCard>
      )}

      {/* Score do mês (visual) */}
      <SectionCard title={labels.scoreDoMes}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div data-tour="fluxia-dashboard-score">
            <ScoreRadial value={score} size={100} strokeWidth={8} />
          </div>
          <div className="flex-1" data-tour="fluxia-dashboard-score-suggestions">
            <InlineHint className="mt-1">{hints.score}</InlineHint>
            {scoreSuggestions.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {scoreSuggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Teaser: Gastos emocionais (relatório comportamento) */}
      {onGoToReports != null && (() => {
        const dist = getSpendingTypeDistribution(txForMonth);
        const totalExpenses = Math.abs(getExpenseTotal(txForMonth));
        const emotionalTotal = dist.EMOTIONAL ?? 0;
        const emotionalPercent = totalExpenses > 0 ? Math.round((emotionalTotal / totalExpenses) * 100) : 0;
        const hasTyped = totalExpenses > 0 && (dist.ESSENTIAL + dist.OPTIONAL + dist.EMOTIONAL) > 0;
        return (
          <SectionCard
            title="Gastos emocionais"
            action={
              <Button variant="outline" size="sm" onClick={onGoToReports}>
                {ctas.verRelatorioComportamento}
              </Button>
            }
          >
            <p className="text-2xl font-bold">{emotionalPercent}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasTyped
                ? 'Gastos emocionais neste mês.'
                : 'Comece marcando seus lançamentos como Essencial, Opcional ou Emocional.'}
            </p>
          </SectionCard>
        );
      })()}

      {/* Contas fixas do mês */}
      {onGoToFixedExpenses != null && (
        <SectionCard
          title={labels.contasFixasDoMes}
          action={
            onGoToFixedExpenses ? (
              <Button variant="outline" size="sm" onClick={onGoToFixedExpenses}>
                {labels.gerenciarContasFixas}
              </Button>
            ) : undefined
          }
        >
          <p className="text-2xl font-bold">{formatCurrencyBRL(fixedTotal)}</p>
          {fixedPercentOfIncome != null && monthlyIncome > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {labels.percentualRenda.replace('{percent}', String(fixedPercentOfIncome))}
            </p>
          )}
        </SectionCard>
      )}

      {/* Missões do mês - checklist */}
      {missions.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            {labels.missoesDoMes}
          </h3>
          <ul className="space-y-2">
            {missions.map((m) => (
              <li
                key={m.id}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  m.done ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {m.done ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={18} className="text-muted-foreground shrink-0" />
                )}
                <span className={m.done ? 'line-through' : ''}>{m.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Gráfico por categoria + Últimas transações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Gastos por categoria</h3>
          <div className="h-[220px] w-full">
            {dataPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => formatCurrencyBRL(v)} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum gasto neste mês
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {dataPie.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
                <span className="font-medium shrink-0 ml-auto">{formatCurrencyBRL(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Últimas transações</h3>
            {onGoToTransactions && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary gap-1"
                onClick={onGoToTransactions}
              >
                Ver todas <ArrowRight size={14} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {latestTx.length > 0 ? (
              latestTx.map((tx) => {
                const Icon = getCategoryIcon(tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} · {tx.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'font-semibold tabular-nums shrink-0 ml-2',
                        isIncome ? 'text-emerald-500' : 'text-destructive'
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrencyBRL(Math.abs(tx.amount))}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma transação neste mês
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Forecast compacto: "No ritmo atual, estoura em X dias" (só se houver orçamento em risco) */}
      {forecast.byCategory.some((c) => c.daysUntilOverflow !== null && c.daysUntilOverflow <= c.daysRemaining) && (
        <Card className="p-4 border-orange-500/20 bg-orange-500/5">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Atenção ao orçamento</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {forecast.byCategory
              .filter((c) => c.daysUntilOverflow !== null && c.daysUntilOverflow <= c.daysRemaining)
              .map((c) => (
                <li key={c.category}>
                  No ritmo atual, <strong className="text-foreground">{c.category}</strong> estoura em{' '}
                  {c.daysUntilOverflow} dia(s). Reduzir {formatCurrencyBRL(c.suggestedDailyLimit)}/dia para não estourar.
                </li>
              ))}
          </ul>
          {onGoToBudgets && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onGoToBudgets}>
              Ajustar orçamentos
            </Button>
          )}
        </Card>
      )}
    </motion.div>
  );
}
