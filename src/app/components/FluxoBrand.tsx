import React from 'react';
import { cn } from './ui';

interface FluxoBrandProps {
  logoSize?: 'sm' | 'md' | 'lg';
  textSize?: 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'default' | 'light';
  className?: string;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

const textSizeMap = {
  base: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
  '3xl': 'text-4xl',
};

export const FluxoBrand = ({
  logoSize = 'md',
  textSize = 'lg',
  variant = 'default',
  className,
}: FluxoBrandProps) => (
  <div
    className={cn(
      'flex items-center gap-1.5',
      className
    )}
  >
    <img
      src="/fluxo-icon.png?v=2"
      alt="Fluxo"
      className={cn(sizeMap[logoSize], 'object-contain shrink-0')}
    />
    <span
      className={cn(
        'font-bold tracking-tight fluxo-brand-text',
        textSizeMap[textSize],
        variant === 'light' && 'fluxo-brand-text-light'
      )}
    >
      Fluxo
    </span>
  </div>
);
