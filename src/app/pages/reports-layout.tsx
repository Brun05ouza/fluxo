import React, { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/app/components/ui';

export type ReportsOutletContext = {
  onGoToImport: () => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
  onGuideClick: () => void;
};

export function ReportsLayout({
  onGoToImport,
  onAddTransaction,
  onGuideClick,
}: ReportsOutletContext) {
  const contextValue = useMemo(
    () => ({ onGoToImport, onAddTransaction, onGuideClick }),
    [onGoToImport, onAddTransaction, onGuideClick]
  );

  const tabClass = (isActive: boolean) =>
    cn(
      'px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <nav
        className="flex flex-wrap items-center gap-2 border-b border-border pb-4"
        aria-label="Contas e análise"
      >
        <NavLink to="/reports" end className={({ isActive }) => tabClass(isActive)}>
          Contas
        </NavLink>
        <NavLink to="/reports/analise" className={({ isActive }) => tabClass(isActive)}>
          Análise
        </NavLink>
      </nav>
      <Outlet context={contextValue} />
    </div>
  );
}
