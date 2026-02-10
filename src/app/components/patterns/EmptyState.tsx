import React from 'react';
import { Card, Button, cn } from '../ui';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  onGuideClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  bullets,
  primaryAction,
  secondaryAction,
  onGuideClick,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-4 max-w-sm space-y-1 text-left text-sm text-muted-foreground">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-primary">•</span>
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} className="gap-2">
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {onGuideClick && (
          <button
            type="button"
            onClick={onGuideClick}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Me guiar com o Flux.ia
          </button>
        )}
      </div>
    </Card>
  );
}
