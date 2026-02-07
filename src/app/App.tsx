import React, { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { AppLayout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { FixedExpenses } from './components/FixedExpenses';
import { Budgets, Reports, Settings } from './components/Pages';
import { TransactionDrawer } from './components/TransactionDrawer';
import { Login } from './components/Login';
import { Toaster, toast } from 'sonner';

const AppContent = () => {
  const { user, loading, signOut } = useAuth();
  const { addTransaction } = useTransactions(user?.id);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.info('Até logo!');
  };

  const handleAddTransaction = () => {
    setIsDrawerOpen(true);
  };

  const handleSaveTransaction = async (tx: Parameters<typeof addTransaction>[0]) => {
    return addTransaction(tx);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Login />
    );
  }

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onAddTransaction={handleAddTransaction}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            onAddTransaction={handleAddTransaction}
            onGoToTransactions={() => setActiveTab('transactions')}
            onGoToBudgets={() => setActiveTab('budgets')}
            onGoToFixedExpenses={() => setActiveTab('fixed-expenses')}
          />
        )}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'fixed-expenses' && <FixedExpenses />}
        {activeTab === 'budgets' && <Budgets />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && <Settings />}
      </AppLayout>

      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveTransaction}
      />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
