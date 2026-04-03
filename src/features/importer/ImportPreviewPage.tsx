import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, FileSearch } from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';
import { EmptyState } from '@/app/components/patterns';
import { emptyStates, hints } from '@/content/microcopy';
import { ImportPreviewTable } from './ui/ImportPreviewTable';
import { BulkActionsBar } from './ui/BulkActionsBar';
import type { PreviewTxn } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';

export const ImportPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTransactions } = useTransactions();
  const stateRows = (location.state as { rows?: PreviewTxn[] })?.rows ?? [];

  const [rows, setRows] = useState<PreviewTxn[]>(stateRows);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [onlyWithoutCategory, setOnlyWithoutCategory] = useState(false);
  const [committing, setCommitting] = useState(false);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback((id: string, category: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, category } : r))
    );
  }, []);

  const handleTypeChange = useCallback((id: string, type: 'expense' | 'income') => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const amount = Math.abs(r.amount);
        return { ...r, amount: type === 'income' ? amount : -amount };
      })
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSetCategoryBulk = useCallback((category: string) => {
    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id) ? { ...r, category } : r
      )
    );
  }, [selectedIds]);

  const handleSetTypeBulk = useCallback(
    (type: 'expense' | 'income') => {
      setRows((prev) =>
        prev.map((r) => {
          if (!selectedIds.has(r.id)) return r;
          const amount = Math.abs(r.amount);
          return { ...r, amount: type === 'income' ? amount : -amount };
        })
      );
    },
    [selectedIds]
  );

  const handleConfirm = useCallback(async () => {
    const toImport = rows.filter(
      (r) => !r.isDuplicate || includeDuplicates
    );
    if (toImport.length === 0) {
      toast.error('Nenhuma transação para importar.');
      return;
    }

    setCommitting(true);
    const txs = toImport.map((r) => ({
      title: r.title,
      description: r.description || null,
      category: r.category,
      amount: r.amount,
      date: r.date,
      payment_method: r.payment_method,
      tags: r.tags,
      is_recurring: r.is_recurring,
    }));

    const { error } = await addTransactions(txs);
    setCommitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const dupCount = rows.filter((r) => r.isDuplicate && !includeDuplicates).length;
    toast.success(
      dupCount > 0
        ? `Importamos ${txs.length} transações. Ignoramos ${dupCount} duplicadas.`
        : `Importamos ${txs.length} transações.`
    );
    navigate('/?import=success&importCount=' + txs.length);
  }, [rows, includeDuplicates, addTransactions, navigate]);

  if (stateRows.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<FileSearch size={28} />}
          title={emptyStates.importPreview.noData}
          description="Volte à tela de importação e envie um arquivo CSV ou OFX."
          primaryAction={{ label: emptyStates.importPreview.backCta, onClick: () => navigate('/import') }}
        />
      </div>
    );
  }

  const toImport = rows.filter((r) => !r.isDuplicate || includeDuplicates);
  const totalGastos = toImport.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const totalReceitas = toImport.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const total = rows.length;
  const dupCount = rows.filter((r) => r.isDuplicate).length;
  const withoutCat = rows.filter((r) => r.category === 'Outros').length;

  const formatCurrency = (v: number) =>
    'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Passos: 2) Revise 3) Confirme */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
          {hints.importSteps[0]}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
          {hints.importSteps[1]}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</span>
          {hints.importSteps[2]}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revisar importação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} encontradas • {withoutCat} sem categoria definida • {dupCount} duplicadas
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/import')}>
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>
      </div>

      {/* Resumo antes de confirmar */}
      <Card className="p-5 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-lg mb-2">Resumo do extrato</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Você vai importar <strong className="text-foreground">{toImport.length} lançamentos</strong>.
          {totalGastos > 0 && (
            <> <strong className="text-destructive">{formatCurrency(totalGastos)}</strong> em gastos.</>
          )}
          {totalReceitas > 0 && (
            <> <strong className="text-emerald-600">{formatCurrency(totalReceitas)}</strong> em receitas.</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Revise as categorias na tabela abaixo e clique em &quot;Importar extrato&quot; para confirmar.
        </p>
      </Card>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideDuplicates}
            onChange={(e) => setHideDuplicates(e.target.checked)}
          />
          <span className="text-sm">Ocultar duplicadas</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyWithoutCategory}
            onChange={(e) => setOnlyWithoutCategory(e.target.checked)}
          />
          <span className="text-sm">Somente sem categoria</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeDuplicates}
            onChange={(e) => setIncludeDuplicates(e.target.checked)}
          />
          <span className="text-sm">Importar duplicadas mesmo assim</span>
        </label>
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onSetCategory={handleSetCategoryBulk}
        onSetType={handleSetTypeBulk}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <ImportPreviewTable
        rows={rows}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onCategoryChange={handleCategoryChange}
        onTypeChange={handleTypeChange}
        onRemove={handleRemove}
        hideDuplicates={hideDuplicates}
        onlyWithoutCategory={onlyWithoutCategory}
      />

      <div className="flex justify-end">
        <Button onClick={handleConfirm} loading={committing} className="gap-2" data-tour="fluxia-import-confirm">
          <Check size={18} />
          Importar extrato
        </Button>
      </div>
    </div>
  );
};
