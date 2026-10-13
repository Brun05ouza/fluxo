import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { neon } from '@/lib/neon';
import { notifyDataChange } from '@/lib/data-sync';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useTransactions } from '@/hooks/useTransactions';
import { isBudgetExpense, isSettled, isIgnored } from '@/lib/financial-status';
import { formatCurrencyBRL } from '@/lib/format-currency';
import { Card, Button } from './ui';
import { toast } from 'sonner';

export function MonthlyPlan({ month }: { month: string }) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useFinancialProfile(user?.id);
  const { expenses, loading: expensesLoading } = useFixedExpenses(user?.id);
  const { transactions, refetchTransactions } = useTransactions();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const monthly = transactions.filter(t => (t.competency_date || t.date).startsWith(month) && !isIgnored(t));
  const received = monthly.filter(t => t.amount > 0 && isSettled(t) && (t.transaction_kind ?? 'income') === 'income').reduce((sum,t)=>sum+Number(t.amount),0);
  const pendingIncome = monthly.filter(t => t.amount > 0 && !isSettled(t) && (t.transaction_kind ?? 'income') === 'income').reduce((sum,t)=>sum+Number(t.amount),0);
  const paid = monthly.filter(t => isBudgetExpense(t) && isSettled(t)).reduce((sum,t)=>sum+Math.abs(Number(t.amount)),0);
  const pendingExpenses = monthly.filter(t=>isBudgetExpense(t) && !isSettled(t)).reduce((sum,t)=>sum+Math.abs(Number(t.amount)),0);
  const fixed = expenses.filter(e=>e.is_active).reduce((sum,e)=>sum+Number(e.amount),0);
  const prepare = async () => {
    setBusy(true);
    try {
      const { data, error } = await neon.rpc('prepare_financial_month',{ target_month: `${month}-01` });
      if (error) throw new Error(error.message);
      notifyDataChange('transactions');
      await refetchTransactions();
      toast.success(Number(data) ? `${data} previsões criadas. Confira e vincule valores já lançados.` : 'Este mês já está preparado. Nenhuma previsão duplicada.');
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Não foi possível preparar o mês.'); }
    finally { setBusy(false); }
  };
  if (profileLoading || expensesLoading) return <Card className="rounded-2xl text-sm text-muted-foreground" aria-busy="true">Carregando planejamento mensal…</Card>;
  return <Card className="space-y-4 rounded-2xl">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h3 className="font-semibold">Planejamento de {new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h3>
        <p className="text-sm text-muted-foreground mt-1">Renda configurada: {formatCurrencyBRL(Number(profile?.monthly_income || 0))} · Contas fixas: {formatCurrencyBRL(fixed)}</p></div>
      <Button variant="outline" onClick={prepare} loading={busy} disabled={!profile || busy}>Preparar mês</Button>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div><p className="text-muted-foreground">Recebido</p><p className="font-bold text-lg text-emerald-500">{formatCurrencyBRL(received)}</p></div>
      <div><p className="text-muted-foreground">A receber</p><p className="font-bold text-lg">{formatCurrencyBRL(pendingIncome)}</p></div>
      <div><p className="text-muted-foreground">Despesas pagas</p><p className="font-bold text-lg">{formatCurrencyBRL(paid)}</p></div>
      <div><p className="text-muted-foreground">A pagar</p><p className="font-bold text-lg text-amber-500">{formatCurrencyBRL(pendingExpenses)}</p></div>
    </div>
    <p className="text-sm text-muted-foreground">Resultado previsto: <strong className="text-foreground">{formatCurrencyBRL(received + pendingIncome - paid - pendingExpenses)}</strong>. As previsões só alteram o saldo real quando confirmadas. Se já lançou salário ou uma conta, vincule o lançamento existente em Transações.</p>
    <div className="flex flex-wrap gap-4 text-sm"><button className="text-primary underline underline-offset-4" onClick={()=>navigate('/transactions')}>Conferir transações</button><button className="text-primary underline underline-offset-4" onClick={()=>navigate('/profile')}>Ajustar renda e recebimento</button><button className="text-primary underline underline-offset-4" onClick={()=>navigate('/fixed-expenses')}>Configurar contas fixas</button></div>
  </Card>;
}
