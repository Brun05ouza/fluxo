import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN as string | undefined;

export function AdminLoginModal({ onSuccess, onClose }: AdminLoginModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ADMIN_PIN) {
      setError('VITE_ADMIN_PIN não configurado no .env');
      return;
    }

    if (pin !== ADMIN_PIN) {
      setError('PIN incorreto.');
      setPin('');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Sessão expirada.'); setLoading(false); return; }

    const { data, error: dbErr } = await supabase
      .from('financial_profile')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    setLoading(false);

    if (dbErr || !data) { setError('Erro ao verificar permissão.'); return; }
    if (!(data as { is_admin: boolean }).is_admin) {
      setError('Seu usuário não tem permissão de admin.');
      return;
    }

    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6 relative"
        style={{
          background: 'rgba(22, 22, 24, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Linha decorativa */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FF9480] to-transparent rounded-t-2xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#00FF94]/10 border border-[#00FF94]/20 flex items-center justify-center">
            <ShieldCheck size={28} className="text-[#00FF94]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Área Administrativa</h2>
            <p className="text-sm text-gray-500 mt-1">Digite o PIN de acesso para continuar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              placeholder="PIN de acesso"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null); }}
              className="w-full h-12 rounded-xl px-4 pr-12 text-white bg-[#0A0A0C] border border-[#333] focus:outline-none focus:border-[#00FF94] focus:ring-1 focus:ring-[#00FF94] transition-all text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
            style={{ background: '#00FF94', color: '#0A0A0C' }}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center">
          Ctrl+Shift+A para fechar · Esc para cancelar
        </p>
      </div>
    </div>
  );
}
