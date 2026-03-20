import React, { useEffect } from 'react';
import { X, ShieldCheck, Shield, Users, RefreshCw } from 'lucide-react';
import { useAdminUsers } from './useAdminUsers';
import { formatCurrencyBRL } from '@/lib/format-currency';
import type { AdminUser } from './types';

interface AdminPanelProps {
  onClose: () => void;
  currentUserId: string;
}

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function UserRow({
  user,
  isSelf,
  onToggle,
}: {
  user: AdminUser;
  isSelf: boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  const initials = getInitials(user.full_name, user.email);
  const joined = new Date(user.created_at).toLocaleDateString('pt-BR');
  const onboarded = !!user.onboarding_completed_at;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF94]/40 to-blue-500/40 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={initials} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">
            {user.full_name || user.email}
          </p>
          {isSelf && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00FF94]/20 text-[#00FF94]">você</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-600">
            {formatCurrencyBRL(user.monthly_income)}/mês
          </span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-600">Entrou {joined}</span>
          {!onboarded && (
            <span className="text-xs text-yellow-600/80">· Onboarding pendente</span>
          )}
        </div>
      </div>

      {/* Toggle admin */}
      <button
        onClick={() => !isSelf && onToggle(user.id, !user.is_admin)}
        disabled={isSelf}
        title={isSelf ? 'Você não pode alterar seu próprio admin' : user.is_admin ? 'Remover admin' : 'Tornar admin'}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
          ${user.is_admin
            ? 'bg-[#00FF94]/15 text-[#00FF94] border border-[#00FF94]/30'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'}
        `}
      >
        {user.is_admin ? <ShieldCheck size={14} /> : <Shield size={14} />}
        {user.is_admin ? 'Admin' : 'Membro'}
      </button>
    </div>
  );
}

export function AdminPanel({ onClose, currentUserId }: AdminPanelProps) {
  const { users, loading, error, fetchUsers, setUserAdmin } = useAdminUsers();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleToggle = async (userId: string, isAdmin: boolean) => {
    await setUserAdmin(userId, isAdmin);
  };

  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] relative"
        style={{
          background: 'rgba(16, 16, 18, 0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Linha decorativa */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF9480] to-transparent rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00FF94]/10 border border-[#00FF94]/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-[#00FF94]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Área Administrativa</h2>
              <p className="text-xs text-gray-500">
                {users.length} usuário{users.length !== 1 ? 's' : ''} · {adminCount} admin{adminCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Atualizar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
          {[
            { label: 'Total de usuários', value: users.length, icon: Users },
            { label: 'Com onboarding', value: users.filter(u => u.onboarding_completed_at).length, icon: ShieldCheck },
            { label: 'Admins', value: adminCount, icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-1 px-5 py-4 bg-[#101012]">
              <p className="text-xs text-gray-500">{label}</p>
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#00FF94]" />
                <span className="text-2xl font-bold text-white">{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && users.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#00FF94] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-center py-12 text-red-400 text-sm">{error}</div>
          )}
          {!loading && !error && users.length === 0 && (
            <div className="text-center py-12 text-gray-600 text-sm">Nenhum usuário encontrado.</div>
          )}
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onToggle={handleToggle}
            />
          ))}
        </div>

        <div className="px-6 py-3 border-t border-white/5 text-center">
          <p className="text-xs text-gray-700">Ctrl+Shift+A para fechar · Esc para fechar</p>
        </div>
      </div>
    </div>
  );
}
