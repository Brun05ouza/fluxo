import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ArrowRight,
  Banknote,
  DollarSign,
  Shield,
  Palette,
  Moon,
  Sun,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { Card, Button, Input, cn } from '@/app/components/ui';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/app/components/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { formatCurrencyBRL } from '@/lib/format-currency';
import { toast } from 'sonner';

export const Settings = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, upsertProfile } = useFinancialProfile(user?.id);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [saving, setSaving] = useState(false);
  const [hasFinanceChanges, setHasFinanceChanges] = useState(false);
  const [resetting, setResetting] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (profile !== undefined && profile !== null && !hasInitialized.current) {
      setMonthlyIncome(profile.monthly_income ? String(profile.monthly_income) : '');
      setPayDay(String(profile.pay_day || 1));
      hasInitialized.current = true;
    } else if (!profileLoading && (profile === null || profile === undefined)) {
      setMonthlyIncome('');
      setPayDay('1');
      hasInitialized.current = false;
    }
  }, [profile, profileLoading]);

  const handleFinanceChange = () => {
    const income = parseFloat(monthlyIncome?.replace(',', '.') || '0');
    const day = parseInt(payDay || '1', 10);
    setHasFinanceChanges(
      income !== (profile?.monthly_income ?? 0) || day !== (profile?.pay_day ?? 1)
    );
  };

  useEffect(() => {
    handleFinanceChange();
  }, [monthlyIncome, payDay, profile]);

  const handleSaveFinance = async () => {
    const income = parseFloat(monthlyIncome?.replace(',', '.') || '0');
    const day = Math.min(31, Math.max(1, parseInt(payDay || '1', 10)));
    setSaving(true);
    const { error } = await upsertProfile({ monthly_income: income, pay_day: day });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      setHasFinanceChanges(false);
      toast.success(`Salvo! Renda: ${formatCurrencyBRL(income)}`);
    }
  };

  const handleRestoreAccount = async () => {
    if (!user?.id) return;
    setResetting(true);
    const uid = user.id;
    const errors: string[] = [];
    const { error: e1 } = await supabase.from('transactions').delete().eq('user_id', uid);
    if (e1) errors.push(e1.message);
    const { error: e2 } = await supabase.from('budgets').delete().eq('user_id', uid);
    if (e2) errors.push(e2.message);
    const { error: e3 } = await supabase.from('fixed_expenses').delete().eq('user_id', uid);
    if (e3) errors.push(e3.message);
    const { error: e4 } = await supabase.from('accounts').delete().eq('user_id', uid);
    if (e4) errors.push(e4.message);
    const { error: e5 } = await supabase.from('financial_profile').delete().eq('id', uid);
    if (e5) errors.push(e5.message);
    setResetting(false);
    if (errors.length > 0) {
      toast.error('Erro ao restaurar: ' + errors.join('; '));
      return;
    }
    toast.success('Conta restaurada! Recarregando...');
    window.location.reload();
  };

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const selectClass = cn(
    "w-full h-12 px-4 text-base bg-background text-foreground border border-border rounded-xl",
    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
    "transition-colors hover:border-foreground/30 cursor-pointer"
  );

  const inputClass = "h-12 px-4 text-base rounded-xl";

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-foreground/80 mt-1">Ajustes do site e preferências.</p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Perfil</h3>
            <p className="text-sm text-foreground/80">
              Edite seu nome, foto e dados pessoais.
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/profile')}>
          <User size={18} />
          Editar Meu Perfil
          <ArrowRight size={16} />
        </Button>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Aparência</h3>
            <p className="text-sm text-foreground/80">
              Alterne entre tema claro e escuro.
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </Button>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Contas e carteiras</h3>
            <p className="text-sm text-foreground/80">
              Cadastre bancos e carteiras para vincular aos lançamentos (sem sync automático).
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/reports')}>
          <Wallet size={18} />
          Gerenciar contas
          <ArrowRight size={16} />
        </Button>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Situação financeira</h3>
            <p className="text-sm text-foreground/80">
              Informe sua renda e o dia que recebe para o cálculo do fluxo de caixa.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 items-end">
          <div className="space-y-2 flex flex-col items-center sm:items-stretch">
            <label className="text-sm font-medium text-foreground/90 w-full text-center sm:text-left">Renda mensal</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 2750"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value.replace(/[^\d,.]/g, ''))}
              className={inputClass}
            />
          </div>
          <div className="space-y-2 flex flex-col items-center sm:items-stretch">
            <label className="text-sm font-medium text-foreground/90 w-full text-center sm:text-left">Dia que recebe</label>
            <select
              className={cn(selectClass, "text-center sm:text-left")}
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasFinanceChanges && (
          <div className="flex justify-center pt-2">
            <Button onClick={handleSaveFinance} loading={saving}>
              Salvar situação financeira
            </Button>
          </div>
        )}
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Preferências</h3>
            <p className="text-sm text-foreground/80">
              Defina a moeda padrão para seus relatórios.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-muted/30 border border-border">
          <span className="font-medium text-foreground text-base">Moeda Principal</span>
          <select className={cn(selectClass, "sm:min-w-[160px]")}>
            <option>BRL (R$)</option>
            <option>USD ($)</option>
            <option>EUR (€)</option>
          </select>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Segurança</h3>
            <p className="text-sm text-foreground/80">
              Altere sua senha de acesso.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-between h-12 px-4"
          onClick={() => toast.info('Em breve: alteração de senha via e-mail')}
        >
          <span>Alterar Senha</span>
          <ArrowRight size={16} />
        </Button>
      </Card>

      <Card className="space-y-6 border-destructive/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-destructive">Restaurar conta</h3>
            <p className="text-sm text-foreground/80">
              Remove todos os seus dados do site: transações, orçamentos, contas (carteiras), contas fixas e perfil financeiro. A conta de acesso permanece.
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <RotateCcw size={18} />
              Restaurar conta (apagar dados)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente: transações, orçamentos, contas cadastradas, contas fixas e perfil financeiro. Sua conta de login continuará existindo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleRestoreAccount}
                disabled={resetting}
              >
                {resetting ? 'Restaurando...' : 'Sim, apagar todos os dados'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

    </div>
  );
};
