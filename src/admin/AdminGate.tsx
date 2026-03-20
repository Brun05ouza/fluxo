import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLoginModal } from './AdminLoginModal';

interface AdminGateProps {
  currentUserId: string;
}

export function AdminGate({ currentUserId: _ }: AdminGateProps) {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setLoginOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!loginOpen) return null;

  return (
    <AdminLoginModal
      onSuccess={() => {
        setLoginOpen(false);
        navigate('/admin');
      }}
      onClose={() => setLoginOpen(false)}
    />
  );
}
