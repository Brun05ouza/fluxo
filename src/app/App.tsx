import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { computeForecast, getAlertMessageForCategory } from '@/lib/forecast';
import { AppLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { FixedExpenses } from './components/FixedExpenses';
import { Budgets, Reports, Settings } from './components/Pages';
import { ImportPage } from '@/features/importer/ImportPage';
import { ImportPreviewPage } from '@/features/importer/ImportPreviewPage';
import { TransactionDrawer } from './components/TransactionDrawer';
import { Login } from './components/Login';
import { Toaster, toast } from 'sonner';
import { TourProvider, FluxiaButton, FluxiaDrawer } from '@/fluxia';

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { transactions, addTransaction } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.info('Até logo!');
  };

  const handleAddTransaction = () => setIsDrawerOpen(true);
  const [fluxiaOpen, setFluxiaOpen] = React.useState(false);

  const handleSaveTransaction = async (
    tx: Parameters<typeof addTransaction>[0]
  ) => {
    const result = await addTransaction(tx);
    if (result.error) return result;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const syntheticTx = {
      ...tx,
      id: 'temp',
      user_id: user!.id,
      created_at: new Date().toISOString(),
    } as typeof tx & { id: string; user_id: string; created_at: string };
    const forecast = computeForecast(month, [...transactions, syntheticTx], budgets);
    const catForecast = forecast.byCategory.find((c) => c.category === tx.category);
    if (catForecast) {
      const msg = getAlertMessageForCategory(catForecast.category, catForecast.percentUsed);
      if (msg) toast.warning(msg);
    }
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <TourProvider>
      <AppLayout onLogout={handleLogout} onAddTransaction={handleAddTransaction}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onAddTransaction={handleAddTransaction}
                onGoToTransactions={() => navigate('/transactions')}
                onGoToBudgets={() => navigate('/budgets')}
                onGoToFixedExpenses={() => navigate('/fixed-expenses')}
                onGoToReports={() => navigate('/reports')}
              />
            }
          />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/import/preview" element={<ImportPreviewPage />} />
          <Route path="/fixed-expenses" element={<FixedExpenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveTransaction}
      />
      <FluxiaButton onClick={() => setFluxiaOpen(true)} hidden={fluxiaOpen} />
      <FluxiaDrawer open={fluxiaOpen} onOpenChange={setFluxiaOpen} />
    </TourProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
