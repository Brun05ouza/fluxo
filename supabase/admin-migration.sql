-- =============================================================================
-- ADMIN MIGRATION
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Adiciona coluna is_admin em financial_profile
ALTER TABLE financial_profile
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Promove o primeiro admin manualmente (substitua pelo seu user_id)
-- UPDATE financial_profile SET is_admin = true WHERE id = 'seu-user-id-aqui';
-- Para descobrir seu id: SELECT id FROM auth.users WHERE email = 'seu@email.com';

-- 3. RPC: lista todos os usuários (só admins podem chamar)
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id              UUID,
  email           TEXT,
  full_name       TEXT,
  avatar_url      TEXT,
  is_admin        BOOLEAN,
  monthly_income  DECIMAL,
  onboarding_completed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM financial_profile WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
    SELECT
      fp.id,
      au.email,
      (au.raw_user_meta_data->>'full_name')::TEXT AS full_name,
      (au.raw_user_meta_data->>'avatar_url')::TEXT AS avatar_url,
      fp.is_admin,
      fp.monthly_income,
      fp.onboarding_completed_at,
      fp.created_at
    FROM financial_profile fp
    JOIN auth.users au ON au.id = fp.id
    ORDER BY fp.created_at DESC;
END;
$$;

-- 4. RPC: altera is_admin de um usuário (só admins podem chamar, e não podem remover a si mesmos)
CREATE OR REPLACE FUNCTION admin_set_user_admin(target_id UUID, admin_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM financial_profile WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF target_id = auth.uid() AND admin_status = false THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso admin';
  END IF;

  UPDATE financial_profile SET is_admin = admin_status WHERE id = target_id;
END;
$$;
