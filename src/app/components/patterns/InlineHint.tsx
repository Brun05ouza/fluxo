import React from 'react';
import { cn } from '../ui';

interface InlineHintProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineHint({ children, className }: InlineHintProps) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </p>
  );
}
