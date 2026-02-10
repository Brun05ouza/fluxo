import React from 'react';
import { Button, cn } from '../ui';

interface PrimaryCTAProps {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function PrimaryCTA({ children, onClick, loading, icon, className }: PrimaryCTAProps) {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      size="lg"
      className={cn('gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30', className)}
    >
      {icon}
      {children}
    </Button>
  );
}
