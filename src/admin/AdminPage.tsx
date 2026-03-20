import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Shield, Users, RefreshCw, ArrowLeft,
  FileText, Wallet, Search, CheckCircle, Clock, X,
  LayoutDashboard, Activity, Settings, TrendingUp,
  UserCheck, UserX, LogIn, CalendarDays,
  Database, Key,
} from 'lucide-react';
import { useAdminUsers } from './useAdminUsers';
import { formatCurrencyBRL } from '@/lib/format-currency';
import type { AdminUser } from './types';

type Section = 'dashboard' | 'usuarios' | 'atividade' | 'configuracoes';

interface AdminPageProps {
  userId: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatRelativeDate(iso: string | null) {
  if (!iso) return '—';
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

function Avatar({ user, size = 14 }: { user: AdminUser; size?: number }) {
  const initials = getInitials(user.full_name, user.email);
  const cls = `w-${size} h-${size}`;
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}
      style={{ fontSize: size < 10 ? 12 : 14, background: 'linear-gradient(135deg,rgba(0,255,148,.45),rgba(59,130,246,.45))' }}
    >
      {user.avatar_url
        ? <img src={user.avatar_url} alt={initials} className={`${cls} object-cover`} />
        : initials}
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard, desc: 'Visão geral'      },
  { id: 'usuarios',      label: 'Usuários',       icon: Users,           desc: 'Gerenciar contas' },
  { id: 'atividade',     label: 'Atividade',      icon: Activity,        desc: 'Últimos acessos'  },
  { id: 'configuracoes', label: 'Configurações',  icon: Settings,        desc: 'Setup do admin'   },
];

function Sidebar({
  active,
  onSelect,
  onBack,
  currentUser,
  loading,
  onRefresh,
}: {
  active: Section;
  onSelect: (s: Section) => void;
  onBack: () => void;
  currentUser: AdminUser | undefined;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <aside
      className="w-64 shrink-0 flex flex-col h-screen sticky top-0 border-r"
      style={{ background: '#0D0D0F', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Brand */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.25)' }}
          >
            <ShieldCheck size={20} style={{ color: '#00FF94' }} />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none">Fluxo Admin</p>
            <p className="text-xs text-gray-500 mt-0.5">Painel de controle</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={
                isActive
                  ? { background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.2)' }
                  : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Icon
                size={20}
                style={{ color: isActive ? '#00FF94' : '#6b7280', flexShrink: 0 }}
              />
              <div>
                <p className={`text-sm font-semibold leading-none ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Refresh */}
      <div className="px-3 pb-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar dados
        </button>
      </div>

      {/* Current user + back */}
      <div className="px-3 pb-5 pt-2 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {currentUser && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Avatar user={currentUser} size={9} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-500 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <ArrowLeft size={16} />
          Voltar ao app
        </button>
      </div>
    </aside>
  );
}

// ─── Section: Dashboard ─────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent = false,
}: {
  label: string; value: string | number; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-5 p-7 rounded-2xl border"
      style={{
        background: accent ? 'rgba(0,255,148,0.05)' : 'rgba(255,255,255,0.03)',
        borderColor: accent ? 'rgba(0,255,148,0.25)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'rgba(0,255,148,0.15)' : 'rgba(255,255,255,0.06)' }}
        >
          <Icon size={19} style={{ color: accent ? '#00FF94' : '#6b7280' }} />
        </div>
      </div>
      <p className="text-5xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function SectionDashboard({ users, totalTx, totalBudgets }: { users: AdminUser[]; totalTx: number; totalBudgets: number }) {
  const adminCount    = users.filter((u) => u.is_admin).length;
  const onboardedCount = users.filter((u) => u.onboarding_completed_at).length;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Visão geral</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total de usuários" value={users.length} icon={Users} accent />
          <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
          <StatCard label="Com onboarding" value={onboardedCount} icon={CheckCircle} />
          <StatCard label="Transações totais" value={totalTx} icon={FileText} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Distribuição de atividade</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {users
            .slice()
            .sort((a, b) => Number(b.tx_count) - Number(a.tx_count))
            .map((u) => {
              const pct = totalTx > 0 ? (Number(u.tx_count) / totalTx) * 100 : 0;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 p-5 rounded-2xl border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <Avatar user={u} size={12} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-base font-semibold text-white truncate">
                        {u.full_name || u.email}
                      </p>
                      <span className="text-sm text-gray-500 shrink-0 tabular-nums font-semibold">
                        {u.tx_count} tx · {u.budgets_count} orc.
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: '#00FF94' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Resumo financeiro da base</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            className="p-6 rounded-2xl border flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm text-gray-500">Renda total declarada</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrencyBRL(users.reduce((s, u) => s + u.monthly_income, 0))}
            </p>
            <p className="text-xs text-gray-600">/mês somando todos os usuários</p>
          </div>
          <div
            className="p-6 rounded-2xl border flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm text-gray-500">Renda média por usuário</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrencyBRL(users.length > 0 ? users.reduce((s, u) => s + u.monthly_income, 0) / users.length : 0)}
            </p>
            <p className="text-xs text-gray-600">/mês por pessoa</p>
          </div>
          <div
            className="p-6 rounded-2xl border flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm text-gray-500">Orçamentos criados</p>
            <p className="text-3xl font-bold text-white">{totalBudgets}</p>
            <p className="text-xs text-gray-600">em toda a plataforma</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Usuários ──────────────────────────────────────────────────────

function UserDetailPanel({
  user, isSelf, onClose, onToggle, toggling,
}: {
  user: AdminUser; isSelf: boolean;
  onClose: () => void;
  onToggle: (id: string, v: boolean) => void;
  toggling: boolean;
}) {
  const metrics = [
    { label: 'Transações',  value: user.tx_count,      icon: FileText,  color: '#6366f1' },
    { label: 'Orçamentos',  value: user.budgets_count, icon: Wallet,    color: '#0ea5e9' },
  ];

  return (
    <div
      className="w-80 shrink-0 flex flex-col rounded-2xl border overflow-hidden"
      style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-sm font-semibold text-gray-300">Detalhes do usuário</p>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-2">
          <Avatar user={user} size={20} />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-bold text-white">{user.full_name || '—'}</p>
              {isSelf && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94' }}>você</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {user.is_admin
                ? <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,255,148,0.12)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.25)' }}>
                    <ShieldCheck size={11} /> Admin
                  </span>
                : <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Shield size={11} /> Membro
                  </span>
              }
              {user.onboarding_completed_at
                ? <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <CheckCircle size={11} /> Onboarding
                  </span>
                : <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(234,179,8,0.1)', color: '#facc15', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <Clock size={11} /> Pendente
                  </span>
              }
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col gap-2 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color }} />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Financial */}
        <div className="p-4 rounded-xl space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil financeiro</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Renda mensal</span>
              <span className="text-sm font-semibold text-white">{formatCurrencyBRL(user.monthly_income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Onboarding</span>
              <span className="text-sm font-medium text-gray-300">
                {user.onboarding_completed_at
                  ? new Date(user.onboarding_completed_at).toLocaleDateString('pt-BR')
                  : 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 rounded-xl space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Linha do tempo</p>
          <div className="space-y-3">
            {[
              { label: 'Criou a conta',   value: new Date(user.created_at).toLocaleDateString('pt-BR'), dot: '#6366f1' },
              { label: 'Último acesso',   value: formatRelativeDate(user.last_sign_in),                 dot: '#00FF94' },
            ].map(({ label, value, dot }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                <span className="text-sm text-gray-400 flex-1">{label}</span>
                <span className="text-sm font-medium text-gray-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin toggle */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => !isSelf && !toggling && onToggle(user.id, !user.is_admin)}
          disabled={isSelf || toggling}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={
            user.is_admin
              ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
              : { background: 'rgba(0,255,148,0.1)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.25)' }
          }
        >
          {user.is_admin ? <><Shield size={16} /> Remover admin</> : <><ShieldCheck size={16} /> Tornar admin</>}
        </button>
        {isSelf && <p className="text-xs text-gray-600 text-center mt-2">Você não pode alterar seu próprio acesso.</p>}
      </div>
    </div>
  );
}

function UserRow({
  user, isSelf, selected, onSelect, toggling,
}: {
  user: AdminUser; isSelf: boolean; selected: boolean;
  onSelect: (u: AdminUser) => void; toggling: boolean;
}) {
  return (
    <tr
      onClick={() => onSelect(user)}
      className="border-b border-white/[0.05] cursor-pointer transition-colors"
      style={selected ? { background: 'rgba(0,255,148,0.06)' } : undefined}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} size={10} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white truncate max-w-[160px]">{user.full_name || '—'}</p>
              {isSelf && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94' }}>você</span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate max-w-[180px] mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-200">{formatCurrencyBRL(user.monthly_income)}</span>
        <span className="text-xs text-gray-500">/mês</span>
      </td>
      <td className="px-5 py-4 text-center">
        <span className="text-lg font-bold text-white tabular-nums">{user.tx_count}</span>
      </td>
      <td className="px-5 py-4 text-center">
        <span className="text-lg font-bold text-white tabular-nums">{user.budgets_count}</span>
      </td>
      <td className="px-5 py-4 text-center">
        {user.onboarding_completed_at
          ? <CheckCircle size={18} className="mx-auto text-[#00FF94]" />
          : <Clock size={18} className="mx-auto text-yellow-500/70" />}
      </td>
      <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{formatRelativeDate(user.last_sign_in)}</td>
      <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-5 py-4">
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold w-fit"
          style={
            user.is_admin
              ? { background: 'rgba(0,255,148,0.1)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.2)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
          }
        >
          {user.is_admin ? <ShieldCheck size={13} /> : <Shield size={13} />}
          {user.is_admin ? 'Admin' : 'Membro'}
        </span>
      </td>
    </tr>
  );
}

function SectionUsuarios({
  users, userId, onToggle, togglingId, loading, error,
}: {
  users: AdminUser[]; userId: string;
  onToggle: (id: string, v: boolean) => void;
  togglingId: string | null; loading: boolean; error: string | null;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  // keep selected in sync after toggle
  React.useEffect(() => {
    if (selected) {
      const updated = users.find((u) => u.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [users]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  });

  const handleSelect = (u: AdminUser) => setSelected((prev) => prev?.id === u.id ? null : u);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          Usuários ({filtered.length !== users.length ? `${filtered.length} de ${users.length}` : users.length})
        </h2>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar por nome ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 pr-4 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-[#00FF94]/40 focus:ring-1 focus:ring-[#00FF94]/20 transition-all w-72"
          />
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Table */}
        <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-[#00FF94] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400 text-base">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {['Usuário', 'Renda', 'Tx', 'Orç.', 'Onboarding', 'Último acesso', 'Entrou', 'Permissão'].map((h) => (
                      <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isSelf={u.id === userId}
                      selected={selected?.id === u.id}
                      onSelect={handleSelect}
                      toggling={togglingId === u.id}
                    />
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-600 text-sm">Nenhum resultado para "{search}"</div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <UserDetailPanel
            user={selected}
            isSelf={selected.id === userId}
            onClose={() => setSelected(null)}
            onToggle={onToggle}
            toggling={togglingId === selected.id}
          />
        )}
      </div>

      {!selected && users.length > 0 && (
        <p className="text-xs text-gray-700 text-center">Clique em uma linha para ver os detalhes do usuário</p>
      )}
    </div>
  );
}

// ─── Section: Atividade ─────────────────────────────────────────────────────

function SectionAtividade({ users }: { users: AdminUser[] }) {
  const sorted = [...users].sort((a, b) => {
    const ta = a.last_sign_in ? new Date(a.last_sign_in).getTime() : 0;
    const tb = b.last_sign_in ? new Date(b.last_sign_in).getTime() : 0;
    return tb - ta;
  });

  const recentlyJoined = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const activeUsers   = users.filter((u) => Number(u.tx_count) > 0).length;
  const inactiveUsers = users.filter((u) => Number(u.tx_count) === 0).length;

  return (
    <div className="space-y-10">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Usuários ativos', value: activeUsers, icon: UserCheck, color: '#00FF94' },
          { label: 'Usuários inativos', value: inactiveUsers, icon: UserX, color: '#f87171' },
          { label: 'Total de acessos', value: users.length, icon: LogIn, color: '#60a5fa' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-6 rounded-2xl border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Last seen timeline */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Último acesso</h2>
        <div
          className="rounded-2xl border divide-y overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          {sorted.map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors">
              <Avatar user={u} size={11} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">{u.full_name || u.email}</p>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-600">Entrou</p>
                  <p className="text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Transações</p>
                  <p className="text-base font-bold text-white tabular-nums">{u.tx_count}</p>
                </div>
                <div
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold min-w-[100px] text-center"
                  style={
                    u.last_sign_in
                      ? { background: 'rgba(0,255,148,0.08)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.2)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {formatRelativeDate(u.last_sign_in)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently joined */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Novos usuários</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {recentlyJoined.map((u, i) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-5 rounded-2xl border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <span className="text-2xl font-black text-gray-700 tabular-nums w-7 text-center shrink-0">
                {i + 1}
              </span>
              <Avatar user={u} size={12} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">{u.full_name || '—'}</p>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-[#00FF94] font-semibold">
                  {formatRelativeDate(u.created_at)}
                </p>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  <CalendarDays size={12} className="text-gray-600" />
                  <p className="text-xs text-gray-600">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Configurações ─────────────────────────────────────────────────


function SectionConfiguracoes({ users, userId }: { users: AdminUser[]; userId: string }) {
  const self = users.find((u) => u.id === userId);
  const pinConfigured = !!import.meta.env.VITE_ADMIN_PIN;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Status */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">Status do sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'PIN de acesso',
              ok: pinConfigured,
              ok_text: 'Configurado',
              fail_text: 'Não configurado',
              icon: Key,
            },
            {
              label: 'Seu perfil admin',
              ok: !!self?.is_admin,
              ok_text: 'Ativo',
              fail_text: 'Inativo',
              icon: ShieldCheck,
            },
            {
              label: 'Coluna is_admin',
              ok: true,
              ok_text: 'Migração aplicada',
              fail_text: 'Pendente',
              icon: Database,
            },
          ].map(({ label, ok, ok_text, fail_text, icon: Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-5 rounded-2xl border"
              style={{
                background: ok ? 'rgba(0,255,148,0.04)' : 'rgba(239,68,68,0.04)',
                borderColor: ok ? 'rgba(0,255,148,0.2)' : 'rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: ok ? 'rgba(0,255,148,0.12)' : 'rgba(239,68,68,0.12)' }}
              >
                <Icon size={17} style={{ color: ok ? '#00FF94' : '#f87171' }} />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">{label}</p>
                <p className="text-base font-bold mt-0.5" style={{ color: ok ? '#00FF94' : '#f87171' }}>
                  {ok ? ok_text : fail_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PIN */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">
          <span className="flex items-center gap-2"><Key size={14} /> PIN de acesso</span>
        </h2>
        <div
          className="p-6 rounded-2xl border space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <p className="text-base text-gray-300">
            O PIN é definido via variável de ambiente{' '}
            <code className="px-2 py-0.5 rounded bg-white/10 text-[#00FF94] text-sm">VITE_ADMIN_PIN</code>{' '}
            no arquivo <code className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-sm">.env</code>.
            Para alterar, edite o arquivo e reinicie o servidor.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Status', value: import.meta.env.VITE_ADMIN_PIN ? 'Configurado' : 'Não configurado', ok: !!import.meta.env.VITE_ADMIN_PIN },
              { label: 'Tamanho', value: import.meta.env.VITE_ADMIN_PIN ? `${(import.meta.env.VITE_ADMIN_PIN as string).length} caracteres` : '—', ok: true },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm text-gray-500">{label}:</span>
                <span className="text-sm font-semibold" style={{ color: ok ? '#00FF94' : '#f87171' }}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Use <kbd className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-xs font-mono">Ctrl+Shift+A</kbd> em qualquer tela do app para abrir o modal de login admin.
          </p>
        </div>
      </div>

      {/* Atalhos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">
          <span className="flex items-center gap-2"><Key size={14} /> Atalhos de teclado</span>
        </h2>
        <div className="rounded-2xl border divide-y overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          {[
            { keys: ['Ctrl', 'Shift', 'A'], desc: 'Abrir / fechar modal de login admin' },
            { keys: ['Esc'],                desc: 'Fechar modal de login admin'         },
          ].map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between px-6 py-4">
              <span className="text-base text-gray-300">{desc}</span>
              <div className="flex items-center gap-1.5">
                {keys.map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && <span className="text-gray-600 text-sm">+</span>}
                    <kbd className="px-3 py-1.5 rounded-lg text-sm font-mono font-semibold text-gray-200"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admins atuais */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">
          <span className="flex items-center gap-2"><TrendingUp size={14} /> Admins ativos ({users.filter(u => u.is_admin).length})</span>
        </h2>
        <div className="space-y-3">
          {users.filter((u) => u.is_admin).map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl border"
              style={{ background: 'rgba(0,255,148,0.03)', borderColor: 'rgba(0,255,148,0.15)' }}
            >
              <Avatar user={u} size={11} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">{u.full_name || u.email}</p>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ShieldCheck size={16} className="text-[#00FF94]" />
                <span className="text-sm font-semibold text-[#00FF94]">Admin</span>
              </div>
            </div>
          ))}
          {users.filter((u) => u.is_admin).length === 0 && (
            <p className="text-sm text-gray-600">Nenhum admin encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function AdminPage({ userId }: AdminPageProps) {
  const navigate = useNavigate();
  const { users, loading, error, fetchUsers, setUserAdmin } = useAdminUsers();
  const [section, setSection] = useState<Section>('dashboard');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id: string, isAdmin: boolean) => {
    setTogglingId(id);
    await setUserAdmin(id, isAdmin);
    setTogglingId(null);
  };

  const currentUser = users.find((u) => u.id === userId);
  const totalTx      = users.reduce((s, u) => s + Number(u.tx_count), 0);
  const totalBudgets = users.reduce((s, u) => s + Number(u.budgets_count), 0);

  const SECTION_TITLES: Record<Section, string> = {
    dashboard:     'Dashboard',
    usuarios:      'Usuários',
    atividade:     'Atividade',
    configuracoes: 'Configurações',
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0A0A0C', color: '#fff' }}>
      <Sidebar
        active={section}
        onSelect={setSection}
        onBack={() => navigate('/')}
        currentUser={currentUser}
        loading={loading}
        onRefresh={fetchUsers}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b shrink-0"
          style={{ background: 'rgba(10,10,12,0.92)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(14px)' }}
        >
          <div>
            <h1 className="text-xl font-bold text-white">{SECTION_TITLES[section]}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {users.length} usuário{users.length !== 1 ? 's' : ''} · última atualização agora
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border border-[#00FF94] border-t-transparent rounded-full animate-spin" />
              Carregando…
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-10 overflow-y-auto">
          {section === 'dashboard' && (
            <SectionDashboard users={users} totalTx={totalTx} totalBudgets={totalBudgets} />
          )}
          {section === 'usuarios' && (
            <SectionUsuarios
              users={users}
              userId={userId}
              onToggle={handleToggle}
              togglingId={togglingId}
              loading={loading}
              error={error}
            />
          )}
          {section === 'atividade' && (
            <SectionAtividade users={users} />
          )}
          {section === 'configuracoes' && (
            <SectionConfiguracoes users={users} userId={userId} />
          )}
        </main>
      </div>
    </div>
  );
}
