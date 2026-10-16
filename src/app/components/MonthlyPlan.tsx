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
import { ChevronRight } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export function MonthlyPlan({ month, compact = false }: { month: string; compact?: boolean }) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useFinancialProfile(user?.id);
  const { expenses, loading: expensesLoading } = useFixedExpenses(user?.id);
  const { transactions, refetchTransactions } = useTransactions();
  const [busy, setBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const details = <>
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
  </>;
  if (!compact) return <Card className="space-y-4 rounded-2xl">{details}</Card>;
  return <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
    <Card className="rounded-2xl p-4 md:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold">Planejamento de {monthLabel}</h3>
          <p className="text-sm text-muted-foreground mt-1">Resultado previsto <strong className="font-semibold text-foreground tabular-nums">{formatCurrencyBRL(received + pendingIncome - paid - pendingExpenses)}</strong></p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end">
          <div className="text-sm"><p className="text-muted-foreground">A receber</p><p className="font-semibold tabular-nums">{formatCurrencyBRL(pendingIncome)}</p></div>
          <div className="text-sm"><p className="text-muted-foreground">A pagar</p><p className="font-semibold tabular-nums text-amber-500">{formatCurrencyBRL(pendingExpenses)}</p></div>
          <DialogTrigger asChild><Button variant="outline" className="gap-2 rounded-xl">Ver detalhes<ChevronRight size={16} aria-hidden="true" /></Button></DialogTrigger>
        </div>
      </div>
    </Card>
      <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl border-border bg-card p-5 sm:p-6">
        <DialogHeader className="sr-only"><DialogTitle>Detalhes do planejamento de {monthLabel}</DialogTitle><DialogDescription>Confira os valores do mês, prepare as previsões e ajuste suas configurações.</DialogDescription></DialogHeader>
        <div className="space-y-5 pt-5">{details}</div>
      </DialogContent>
  </Dialog>;
}
