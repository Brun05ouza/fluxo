import React from 'react';
import { Card, cn } from '../ui';

export type KPIVariant = 'default' | 'positive' | 'negative';

export interface KPIItem {
  label: string;
  value: string;
  variant?: KPIVariant;
}

interface KPIGroupProps {
  items: [KPIItem, KPIItem, KPIItem];
  className?: string;
}

const variantClasses: Record<KPIVariant, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-destructive',
};

export function KPIGroup({ items, className }: KPIGroupProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      {items.map((item, i) => (
        <Card key={i} className="p-5 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
          <p className={cn('text-2xl font-bold', variantClasses[item.variant ?? 'default'])}>
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
