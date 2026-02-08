import React from 'react';
import { CATEGORIES } from '@/types/database';
import { cn } from '@/app/components/ui';

interface CategoryInlineSelectProps {
  value: string;
  onChange: (value: string) => void;
  confidence?: number;
  className?: string;
}

export const CategoryInlineSelect = ({
  value,
  onChange,
  confidence = 1,
  className,
}: CategoryInlineSelectProps) => {
  const isSuggested = confidence < 0.9;

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full min-w-[120px] h-8 px-2 text-sm rounded-md border bg-background',
          isSuggested && 'border-orange-500/50'
        )}
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      {isSuggested && (
        <span
          className="absolute -top-1 -right-1 text-[10px] text-orange-500"
          title="Sugestao"
        >
          ?
        </span>
      )}
    </div>
  );
};
