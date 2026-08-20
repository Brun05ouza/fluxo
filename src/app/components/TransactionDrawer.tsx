import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Tag,
  CreditCard,
  AlignLeft,
  Check,
  Calculator,
  Bookmark,
  Building2,
  Paperclip,
  CheckCircle2,
  Pin,
  RefreshCw,
  Pencil,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, cn } from './ui';
import { Switch } from './ui/switch';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { motion, AnimatePresence } from 'motion/react';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  SPENDING_TYPES,
  type RecurringInterval,
} from '@/types/database';
import type { Transaction, TransactionSavePayload } from '@/types/database';
import { getCategoryIcon } from '@/lib/category-icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';

const WALLETS_STORAGE_KEY = 'fluxo-custom-wallets-v1';
const LEGACY_PAYMENT_PREFIX = '__legacy__::';

function loadCustomWallets(): string[] {
  try {
    const raw = localStorage.getItem(WALLETS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type DateQuick = 'today' | 'yesterday' | 'custom';

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: TransactionSavePayload) => Promise<{ error: Error | null; parcelCount?: number }>;
  initialTransaction?: Transaction | null;
  presetType?: 'income' | 'expense' | null;
}

export const TransactionDrawer = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  presetType = null,
}: TransactionDrawerProps) => {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories(user?.id);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [date, setDate] = useState(localISODate(new Date()));
  const [dateQuick, setDateQuick] = useState<DateQuick>('today');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Carteira');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [customWallets, setCustomWallets] = useState<string[]>(loadCustomWallets);
  const [tagsStr, setTagsStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCount, setRecurringCount] = useState(2);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('MONTH');
  const [spendingType, setSpendingType] = useState<'ESSENTIAL' | 'OPTIONAL' | 'EMOTIONAL' | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [createFixedExpense, setCreateFixedExpense] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const expandDetails = () => setDetailsExpanded(true);
    window.addEventListener('fluxia-tour-expand-tx-details', expandDetails);
    return () => window.removeEventListener('fluxia-tour-expand-tx-details', expandDetails);
  }, []);

  const hideTypeToggle = Boolean(!initialTransaction && presetType);

  const accent = useMemo(
    () =>
      type === 'income'
        ? {
            border: 'border-emerald-500/40 ring-emerald-500/15',
            header: 'from-emerald-600 to-emerald-500',
            pill: 'bg-emerald-600 text-white shadow-sm',
            pillMuted: 'bg-muted/80 text-muted-foreground hover:bg-muted',
            amount: 'text-emerald-600 dark:text-emerald-400',
            catRing: 'border-emerald-500/55',
            warn: 'border-amber-500 text-amber-600 dark:text-amber-400',
            save: 'bg-emerald-600 hover:bg-emerald-600/90',
            switchOn: 'data-[state=checked]:bg-emerald-600',
          }
        : {
            border: 'border-red-500/40 ring-red-500/15',
            header: 'from-red-600 to-red-500',
            pill: 'bg-red-600 text-white shadow-sm',
            pillMuted: 'bg-muted/80 text-muted-foreground hover:bg-muted',
            amount: 'text-red-600 dark:text-red-400',
            catRing: 'border-red-500/55',
            warn: 'border-amber-500 text-amber-600 dark:text-amber-400',
            save: 'bg-red-600 hover:bg-red-600/90',
            switchOn: 'data-[state=checked]:bg-red-600',
          },
    [type]
  );

  const numAmount = useMemo(() => {
    const digits = amount.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) / 100 : 0;
  }, [amount]);

  const canSave = numAmount > 0 && title.trim().length > 0;
  const amountInvalid = amount !== '' && numAmount <= 0;

  const CategoryIcon = getCategoryIcon(category);

  const walletOptions = useMemo(() => {
    const set = new Set<string>(['Carteira', ...customWallets, ...PAYMENT_METHODS]);
    if (paymentMethod) set.add(paymentMethod);
    return [...set];
  }, [customWallets, paymentMethod]);

  const persistCustomWallet = (name: string) => {
    const t = name.trim();
    if (!t) return;
    if (walletOptions.includes(t)) {
      setPaymentMethod(t);
      return;
    }
    const next = [...customWallets, t];
    setCustomWallets(next);
    try {
      localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setPaymentMethod(t);
  };

  const reset = () => {
    setType('expense');
    setAmount('');
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setDate(localISODate(new Date()));
    setDateQuick('today');
    setCalendarOpen(false);
    setPaymentMethod('Carteira');
    setAccountId(null);
    setTagsStr('');
    setIsRecurring(false);
    setRecurringCount(2);
    setRecurringInterval('MONTH');
    setSpendingType(null);
    setDetailsExpanded(false);
    setIsPaid(true);
    setCreateFixedExpense(false);
    setAttachmentFile(null);
    setSubmitAttempted(false);
  };

  const syncDateQuick = (d: string) => {
    const t = localISODate(new Date());
    const y = localISODate(new Date(Date.now() - 86400000));
    if (d === t) setDateQuick('today');
    else if (d === y) setDateQuick('yesterday');
    else setDateQuick('custom');
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialTransaction) {
      setType(initialTransaction.amount > 0 ? 'income' : 'expense');
      const abs = Math.abs(initialTransaction.amount);
      setAmount(abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setTitle(initialTransaction.title);
      setDescription(initialTransaction.description ?? '');
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      syncDateQuick(initialTransaction.date);
      setPaymentMethod(initialTransaction.payment_method);
      setAccountId(initialTransaction.account_id ?? null);
      setTagsStr(Array.isArray(initialTransaction.tags) ? initialTransaction.tags.join(', ') : '');
      setIsRecurring(initialTransaction.is_recurring ?? false);
      setRecurringCount(initialTransaction.recurring_count ?? 2);
      setRecurringInterval((initialTransaction.recurring_interval as RecurringInterval) ?? 'MONTH');
      setSpendingType((initialTransaction as Transaction & { spending_type?: string }).spending_type ?? null);
      setIsPaid(initialTransaction.is_paid ?? true);
      setCreateFixedExpense(false);
      setDetailsExpanded(false);
      setAttachmentFile(null);
      setSubmitAttempted(false);
    } else {
      setAmount('');
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      const today = localISODate(new Date());
      setDate(today);
      setDateQuick('today');
      setCalendarOpen(false);
      setPaymentMethod('Carteira');
      setAccountId(null);
      setTagsStr('');
      setIsRecurring(false);
      setRecurringCount(2);
      setRecurringInterval('MONTH');
      setSpendingType(null);
      setType(presetType ?? 'expense');
      setDetailsExpanded(false);
      setIsPaid(true);
      setCreateFixedExpense(false);
      setAttachmentFile(null);
      setSubmitAttempted(false);
    }
    // is_paid / is_recurring nos deps: ao reabrir o mesmo id após refresh da lista, o formulário espelha o banco
  }, [
    isOpen,
    initialTransaction?.id,
    initialTransaction?.is_paid,
    initialTransaction?.is_recurring,
    initialTransaction?.account_id,
    presetType,
  ]);

  useEffect(() => {
    if (!isOpen || initialTransaction) return;
    try {
      const raw = sessionStorage.getItem('fluxo-prefill-account-id');
      if (!raw) return;
      sessionStorage.removeItem('fluxo-prefill-account-id');
      const acc = accounts.find((a) => a.id === raw);
      if (acc) {
        setAccountId(acc.id);
        setPaymentMethod(acc.name);
      }
    } catch {
      /* ignore */
    }
  }, [isOpen, initialTransaction, accounts]);

  const walletSelectValue = useMemo(() => {
    if (accountId && accounts.some((a) => a.id === accountId)) return accountId;
    return `${LEGACY_PAYMENT_PREFIX}${paymentMethod}`;
  }, [accountId, accounts, paymentMethod]);

  const handleWalletSelect = (v: string) => {
    if (v.startsWith(LEGACY_PAYMENT_PREFIX)) {
      setAccountId(null);
      setPaymentMethod(v.slice(LEGACY_PAYMENT_PREFIX.length));
      return;
    }
    const acc = accounts.find((a) => a.id === v);
    if (acc) {
      setAccountId(acc.id);
      setPaymentMethod(acc.name);
    }
  };

  const formatBRL = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (raw: string) => {
    setAmount(formatBRL(raw));
  };

  const setQuickDate = (q: DateQuick) => {
    if (q === 'today') {
      setDate(localISODate(new Date()));
      setDateQuick('today');
      setCalendarOpen(false);
    } else if (q === 'yesterday') {
      setDate(localISODate(new Date(Date.now() - 86400000)));
      setDateQuick('yesterday');
      setCalendarOpen(false);
    } else {
      setDateQuick('custom');
      setCalendarOpen(true);
    }
  };

  const buildPayload = (): TransactionSavePayload => {
    const value = type === 'income' ? numAmount : -numAmount;
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      title: title.trim(),
      description: description.trim() || '',
      category,
      amount: value,
      date,
      payment_method: paymentMethod,
      account_id: accountId,
      tags,
      is_recurring: isRecurring,
      spending_type: type === 'expense' ? spendingType : null,
      is_paid: isPaid,
      recurring_count: isRecurring ? Math.max(1, recurringCount) : null,
      recurring_interval: isRecurring ? recurringInterval : null,
      create_fixed_expense: type === 'expense' ? createFixedExpense : false,
      attachmentFile: attachmentFile ?? undefined,
    };
  };

  const save = async (saveAndNew: boolean) => {
    setSubmitAttempted(true);
    if (numAmount <= 0 || !title.trim() || !date?.trim()) {
      toast.error('Preencha valor, nome e data válidos.');
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    const { error, parcelCount } = await onSave(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (saveAndNew && !initialTransaction) {
      toast.success(
        parcelCount && parcelCount > 1
          ? `${parcelCount} lançamentos criados.`
          : 'Transação salva!'
      );
      setAmount('');
      setTitle('');
      setDescription('');
      setTagsStr('');
      setDate(localISODate(new Date()));
      setDateQuick('today');
      setCalendarOpen(false);
      setIsPaid(true);
      setIsRecurring(false);
      setRecurringCount(2);
      setRecurringInterval('MONTH');
      setSpendingType(null);
      setCreateFixedExpense(false);
      setAttachmentFile(null);
      setDetailsExpanded(false);
      setSubmitAttempted(false);
      return;
    }
    toast.success(
      parcelCount && parcelCount > 1
        ? `${parcelCount} lançamentos criados.`
        : initialTransaction
          ? 'Transação atualizada!'
          : 'Transação salva!'
    );
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const paymentStatusLabel =
    type === 'income'
      ? isPaid
        ? 'Já recebi'
        : 'Ainda não recebida'
      : isPaid
        ? 'Já paguei'
        : 'Não foi paga';

  const titleInvalid = submitAttempted && !title.trim();
  const dateInvalid = submitAttempted && !date?.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-expanded={detailsExpanded}
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
              'flex flex-col rounded-2xl border shadow-2xl overflow-hidden bg-card',
              'max-h-[min(92vh,880px)] transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              detailsExpanded ? 'max-w-4xl' : 'max-w-lg',
              accent.border
            )}
          >
            <div
              className={cn(
                'px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 text-white bg-gradient-to-r',
                accent.header
              )}
            >
              <h2 className="text-sm sm:text-base font-semibold tracking-tight">
                {initialTransaction
                  ? 'Editar lançamento'
                  : type === 'income'
                    ? 'Nova receita'
                    : 'Nova despesa'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-white/15 transition-colors text-white -mr-0.5"
                aria-label="Fechar"
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="flex flex-1 min-w-0 min-h-0 flex-col md:flex-row">
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-0 min-w-0">
                  {!hideTypeToggle && (
                    <div className="flex p-1 bg-muted rounded-xl mb-5" data-tour="fluxia-tx-type">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          type === 'expense'
                            ? 'bg-card shadow-sm text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                          type === 'income'
                            ? 'bg-card shadow-sm text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        Receita
                      </button>
                    </div>
                  )}

                  {/* Valor */}
                  <div
                    className={cn(
                      'pb-3 mb-1 border-b-2 transition-colors',
                      amountInvalid ? accent.warn : 'border-transparent'
                    )}
                    data-tour="fluxia-tx-valor"
                  >
                    <div className="flex items-start gap-3">
                      <Calculator className="size-5 text-muted-foreground shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Valor <span className="text-destructive">*</span>
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            BRL
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <span className="text-xl font-bold text-muted-foreground mr-1">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            className={cn(
                              'flex-1 min-w-0 bg-transparent text-3xl sm:text-4xl font-bold border-none outline-none focus:ring-0',
                              accent.amount,
                              type === 'income'
                                ? 'placeholder:text-emerald-900/55 dark:placeholder:text-emerald-300/70'
                                : 'placeholder:text-red-900/55 dark:placeholder:text-red-300/70'
                            )}
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            autoFocus
                          />
                        </div>
                        {amountInvalid && (
                          <p className="text-xs font-medium mt-2 text-amber-600 dark:text-amber-400">
                            Deve ter um valor diferente de 0
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pago / recebido */}
                  <div className="flex items-center gap-3 py-3 border-b border-border/60">
                    <CheckCircle2 className="size-5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-medium">{paymentStatusLabel}</span>
                    <Switch
                      checked={isPaid}
                      onCheckedChange={setIsPaid}
                      className={cn(accent.switchOn)}
                    />
                  </div>

                  {/* Data */}
                  <div className="py-3 border-b border-border/60" data-tour="fluxia-tx-data">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Data <span className="text-destructive">*</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickDate('today')}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                              dateQuick === 'today' ? accent.pill : accent.pillMuted
                            )}
                          >
                            Hoje
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickDate('yesterday')}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                              dateQuick === 'yesterday' ? accent.pill : accent.pillMuted
                            )}
                          >
                            Ontem
                          </button>
                          <Popover
                            open={calendarOpen}
                            onOpenChange={(open) => {
                              setCalendarOpen(open);
                              if (open) setDateQuick('custom');
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  'rounded-full px-3 py-1.5 text-sm font-semibold transition-all',
                                  dateQuick === 'custom' ? accent.pill : accent.pillMuted
                                )}
                              >
                                Outros…
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[120]" align="start">
                              <Calendar
                                mode="single"
                                locale={ptBR}
                                selected={parseISO(`${date}T12:00:00`)}
                                onSelect={(d) => {
                                  if (d) {
                                    const iso = format(d, 'yyyy-MM-dd');
                                    setDate(iso);
                                    syncDateQuick(iso);
                                    setCalendarOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {dateQuick === 'custom' && (
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(`${date}T12:00:00`), "EEEE, d 'de' MMMM yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        {dateInvalid && (
                          <p className="text-xs font-medium text-destructive">Informe a data.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descrição (título) */}
                  <div className="flex items-start gap-3 py-3 border-b border-border/60" data-tour="fluxia-tx-descricao">
                    <AlignLeft className="size-5 text-muted-foreground shrink-0 mt-2" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        Nome / descrição <span className="text-destructive font-semibold">*</span>
                      </p>
                      <input
                        type="text"
                        placeholder="Ex.: Salário, freelance…"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={cn(
                          'w-full bg-transparent border-0 border-b py-2 text-sm font-medium outline-none focus:ring-0 transition-colors placeholder:text-muted-foreground/55',
                          titleInvalid
                            ? 'border-destructive focus:border-destructive'
                            : 'border-border focus:border-primary'
                        )}
                      />
                      {titleInvalid && (
                        <p className="text-xs font-medium text-destructive">Este campo é obrigatório.</p>
                      )}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="flex items-start gap-3 py-3 border-b border-border/60" data-tour="fluxia-tx-categoria">
                    <Bookmark className="size-5 text-muted-foreground shrink-0 mt-2" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Categoria
                      </p>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger
                          className={cn(
                            'h-10 rounded-xl border-2 bg-background/50 shadow-none gap-2 [&_svg]:text-muted-foreground',
                            accent.catRing
                          )}
                        >
                          <CategoryIcon className="size-4 shrink-0 text-muted-foreground" />
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent className="z-[120] max-h-64">
                          {categories.map((c) => {
                            const Ico = getCategoryIcon(c);
                            return (
                              <SelectItem key={c} value={c}>
                                <span className="flex items-center gap-2">
                                  <Ico className="size-4 shrink-0 text-muted-foreground" />
                                  {c}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Carteiras / meios */}
                  <div className="flex items-start gap-3 py-3 border-b border-border/60" data-tour="fluxia-tx-pagamento">
                    <Building2 className="size-5 text-muted-foreground shrink-0 mt-2" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Conta / carteira
                        </p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          onClick={() => {
                            const n = window.prompt('Nome da nova carteira:');
                            if (n) persistCustomWallet(n);
                          }}
                        >
                          <Plus className="size-3.5" /> Nova
                        </button>
                      </div>
                      <Select value={walletSelectValue} onValueChange={handleWalletSelect}>
                        <SelectTrigger className="h-10 rounded-xl border-2 border-blue-500/45 bg-background/50 shadow-none gap-2">
                          <CreditCard className="size-4 shrink-0 text-blue-600/80 dark:text-blue-400" />
                          <SelectValue placeholder="Conta" />
                        </SelectTrigger>
                        <SelectContent className="z-[120] max-h-64">
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: a.color }}
                                />
                                {a.name}
                              </span>
                            </SelectItem>
                          ))}
                          {accounts.length > 0 && walletOptions.length > 0 && (
                            <>
                              <SelectSeparator />
                              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                Outras / legado
                              </div>
                            </>
                          )}
                          {walletOptions.map((w) => (
                            <SelectItem key={`leg-${w}`} value={`${LEGACY_PAYMENT_PREFIX}${w}`}>
                              {w}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Contas cadastradas em <strong>Contas</strong> no menu; opções abaixo são rótulos rápidos
                        sem vínculo.
                      </p>
                    </div>
                  </div>

                  {/* Anexo */}
                  <div className="flex items-center gap-3 py-3 border-b border-border/60">
                    <Paperclip className="size-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.csv,application/pdf"
                        onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Anexar arquivo
                        </button>
                        {attachmentFile && (
                          <>
                            <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                              {attachmentFile.name}
                            </span>
                            <button
                              type="button"
                              className="text-xs text-destructive font-medium"
                              onClick={() => setAttachmentFile(null)}
                            >
                              Remover
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna detalhes — largura animada (desktop) */}
                <motion.aside
                  initial={false}
                  animate={{
                    width: detailsExpanded ? 320 : 0,
                    opacity: detailsExpanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'hidden md:flex shrink-0 flex-col overflow-hidden border-t md:border-t-0 md:border-l border-border bg-muted/20',
                    !detailsExpanded && 'pointer-events-none'
                  )}
                >
                  <motion.div
                    initial={false}
                    animate={{ x: detailsExpanded ? 0 : 12 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="w-80 p-4 md:p-5 space-y-5 overflow-y-auto max-h-[min(92vh,880px)] shrink-0"
                  >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Mais detalhes
                        </p>

                        <div className="space-y-2" data-tour="fluxia-tx-tags">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="size-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Tags</span>
                          </div>
                          <input
                            type="text"
                            placeholder="viagem, mercado…"
                            value={tagsStr}
                            onChange={(e) => setTagsStr(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2" data-tour="fluxia-tx-observacao">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Pencil className="size-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Observação</span>
                          </div>
                          <textarea
                            placeholder="Detalhes adicionais…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          />
                        </div>

                        {type === 'expense' && (
                          <label className="flex items-center gap-3 rounded-xl border border-border bg-background/80 p-3 cursor-pointer">
                            <Pin className="size-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Criar conta fixa</p>
                              <p className="text-[11px] text-muted-foreground">
                                Adiciona em Contas fixas com o vencimento do dia do lançamento
                              </p>
                            </div>
                            <Switch
                              checked={createFixedExpense}
                              onCheckedChange={setCreateFixedExpense}
                              disabled={!!initialTransaction}
                            />
                          </label>
                        )}

                        {type === 'expense' && (
                          <div className="space-y-2" data-tour="fluxia-tx-mindful">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Tipo de gasto (Mindful)
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                              {SPENDING_TYPES.map((st) => (
                                <button
                                  key={st.value}
                                  type="button"
                                  onClick={() =>
                                    setSpendingType(spendingType === st.value ? null : st.value)
                                  }
                                  className={cn(
                                    'p-2.5 rounded-lg border text-left transition-all text-xs',
                                    spendingType === st.value
                                      ? 'border-primary bg-primary/10 text-primary font-medium'
                                      : 'border-border hover:border-primary/40'
                                  )}
                                >
                                  <span className="block font-medium">{st.label}</span>
                                  <span className="text-muted-foreground">{st.description}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 rounded-xl border border-border bg-background/80 p-3" data-tour="fluxia-tx-recorrente">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="size-4 text-muted-foreground" />
                            <span className="flex-1 text-sm font-medium">Repetir</span>
                            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Ao salvar, o app cria <strong>{Math.max(1, recurringCount)}</strong> lançamentos iguais nas
                            datas previstas ({recurringInterval === 'MONTH' ? 'meses' : 'semanas'}), a partir da data
                            escolhida.
                          </p>
                          <AnimatePresence>
                            {isRecurring && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden space-y-2 pt-1"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={recurringCount}
                                    onChange={(e) =>
                                      setRecurringCount(
                                        Math.max(1, parseInt(e.target.value, 10) || 1)
                                      )
                                    }
                                    className="w-14 h-9 rounded-lg border border-border bg-background text-center text-sm"
                                  />
                                  <span className="text-sm text-muted-foreground">vezes</span>
                                  <select
                                    value={recurringInterval}
                                    onChange={(e) =>
                                      setRecurringInterval(e.target.value as RecurringInterval)
                                    }
                                    className="flex-1 min-w-[6rem] h-9 rounded-lg border border-border bg-background px-2 text-sm"
                                  >
                                    <option value="MONTH">Meses</option>
                                    <option value="WEEK">Semanas</option>
                                  </select>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                  </motion.div>
                </motion.aside>
              </div>

              {/* Mobile: detalhes empilhados */}
              <AnimatePresence>
                {detailsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="md:hidden overflow-hidden border-t border-border bg-muted/20"
                  >
                    <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Mais detalhes</p>
                      <input
                        type="text"
                        placeholder="Tags"
                        value={tagsStr}
                        onChange={(e) => setTagsStr(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <textarea
                        placeholder="Observação"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      {type === 'expense' && (
                        <>
                          <label className="flex items-center gap-2 text-sm">
                            <Switch
                              checked={createFixedExpense}
                              onCheckedChange={setCreateFixedExpense}
                              disabled={!!initialTransaction}
                            />
                            Conta fixa
                          </label>
                          <div className="space-y-2">
                            <span className="text-xs text-muted-foreground">Mindful</span>
                            <div className="flex flex-wrap gap-1">
                              {SPENDING_TYPES.map((st) => (
                                <button
                                  key={st.value}
                                  type="button"
                                  onClick={() =>
                                    setSpendingType(spendingType === st.value ? null : st.value)
                                  }
                                  className={cn(
                                    'px-2 py-1 rounded-md text-xs border',
                                    spendingType === st.value
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border'
                                  )}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                        Repetir
                      </label>
                      {isRecurring && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={1}
                            className="w-14 h-9 rounded border text-sm text-center"
                            value={recurringCount}
                            onChange={(e) =>
                              setRecurringCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                            }
                          />
                          <span className="text-xs">vezes</span>
                          <select
                            value={recurringInterval}
                            onChange={(e) =>
                              setRecurringInterval(e.target.value as RecurringInterval)
                            }
                            className="h-9 rounded border text-sm flex-1"
                          >
                            <option value="MONTH">Meses</option>
                            <option value="WEEK">Semanas</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rodapé */}
            <div
              className="shrink-0 border-t border-border bg-card p-4 md:p-5 space-y-3"
              data-tour="fluxia-tx-botoes"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsExpanded((e) => !e)}
                  className="text-sm font-semibold text-primary hover:text-primary/90 transition-colors flex items-center gap-1.5 underline-offset-4 hover:underline"
                >
                  {detailsExpanded ? (
                    <>
                      Menos detalhes <span className="text-lg leading-none">‹</span>
                    </>
                  ) : (
                    <>
                      Mais detalhes <span className="text-lg leading-none">›</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-col-reverse sm:flex-row flex-wrap items-stretch sm:items-center gap-3 justify-between">
                {!initialTransaction && (
                  <button
                    type="button"
                    disabled={saving || !canSave}
                    onClick={() => save(true)}
                    className="text-xs font-bold tracking-wide text-foreground/80 hover:text-foreground disabled:opacity-40 uppercase text-left sm:text-center py-2 sm:py-0"
                  >
                    Salvar e criar nova
                  </button>
                )}
                {initialTransaction && <span className="hidden sm:block w-0 sm:w-px" />}
                <div className="flex gap-2 justify-end sm:ml-auto shrink-0">
                  <Button variant="outline" className="min-w-[5.5rem]" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={!canSave || saving}
                    className={cn(
                      'min-w-[6.5rem] gap-2 text-white border-0 shadow-md disabled:opacity-45',
                      accent.save
                    )}
                    onClick={() => save(false)}
                    loading={saving}
                  >
                    <Check size={18} /> Salvar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
