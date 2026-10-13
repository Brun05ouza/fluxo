import { MonthlyPlan } from './MonthlyPlan';
import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  LayoutGrid,
  PieChart as PieChartIcon,
  Upload,
  Wallet,
  FileSpreadsheet,
  ListOrdered,
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
  getPieDataFromTransactions,
} from '@/lib/transaction-utils';
import { getEffectiveCashBalance } from '@/features/finance/domain/balance-engine';
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
import {
  buildTransactionParcelLabelMap,
  formatTransactionTitleWithParcel,
} from '@/lib/transaction-parcel-label';

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

function emotionalInsight(percent: number, hasTyped: boolean, totalExpenses: number): string {
  if (!hasTyped || totalExpenses <= 0) {
    return 'Classifique suas despesas como Essencial, Opcional ou Emocional para ver se há padrão de compras por impulso neste mês.';
  }
  if (percent >= 35) {
    return 'Boa parte dos gastos está em compras emocionais. Vale pausar antes do próximo impulso e rever o que pode esperar.';
  }
  if (percent >= 15) {
    return 'Há espaço para ajustar: combine obrigações com lazer sem perder o controle do mês.';
  }
  return 'Poucos gastos emocionais — bom equilíbrio entre necessidades e impulsos.';
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
  onAddTransaction?: (type?: 'income' | 'expense') => void;
  onGoToTransactions?: () => void;
  onGoToBudgets?: () => void;
  onGoToFixedExpenses?: () => void;
  onGoToReports?: () => void;
  onGoToImport?: () => void;
  onGuideClick?: () => void;
}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();
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

  const hasMonthData = txForMonth.length > 0;

  const forecast = useForecast(currentMonthKey, transactions, budgets);
  const income = getIncomeTotal(txForMonth);
  const expense = getExpenseTotal(txForMonth);
  const balance = getEffectiveCashBalance(txForMonth);
  const dataPie = getPieDataFromTransactions(txForMonth);
  const latestTx = useMemo(
    () =>
      txForMonth
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [txForMonth]
  );

  const parcelLabelMap = useMemo(() => buildTransactionParcelLabelMap(transactions), [transactions]);

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

  const missionProgress = useMemo(() => {
    if (!missions.length) return { done: 0, total: 0, percent: 0 };
    const done = missions.filter((m) => m.done).length;
    return { done, total: missions.length, percent: Math.round((done / missions.length) * 100) };
  }, [missions]);

  const withCategoryCount = useMemo(
    () => txForMonth.filter((t) => t.category && t.category !== 'Outros').length,
    [txForMonth]
  );

  const scoreSuggestions = useMemo(
    () => getScoreSuggestions(currentMonthKey, transactions, budgets),
    [currentMonthKey, transactions, budgets]
  );

  const handleMissionCta = useCallback(
    (missionId: MissionId) => {
      if (missionId === 'import_extrato' && onGoToImport) onGoToImport();
      else if (missionId === 'categorizar_transacoes' && onGoToTransactions) onGoToTransactions();
      else if (missionId === 'criar_orcamento' && onGoToBudgets) onGoToBudgets();
      else if (missionId === 'visualizar_insight' && onGoToReports) onGoToReports();
    },
    [onGoToImport, onGoToTransactions, onGoToBudgets, onGoToReports]
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
  }, [
    txForMonth.length,
    withCategoryCount,
    budgets.length,
    nextStep,
    onGoToImport,
    onAddTransaction,
    onGoToTransactions,
    onGoToBudgets,
    onGoToReports,
    handleMissionCta,
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const importSuccess = searchParams.get('import') === 'success';
  const importCount = searchParams.get('importCount');

  const budgetRiskCategories = useMemo(
    () =>
      forecast.byCategory.filter(
        (c) => c.daysUntilOverflow !== null && c.daysUntilOverflow <= c.daysRemaining
      ),
    [forecast.byCategory]
  );

  const distEmotional = useMemo(() => getSpendingTypeDistribution(txForMonth), [txForMonth]);
  const totalExpensesVal = Math.abs(getExpenseTotal(txForMonth));
  const emotionalTotal = distEmotional.EMOTIONAL ?? 0;
  const emotionalPercent =
    totalExpensesVal > 0 ? Math.round((emotionalTotal / totalExpensesVal) * 100) : 0;
  const hasTypedSpending =
    totalExpensesVal > 0 && (distEmotional.ESSENTIAL + distEmotional.OPTIONAL + distEmotional.EMOTIONAL) > 0;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpiItems = [
    {
      label: labels.kpiReceitas,
      value: formatCurrencyBRL(income),
      variant: 'positive' as const,
      hint: 'Total de entradas já recebidas neste mês (competência pela data do lançamento).',
    },
    {
      label: labels.kpiGastos,
      value: formatCurrencyBRL(expense),
      variant: 'negative' as const,
      hint: 'Todas as saídas lançadas no mês, pagas ou a pagar.',
    },
    {
      label: labels.kpiSaldo,
      value: formatCurrencyBRL(balance),
      variant: balance >= 0 ? ('default' as const) : ('negative' as const),
      hint: 'Quanto entrou e saiu de fato no caixa (só o quitado).',
    },
    {
      label: 'Score do mês',
      value: String(score),
      variant: score >= 70 ? ('positive' as const) : score >= 40 ? ('default' as const) : ('negative' as const),
      hint: 'Resumo rápido: orçamento, categorias e hábito. Veja sugestões abaixo para melhorar.',
    },
  ];

  const commitmentCard = (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-bold text-lg leading-tight">Comprometimento da renda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Contas fixas ativas frente à renda mensal informada no perfil.
          </p>
        </div>
        {onGoToFixedExpenses && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={onGoToFixedExpenses}>
            {labels.gerenciarContasFixas}
          </Button>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums mt-1">{formatCurrencyBRL(fixedTotal)}</p>
      <p className="text-xs text-muted-foreground mt-1">Soma das obrigações recorrentes (ativas)</p>
      {fixedPercentOfIncome != null && monthlyIncome > 0 ? (
        <p className="text-sm text-muted-foreground mt-3 leading-snug">
          {labels.percentualRenda.replace('{percent}', String(fixedPercentOfIncome))} Quanto maior o
          percentual, menos folga você tem para imprevistos no mês.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mt-3">
          Informe sua renda mensal no perfil para ver a proporção de comprometimento.
        </p>
      )}
    </Card>
  );

  const emotionalCard = (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-bold text-lg leading-tight">Gastos emocionais</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quanto das suas saídas foi marcado como compra por impulso ou emoção.
          </p>
        </div>
        {onGoToReports && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={onGoToReports}>
            {ctas.verRelatorioComportamento}
          </Button>
        )}
      </div>
      <p className="text-3xl font-bold tabular-nums mt-2">{emotionalPercent}%</p>
      <p className="text-sm text-muted-foreground mt-2 leading-snug flex-1">
        {emotionalInsight(emotionalPercent, hasTypedSpending, totalExpensesVal)}
      </p>
    </Card>
  );

  const scoreCard = (
    <SectionCard
      className="h-full"
      title={labels.scoreDoMes}
      description="Reflete orçamento, categorização e organização do mês."
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div data-tour="fluxia-dashboard-score">
          <ScoreRadial value={score} size={100} strokeWidth={8} />
        </div>
        <div className="flex-1 w-full space-y-2" data-tour="fluxia-dashboard-score-suggestions">
          <InlineHint>{hints.score}</InlineHint>
          {scoreSuggestions.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {scoreSuggestions.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Continue registrando e revisando o mês para manter o score estável.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );

  const missionsCard =
    missions.length > 0 ? (
      <Card className="p-5 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg">{labels.missoesDoMes}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pequenos passos que organizam sua rotina financeira.
            </p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground shrink-0">
            {missionProgress.done}/{missionProgress.total} concluídas
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${missionProgress.percent}%` }}
            role="progressbar"
            aria-valuenow={missionProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <ul className="space-y-2.5 flex-1">
          {missions.map((m) => (
            <li
              key={m.id}
              className={cn(
                'flex items-center gap-3 text-sm rounded-lg px-2 py-1.5 -mx-2',
                m.done ? 'text-muted-foreground bg-muted/30' : 'text-foreground'
              )}
            >
              {m.done ? (
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={20} className="text-muted-foreground/70 shrink-0" />
              )}
              <span className={cn('flex-1', m.done && 'line-through')}>{m.label}</span>
              {m.id === 'categorizar_transacoes' && m.target != null && m.progress != null && !m.done && (
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {Math.min(withCategoryCount, m.target)}/{m.target}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    ) : null;

  const shortcutsStrip = (
    <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
        Atalhos
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {onGoToImport && (
          <Button variant="outline" className="h-auto py-2.5 flex flex-col gap-1" onClick={onGoToImport}>
            <FileSpreadsheet className="size-4 opacity-80" />
            <span className="text-xs font-medium">Importar</span>
          </Button>
        )}
        {onAddTransaction && (
          <Button variant="outline" className="h-auto py-2.5 flex flex-col gap-1" onClick={() => onAddTransaction()}>
            <ListOrdered className="size-4 opacity-80" />
            <span className="text-xs font-medium">Lançamento</span>
          </Button>
        )}
        {onGoToBudgets && (
          <Button variant="outline" className="h-auto py-2.5 flex flex-col gap-1" onClick={onGoToBudgets}>
            <LayoutGrid className="size-4 opacity-80" />
            <span className="text-xs font-medium">Orçamentos</span>
          </Button>
        )}
        {onGoToReports && (
          <Button variant="outline" className="h-auto py-2.5 flex flex-col gap-1" onClick={onGoToReports}>
            <PieChartIcon className="size-4 opacity-80" />
            <span className="text-xs font-medium">Relatórios</span>
          </Button>
        )}
        {onGoToTransactions && (
          <Button variant="outline" className="h-auto py-2.5 flex flex-col gap-1" onClick={onGoToTransactions}>
            <Wallet className="size-4 opacity-80" />
            <span className="text-xs font-medium">Transações</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10 md:space-y-8"
    >
      {importSuccess && (
        <SuccessBanner
          message={importCount ? success.importDone.replace('{count}', importCount) : 'Importação concluída.'}
          onDismiss={() => setSearchParams({})}
          action={
            onGoToTransactions
              ? {
                  label: success.importDoneCta,
                  onClick: () => {
                    setSearchParams({});
                    onGoToTransactions();
                  },
                }
              : undefined
          }
        />
      )}

      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{labels.visaoDoMes}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {hasMonthData
                ? 'Resumo do mês, hábitos de gasto e próximos passos.'
                : 'Comece importando o extrato ou lançando a primeira movimentação.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 shrink-0">
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
      </header>

      <MonthlyPlan month={currentMonthKey} />
      {!hasMonthData ? (
        <>
          <EmptyState
            icon={<Upload size={28} />}
            title={emptyStates.dashboard.title}
            description={emptyStates.dashboard.description}
            bullets={emptyStates.dashboard.bullets}
            primaryAction={onGoToImport ? { label: emptyStates.dashboard.primaryCta, onClick: onGoToImport } : undefined}
            secondaryAction={onAddTransaction ? { label: emptyStates.dashboard.secondaryCta, onClick: onAddTransaction } : undefined}
            onGuideClick={onGuideClick}
          />

          <section className="space-y-3" aria-labelledby="dash-contexto">
            <h2 id="dash-contexto" className="text-lg font-semibold tracking-tight">
              Enquanto isso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 items-stretch">
              <div className="min-w-0">{commitmentCard}</div>
              <div className="min-w-0">{scoreCard}</div>
              {missionsCard && <div className="min-w-0 md:col-span-2 xl:col-span-1">{missionsCard}</div>}
            </div>
          </section>

          {shortcutsStrip}
        </>
      ) : (
        <>
          <section aria-labelledby="dash-resumo" className="space-y-3">
            <div className="sr-only">
              <h2 id="dash-resumo">Resumo financeiro do mês</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visão geral</p>
            <KPIGroup items={kpiItems} />
          </section>

          <section className="space-y-4" aria-labelledby="dash-analise">
            <div className="space-y-0.5">
              <h2 id="dash-analise" className="text-lg font-semibold tracking-tight">
                Análise
              </h2>
              <p className="text-sm text-muted-foreground">
                Onde o dinheiro foi e quanto está comprometido.
              </p>
            </div>

            {budgetRiskCategories.length > 0 && (
              <Card className="p-5 border-orange-500/30 bg-orange-500/[0.06]">
                <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">Orçamento em risco</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Com o ritmo atual, estas categorias podem estourar o limite antes do fim do mês.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {budgetRiskCategories.map((c) => (
                    <li key={c.category}>
                      <strong className="text-foreground">{c.category}</strong>: estoura em cerca de{' '}
                      <strong className="text-foreground">{c.daysUntilOverflow}</strong> dia(s). Teto sugerido:{' '}
                      {formatCurrencyBRL(c.suggestedDailyLimit)}/dia.
                    </li>
                  ))}
                </ul>
                {onGoToBudgets && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={onGoToBudgets}>
                    Ajustar orçamentos
                  </Button>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch">
              <Card className="p-5 space-y-4 w-full h-full lg:col-span-2 min-w-0 flex flex-col">
                <div>
                  <h3 className="font-bold text-lg">{labels.gastosPorCategoria}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Distribuição das despesas do mês por categoria.
                  </p>
                </div>
                {dataPie.length > 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 flex-1">
                    <div className="mx-auto sm:mx-0 size-[200px] shrink-0 sm:size-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataPie}
                            cx="50%"
                            cy="50%"
                            innerRadius="52%"
                            outerRadius="82%"
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
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 min-w-0 w-full sm:flex-1">
                      {dataPie.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-muted-foreground">{item.name}</span>
                          <span className="font-medium shrink-0 ml-auto tabular-nums">
                            {formatCurrencyBRL(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 min-h-[120px] px-4 text-muted-foreground text-sm text-center">
                    Nenhuma despesa categorizada neste mês.
                  </div>
                )}
              </Card>

              <div className="flex flex-col gap-4 lg:gap-5 min-w-0 h-full">
                <div className="flex-1 min-h-0">{emotionalCard}</div>
                <div className="flex-1 min-h-0">{commitmentCard}</div>
              </div>
            </div>

            <Card className="p-5 w-full">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-lg">{labels.ultimasTransacoes}</h3>
                {onGoToTransactions && (
                  <Button variant="ghost" size="sm" className="text-primary gap-1 shrink-0" onClick={onGoToTransactions}>
                    Ver todas <ArrowRight size={14} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">Até 5 lançamentos mais recentes deste mês.</p>
              <div className="space-y-0">
                {latestTx.map((tx) => {
                  const Icon = getCategoryIcon(tx.category);
                  const isIncome = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">
                            {formatTransactionTitleWithParcel(tx, parcelLabelMap)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString('pt-BR')} · {tx.category}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'font-semibold tabular-nums text-sm shrink-0 ml-2',
                          isIncome ? 'text-emerald-500' : 'text-destructive'
                        )}
                      >
                        {isIncome ? '+' : '-'} {formatCurrencyBRL(Math.abs(tx.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>

          <section className="space-y-4" aria-labelledby="dash-acoes">
            <div className="space-y-0.5">
              <h2 id="dash-acoes" className="text-lg font-semibold tracking-tight">
                Próximos passos
              </h2>
              <p className="text-sm text-muted-foreground">
                Score, missões e a ação com maior impacto agora.
              </p>
            </div>

            {dominantAction && (
              <SectionCard
                title={labels.acaoPrincipal}
                description="Maior impacto para o seu mês com base no que você já cadastrou."
                action={
                  <PrimaryCTA onClick={dominantAction.onCta} icon={<ArrowRight size={18} />}>
                    {dominantAction.ctaLabel}
                  </PrimaryCTA>
                }
              >
                <p className="text-sm text-foreground/90 leading-relaxed">{dominantAction.title}</p>
                {dominantAction.secondary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full sm:w-auto"
                    onClick={dominantAction.secondary.onClick}
                  >
                    {dominantAction.secondary.label}
                  </Button>
                )}
              </SectionCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
              <div className="min-w-0">{scoreCard}</div>
              {missionsCard ? (
                <div className="min-w-0">{missionsCard}</div>
              ) : (
                <div className="min-w-0 hidden lg:block" aria-hidden />
              )}
            </div>

            {shortcutsStrip}
          </section>
        </>
      )}
    </motion.div>
  );
};
