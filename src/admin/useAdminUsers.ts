import { useState, useCallback } from 'react';
import { neon } from '@/lib/neon';
import type { AdminUser } from './types';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await neon.rpc('admin_get_users');
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setUsers((data as AdminUser[]) ?? []);
  }, []);

  const setUserAdmin = useCallback(async (userId: string, isAdmin: boolean) => {
    const { error: err } = await neon.rpc('admin_set_user_admin', {
      target_id: userId,
      admin_status: isAdmin,
    });
    if (err) return { error: new Error(err.message) };
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_admin: isAdmin } : u))
    );
    return { error: null };
  }, []);

  return { users, loading, error, fetchUsers, setUserAdmin };
}
