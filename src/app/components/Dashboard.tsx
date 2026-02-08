import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Banknote,
  FileText,
  Calendar,
  LineChart,
  AlertTriangle,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, Button, Badge, ProgressBar, cn } from './ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import {
  getIncomeTotal,
  getExpenseTotal,
  getBalance,
  getChartDataFromTransactions,
  getPieDataFromTransactions,
  getBudgetProgress,
  getSpentByCategory,
} from '@/lib/transaction-utils';
import { getCategoryIcon } from '@/lib/category-icons';
import { useForecast } from '@/hooks/useForecast';
import { getMindfulInsights } from '@/lib/mindful-insights';

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 16,
    }
  }
};

const chartItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const ChartTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { name?: string; value?: number } }>;
  label?: string;
  formatter?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const displayName = (item?.payload as { name?: string })?.name ?? item?.name ?? '';
  const val = Number(item?.value ?? item?.payload?.value ?? 0);
  const fmt = formatter ?? ((v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  return (
    <div className="px-4 py-3 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
      {label && <p className="text-xs text-foreground/80 mb-1">{label}</p>}
      <p className="font-semibold text-foreground">{displayName}: {fmt(val)}</p>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
  <Card className="flex flex-col gap-2 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={64} className={colorClass} />
    </div>
    <div className="flex items-center justify-between z-10">
      <div className={cn('p-2.5 rounded-xl bg-background/50 backdrop-blur-sm shadow-sm', colorClass)}>
        <Icon size={20} />
      </div>
      {trend != null && (
        <span
          className={cn(
            'text-xs font-medium flex items-center gap-1 bg-background/50 px-2 py-1 rounded-full',
            trend > 0 ? 'text-emerald-500' : 'text-red-500'
          )}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </span>
      )}
    </div>
    <div className="mt-4 z-10 space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{value}</h3>
    </div>
  </Card>
);

export const Dashboard = ({
  onAddTransaction,
  onGoToTransactions,
  onGoToBudgets,
  onGoToFixedExpenses,
  onGoToReports,
}: {
  onAddTransaction?: () => void;
  onGoToTransactions?: () => void;
  onGoToBudgets?: () => void;
  onGoToFixedExpenses?: () => void;
  onGoToReports?: () => void;
}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const { profile } = useFinancialProfile(user?.id);
  const { expenses } = useFixedExpenses(user?.id);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const forecast = useForecast(currentMonth, transactions, budgets);

  const monthlyIncome = profile?.monthly_income ?? 0;
  const fixedTotal = expenses.filter((e) => e.is_active).reduce((s, e) => s + e.amount, 0);
  const availableAfterFixed = monthlyIncome - fixedTotal;
  const upcomingExpenses = [...expenses.filter((e) => e.is_active)]
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 5);

  const income = getIncomeTotal(transactions);
  const expense = getExpenseTotal(transactions);
  const balance = getBalance(transactions);
  const spentByCategory = getSpentByCategory(transactions);
  const budgetProgress = getBudgetProgress(budgets, spentByCategory);
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0);
  const budgetPercent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const dataLine = getChartDataFromTransactions(transactions);
  const dataPie = getPieDataFromTransactions(transactions);
  const latestTx = transactions.slice(0, 5);
  const mindfulInsights = getMindfulInsights(transactions);
  const [searchParams, setSearchParams] = useSearchParams();
  const importSuccess = searchParams.get('import') === 'success';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-8"
    >
      {importSuccess && (
        <motion.div variants={itemVariants} className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            Tudo certo! Seu mês está pronto.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="text-sm text-emerald-600 hover:underline"
          >
            Fechar
          </button>
        </motion.div>
      )}
      {/* Fluxo de caixa: Renda, Obrigações, Disponível */}
      {(monthlyIncome > 0 || fixedTotal > 0) && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 shadow-sm">
                <Banknote size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renda mensal</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyIncome)}</p>
                {profile?.pay_day && (
                  <p className="text-xs text-muted-foreground">Recebe dia {profile.pay_day}</p>
                )}
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-red-500/5 border-red-500/20 hover:bg-red-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 shadow-sm">
                <FileText size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Obrigações do mês</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(fixedTotal)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 shadow-sm">
                <Wallet size={24} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponível</p>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(availableAfterFixed)}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(balance)}
          icon={Wallet}
          colorClass="text-blue-500"
        />
        <StatCard title="Recebido" value={formatCurrency(income)} icon={TrendingUp} colorClass="text-emerald-500" />
        <StatCard
          title="Gastos do Mês"
          value={formatCurrency(expense)}
          icon={TrendingDown}
          colorClass="text-red-500"
        />
        <Card className="flex flex-col gap-4 justify-between hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Orçamento Usado</p>
            <Badge variant={budgetPercent >= 100 ? 'destructive' : budgetPercent >= 80 ? 'warning' : 'default'} className="rounded-full px-2.5">
              {totalBudgeted > 0 ? Math.round(budgetPercent) + '%' : '—'}
            </Badge>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalBudgeted > 0 ? formatCurrency(totalSpent) : '—'}
            </h3>
            <ProgressBar
              value={Math.min(budgetPercent, 100)}
              color={budgetPercent >= 100 ? 'destructive' : budgetPercent >= 80 ? 'warning' : 'primary'}
              className="h-2"
            />
          </div>
        </Card>
      </motion.div>

      {/* Previsão do mês + Risco por categoria */}
      {(forecast.byCategory.length > 0) && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <LineChart size={22} />
              </div>
              <h3 className="font-bold text-lg">Previsão do mês</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Com o ritmo atual de gastos, você deve fechar o mês em{' '}
              <strong className="text-foreground text-base">{formatCurrency(forecast.forecastEndMonth)}</strong>.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">Média diária</span>
                <span className="font-medium">{formatCurrency(forecast.dailyAvg)}/dia</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Limite sugerido</span>
                <span className="font-medium">{formatCurrency(forecast.suggestedDailyLimit)}/dia</span>
              </div>
            </div>
            <div
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl text-sm font-medium border',
                forecast.riskLevel === 'DANGER' && 'bg-red-500/10 text-red-600 border-red-500/20',
                forecast.riskLevel === 'WARNING' && 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                forecast.riskLevel === 'OK' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              )}
            >
              {forecast.riskLevel === 'DANGER' && <AlertTriangle size={20} className="shrink-0" />}
              {forecast.riskLevel === 'WARNING' && <AlertTriangle size={20} className="shrink-0" />}
              {forecast.riskLevel === 'OK' && <CheckCircle2 size={20} className="shrink-0" />}
              <span>
                {forecast.riskLevel === 'DANGER' && 'Risco alto: orçamento estourado.'}
                {forecast.riskLevel === 'WARNING' && 'Atenção: >80% do orçamento usado.'}
                {forecast.riskLevel === 'OK' && 'Tudo certo! Gastos sob controle.'}
              </span>
            </div>
          </Card>
          <Card className="lg:col-span-2 p-6 space-y-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              Risco por categoria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forecast.byCategory.map((cat) => {
                const Icon = getCategoryIcon(cat.category);
                const riskColor =
                  cat.riskLevel === 'DANGER' ? 'destructive' : cat.riskLevel === 'WARNING' ? 'warning' : 'primary';
                return (
                  <div key={cat.category} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-background shadow-sm text-muted-foreground">
                          <Icon size={16} />
                        </div>
                        <span className="font-semibold">{cat.category}</span>
                      </div>
                      <Badge
                        variant={
                          cat.riskLevel === 'DANGER' ? 'destructive' : cat.riskLevel === 'WARNING' ? 'warning' : 'default'
                        }
                        className="text-[10px] h-5 px-1.5"
                      >
                        {cat.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Gasto: {formatCurrency(cat.spent)}</span>
                      <span>Limite: {formatCurrency(cat.limit)}</span>
                    </div>
                    <ProgressBar value={Math.min(cat.percentUsed, 100)} color={riskColor} className="h-1.5" />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={onGoToBudgets} className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
                Ajustar orçamentos
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {mindfulInsights.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6 space-y-4 border-l-4 border-l-primary/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary animate-pulse">
                <Brain size={22} />
              </div>
              <h3 className="font-bold text-lg">Insights Mindful</h3>
              {onGoToReports && (
                <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-primary" onClick={onGoToReports}>
                  Ver relatórios
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mindfulInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all hover:scale-[1.01]',
                    insight.type === 'warning' && 'border-orange-500/30 bg-orange-500/5',
                    insight.type === 'info' && 'border-primary/30 bg-primary/5',
                    insight.type === 'success' && 'border-emerald-500/30 bg-emerald-500/5'
                  )}
                >
                  <p className="font-semibold text-sm mb-1.5">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{insight.description}</p>
                  {insight.cta && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-transparent hover:bg-background/80"
                      onClick={
                        insight.cta.action === 'transactions'
                          ? onGoToTransactions
                          : onGoToReports
                      }
                    >
                      {insight.cta.label}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={chartItemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Evolução do Saldo</h3>
          </div>
          <div className="h-[300px] w-full">
            {dataLine.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataLine}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    tickFormatter={(v) => `R$${v}`}
                    dx={-10}
                  />
                  <Tooltip
                    content={<ChartTooltip formatter={(v) => formatCurrency(v)} />}
                    cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4', strokeOpacity: 0.6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSaldo)"
                    isAnimationActive
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-foreground/70 flex-col gap-2">
                <LineChart size={32} className="opacity-30" />
                <p>Adicione transações para ver o gráfico</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-6 overflow-hidden">
          <h3 className="font-bold text-lg">Gastos por Categoria</h3>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            {dataPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-foreground/70">
                <PieChart size={32} className="opacity-30" />
                <p className="text-sm">Sem dados</p>
              </div>
            )}
          </div>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {dataPie.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-2 ring-background" style={{ backgroundColor: item.color }} />
                  <span className="text-foreground/90 group-hover:text-foreground transition-colors">{item.name}</span>
                </div>
                <span className="font-medium font-mono text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Últimas Transações</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary gap-1 hover:bg-primary/10"
              onClick={onGoToTransactions}
            >
              Ver todas <ArrowRight size={16} />
            </Button>
          </div>
          <div className="space-y-3">
            {latestTx.length > 0 ? (
              latestTx.map((tx, idx) => {
                const Icon = getCategoryIcon(tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-medium">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        isIncome ? 'text-emerald-500' : 'text-foreground'
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">
                Nenhuma transação. Adicione a primeira!
              </p>
            )}
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Próximos vencimentos</h3>
            {onGoToFixedExpenses && (
              <Button variant="ghost" size="sm" className="text-primary gap-1 hover:bg-primary/10" onClick={onGoToFixedExpenses}>
                Ver todas <ArrowRight size={16} />
              </Button>
            )}
          </div>
          {upcomingExpenses.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpenses.map((exp, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={exp.id}
                  className="flex items-center justify-between text-sm p-3 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <Calendar size={16} />
                    </div>
                    <span>{exp.title}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(exp.amount)}</p>
                    <p className="text-xs text-muted-foreground">Dia {exp.due_day}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">
              Nenhuma obrigação próxima.
            </p>
          )}
        </Card>

        <Card className="space-y-6 lg:col-span-2">
          <h3 className="font-bold text-lg">Metas e Orçamentos</h3>
          <div className="space-y-6">
            {budgetProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {budgetProgress.map((b) => {
                  const Icon = getCategoryIcon(b.category);
                  const isOver = b.percent >= 100;
                  const isCritical = b.percent >= 80 && !isOver;
                  return (
                    <div key={b.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-primary" />
                          <span className="font-medium">{b.category}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(b.spent)} <span className="text-border">/</span> {formatCurrency(b.limit)}
                        </span>
                      </div>
                      <ProgressBar
                        value={b.percent}
                        color={isOver ? 'destructive' : isCritical ? 'warning' : 'primary'}
                        className="h-2"
                      />
                      {isCritical && (
                        <p
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wider',
                            isOver ? 'text-destructive' : 'text-orange-500'
                          )}
                        >
                          {isOver ? 'Limite ultrapassado!' : 'Atenção: 80% do limite atingido'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum orçamento configurado.
              </p>
            )}
          </div>
          <Button variant="outline" className="w-full hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" onClick={onGoToBudgets}>
            Gerenciar Orçamentos
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
};
