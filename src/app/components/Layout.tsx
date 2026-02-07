import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  PlusCircle,
  Bell,
  FileText
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { FluxoBrand } from './FluxoBrand';
import { Button, cn } from './ui';

const getInitials = (name: string | undefined, email: string) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
};

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-3 py-2.5 rounded-[var(--radius)] transition-all group",
      active 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon size={20} className={cn("shrink-0", active ? "" : "group-hover:scale-110 transition-transform")} />
    {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
  </button>
);

export const AppLayout = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onLogout,
  onAddTransaction
}: { 
  children: React.ReactNode, 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  onLogout: () => void,
  onAddTransaction: () => void
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const initials = getInitials(user?.user_metadata?.full_name, user?.email ?? '');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: ArrowLeftRight, label: 'Transações' },
    { id: 'fixed-expenses', icon: FileText, label: 'Contas fixas' },
    { id: 'budgets', icon: Target, label: 'Orçamentos' },
    { id: 'reports', icon: PieChart, label: 'Relatórios' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {!collapsed ? (
            <FluxoBrand logoSize="md" textSize="lg" />
          ) : (
            <img src="/fluxo-icon.png?v=2" alt="Fluxo" className="mx-auto w-16 h-16 object-contain" />
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => handleTabClick(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="w-full justify-start gap-3 px-3"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogout}
            className="w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 mt-2"
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-card p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <FluxoBrand logoSize="md" textSize="lg" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-muted rounded">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                />
              ))}
            </nav>
            <div className="pt-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive mt-2" onClick={onLogout}>
                <LogOut size={20} />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 md:h-20 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-semibold capitalize hidden sm:block">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              size="sm" 
              className="hidden sm:flex items-center gap-2"
              onClick={onAddTransaction}
            >
              <PlusCircle size={18} />
              Nova Transação
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="sm:hidden text-primary"
              onClick={onAddTransaction}
            >
              <PlusCircle size={24} />
            </Button>
            <Button size="icon" variant="ghost" className="relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <button
              onClick={() => setActiveTab('settings')}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center border border-border hover:bg-primary/30 transition-colors"
            >
              <span className="text-xs font-bold text-primary">{initials}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
