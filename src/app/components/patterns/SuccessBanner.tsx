import React from 'react';
import { cn } from '../ui';

interface SuccessBannerProps {
  message: string;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function SuccessBanner({ message, onDismiss, action, className }: SuccessBannerProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4',
        className
      )}
    >
      <p className="font-medium text-emerald-700 dark:text-emerald-400">{message}</p>
      <div className="flex items-center gap-2">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
