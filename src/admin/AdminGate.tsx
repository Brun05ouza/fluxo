import React, { useEffect, useState } from 'react';
import { AdminLoginModal } from './AdminLoginModal';
import { AdminPanel } from './AdminPanel';

type AdminState = 'closed' | 'login' | 'panel';

interface AdminGateProps {
  currentUserId: string;
}

export function AdminGate({ currentUserId }: AdminGateProps) {
  const [state, setState] = useState<AdminState>('closed');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setState((prev) => {
          if (prev !== 'closed') return 'closed'; // toggle: fecha se já aberto
          return 'login';
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (state === 'closed') return null;

  if (state === 'login') {
    return (
      <AdminLoginModal
        onSuccess={() => setState('panel')}
        onClose={() => setState('closed')}
      />
    );
  }

  return (
    <AdminPanel
      currentUserId={currentUserId}
      onClose={() => setState('closed')}
    />
  );
}
