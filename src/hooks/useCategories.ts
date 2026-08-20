import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '@/types/database';

const storageKey = (userId: string) => `fluxo:custom-categories:${userId}`;

function readCustom(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c): c is string => typeof c === 'string')
      .map((c) => c.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeCustom(userId: string, list: string[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function useCategories(userId: string | undefined) {
  const [custom, setCustom] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setCustom([]);
      return;
    }
    setCustom(readCustom(userId));
  }, [userId]);

  const categories = useMemo(() => {
    const base = [...CATEGORIES] as string[];
    const seen = new Set(base.map((c) => c.toLowerCase()));
    for (const c of custom) {
      if (!seen.has(c.toLowerCase())) {
        base.push(c);
        seen.add(c.toLowerCase());
      }
    }
    return base;
  }, [custom]);

  const addCategory = useCallback(
    (name: string): { ok: true; name: string } | { ok: false; error: string } => {
      const trimmed = name.trim().replace(/\s+/g, ' ');
      if (!trimmed) return { ok: false, error: 'Informe um nome para a categoria' };
      if (trimmed.length > 40) return { ok: false, error: 'Use no máximo 40 caracteres' };
      const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (exists) return { ok: false, error: 'Essa categoria já existe' };
      if (!userId) return { ok: false, error: 'Faça login para criar categorias' };

      const next = [...custom, trimmed];
      writeCustom(userId, next);
      setCustom(next);
      return { ok: true, name: trimmed };
    },
    [categories, custom, userId]
  );

  return { categories, custom, addCategory };
}
