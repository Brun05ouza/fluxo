import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  PlusCircle,
  Bell,
  FileText,
  Upload,
  User,
  HelpCircle,
  Pin,
  PinOff,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { FluxoBrand } from './FluxoBrand';
import { Button, cn } from './ui';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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
  dataTour?: string;
}

const sidebarLabelClass = (collapsed: boolean) =>
  cn(
    'min-w-0 font-medium whitespace-nowrap overflow-hidden text-left transition-[max-width,opacity] duration-300 ease-out',
    collapsed ? 'max-w-0 min-w-0 shrink opacity-0' : 'max-w-[220px] opacity-100'
  );

/** Mesma grade de todos os itens da sidebar: padding e coluna de ícone fixa. */
const sidebarRowClass = 'flex items-center w-full rounded-[var(--radius)] px-2 py-2.5 gap-0';
/** Linha da marca + CTA: altura para ícone destacado + padding. */
const sidebarProminentRowClass = cn(sidebarRowClass, 'min-h-16 justify-center');
/** Célula de ícone maior só no Nova transação (nav segue 40px). */
const sidebarProminentIconCellClass =
  'flex h-11 w-11 shrink-0 items-center justify-center pointer-events-none';
/** Logo da marca — maior que os ícones de nav/CTA. */
const sidebarBrandIconCellClass =
  'flex h-14 w-14 shrink-0 items-center justify-center pointer-events-none';
const sidebarBrandRowClass = cn(sidebarRowClass, 'min-h-[4.5rem] justify-center');
const sidebarIconCellClass =
  'flex h-10 w-10 shrink-0 items-center justify-center pointer-events-none';

/**
 * Rótulo alinhado à célula do ícone destacada (44px): texto maior e centralizado na vertical.
 */
const sidebarAlignedLabelClass = (
  collapsed: boolean,
  weight: 'semibold' | 'bold' = 'semibold'
) =>
  cn(
    sidebarLabelClass(collapsed),
    'inline-flex h-11 items-center text-base leading-none',
    weight === 'semibold' ? 'font-semibold' : 'font-bold'
  );

const sidebarBrandLabelClass = (collapsed: boolean) =>
  cn(
    sidebarLabelClass(collapsed),
    'inline-flex h-14 items-center text-xl leading-none font-bold'
  );

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, dataTour }: SidebarItemProps) => (
  <button
    onClick={onClick}
    {...(dataTour ? { 'data-tour': dataTour } : {})}
    title={collapsed ? label : undefined}
    className={cn(
      sidebarRowClass,
      'group',
      collapsed && 'justify-center',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    <span className={sidebarIconCellClass}>
      <Icon size={20} className="shrink-0" />
    </span>
    <span className={sidebarLabelClass(collapsed ?? false)}>{label}</span>
  </button>
);

const novaTxMenuContentClass =
  'flex items-center gap-2 w-full cursor-pointer font-semibold rounded-lg';

export const AppLayout = ({
  children,
  onLogout,
  onAddTransaction,
  onHelpClick,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  onAddTransaction: (type?: 'income' | 'expense') => void;
  onHelpClick?: () => void;
}) => {
  const [pinned, setPinned] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const autoCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = useCallback(() => {
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
      autoCollapseTimer.current = null;
    }
  }, []);

  const handleSidebarMouseEnter = useCallback(() => {
    if (pinned) return;
    cancelTimer();
    setCollapsed(false);
  }, [pinned, cancelTimer]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (pinned) return;
    cancelTimer();
    autoCollapseTimer.current = setTimeout(() => {
      setCollapsed(true);
    }, 2000);
  }, [pinned, cancelTimer]);

  const handleTogglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      if (!next) {
        // ao desafixar, colapsa após 2s sem hover
        autoCollapseTimer.current = setTimeout(() => setCollapsed(true), 2000);
      } else {
        cancelTimer();
        setCollapsed(false);
      }
      return next;
    });
  }, [cancelTimer]);

  useEffect(() => {
    const expand = () => {
      cancelTimer();
      setCollapsed(false);
    };
    window.addEventListener('fluxia-tour-expand-sidebar', expand);
    return () => window.removeEventListener('fluxia-tour-expand-sidebar', expand);
  }, [cancelTimer]);

  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const initials = getInitials(user?.user_metadata?.full_name, user?.email ?? '');

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', dataTour: 'fluxia-nav-dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Transações', dataTour: 'fluxia-nav-transactions' },
    { path: '/import', icon: Upload, label: 'Importar', dataTour: 'fluxia-nav-import' },
    { path: '/fixed-expenses', icon: FileText, label: 'Contas fixas', dataTour: 'fluxia-nav-fixed' },
    { path: '/budgets', icon: Target, label: 'Orçamentos', dataTour: 'fluxia-nav-budgets' },
    { path: '/reports', icon: Wallet, label: 'Contas', dataTour: 'fluxia-nav-accounts' },
    { path: '/settings', icon: Settings, label: 'Configurações', dataTour: 'fluxia-nav-settings' },
  ];

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const mobileNovaMenuClose = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/5 via-background to-background -z-10" />

      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className={cn(
          'hidden md:flex flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl z-20 transition-[width] duration-300 ease-out',
          collapsed ? 'w-[4.75rem]' : 'w-64'
        )}
      >
        {/* Logo + Pin: mesmo encadeamento que SidebarItem (ícone + span de rótulo); pin absoluto para não empurrar o texto */}
        <div className={cn(sidebarBrandRowClass, 'text-foreground relative')}>
          <span className={sidebarBrandIconCellClass}>
            <img
              src="/fluxo-icon.png?v=2"
              alt=""
              className="h-14 w-14 object-contain object-center"
              aria-hidden
            />
          </span>
          {!collapsed && (
            <>
              <span
                className={cn(
                  sidebarBrandLabelClass(false),
                  'tracking-tight fluxo-brand-text pr-10'
                )}
              >
                Fluxo
              </span>
              <button
                type="button"
                onClick={handleTogglePin}
                title={pinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
                className={cn(
                  'absolute right-1 top-1/2 z-10 -translate-y-1/2 flex size-8 items-center justify-center rounded-lg transition-colors',
                  pinned
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {pinned ? <Pin size={16} /> : <PinOff size={16} />}
              </button>
            </>
          )}
        </div>

        <div className="px-2 pb-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-tour="fluxia-btn-nova-transacao"
                title={collapsed ? 'Nova transação' : undefined}
                className={cn(
                  sidebarProminentRowClass,
                  'rounded-[var(--radius)]',
                  'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35',
                  'transition-colors'
                )}
              >
                <span className={sidebarProminentIconCellClass}>
                  <PlusCircle size={22} className="shrink-0" />
                </span>
                <span className={sidebarAlignedLabelClass(collapsed, 'semibold')}>Nova transação</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side={collapsed ? 'right' : 'bottom'}
              sideOffset={8}
              className="w-56 p-2"
            >
              <p className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                Tipo de lançamento
              </p>
              <DropdownMenuItem
                className={cn(novaTxMenuContentClass, 'text-emerald-700 dark:text-emerald-400 focus:bg-emerald-500/15')}
                onClick={() => onAddTransaction('income')}
              >
                <TrendingUp size={18} className="shrink-0" />
                Receita
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(novaTxMenuContentClass, 'text-red-700 dark:text-red-400 focus:bg-red-500/15')}
                onClick={() => onAddTransaction('expense')}
              >
                <TrendingDown size={18} className="shrink-0" />
                Despesa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 px-2 space-y-1 mt-1 min-h-0 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => handleNav(item.path)}
              collapsed={collapsed}
              dataTour={item.dataTour}
            />
          ))}
        </nav>

        <div className="border-t border-border/50 space-y-1 p-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            className={cn(sidebarRowClass, 'transition-colors hover:bg-primary/5', collapsed && 'justify-center')}
          >
            <span className={sidebarIconCellClass}>
              {theme === 'dark' ? (
                <Sun size={20} className="shrink-0 text-muted-foreground" />
              ) : (
                <Moon size={20} className="shrink-0 text-muted-foreground" />
              )}
            </span>
            <span className={cn(sidebarLabelClass(collapsed), 'text-sm text-muted-foreground')}>
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>
          <button
            onClick={onLogout}
            title="Sair"
            className={cn(
              sidebarRowClass,
              'transition-colors text-destructive hover:bg-destructive/10',
              collapsed && 'justify-center'
            )}
          >
            <span className={sidebarIconCellClass}>
              <LogOut size={20} className="shrink-0" />
            </span>
            <span className={cn(sidebarLabelClass(collapsed), 'text-sm')}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-background/90 backdrop-blur-xl border-r border-border/50 p-6 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <FluxoBrand logoSize="lg" textSize="xl" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-tour="fluxia-btn-nova-transacao"
                    className={cn(
                      'flex items-center justify-center w-full h-12 px-4 gap-2 rounded-[var(--radius)] font-semibold transition-all',
                      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                    )}
                  >
                    <PlusCircle size={20} />
                    Nova transação
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2">
                  <p className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                    Tipo de lançamento
                  </p>
                  <DropdownMenuItem
                    className={cn(novaTxMenuContentClass, 'text-emerald-700 dark:text-emerald-400 focus:bg-emerald-500/15')}
                    onClick={() => {
                      onAddTransaction('income');
                      mobileNovaMenuClose();
                    }}
                  >
                    <TrendingUp size={18} className="shrink-0" />
                    Receita
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(novaTxMenuContentClass, 'text-red-700 dark:text-red-400 focus:bg-red-500/15')}
                    onClick={() => {
                      onAddTransaction('expense');
                      mobileNovaMenuClose();
                    }}
                  >
                    <TrendingDown size={18} className="shrink-0" />
                    Despesa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <nav className="flex-1 space-y-2 min-h-0 overflow-y-auto">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.path)}
                  onClick={() => handleNav(item.path)}
                  dataTour={item.dataTour}
                />
              ))}
            </nav>
            <div className="pt-4 border-t border-border/50 space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={onLogout}>
                <LogOut size={20} />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 md:h-20 border-b border-border/50 bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-muted rounded-md transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hidden sm:block">
              {pathname === '/profile' ? 'Meu Perfil' : menuItems.find(i => isActive(i.path))?.label ?? 'Fluxo'}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button size="icon" variant="ghost" className="relative hover:bg-muted/50 rounded-full" title="Notificações (em breve)">
              <Bell size={20} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <Avatar className="w-9 h-9 md:w-10 md:h-10 border-2 border-background">
                    <AvatarImage src={user?.user_metadata?.avatar_url as string | undefined} alt="Perfil" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-500 text-primary-foreground text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem onClick={() => { navigate('/profile'); }}>
                  <User size={16} />
                  Meu Perfil
                </DropdownMenuItem>
                {onHelpClick && (
                  <DropdownMenuItem onClick={onHelpClick}>
                    <HelpCircle size={16} />
                    Precisa de Ajuda?
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} variant="destructive">
                  <LogOut size={16} />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full pb-24 md:pb-40">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
