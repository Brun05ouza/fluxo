import React, { useState } from 'react';
import {
  X,
  Calendar,
  Tag,
  CreditCard,
  AlignLeft,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button, Input, cn } from './ui';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PAYMENT_METHODS, SPENDING_TYPES } from '@/types/database';
import { toast } from 'sonner';

interface TransactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: {
    title: string;
    description: string;
    category: string;
    amount: number;
    date: string;
    payment_method: string;
    tags: string[];
    is_recurring: boolean;
    spending_type?: 'ESSENTIAL' | 'OPTIONAL' | 'EMOTIONAL' | null;
  }) => Promise<{ error: Error | null }>;
}

export const TransactionDrawer = ({ isOpen, onClose, onSave }: TransactionDrawerProps) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [tagsStr, setTagsStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [spendingType, setSpendingType] = useState<'ESSENTIAL' | 'OPTIONAL' | 'EMOTIONAL' | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType('expense');
    setAmount('');
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setTagsStr('');
    setIsRecurring(false);
    setSpendingType(null);
  };

  const handleSave = async () => {
    const num = parseFloat(amount?.replace(',', '.') || '0');
    if (num <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe a descrição');
      return;
    }
    setSaving(true);
    const value = type === 'income' ? num : -num;
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const { error } = await onSave({
      title: title.trim(),
      description: description.trim() || '',
      category,
      amount: value,
      date,
      payment_method: paymentMethod,
      tags,
      is_recurring: isRecurring,
      spending_type: type === 'expense' ? spendingType : null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Transação salva!');
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova Transação</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex p-1 bg-muted rounded-xl">
                <button
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

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  Valor
                </p>
                <div className="relative inline-block w-full">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={cn(
                      'w-full bg-transparent text-5xl font-bold text-center border-none outline-hidden focus:ring-0 placeholder:text-muted/30 pl-8',
                      type === 'income' ? 'text-emerald-500' : 'text-foreground'
                    )}
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value.replace(/[^\d,.]/g, '').replace(/,/g, '.')
                      )
                    }
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Descrição"
                  placeholder="Ex: Supermercado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  icon={<AlignLeft size={18} />}
                />
                <Input
                  label="Observação (opcional)"
                  placeholder="Detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      Categoria
                    </label>
                    <div className="relative">
                      <select
                        className="w-full h-11 pl-3 pr-10 bg-background border border-border rounded-[var(--radius)] appearance-none outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                        size={18}
                      />
                    </div>
                  </div>
                  <Input
                    label="Data"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    icon={<Calendar size={18} />}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Forma de Pagamento
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-11 pl-10 pr-10 bg-background border border-border rounded-[var(--radius)] appearance-none outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <CreditCard
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      size={18}
                    />
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      size={18}
                    />
                  </div>
                </div>

                {type === 'expense' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de gasto (Mindful)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SPENDING_TYPES.map((st) => (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setSpendingType(spendingType === st.value ? null : st.value)}
                          className={cn(
                            'p-3 rounded-lg border text-left transition-all',
                            spendingType === st.value
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="block text-sm font-medium">{st.label}</span>
                          <span className="block text-xs text-muted-foreground truncate">{st.description}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Opcional — ajuda nos insights</p>
                  </div>
                )}

                <Input
                  label="Tags"
                  placeholder="viagem, mercado..."
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  icon={<Tag size={18} />}
                />

                <label className="flex items-center gap-3 p-4 rounded-[var(--radius)] border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Transação Recorrente</p>
                    <p className="text-xs text-muted-foreground">Repetir mensalmente</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSave} loading={saving}>
                <Check size={20} /> Salvar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
