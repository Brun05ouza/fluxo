import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
  TrendingDown,
} from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';
import { Switch } from '@/app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { getAccountBalance } from '@/lib/account-balance';
import {
  FINANCIAL_INSTITUTIONS,
  getInstitutionByKey,
  type FinancialInstitution,
} from '@/lib/financial-institutions';
import { formatCurrencyBRL } from '@/lib/format-currency';
import type { Account, AccountType } from '@/types/database';
import { ACCOUNT_TYPE_OPTIONS } from '@/types/database';
import { toast } from 'sonner';
import type { ReportsOutletContext } from './reports-layout';

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316'];

function formatBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRLToNumber(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

function InstitutionOrb({ inst, size = 'md' }: { inst: FinancialInstitution; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'size-10 text-sm rounded-[12px]' : 'size-8 text-xs rounded-[10px]';
  const iconSize = size === 'md' ? 'size-5' : 'size-4';
  return (
    <div
      className={cn(cls, 'flex items-center justify-center font-bold text-white shrink-0 shadow-sm')}
      style={{ backgroundColor: inst.color }}
      aria-hidden
    >
      {inst.key === 'custom' ? <BriefcaseBusiness className={iconSize} /> : inst.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export const AccountsPage = () => {
  const { onAddTransaction } = useOutletContext<ReportsOutletContext>();
  const { user } = useAuth();
  const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts(user?.id);
  const { transactions } = useTransactions(user?.id);

  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [instSearch, setInstSearch] = useState('');
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formInstitutionKey, setFormInstitutionKey] = useState('custom');
  const [formType, setFormType] = useState<AccountType>('CHECKING');
  const [formColor, setFormColor] = useState('#3b82f6');
  /** Um único campo: limite (cartão de crédito) ou saldo atual (demais tipos). */
  const [formAmount, setFormAmount] = useState('');
  const [formIncludeHome, setFormIncludeHome] = useState(true);
  const [saving, setSaving] = useState(false);

  const filteredInstitutions = useMemo(() => {
    const q = instSearch.trim().toLowerCase();
    if (!q) return FINANCIAL_INSTITUTIONS;
    return FINANCIAL_INSTITUTIONS.filter((i) => i.name.toLowerCase().includes(q));
  }, [instSearch]);

  const totalIncludedInHome = useMemo(() => {
    return accounts
      .filter((a) => a.include_in_home_total)
      .reduce((s, a) => s + getAccountBalance(a, transactions), 0);
  }, [accounts, transactions]);

  const isCreditCard = formType === 'CREDIT_CARD';
  const amountFieldLabel = isCreditCard ? 'Limite do cartão' : 'Saldo atual';
  const amountFieldHint = isCreditCard
    ? 'Limite total do cartão. Lançamentos futuros abatem desse limite na visão de saldo.'
    : 'Quanto você tem hoje nesta conta ou carteira.';

  const openNewAccount = () => {
    setEditing(null);
    setFormName('');
    setFormInstitutionKey('custom');
    setFormType('CHECKING');
    setFormColor('#3b82f6');
    setFormAmount('');
    setFormIncludeHome(true);
    setFormDialogOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setFormName(a.name);
    setFormInstitutionKey(a.institution_key);
    setFormType(a.account_type);
    setFormColor(a.color);
    const isCard = a.account_type === 'CREDIT_CARD';
    const raw = isCard ? a.credit_limit : a.initial_balance;
    const n = raw != null ? Math.abs(Number(raw)) : 0;
    setFormAmount(
      n > 0
        ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setFormIncludeHome(a.include_in_home_total);
    setFormDialogOpen(true);
  };

  const handlePickInstitution = (inst: FinancialInstitution) => {
    setFormInstitutionKey(inst.key);
    setInstitutionDialogOpen(false);
    setInstSearch('');
    if (!formName.trim() && inst.key !== 'custom') {
      setFormName(inst.name);
    }
  };

  const handleSaveAccount = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error('Informe um nome ou descrição para a conta.');
      return;
    }
    const amt = parseBRLToNumber(formAmount);
    const isCard = formType === 'CREDIT_CARD';
    const initial_balance = isCard ? 0 : amt;
    const credit_limit = isCard ? (amt > 0 ? amt : null) : null;
    setSaving(true);
    if (editing) {
      const { error } = await updateAccount(editing.id, {
        name,
        institution_key: formInstitutionKey,
        account_type: formType,
        color: formColor,
        initial_balance,
        credit_limit,
        include_in_home_total: formIncludeHome,
      });
      setSaving(false);
      if (error) toast.error(error.message);
      else {
        toast.success('Conta atualizada');
        setFormDialogOpen(false);
        setEditing(null);
      }
    } else {
      const { error } = await addAccount({
        name,
        institution_key: formInstitutionKey,
        account_type: formType,
        color: formColor,
        initial_balance,
        credit_limit,
        include_in_home_total: formIncludeHome,
      });
      setSaving(false);
      if (error) toast.error(error.message);
      else {
        toast.success('Conta criada');
        setFormDialogOpen(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteAccount(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error(error.message);
    else toast.success('Conta removida');
  };

  const triggerExpenseFromAccount = (account: Account) => {
    try {
      sessionStorage.setItem('fluxo-prefill-account-id', account.id);
    } catch {
      /* ignore */
    }
    onAddTransaction('expense');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const formOrbInst =
    getInstitutionByKey(formInstitutionKey) ??
    ({ key: 'custom', name: 'Outra', color: '#64748b' } as FinancialInstitution);

  return (
    <div className="space-y-8" data-tour="fluxia-accounts-page">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Contas</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Carteiras e bancos só para organização — sem conexão automática com instituições.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={openNewAccount}
              className="group relative rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-transparent hover:border-primary/50 hover:bg-primary/5 transition-all p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]"
            >
              <div className="size-12 rounded-full bg-muted/50 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center">
                <Plus className="size-6" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Nova conta</span>
            </button>

            {accounts.map((acc) => {
              const inst =
                getInstitutionByKey(acc.institution_key) ??
                ({ key: 'custom', name: 'Outra', color: acc.color } as FinancialInstitution);
              const balance = getAccountBalance(acc, transactions);
              return (
                <Card key={acc.id} className="group relative rounded-2xl p-5 flex flex-col gap-4 border-border/50 bg-card hover:border-border/80 transition-colors shadow-sm overflow-hidden min-h-[180px]">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <InstitutionOrb inst={{ ...inst, color: acc.color }} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate text-foreground leading-tight">{acc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ACCOUNT_TYPE_OPTIONS.find((o) => o.value === acc.account_type)?.label}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2 -mt-1 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(acc)} className="gap-2">
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          className="gap-2"
                          onClick={() => setDeleteTarget(acc)}
                        >
                          <Trash2 className="size-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {acc.account_type === 'CREDIT_CARD' ? 'Fatura atual' : 'Saldo atual'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-2xl font-bold tracking-tight tabular-nums',
                          balance >= 0 ? 'text-foreground' : 'text-destructive'
                        )}
                      >
                        {formatCurrencyBRL(balance)}
                      </span>
                    </div>
                    {acc.account_type === 'CREDIT_CARD' && acc.credit_limit != null && acc.credit_limit > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Limite: <span className="font-medium">{formatCurrencyBRL(acc.credit_limit)}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    <Button
                      variant="secondary"
                      className="w-full h-9 text-xs font-semibold bg-secondary/50 hover:bg-secondary text-secondary-foreground"
                      onClick={() => triggerExpenseFromAccount(acc)}
                    >
                      <Plus className="size-3.5 mr-1.5" />
                      Adicionar despesa
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="lg:w-80 shrink-0 space-y-3">
          <Card className="rounded-2xl p-4 flex items-center gap-3">
            <div className="size-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Wallet className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Saldo nas contas da inicial
                <ChevronRight className="size-3 opacity-50" />
              </p>
              <p className="text-xl font-bold tabular-nums">{formatCurrencyBRL(totalIncludedInHome)}</p>
            </div>
          </Card>
          <Card className="rounded-2xl p-4 flex items-center gap-3 opacity-90">
            <div className="size-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <TrendingDown className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Dica</p>
              <p className="text-sm text-muted-foreground leading-snug">
                Ao lançar despesas, escolha a conta no formulário ou use o atalho no card.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={institutionDialogOpen} onOpenChange={setInstitutionDialogOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card z-[120]">
          <DialogHeader>
            <DialogTitle>Instituição (apenas visual)</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por nome"
              value={instSearch}
              onChange={(e) => setInstSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <ul className="max-h-[min(60vh,320px)] overflow-y-auto divide-y divide-border rounded-xl border border-border">
            {filteredInstitutions.map((inst) => (
              <li key={inst.key}>
                <button
                  type="button"
                  onClick={() => handlePickInstitution(inst)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/60 transition-colors text-left"
                >
                  <InstitutionOrb inst={inst} size="sm" />
                  <span className="flex-1 font-medium">{inst.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={formDialogOpen} onOpenChange={(o) => { if (!o) setEditing(null); setFormDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg border-border bg-card z-[120] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar conta' : 'Nova conta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Instituição financeira</p>
              <button
                type="button"
                onClick={() => setInstitutionDialogOpen(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <InstitutionOrb inst={formOrbInst} size="sm" />
                <span className="flex-1 text-left font-medium">{formOrbInst.name}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3.5" /> Descrição / nome da conta
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex.: Corrente - Nubank"
                className="w-full mt-1 border-0 border-b border-border py-2 text-sm font-medium bg-transparent outline-none focus:border-primary"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de conta</p>
              <Select value={formType} onValueChange={(v) => setFormType(v as AccountType)}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[130]">
                  {ACCOUNT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{amountFieldLabel}</label>
              <p className="text-[11px] text-muted-foreground/90 mb-1">{amountFieldHint}</p>
              <div className="flex items-center border-b-2 border-primary/50 pt-1">
                <span className="text-lg font-semibold text-muted-foreground mr-1">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="flex-1 bg-transparent text-2xl font-bold text-primary outline-none border-0 py-2"
                  placeholder="0,00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(formatBRLInput(e.target.value))}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Cor da conta</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={cn(
                      'size-9 rounded-full border-2 transition-transform flex items-center justify-center text-white text-xs font-bold',
                      formColor === c ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  >
                    {formColor === c ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer">
              <span className="text-sm font-medium">Incluir na soma da tela inicial</span>
              <Switch checked={formIncludeHome} onCheckedChange={setFormIncludeHome} />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setFormDialogOpen(false); setEditing(null); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAccount} loading={saving} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Lançamentos ligados a esta conta ficam sem conta associada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm} loading={deleting} disabled={deleting}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
