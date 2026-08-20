import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TransactionsProvider, useTransactions } from '@/hooks/useTransactions';
import { AccountsProvider } from '@/hooks/useAccounts';
import { useFixedExpenses } from '@/hooks/useFixedExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { computeForecast, getAlertMessageForCategory } from '@/lib/forecast';
import { AppLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { FixedExpenses } from './components/FixedExpenses';
import { Budgets, Reports, Settings, Profile, ReportsLayout, AccountsPage } from './components/Pages';
import { ImportPage } from '@/features/importer/ImportPage';
import { ImportPreviewPage } from '@/features/importer/ImportPreviewPage';
import { TransactionDrawer } from './components/TransactionDrawer';
import { Login } from './components/Login';
import { FirstAccessOnboarding } from './components/FirstAccessOnboarding';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { Toaster, toast } from 'sonner';
import { TourProvider, FluxiaButton, FluxiaDrawer } from '@/fluxia';
import { AdminGate } from '@/admin/AdminGate';
import { AdminPage } from '@/admin/AdminPage';
import type { Transaction, TransactionSavePayload } from '@/types/database';
import { materializeRecurringDates } from '@/lib/transaction-dates';
import { uploadTransactionAttachment } from '@/lib/transaction-attachment';

/** Rotas principais: precisa estar dentro de `TransactionsProvider`. */
const FluxoShell = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { transactions, addTransaction, addTransactions, updateTransaction } = useTransactions();
  const { addExpense } = useFixedExpenses(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [newTransactionPreset, setNewTransactionPreset] = React.useState<
    'income' | 'expense' | null
  >(null);
  const [typePickerOpen, setTypePickerOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.info('Até logo!');
  };

  const closeTransactionDrawer = React.useCallback(() => {
    setIsDrawerOpen(false);
    setNewTransactionPreset(null);
  }, []);

  const handleAddTransaction = React.useCallback((type?: 'income' | 'expense') => {
    if (type) {
      setNewTransactionPreset(type);
      setIsDrawerOpen(true);
    } else {
      setTypePickerOpen(true);
    }
  }, []);

  const handlePickTransactionType = React.useCallback((type: 'income' | 'expense') => {
    setTypePickerOpen(false);
    setNewTransactionPreset(type);
    setIsDrawerOpen(true);
  }, []);

  const [fluxiaOpen, setFluxiaOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      setTypePickerOpen(false);
      setNewTransactionPreset(null);
      setIsDrawerOpen(true);
    };
    window.addEventListener('fluxia-tour-open-drawer', handler);
    return () => window.removeEventListener('fluxia-tour-open-drawer', handler);
  }, []);

  const handleSaveTransaction = async (payload: TransactionSavePayload) => {
    const { create_fixed_expense, attachmentFile, ...rest } = payload;

    const shouldMaterialize =
      Boolean(rest.is_recurring) && Math.max(1, rest.recurring_count ?? 1) >= 1;
    const parcelCount = shouldMaterialize
      ? Math.max(1, rest.recurring_count ?? 1)
      : 1;
    const interval = rest.recurring_interval ?? 'MONTH';
    const dates = shouldMaterialize
      ? materializeRecurringDates(rest.date, interval, parcelCount)
      : [rest.date];

    const {
      is_recurring: _ir,
      recurring_count: _rc,
      recurring_interval: _ri,
      ...baseFields
    } = rest;

    const rowTemplate: Omit<Transaction, 'id' | 'user_id' | 'created_at'> = {
      ...baseFields,
      is_recurring: false,
      recurring_count: null,
      recurring_interval: null,
      attachment_url: null,
    };

    const rows = dates.map((d) => ({ ...rowTemplate, date: d }));

    let ids: string[] = [];
    if (rows.length === 1) {
      const r = await addTransaction(rows[0]!);
      if (r.error) return { error: r.error };
      if (r.id) ids = [r.id];
    } else {
      const r = await addTransactions(rows);
      if (r.error) return { error: r.error };
      ids = r.ids;
    }

    if (attachmentFile && user && ids.length > 0) {
      const { url, error: upErr } = await uploadTransactionAttachment(user.id, attachmentFile);
      if (upErr) {
        toast.warning('Lançamentos salvos, mas o anexo não pôde ser enviado.');
      } else if (url) {
        for (const id of ids) {
          await updateTransaction(id, { attachment_url: url });
        }
      }
    }

    if (create_fixed_expense && user && rest.amount < 0 && dates[0]) {
      const dueDay = Math.min(31, Math.max(1, parseInt(dates[0].slice(8, 10), 10) || 1));
      const fe = await addExpense({
        title: rest.title.slice(0, 500),
        amount: Math.abs(Number(rest.amount)),
        due_day: dueDay,
        category: rest.category,
        is_active: true,
      });
      if (fe.error) {
        toast.warning('Lançamento salvo, mas não foi possível criar a conta fixa.');
      } else {
        toast.success('Conta fixa criada a partir do lançamento.');
      }
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const syntheticTx = {
      ...rowTemplate,
      date: dates[0]!,
      id: 'temp',
      user_id: user!.id,
      created_at: new Date().toISOString(),
    };
    const forecast = computeForecast(month, [...transactions, syntheticTx], budgets);
    const catForecast = forecast.byCategory.find((c) => c.category === rest.category);
    if (catForecast) {
      const msg = getAlertMessageForCategory(catForecast.category, catForecast.percentUsed);
      if (msg) toast.warning(msg);
    }
    return { error: null, parcelCount: rows.length };
  };

  if (!user) return null;

  return (
    <TourProvider>
      <AppLayout
        onLogout={handleLogout}
        onAddTransaction={handleAddTransaction}
        onHelpClick={() => setFluxiaOpen(true)}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onAddTransaction={handleAddTransaction}
                onGoToTransactions={() => navigate('/transactions')}
                onGoToBudgets={() => navigate('/budgets')}
                onGoToFixedExpenses={() => navigate('/fixed-expenses')}
                onGoToReports={() => navigate('/reports/analise')}
                onGoToImport={() => navigate('/import')}
                onGuideClick={() => setFluxiaOpen(true)}
              />
            }
          />
          <Route path="/transactions" element={<Transactions onAddTransaction={handleAddTransaction} onGoToImport={() => navigate('/import')} onGuideClick={() => setFluxiaOpen(true)} />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/import/preview" element={<ImportPreviewPage />} />
          <Route path="/fixed-expenses" element={<FixedExpenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route
            path="/reports"
            element={
              <ReportsLayout
                onGoToImport={() => navigate('/import')}
                onAddTransaction={handleAddTransaction}
                onGuideClick={() => setFluxiaOpen(true)}
              />
            }
          >
            <Route index element={<AccountsPage />} />
            <Route path="analise" element={<Reports />} />
            <Route path="contas" element={<Navigate to="/reports" replace />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={closeTransactionDrawer}
        onSave={handleSaveTransaction}
        presetType={newTransactionPreset}
      />
      {typePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="type-picker-title"
          onClick={() => setTypePickerOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 id="type-picker-title" className="text-lg font-bold text-foreground">
                Novo lançamento
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha o tipo antes de preencher valor e detalhes.
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400 transition-colors border border-emerald-500/30"
                onClick={() => handlePickTransactionType('income')}
              >
                Receita
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-400 transition-colors border border-red-500/30"
                onClick={() => handlePickTransactionType('expense')}
              >
                Despesa
              </button>
            </div>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
              onClick={() => setTypePickerOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <FluxiaButton
        onClick={() => setFluxiaOpen(true)}
        hidden={fluxiaOpen || isDrawerOpen || typePickerOpen}
      />
      <FluxiaDrawer open={fluxiaOpen} onOpenChange={setFluxiaOpen} />
      <AdminGate currentUserId={user.id} />
    </TourProvider>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useFinancialProfile(user?.id);

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {loading ? 'Verificando sessão…' : 'Carregando seu perfil…'}
        </p>
      </div>
    );
  }

  if (!user) return <Login />;

  const needsOnboarding = !profile || profile.onboarding_completed_at == null;

  if (needsOnboarding) {
    return (
      <>
        <FirstAccessOnboarding
          userId={user.id}
          onComplete={async () => {
            await refetchProfile();
          }}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (location.pathname.startsWith('/admin')) {
    if (!profile?.is_admin) return <Navigate to="/" replace />;
    return <AdminPage userId={user.id} />;
  }

  return (
    <TransactionsProvider userId={user.id}>
      <AccountsProvider userId={user.id}>
        <FluxoShell />
      </AccountsProvider>
    </TransactionsProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
