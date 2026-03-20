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

-- 3. RPC: lista todos os usuários com stats (só admins podem chamar)
--    Usa subquery para evitar ambiguidade de nomes entre RETURNS TABLE e colunas de tabela
DROP FUNCTION IF EXISTS admin_get_users();
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id                      UUID,
  email                   TEXT,
  full_name               TEXT,
  avatar_url              TEXT,
  is_admin                BOOLEAN,
  monthly_income          DECIMAL,
  onboarding_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ,
  tx_count                BIGINT,
  budgets_count           BIGINT,
  last_sign_in            TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM financial_profile fp_auth
    WHERE fp_auth.id = auth.uid() AND fp_auth.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
    SELECT
      sq.rid,
      sq.remail,
      sq.rfull_name,
      sq.ravatar_url,
      sq.ris_admin,
      sq.rmonthly_income,
      sq.ronboarding_completed_at,
      sq.rcreated_at,
      sq.rtx_count,
      sq.rbudgets_count,
      sq.rlast_sign_in
    FROM (
      SELECT
        fp.id                                          AS rid,
        au.email::TEXT                                 AS remail,
        (au.raw_user_meta_data->>'full_name')::TEXT    AS rfull_name,
        (au.raw_user_meta_data->>'avatar_url')::TEXT   AS ravatar_url,
        fp.is_admin                                    AS ris_admin,
        fp.monthly_income                              AS rmonthly_income,
        fp.onboarding_completed_at                     AS ronboarding_completed_at,
        fp.created_at                                  AS rcreated_at,
        COUNT(DISTINCT t.id)::BIGINT                   AS rtx_count,
        COUNT(DISTINCT b.id)::BIGINT                   AS rbudgets_count,
        au.last_sign_in_at                             AS rlast_sign_in
      FROM financial_profile fp
      JOIN auth.users au ON au.id = fp.id
      LEFT JOIN transactions t ON t.user_id = fp.id
      LEFT JOIN budgets b ON b.user_id = fp.id
      GROUP BY
        fp.id, fp.is_admin, fp.monthly_income,
        fp.onboarding_completed_at, fp.created_at,
        au.id, au.email, au.raw_user_meta_data, au.last_sign_in_at
      ORDER BY fp.created_at DESC
    ) sq;
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
    SELECT 1 FROM financial_profile fp_auth
    WHERE fp_auth.id = auth.uid() AND fp_auth.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF target_id = auth.uid() AND admin_status = false THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso admin';
  END IF;

  UPDATE financial_profile SET is_admin = admin_status WHERE id = target_id;
END;
$$;
