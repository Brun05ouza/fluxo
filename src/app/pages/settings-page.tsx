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
  CalendarDays,
} from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
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
import { formatCurrencyBRL, maskBRLInput, parseBRLInput } from '@/lib/format-currency';
import { toast } from 'sonner';

const CURRENCIES = [
  { value: 'BRL', label: 'Real brasileiro', symbol: 'R$' },
  { value: 'USD', label: 'Dólar americano', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
] as const;

export const Settings = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, upsertProfile } = useFinancialProfile(user?.id);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [payDay, setPayDay] = useState('');
  const [payDayOpen, setPayDayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasFinanceChanges, setHasFinanceChanges] = useState(false);
  const [resetting, setResetting] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (profile !== undefined && profile !== null && !hasInitialized.current) {
      setMonthlyIncome(
        profile.monthly_income
          ? profile.monthly_income.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ''
      );
      setPayDay(profile.pay_day ? String(profile.pay_day) : '');
      hasInitialized.current = true;
    } else if (!profileLoading && (profile === null || profile === undefined)) {
      setMonthlyIncome('');
      setPayDay('');
      hasInitialized.current = false;
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    const income = parseBRLInput(monthlyIncome);
    const day = payDay ? parseInt(payDay, 10) : 0;
    setHasFinanceChanges(
      income !== (profile?.monthly_income ?? 0) || day !== (profile?.pay_day ?? 0)
    );
  }, [monthlyIncome, payDay, profile]);

  const handleSaveFinance = async () => {
    const income = parseBRLInput(monthlyIncome);
    const day = Math.min(31, Math.max(1, parseInt(payDay || '0', 10)));
    if (!payDay) {
      toast.error('Selecione o dia em que você recebe');
      return;
    }
    if (income < 0) {
      toast.error('Informe uma renda válida');
      return;
    }
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
  const [currency, setCurrency] = useState('BRL');
  const selectedCurrency = CURRENCIES.find((c) => c.value === currency) ?? CURRENCIES[0];

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-muted-foreground mt-1">Ajustes do site e preferências.</p>
      </div>

      {/* Atalhos rápidos — 3 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        <Card className="flex h-full flex-col space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">Perfil</h3>
              <p className="text-sm text-muted-foreground">Nome, foto e dados pessoais.</p>
            </div>
          </div>
          <Button variant="outline" className="mt-auto w-full gap-2" onClick={() => navigate('/profile')}>
            <User size={18} />
            Editar Meu Perfil
            <ArrowRight size={16} className="ml-auto" />
          </Button>
        </Card>

        <Card className="flex h-full flex-col space-y-5" data-tour="fluxia-settings-theme">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Palette size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">Aparência</h3>
              <p className="text-sm text-muted-foreground">Tema claro ou escuro.</p>
            </div>
          </div>
          <Button variant="outline" className="mt-auto w-full gap-2" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </Card>

        <Card className="flex h-full flex-col space-y-5 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">Contas e carteiras</h3>
              <p className="text-sm text-muted-foreground">Bancos e carteiras dos lançamentos.</p>
            </div>
          </div>
          <Button variant="outline" className="mt-auto w-full gap-2" onClick={() => navigate('/reports')}>
            <Wallet size={18} />
            Gerenciar contas
            <ArrowRight size={16} className="ml-auto" />
          </Button>
        </Card>
      </div>

      {/* Situação financeira — 2 cards alinhados ao resto */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Card className="flex h-full flex-col space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Banknote size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">Renda mensal</h3>
                <p className="text-sm text-muted-foreground">Base do fluxo de caixa.</p>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-foreground shrink-0" htmlFor="settings-income">
                Valor
              </label>
              <div className="relative w-full sm:max-w-[220px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  R$
                </span>
                <input
                  id="settings-income"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(maskBRLInput(e.target.value))}
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-11 pr-3 text-base tabular-nums outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>
          </Card>

          <Card className="flex h-full flex-col space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarDays size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">Dia do pagamento</h3>
                <p className="text-sm text-muted-foreground">Quando a renda entra.</p>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-foreground shrink-0">Dia do mês</span>
              <Popover open={payDayOpen} onOpenChange={setPayDayOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex h-11 w-full sm:w-auto sm:min-w-[160px] items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-left text-base transition-all',
                      'hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                      payDayOpen && 'ring-2 ring-primary/30 border-primary/40'
                    )}
                  >
                    {payDay ? (
                      <span className="font-medium tabular-nums">Dia {payDay}</span>
                    ) : (
                      <span className="text-muted-foreground">Selecionar</span>
                    )}
                    <CalendarDays size={16} className="shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="w-[min(100vw-2rem,320px)] rounded-xl border-border p-3 shadow-lg"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Dia do mês</p>
                    {payDay && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
                        Dia {payDay}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const selected = Number(payDay) === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setPayDay(String(d));
                            setPayDayOpen(false);
                          }}
                          aria-pressed={selected}
                          className={cn(
                            'aspect-square rounded-lg text-sm font-medium tabular-nums transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-foreground hover:bg-muted'
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </Card>
        </div>

        {hasFinanceChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSaveFinance} loading={saving}>
              Salvar situação financeira
            </Button>
          </div>
        )}
      </div>

      {/* Preferências + Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <Card className="flex h-full flex-col space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Preferências</h3>
              <p className="text-sm text-muted-foreground">Moeda padrão dos relatórios.</p>
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-foreground shrink-0">Moeda principal</span>
            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                if (value !== 'BRL') {
                  toast.info('Por enquanto a app formata valores em BRL');
                }
              }}
            >
              <SelectTrigger className="h-11 w-full sm:w-auto sm:min-w-[200px] rounded-xl border-border bg-background px-3 text-sm shadow-none focus-visible:ring-primary/30">
                <SelectValue>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary tabular-nums">
                      {selectedCurrency.symbol}
                    </span>
                    <span className="truncate font-medium">{selectedCurrency.value}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end" className="z-[130] rounded-xl border-border p-1 min-w-[220px]">
                {CURRENCIES.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    className="rounded-lg py-2.5 pl-2 pr-8 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground tabular-nums">
                        {c.symbol}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium leading-tight">{c.value}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{c.label}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="flex h-full flex-col space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Segurança</h3>
              <p className="text-sm text-muted-foreground">Senha de acesso da conta.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-auto h-12 w-full justify-between px-4"
            onClick={() => toast.info('Em breve: alteração de senha via e-mail')}
          >
            <span>Alterar Senha</span>
            <ArrowRight size={16} />
          </Button>
        </Card>
      </div>

      {/* Zona de risco */}
      <Card className="border-destructive/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 p-2.5 rounded-xl bg-destructive/10 text-destructive">
              <RotateCcw size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-destructive">Restaurar conta</h3>
              <p className="text-sm text-muted-foreground">
                Remove transações, orçamentos, contas, contas fixas e perfil. O login permanece.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0 gap-2">
                <RotateCcw size={18} />
                Restaurar conta
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
                <Button variant="destructive" onClick={handleRestoreAccount} disabled={resetting}>
                  {resetting ? 'Restaurando...' : 'Sim, apagar todos os dados'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
};
