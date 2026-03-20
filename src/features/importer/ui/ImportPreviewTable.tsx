import React from 'react';
import { Card, Badge, Button, cn } from '@/app/components/ui';
import { CategoryInlineSelect } from './CategoryInlineSelect';
import type { PreviewTxn } from '../types';
import { formatCurrencyAbsBRL } from '@/lib/format-currency';

interface ImportPreviewTableProps {
  rows: PreviewTxn[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onCategoryChange: (id: string, category: string) => void;
  onTypeChange: (id: string, type: 'expense' | 'income') => void;
  onRemove: (id: string) => void;
  hideDuplicates: boolean;
  onlyWithoutCategory: boolean;
}

export const ImportPreviewTable = ({
  rows,
  selectedIds,
  onSelect,
  onCategoryChange,
  onTypeChange,
  onRemove,
  hideDuplicates,
  onlyWithoutCategory,
}: ImportPreviewTableProps) => {
  const filtered = rows.filter((r) => {
    if (hideDuplicates && r.isDuplicate) return false;
    if (onlyWithoutCategory && r.category === 'Outros') return false;
    return true;
  });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                  onChange={(e) =>
                    filtered.forEach((r) => onSelect(r.id, e.target.checked))
                  }
                />
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border hover:bg-muted/20',
                  row.isDuplicate && 'opacity-60'
                )}
              >
                <td className="px-4 py-2">
                  {!row.isDuplicate && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => onSelect(row.id, e.target.checked)}
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-sm">{row.date}</td>
                <td className="px-4 py-2 text-sm max-w-[200px] truncate">{row.description}</td>
                <td
                  className={cn(
                    'px-4 py-2 text-sm font-medium',
                    row.amount >= 0 ? 'text-emerald-500' : 'text-foreground'
                  )}
                >
                  {row.amount >= 0 ? '+' : '-'} {formatCurrencyAbsBRL(row.amount)}
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    {row.amount >= 0 ? 'Receita' : 'Gasto'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {row.isDuplicate ? (
                    <Badge variant="secondary">Duplicado</Badge>
                  ) : (
                    <CategoryInlineSelect
                      value={row.category}
                      onChange={(v) => onCategoryChange(row.id, v)}
                      confidence={row.confidence}
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {!row.isDuplicate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => onRemove(row.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          Nenhuma transação para exibir com os filtros atuais.
        </div>
      )}
    </Card>
  );
};
