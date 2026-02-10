import React from 'react';
import { Card, cn } from '../ui';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({ title, children, className, action }: SectionCardProps) {
  return (
    <Card className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="font-bold text-lg">{title}</h3>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}
