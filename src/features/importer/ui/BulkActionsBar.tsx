import React from 'react';
import { Button } from '@/app/components/ui';
import { CATEGORIES } from '@/types/database';

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  onSetCategory: (category: string) => void;
  onSetType: (type: 'expense' | 'income') => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedIds,
  onSetCategory,
  onSetType,
  onClearSelection,
}: BulkActionsBarProps) => {
  if (selectedIds.size === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
      <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
      <div className="flex gap-2">
        <select
          className="h-8 px-2 text-sm rounded-md border bg-background"
          onChange={(e) => {
            const v = e.target.value;
            if (v) onSetCategory(v);
          }}
          defaultValue=""
        >
          <option value="">Definir categoria...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => onSetType('expense')}>
          Gasto
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSetType('income')}>
          Receita
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Limpar
      </Button>
    </div>
  );
};
