import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';
import { Card, Button, cn } from '@/app/components/ui';
import { ImportPreviewTable } from './ui/ImportPreviewTable';
import { BulkActionsBar } from './ui/BulkActionsBar';
import type { PreviewTxn } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';

export const ImportPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTransactions } = useTransactions(user?.id);
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
    navigate('/?import=success');
  }, [rows, includeDuplicates, addTransactions, navigate]);

  if (stateRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Nenhum dado para revisar.</p>
        <Button variant="outline" onClick={() => navigate('/import')}>
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const total = rows.length;
  const dupCount = rows.filter((r) => r.isDuplicate).length;
  const withoutCat = rows.filter((r) => r.category === 'Outros').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        <Button onClick={handleConfirm} loading={committing} className="gap-2">
          <Check size={18} />
          Confirmar importação
        </Button>
      </div>
    </div>
  );
};
