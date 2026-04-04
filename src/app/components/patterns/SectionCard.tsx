import React from 'react';
import { Card, cn } from '../ui';

interface SectionCardProps {
  title?: string;
  /** Texto de apoio abaixo do título (contexto para qualquer perfil de usuário). */
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({ title, description, children, className, action }: SectionCardProps) {
  return (
    <Card className={cn('space-y-4 p-5', className)}>
      {(title || description || action) && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {title && <h3 className="font-bold text-lg tracking-tight">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground leading-snug">{description}</p>}
          </div>
          {action && <div className="shrink-0 sm:pt-0.5">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}
