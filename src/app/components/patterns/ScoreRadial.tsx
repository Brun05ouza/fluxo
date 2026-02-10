import React from 'react';
import { cn } from '../ui';

interface ScoreRadialProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRadial({ value, size = 120, strokeWidth = 10, className }: ScoreRadialProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-700"
        />
      </svg>
      <span className="absolute text-2xl font-bold tabular-nums">{Math.round(clamped)}</span>
    </div>
  );
}
