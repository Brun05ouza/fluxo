import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Utensils,
  Car,
  Home,
  Play,
  Banknote,
  FileText,
  Calendar,
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

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className={cn('p-2 rounded-lg bg-muted/50', colorClass)}>
        <Icon size={20} />
      </div>
      {trend != null && (
        <span
          className={cn(
            'text-xs font-medium flex items-center gap-1',
            trend > 0 ? 'text-primary' : 'text-destructive'
          )}
        >
          {trend > 0 ? '+' : ''}
          {trend}%
          {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </span>
      )}
    </div>
    <div className="mt-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  </Card>
);

export const Dashboard = ({
  onAddTransaction,
  onGoToTransactions,
  onGoToBudgets,
  onGoToFixedExpenses,
}: {
  onAddTransaction?: () => void;
  onGoToTransactions?: () => void;
  onGoToBudgets?: () => void;
  onGoToFixedExpenses?: () => void;
}) => {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const { profile } = useFinancialProfile(user?.id);
  const { expenses } = useFixedExpenses(user?.id);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Fluxo de caixa: Renda, Obrigações, Disponível */}
      {(monthlyIncome > 0 || fixedTotal > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-6 bg-emerald-500/10 border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Banknote size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renda mensal</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyIncome)}</p>
                {profile?.pay_day && (
                  <p className="text-xs text-muted-foreground">Recebe dia {profile.pay_day}</p>
                )}
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <FileText size={24} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Obrigações do mês</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(fixedTotal)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Wallet size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponível após contas</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(availableAfterFixed)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(balance)}
          icon={Wallet}
          colorClass="text-primary"
        />
        <StatCard title="Recebido" value={formatCurrency(income)} icon={TrendingUp} colorClass="text-emerald-500" />
        <StatCard
          title="Gastos do Mês"
          value={formatCurrency(expense)}
          icon={TrendingDown}
          colorClass="text-destructive"
        />
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Orçamento Usado</p>
            <Badge variant={budgetPercent >= 100 ? 'destructive' : budgetPercent >= 80 ? 'warning' : 'default'}>
              {totalBudgeted > 0 ? Math.round(budgetPercent) + '%' : '—'}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {totalBudgeted > 0 ? formatCurrency(totalSpent) : '—'}
            </h3>
            <ProgressBar
              value={Math.min(budgetPercent, 100)}
              color={budgetPercent >= 100 ? 'destructive' : budgetPercent >= 80 ? 'warning' : 'primary'}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Evolução do Saldo</h3>
          </div>
          <div className="h-[300px] w-full">
            {dataLine.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataLine}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSaldo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Adicione transações para ver o gráfico
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="font-semibold text-lg">Gastos por Categoria</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {dataPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum gasto registrado</p>
            )}
          </div>
          <div className="space-y-3">
            {dataPie.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Últimas Transações</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary gap-1"
              onClick={onGoToTransactions}
            >
              Ver todas <ArrowRight size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            {latestTx.length > 0 ? (
              latestTx.map((tx) => {
                const Icon = getCategoryIcon(tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Icon size={20} />
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
                        'font-semibold',
                        isIncome ? 'text-emerald-500' : 'text-foreground'
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma transação. Adicione a primeira!
              </p>
            )}
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Próximos vencimentos</h3>
            {onGoToFixedExpenses && (
              <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={onGoToFixedExpenses}>
                Ver todas <ArrowRight size={16} />
              </Button>
            )}
          </div>
          {upcomingExpenses.length > 0 ? (
            <div className="space-y-3">
              {upcomingExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{exp.title}</span>
                  </div>
                  <span className="font-medium">Dia {exp.due_day} • {formatCurrency(exp.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma obrigação. Configure em Contas fixas.
            </p>
          )}
        </Card>

        <Card className="space-y-6">
          <h3 className="font-semibold text-lg">Metas e Orçamentos</h3>
          <div className="space-y-6">
            {budgetProgress.length > 0 ? (
              budgetProgress.map((b) => {
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
                      <span className="text-muted-foreground">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </span>
                    </div>
                    <ProgressBar
                      value={b.percent}
                      color={isOver ? 'destructive' : isCritical ? 'warning' : 'primary'}
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
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum orçamento configurado.
              </p>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={onGoToBudgets}>
            Gerenciar Orçamentos
          </Button>
        </Card>
      </div>
    </div>
  );
};
