import React from 'react';
import { Card, cn } from '../ui';

export type KPIVariant = 'default' | 'positive' | 'negative';

export interface KPIItem {
  label: string;
  value: string;
  variant?: KPIVariant;
  /** Explica em uma linha o que o número significa (acessível para iniciantes). */
  hint?: string;
}

interface KPIGroupProps {
  items: KPIItem[];
  className?: string;
}

const variantClasses: Record<KPIVariant, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-destructive',
};

const gridForCount = (n: number) =>
  n <= 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : n === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

export function KPIGroup({ items, className }: KPIGroupProps) {
  return (
    <div className={cn('grid gap-4', gridForCount(items.length), className)}>
      {items.map((item, i) => (
        <Card key={i} className="flex flex-col justify-center p-5 min-h-[7.5rem] space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <p className={cn('text-2xl font-bold tabular-nums', variantClasses[item.variant ?? 'default'])}>
            {item.value}
          </p>
          {item.hint ? <p className="text-xs text-muted-foreground leading-snug pt-0.5">{item.hint}</p> : null}
        </Card>
      ))}
    </div>
  );
}
