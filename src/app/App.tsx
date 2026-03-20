import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { computeForecast, getAlertMessageForCategory } from '@/lib/forecast';
import { AppLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { FixedExpenses } from './components/FixedExpenses';
import { Budgets, Reports, Settings, Profile } from './components/Pages';
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

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useFinancialProfile(user?.id);
  const { transactions, addTransaction } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.info('Até logo!');
  };

  const handleAddTransaction = () => setIsDrawerOpen(true);
  const [fluxiaOpen, setFluxiaOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsDrawerOpen(true);
    window.addEventListener('fluxia-tour-open-drawer', handler);
    return () => window.removeEventListener('fluxia-tour-open-drawer', handler);
  }, []);

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
                onGoToReports={() => navigate('/reports')}
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
          <Route path="/reports" element={<Reports onGoToImport={() => navigate('/import')} onAddTransaction={handleAddTransaction} onGuideClick={() => setFluxiaOpen(true)} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveTransaction}
      />
      <FluxiaButton onClick={() => setFluxiaOpen(true)} hidden={fluxiaOpen || isDrawerOpen} />
      <FluxiaDrawer open={fluxiaOpen} onOpenChange={setFluxiaOpen} />
      <AdminGate currentUserId={user.id} />
    </TourProvider>
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
